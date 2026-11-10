import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import prisma from '../db/prisma.js'
import { AppError } from './errorHandler.js'

export const extractToken = (req) => {
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken
  }
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  return null
}

export const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req)
    if (!token) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED')
    }

    const decoded = jwt.verify(token, config.jwtAccessSecret)
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

    req.user = user
    next()
  } catch (err) {
    if (err instanceof AppError) {
      return next(err)
    }
    return next(new AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN'))
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req)
    if (!token) {
      req.user = null
      return next()
    }

    const decoded = jwt.verify(token, config.jwtAccessSecret)
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

    req.user = user || null
    next()
  } catch {
    req.user = null
    next()
  }
}
