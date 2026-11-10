import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { signupSchema, loginSchema } from '../validators/auth.schema.js'
import * as authService from '../services/auth.service.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 requests per 15 mins for login/signup
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
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

router.post('/login', authLimiter, async (req, res, next) => {
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
