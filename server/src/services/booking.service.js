import crypto from 'crypto'
import prisma from '../db/prisma.js'
import { AppError } from '../middleware/errorHandler.js'

export const generateBookingReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = crypto.randomBytes(6)
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return `TT-2026-${code}`
}

export const calculateQuote = ({ startDate, endDate, adults = 1, children = 0, infants = 0 }) => {
  let nights = 1
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    nights = Math.max(1, diff)
  }

  const adultPricePerNight = 120
  const childPricePerNight = 60
  const infantPricePerNight = 0

  const subtotalPerNight = (adults * adultPricePerNight) + (children * childPricePerNight) + (infants * infantPricePerNight)
  const total = subtotalPerNight * nights
  const taxes = Math.round(total * 0.1) // 10% taxes
  const priceTotal = total + taxes

  return {
    nights,
    adultPricePerNight,
    childPricePerNight,
    subtotal: total,
    taxes,
    priceTotal,
    currency: 'USD',
  }
}

export const createBooking = async (data, user = null) => {
  const {
    idempotencyKey,
    name,
    startLocation,
    endLocation,
    startDate,
    endDate,
    adults = 1,
    children = 0,
    infants = 0,
    assistanceNeeded = false,
    assistanceType = null,
    assistanceNotes = null,
    startLat = null,
    startLng = null,
    endLat = null,
    endLng = null,
  } = data

  // Idempotency check
  if (idempotencyKey) {
    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey },
      include: { statusEvents: true },
    })
    if (existing) {
      return { booking: existing, isDuplicate: true }
    }
  }

  const quote = calculateQuote({ startDate, endDate, adults, children, infants })
  const reference = generateBookingReference()

  const booking = await prisma.booking.create({
    data: {
      reference,
      userId: user?.id || null,
      name,
      startLocation,
      endLocation,
      startDate,
      endDate,
      adults,
      children,
      infants,
      assistanceNeeded: Boolean(assistanceNeeded),
      assistanceType: assistanceNeeded ? (assistanceType || 'Wheelchair') : null,
      assistanceNotes: assistanceNeeded ? assistanceNotes : null,
      priceTotal: quote.priceTotal,
      currency: quote.currency,
      status: 'CONFIRMED',
      idempotencyKey: idempotencyKey || null,
      startLat: startLat || null,
      startLng: startLng || null,
      endLat: endLat || null,
      endLng: endLng || null,
      statusEvents: {
        create: {
          status: 'CONFIRMED',
          note: 'Booking successfully confirmed',
        },
      },
    },
    include: {
      statusEvents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return { booking, isDuplicate: false }
}

export const getBookings = async ({ userId, role, page = 1, limit = 10, status, search }) => {
  const skip = (page - 1) * limit
  const where = {}

  // Non-admins can only see their own bookings
  if (role !== 'ADMIN') {
    if (!userId) {
      return { bookings: [], pagination: { total: 0, page, limit, totalPages: 0 } }
    }
    where.userId = userId
  }

  if (status && status !== 'ALL') {
    where.status = status
  }

  if (search && search.trim()) {
    where.OR = [
      { reference: { contains: search } },
      { startLocation: { contains: search } },
      { endLocation: { contains: search } },
      { name: { contains: search } },
    ]
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        statusEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
  ])

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  }
}

export const getBookingById = async (idOrReference, user = null) => {
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { id: idOrReference },
        { reference: idOrReference },
      ],
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      statusEvents: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND')
  }

  // Authorization check
  if (booking.userId && user) {
    if (booking.userId !== user.id && user.role !== 'ADMIN') {
      throw new AppError('Access denied to this booking', 403, 'FORBIDDEN')
    }
  }

  return booking
}
