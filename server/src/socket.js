import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from './config/env.js'
import prisma from './db/prisma.js'
import logger from './utils/logger.js'

let io = null

const parseCookies = (cookieHeader = '') => {
  const list = {}
  if (!cookieHeader) return list

  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=')
    if (parts.length >= 2) {
      const name = parts[0].trim()
      const val = parts.slice(1).join('=').trim()
      list[name] = decodeURIComponent(val)
    }
  })
  return list
}

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [config.clientUrl],
      credentials: true,
    },
  })

  // Handshake authentication middleware
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie
      const cookies = parseCookies(cookieHeader)
      const token = cookies.accessToken || cookies.refreshToken

      if (!token) {
        return next(new Error('AUTHENTICATION_ERROR: Missing authentication cookie'))
      }

      let decoded = null
      try {
        decoded = jwt.verify(token, config.jwtAccessSecret)
      } catch {
        try {
          decoded = jwt.verify(token, config.jwtRefreshSecret)
        } catch {
          return next(new Error('AUTHENTICATION_ERROR: Invalid or expired token'))
        }
      }

      socket.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'USER',
      }

      next()
    } catch (err) {
      logger.error({ err }, 'Socket handshake authentication error')
      next(new Error('AUTHENTICATION_ERROR'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.user.id
    const userRole = socket.user.role

    logger.info({ socketId: socket.id, userId, role: userRole }, 'Socket connected')

    // Join personal user room
    socket.join(`user:${userId}`)

    // If admin, join admins room
    if (userRole === 'ADMIN') {
      socket.join('admins')
      logger.info({ socketId: socket.id, userId }, 'Socket joined admins room')
    }

    // Join booking room
    socket.on('join:booking', async (bookingId, ack) => {
      try {
        if (!bookingId) return

        // Verify authorization: must be booking owner or admin
        if (userRole !== 'ADMIN') {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { userId: true },
          })
          if (!booking || booking.userId !== userId) {
            if (typeof ack === 'function') {
              ack({ success: false, error: 'Unauthorized to join booking room' })
            }
            return
          }
        }

        socket.join(`booking:${bookingId}`)
        logger.info({ socketId: socket.id, bookingId }, 'Socket joined booking room')
        if (typeof ack === 'function') {
          ack({ success: true, room: `booking:${bookingId}` })
        }
      } catch (err) {
        logger.error({ err, bookingId }, 'Error joining booking room')
        if (typeof ack === 'function') {
          ack({ success: false, error: err.message })
        }
      }
    })

    // Leave booking room
    socket.on('leave:booking', (bookingId) => {
      if (bookingId) {
        socket.leave(`booking:${bookingId}`)
        logger.info({ socketId: socket.id, bookingId }, 'Socket left booking room')
      }
    })

    // Multi-tab draft update
    socket.on('draft:update', async (data) => {
      try {
        if (!data) return
        const { stepId, payload, updatedAt } = data
        const timestamp = updatedAt || new Date().toISOString()
        const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload)

        // Save to DB
        await prisma.draft.upsert({
          where: { userId },
          update: {
            stepId: stepId || 'YOUR_DETAILS',
            payload: payloadStr,
          },
          create: {
            userId,
            stepId: stepId || 'YOUR_DETAILS',
            payload: payloadStr,
          },
        })

        // Broadcast to user's other sockets
        socket.to(`user:${userId}`).emit('draft:synced', {
          payload,
          stepId,
          updatedAt: timestamp,
          sourceSocketId: socket.id,
        })
      } catch (err) {
        logger.error({ err, userId }, 'Error syncing draft via socket')
      }
    })

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, userId, reason }, 'Socket disconnected')
    })
  })

  return io
}

export const getIO = () => io

export const emitBookingStatus = (bookingId, status, note, userId) => {
  if (!io) return

  const payload = {
    bookingId,
    status,
    note: note || '',
    at: new Date().toISOString(),
  }

  // Emit to booking room, personal user room, and admins room
  io.to(`booking:${bookingId}`)
    .to(`user:${userId}`)
    .to('admins')
    .emit('booking:status', payload)

  logger.info({ bookingId, status, userId }, 'Emitted booking:status event')
}

export const emitAdminNewBooking = (bookingSummary) => {
  if (!io) return

  const payload = {
    ...bookingSummary,
    at: new Date().toISOString(),
  }

  io.to('admins').emit('admin:new-booking', payload)
  logger.info({ bookingId: bookingSummary.id }, 'Emitted admin:new-booking event')
}

export const emitQuoteUpdated = (target, newTotal, oldTotal) => {
  if (!io) return

  const payload = {
    target,
    newTotal,
    oldTotal,
    at: new Date().toISOString(),
  }

  io.emit('quote:updated', payload)
  logger.info({ target, newTotal, oldTotal }, 'Emitted quote:updated event')
}
