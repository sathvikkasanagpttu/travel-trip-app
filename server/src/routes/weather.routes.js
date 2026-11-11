import { Router } from 'express'
import logger from '../utils/logger.js'

const router = Router()

// In-memory cache for weather forecasts: key -> { timestamp, data }
const weatherCache = new Map()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

export const clearWeatherCache = () => {
  weatherCache.clear()
}

// WMO weather code descriptions
const getWeatherDescription = (code) => {
  if (code === 0) return { description: 'Clear sky', icon: '☀️' }
  if ([1, 2].includes(code)) return { description: 'Partly cloudy', icon: '🌤️' }
  if (code === 3) return { description: 'Overcast', icon: '☁️' }
  if ([45, 48].includes(code)) return { description: 'Foggy', icon: '🌫️' }
  if ([51, 53, 55].includes(code)) return { description: 'Drizzle', icon: '🌦️' }
  if ([61, 63, 65].includes(code)) return { description: 'Rain', icon: '🌧️' }
  if ([71, 73, 75].includes(code)) return { description: 'Snow', icon: '❄️' }
  if ([80, 81, 82].includes(code)) return { description: 'Rain showers', icon: '🌦️' }
  if ([95, 96, 99].includes(code)) return { description: 'Thunderstorm', icon: '⛈️' }
  return { description: 'Fair weather', icon: '🌤️' }
}

// GET /api/v1/weather?lat=&lng=&start=&end=
router.get('/', async (req, res, next) => {
  try {
    const { lat, lng, start, end } = req.query

    if (!lat || !lng) {
      return res.status(400).json({
        error: {
          code: 'COORDINATES_REQUIRED',
          message: 'Both latitude (lat) and longitude (lng) are required',
        },
      })
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    // Check if start date is provided and verify 16-day limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const maxForecastDate = new Date(today)
    maxForecastDate.setDate(today.getDate() + 16)

    if (start) {
      const startDate = new Date(start)
      if (startDate > maxForecastDate) {
        return res.status(200).json({
          success: true,
          available: false,
          message: 'Weather forecast is only available for dates within the next 16 days.',
          forecast: [],
        })
      }
    }

    // Cache key
    const cacheKey = `${latitude.toFixed(2)}_${longitude.toFixed(2)}_${start || 'none'}_${end || 'none'}`
    const now = Date.now()

    if (weatherCache.has(cacheKey)) {
      const cached = weatherCache.get(cacheKey)
      if (now - cached.timestamp < CACHE_TTL_MS) {
        return res.status(200).json({
          success: true,
          ...cached.data,
          cached: true,
        })
      } else {
        weatherCache.delete(cacheKey)
      }
    }

    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto`

    const response = await fetch(openMeteoUrl)
    if (!response.ok) {
      logger.warn({ status: response.status }, 'Open-Meteo request failed')
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Weather forecast is temporarily unavailable',
        forecast: [],
      })
    }

    const data = await response.json()
    const daily = data.daily

    if (!daily || !daily.time) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'No forecast data returned',
        forecast: [],
      })
    }

    let forecastList = daily.time.map((dateStr, i) => {
      const code = daily.weathercode ? daily.weathercode[i] : 0
      const { description, icon } = getWeatherDescription(code)

      return {
        date: dateStr,
        tempMax: daily.temperature_2m_max ? daily.temperature_2m_max[i] : null,
        tempMin: daily.temperature_2m_min ? daily.temperature_2m_min[i] : null,
        precipitationProbability: daily.precipitation_probability_max
          ? daily.precipitation_probability_max[i]
          : 0,
        weatherCode: code,
        description,
        icon,
      }
    })

    // Filter by start and end dates if provided
    if (start && end) {
      forecastList = forecastList.filter((f) => f.date >= start && f.date <= end)
    } else if (start) {
      forecastList = forecastList.filter((f) => f.date >= start)
    }

    const result = {
      available: forecastList.length > 0,
      message:
        forecastList.length > 0
          ? 'Forecast loaded successfully'
          : 'Forecast is unavailable for the selected date range.',
      forecast: forecastList,
    }

    // Save to cache
    weatherCache.set(cacheKey, {
      timestamp: now,
      data: result,
    })

    res.status(200).json({
      success: true,
      ...result,
      cached: false,
    })
  } catch (err) {
    logger.error({ err }, 'Error in weather forecast route')
    next(err)
  }
})

export default router
