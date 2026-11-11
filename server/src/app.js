import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { config } from './config/env.js'
import authRoutes from './routes/auth.routes.js'
import bookingRoutes from './routes/bookings.routes.js'
import draftRoutes from './routes/drafts.routes.js'
import placesRoutes from './routes/places.routes.js'
import quoteRoutes from './routes/quote.routes.js'
import weatherRoutes from './routes/weather.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { errorHandler, AppError } from './middleware/errorHandler.js'

const app = express()

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS configuration
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}))

app.use(cookieParser())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: config.nodeEnv,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  })
})

// API routes
app.use('/auth', authRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/bookings', bookingRoutes)
app.use('/bookings', bookingRoutes)
app.use('/api/v1/drafts', draftRoutes)
app.use('/drafts', draftRoutes)
app.use('/api/v1/places', placesRoutes)
app.use('/places', placesRoutes)
app.use('/api/v1/quote', quoteRoutes)
app.use('/quote', quoteRoutes)
app.use('/api/v1/weather', weatherRoutes)
app.use('/weather', weatherRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/admin', adminRoutes)

// 404 catch-all
app.use('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND'))
})

// Centralized error handling
app.use(errorHandler)

export default app
