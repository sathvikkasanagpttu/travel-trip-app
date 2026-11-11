import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { signupSchema, loginSchema } from '../validators/auth.schema.js'
import * as authService from '../services/auth.service.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 mins for signup
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
})

// Specific 5/min per IP rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again after 1 minute',
    },
  },
})

router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const validated = signupSchema.parse(req.body)
    const { user, tokens } = await authService.signup(validated)
    authService.setAuthCookies(res, tokens)
    res.status(201).json({
      success: true,
      user,
      accessToken: tokens.accessToken,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body)
    const { user, tokens } = await authService.login(validated)
    authService.setAuthCookies(res, tokens)
    res.status(200).json({
      success: true,
      user,
      accessToken: tokens.accessToken,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', (req, res) => {
  authService.clearAuthCookies(res)
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
})

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    const { user, tokens } = await authService.refresh(refreshToken)
    authService.setAuthCookies(res, tokens)
    res.status(200).json({
      success: true,
      user,
      accessToken: tokens.accessToken,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  })
})

export default router
