import { Router } from 'express'
import { createBookingSchema } from '../validators/booking.schema.js'
import * as bookingService from '../services/booking.service.js'
import * as draftService from '../services/draft.service.js'
import { generateItineraryPdf } from '../services/pdf.service.js'
import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from '../services/email.service.js'
import { requireAuth } from '../middleware/auth.js'
import { AppError } from '../middleware/errorHandler.js'

const router = Router()

// Create a new booking (auth required)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const idempotencyKey =
      req.headers['idempotency-key'] ||
      req.headers['Idempotency-Key'] ||
      req.body?.idempotencyKey

    if (!idempotencyKey) {
      throw new AppError('Header Idempotency-Key is required', 400, 'IDEMPOTENCY_KEY_REQUIRED')
    }

    const data = {
      ...req.body,
      idempotencyKey,
    }

    const validated = createBookingSchema.parse(data)
    const { booking, isDuplicate } = await bookingService.createBooking(validated, req.user)

    // Clear user draft upon confirmed booking creation
    if (!isDuplicate && req.user?.id) {
      draftService.deleteDraft(req.user.id).catch(() => {})
    }

    // Trigger confirmation email asynchronously (non-blocking)
    if (!isDuplicate) {
      const recipient = req.user?.email || booking.user?.email
      sendBookingConfirmationEmail(booking, recipient).catch(() => {})
    }

    const statusCode = isDuplicate ? 200 : 201
    res.status(statusCode).json({
      success: true,
      booking,
      isDuplicate,
    })
  } catch (err) {
    next(err)
  }
})

// List bookings for current user (or all if admin)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10)
    const limit = parseInt(req.query.limit || '10', 10)
    const status = req.query.status
    const search = req.query.search

    const result = await bookingService.getBookings({
      userId: req.user.id,
      role: req.user.role,
      page,
      limit,
      status,
      search,
    })

    res.status(200).json({
      success: true,
      ...result,
    })
  } catch (err) {
    next(err)
  }
})

// Download PDF itinerary (owner or admin only)
router.get('/:id/itinerary.pdf', requireAuth, async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="itinerary-${booking.reference}.pdf"`
    )

    await generateItineraryPdf(booking, res)
  } catch (err) {
    next(err)
  }
})

// Get booking details (owner or admin only)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user)
    res.status(200).json({
      success: true,
      booking,
    })
  } catch (err) {
    next(err)
  }
})

// Cancel booking (owner or admin only)
router.post('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user)

    // Trigger cancellation email asynchronously (non-blocking)
    const recipient = req.user?.email || booking.user?.email
    sendBookingCancellationEmail(booking, recipient).catch(() => {})

    res.status(200).json({
      success: true,
      booking,
    })
  } catch (err) {
    next(err)
  }
})

export default router
