import { Router } from 'express'
import { z } from 'zod'
import { requireAdmin } from '../middleware/auth.js'
import { getAdminBookings, updateBookingStatusByAdmin } from '../services/booking.service.js'
import { config } from '../config/env.js'
import { emitQuoteUpdated } from '../socket.js'

const router = Router()

// All routes require admin privileges
router.use(requireAdmin)

const statusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED']),
  note: z.string().optional(),
})

// GET /api/v1/admin/bookings
router.get('/bookings', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10)
    const limit = parseInt(req.query.limit || '10', 10)
    const status = req.query.status || 'ALL'
    const search = req.query.search || ''

    const result = await getAdminBookings({ page, limit, status, search })
    res.status(200).json({
      success: true,
      ...result,
    })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/admin/bookings/:id/status
router.patch('/bookings/:id/status', async (req, res, next) => {
  try {
    const parsed = statusSchema.parse(req.body)
    const updated = await updateBookingStatusByAdmin(req.params.id, parsed, req.user)
    res.status(200).json({
      success: true,
      booking: updated,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/admin/quote-rates (to simulate/trigger quote rate updates)
router.post('/quote-rates', (req, res, next) => {
  try {
    const { quoteRatePerKm, quoteNightRate, quoteAssistanceSurcharge } = req.body
    const oldRates = {
      ratePerKm: config.quoteRatePerKm,
      nightRate: config.quoteNightRate,
      assistanceSurcharge: config.quoteAssistanceSurcharge,
    }

    if (quoteRatePerKm !== undefined) config.quoteRatePerKm = parseFloat(quoteRatePerKm)
    if (quoteNightRate !== undefined) config.quoteNightRate = parseFloat(quoteNightRate)
    if (quoteAssistanceSurcharge !== undefined) config.quoteAssistanceSurcharge = parseFloat(quoteAssistanceSurcharge)

    const newRates = {
      ratePerKm: config.quoteRatePerKm,
      nightRate: config.quoteNightRate,
      assistanceSurcharge: config.quoteAssistanceSurcharge,
    }

    emitQuoteUpdated('rates', newRates, oldRates)

    res.status(200).json({
      success: true,
      oldRates,
      newRates,
    })
  } catch (err) {
    next(err)
  }
})

export default router
