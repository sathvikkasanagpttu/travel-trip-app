import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { config } from '../config/env.js'
import logger from '../utils/logger.js'

const router = Router()

// Rate limiter: 1 request/second per IP to respect Nominatim policy
const nominatimLimiter = rateLimit({
  windowMs: 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test' && req.headers['x-test-skip-limit'] === 'true',
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many search requests, please slow down (1 request per second)',
    },
  },
})

// In-memory cache: query -> { timestamp, data }
const placesCache = new Map()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

export const clearPlacesCache = () => {
  placesCache.clear()
}

// GET /api/v1/places/search?q=
router.get('/search', async (req, res, next) => {
  try {
    const rawQuery = req.query.q || ''
    const query = String(rawQuery).trim().toLowerCase()

    if (!query || query.length < 3) {
      return res.status(200).json({
        success: true,
        places: [],
      })
    }

    // Check in-memory cache first (cached queries do not hit Nominatim)
    const now = Date.now()
    if (placesCache.has(query)) {
      const cached = placesCache.get(query)
      if (now - cached.timestamp < CACHE_TTL_MS) {
        return res.status(200).json({
          success: true,
          places: cached.data,
          cached: true,
        })
      } else {
        placesCache.delete(query)
      }
    }

    // Apply rate limiter for actual outbound Nominatim queries
    return nominatimLimiter(req, res, async () => {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=jsonv2&limit=5&addressdetails=1`

        const response = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': config.nominatimUserAgent,
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          logger.warn(
            { status: response.status, statusText: response.statusText },
            'Nominatim request failed'
          )
          return res.status(200).json({
            success: true,
            places: [],
          })
        }

        const data = await response.json()
        const places = (Array.isArray(data) ? data : []).map((item) => ({
          label: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }))

        // Cache results
        placesCache.set(query, {
          timestamp: now,
          data: places,
        })

        return res.status(200).json({
          success: true,
          places,
          cached: false,
        })
      } catch (innerErr) {
        logger.error({ err: innerErr }, 'Error fetching Nominatim places')
        next(innerErr)
      }
    })
  } catch (err) {
    logger.error({ err }, 'Error in Nominatim place search')
    next(err)
  }
})

export default router
