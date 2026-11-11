import http from 'http'
import app from './app.js'
import { config } from './config/env.js'
import prisma from './db/prisma.js'
import { initSocket } from './socket.js'

const server = http.createServer(app)
initSocket(server)

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect()
    console.log('✔ Connected to database')

    server.listen(config.port, () => {
      console.log(`🚀 Travel Trip Server running on http://localhost:${config.port}`)
      console.log(`   Health check at http://localhost:${config.port}/health`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`)
  server.close(async () => {
    console.log('HTTP server closed.')
    await prisma.$disconnect()
    console.log('Prisma disconnected.')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

startServer()
