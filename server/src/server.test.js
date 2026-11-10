import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from './app.js'
import prisma from './db/prisma.js'

describe('Travel Trip Backend API', () => {
  beforeAll(async () => {
    await prisma.$connect()
    // Clean up test data
    await prisma.statusEvent.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.draft.deleteMany()
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('GET /health returns 200 ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  let authCookie = null
  let testUser = null

  it('POST /api/v1/auth/signup creates a user and sets cookies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Jane Traveler',
        email: 'jane@example.com',
        password: 'password123',
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.user.name).toBe('Jane Traveler')
    expect(res.body.user.email).toBe('jane@example.com')
    expect(res.headers['set-cookie']).toBeDefined()

    authCookie = res.headers['set-cookie']
    testUser = res.body.user
  })

  it('POST /api/v1/auth/login logs in and returns user info', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'jane@example.com',
        password: 'password123',
      })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.user.id).toBe(testUser.id)
  })

  it('GET /api/v1/auth/me returns current user profile with cookie', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('jane@example.com')
  })

  it('POST /api/v1/bookings creates a booking with reference and idempotency', async () => {
    const idempotencyKey = 'test-idemp-12345'
    const bookingPayload = {
      name: 'Jane Traveler',
      startLocation: 'New York',
      endLocation: 'Tokyo',
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      adults: 2,
      children: 1,
      infants: 0,
      assistanceNeeded: true,
      assistanceType: 'Wheelchair',
      idempotencyKey,
    }

    // First request - created 201
    const res1 = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send(bookingPayload)

    expect(res1.status).toBe(201)
    expect(res1.body.success).toBe(true)
    expect(res1.body.booking.reference).toMatch(/^TT-2026-[A-Z0-9]+$/)
    expect(res1.body.booking.status).toBe('CONFIRMED')
    expect(res1.body.isDuplicate).toBe(false)

    const reference = res1.body.booking.reference

    // Second request with same idempotency key - returns 200 and existing booking
    const res2 = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', authCookie)
      .send(bookingPayload)

    expect(res2.status).toBe(200)
    expect(res2.body.booking.reference).toBe(reference)
    expect(res2.body.isDuplicate).toBe(true)
  })

  it('GET /api/v1/bookings lists user bookings', async () => {
    const res = await request(app)
      .get('/api/v1/bookings')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.bookings).toHaveLength(1)
    expect(res.body.bookings[0].name).toBe('Jane Traveler')
    expect(res.body.pagination.total).toBe(1)
  })
})
