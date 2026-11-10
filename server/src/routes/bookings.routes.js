import { Router } from 'express'
import { createBookingSchema } from '../validators/booking.schema.js'
import * as bookingService from '../services/booking.service.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const router = Router()

// Create a new booking (can be authenticated user or guest)
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey
    const data = {
      ...req.body,
      idempotencyKey,
    }

    const validated = createBookingSchema.parse(data)
    const { booking, isDuplicate } = await bookingService.createBooking(validated, req.user)

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

// Get booking details
router.get('/:id', optionalAuth, async (req, res, next) => {
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

export default router
