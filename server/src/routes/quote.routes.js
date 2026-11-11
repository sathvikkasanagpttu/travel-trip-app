import { Router } from 'express'
import { calculateQuote } from '../services/quote.service.js'

const router = Router()

// POST /api/v1/quote
router.post('/', (req, res, next) => {
  try {
    const {
      startLat,
      startLng,
      endLat,
      endLng,
      startDate,
      endDate,
      adults = 1,
      children = 0,
      infants = 0,
      assistanceNeeded = false,
    } = req.body

    const quote = calculateQuote({
      startLat,
      startLng,
      endLat,
      endLng,
      startDate,
      endDate,
      adults: parseInt(adults || 1, 10),
      children: parseInt(children || 0, 10),
      infants: parseInt(infants || 0, 10),
      assistanceNeeded: Boolean(assistanceNeeded),
    })

    res.status(200).json({
      success: true,
      ...quote,
    })
  } catch (err) {
    next(err)
  }
})

export default router
