import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../db/prisma.js'
import { config } from '../config/env.js'
import { AppError } from '../middleware/errorHandler.js'

export const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  const accessToken = jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiry,
  })

  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry,
  })

  return { accessToken, refreshToken }
}

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
    domain: config.cookieDomain,
  }

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 mins
  })

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

export const clearAuthCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    path: '/',
    domain: config.cookieDomain,
  }

  res.clearCookie('accessToken', cookieOptions)
  res.clearCookie('refreshToken', cookieOptions)
}

export const signup = async ({ name, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim()
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (existingUser) {
    throw new AppError('Email is already registered', 409, 'EMAIL_EXISTS', {
      email: 'Email is already registered',
    })
  }

  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(password, salt)

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'USER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  const tokens = generateTokens(user)
  return { user, tokens }
}

export const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
  }

  const sanitizedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }

  const tokens = generateTokens(sanitizedUser)
  return { user: sanitizedUser, tokens }
}

export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token required', 401, 'UNAUTHORIZED')
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new AppError('User not found', 401, 'UNAUTHORIZED')
    }

    const tokens = generateTokens(user)
    return { user, tokens }
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN')
  }
}
