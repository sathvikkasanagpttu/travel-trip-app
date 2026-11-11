import crypto from 'crypto'
import prisma from '../db/prisma.js'
import { AppError } from '../middleware/errorHandler.js'
import { calculateQuote } from './quote.service.js'
import { config } from '../config/env.js'
import { emitBookingStatus, emitAdminNewBooking } from '../socket.js'
import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from './email.service.js'
import logger from '../utils/logger.js'

export const generateBookingReference = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = crypto.randomBytes(6)
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length]
  }
  return `TT-2026-${code}`
}

export { calculateQuote }

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

  // Idempotency check: if the same key and user are submitted twice, return original booking
  if (idempotencyKey) {
    const existing = await prisma.booking.findFirst({
      where: {
        idempotencyKey,
        ...(user?.id ? { userId: user.id } : {}),
      },
      include: {
        statusEvents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (existing) {
      return { booking: existing, isDuplicate: true }
    }
  }

  const quote = calculateQuote({
    startLat,
    startLng,
    endLat,
    endLng,
    startDate,
    endDate,
    adults,
    children,
    infants,
    assistanceNeeded: Boolean(assistanceNeeded),
  })
  const reference = generateBookingReference()

  const initialStatus =
    config.autoConfirmSeconds > 0
      ? 'PENDING'
      : (data.status || 'CONFIRMED')

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
      priceTotal: quote.total,
      currency: quote.currency,
      status: initialStatus,
      idempotencyKey: idempotencyKey || null,
      startLat: startLat || null,
      startLng: startLng || null,
      endLat: endLat || null,
      endLng: endLng || null,
      statusEvents: {
        create: [
          {
            status: 'PENDING',
            note: 'Booking initiated',
          },
          ...(initialStatus === 'CONFIRMED'
            ? [
                {
                  status: 'CONFIRMED',
                  note: 'Booking successfully confirmed',
                },
              ]
            : []),
        ],
      },
    },
    include: {
      statusEvents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  // Emit admin:new-booking event to admins room
  emitAdminNewBooking(booking)

  // If autoConfirmSeconds > 0 and status is PENDING, queue promotion PENDING -> CONFIRMED
  if (initialStatus === 'PENDING' && config.autoConfirmSeconds > 0) {
    setTimeout(async () => {
      try {
        const fresh = await prisma.booking.findUnique({
          where: { id: booking.id },
          include: { user: true },
        })
        if (fresh && fresh.status === 'PENDING') {
          const updated = await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CONFIRMED',
              statusEvents: {
                create: {
                  status: 'CONFIRMED',
                  note: 'Auto-confirmed by booking queue simulation',
                },
              },
            },
            include: {
              statusEvents: { orderBy: { createdAt: 'desc' } },
            },
          })

          const recipientEmail = fresh.user?.email || (user?.email ? user.email : null)
          if (recipientEmail) {
            sendBookingConfirmationEmail(updated, recipientEmail).catch(() => {})
          }

          emitBookingStatus(
            booking.id,
            'CONFIRMED',
            'Auto-confirmed by booking queue simulation',
            fresh.userId
          )
        }
      } catch (err) {
        logger.error({ err }, 'Error in auto-confirm simulation')
      }
    }, config.autoConfirmSeconds * 1000)
  }

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
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const getAdminBookings = async ({ page = 1, limit = 10, status, search }) => {
  const skip = (page - 1) * limit
  const where = {}

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

  const [total, bookings, pendingCount, confirmedCount, cancelledCount, allCount] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        statusEvents: { orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.booking.count(),
  ])

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      total: allCount,
      pending: pendingCount,
      confirmed: confirmedCount,
      cancelled: cancelledCount,
    },
  }
}

export const getBookingById = async (idOrReference, user = null) => {
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrReference)
  const where = isUUID ? { id: idOrReference } : { reference: idOrReference }

  const booking = await prisma.booking.findFirst({
    where,
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

  // Authorization check: owner or admin only
  if (booking.userId) {
    if (!user) {
      throw new AppError('Authentication required to view this booking', 401, 'UNAUTHORIZED')
    }
    if (booking.userId !== user.id && user.role !== 'ADMIN') {
      throw new AppError('Access denied to this booking', 403, 'FORBIDDEN')
    }
  }

  return booking
}

export const cancelBooking = async (idOrReference, user) => {
  const booking = await getBookingById(idOrReference, user)

  if (booking.status === 'CANCELLED') {
    return booking
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
      statusEvents: {
        create: {
          status: 'CANCELLED',
          note: `Booking cancelled by ${user.role === 'ADMIN' ? 'admin' : 'user'}`,
        },
      },
    },
    include: {
      statusEvents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  emitBookingStatus(
    booking.id,
    'CANCELLED',
    `Booking cancelled by ${user.role === 'ADMIN' ? 'admin' : 'user'}`,
    booking.userId
  )

  return updated
}

export const updateBookingStatusByAdmin = async (id, { status, note }, adminUser) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND')
  }

  const statusNote =
    note || `Status updated to ${status} by admin ${adminUser.name || adminUser.email}`

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status,
      statusEvents: {
        create: {
          status,
          note: statusNote,
        },
      },
    },
    include: {
      statusEvents: {
        orderBy: { createdAt: 'desc' },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  // Send email non-blocking
  if (booking.user?.email) {
    if (status === 'CONFIRMED') {
      sendBookingConfirmationEmail(updated, booking.user.email).catch(() => {})
    } else if (status === 'CANCELLED') {
      sendBookingCancellationEmail(updated, booking.user.email).catch(() => {})
    }
  }

  // Emit real-time socket event
  emitBookingStatus(booking.id, status, statusNote, booking.userId)

  return updated
}
