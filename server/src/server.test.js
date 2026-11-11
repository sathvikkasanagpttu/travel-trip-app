import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import request from 'supertest'
import http from 'http'
import bcrypt from 'bcryptjs'
import { io as Client } from 'socket.io-client'
import app from './app.js'
import prisma from './db/prisma.js'
import * as emailService from './services/email.service.js'
import { haversineDistanceKm } from './utils/geo.js'
import { clearPlacesCache } from './routes/places.routes.js'
import { clearWeatherCache } from './routes/weather.routes.js'
import { initSocket, emitBookingStatus } from './socket.js'

describe('Travel Trip Backend API', () => {
  let testHttpServer = null
  let socketUrl = ''

  beforeAll(async () => {
    await prisma.$connect()
    // Clean up test data
    await prisma.statusEvent.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.draft.deleteMany()
    await prisma.user.deleteMany()

    testHttpServer = http.createServer(app)
    initSocket(testHttpServer)
    await new Promise((resolve) => testHttpServer.listen(0, resolve))
    const port = testHttpServer.address().port
    socketUrl = `http://localhost:${port}`
  })

  afterAll(async () => {
    if (testHttpServer) {
      await new Promise((resolve) => testHttpServer.close(resolve))
    }
    await prisma.$disconnect()
  })

  it('GET /health returns 200 ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  let userACookie = null
  let userA = null
  let userBCookie = null
  let userB = null
  let bookingA = null

  it('POST /api/v1/auth/signup creates User A and sets httpOnly cookies', async () => {
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

    userACookie = res.headers['set-cookie']
    userA = res.body.user
  })

  it('POST /api/v1/auth/signup creates User B', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Bob Explorer',
        email: 'bob@example.com',
        password: 'password123',
      })

    expect(res.status).toBe(201)
    userBCookie = res.headers['set-cookie']
    userB = res.body.user
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
    expect(res.body.user.id).toBe(userA.id)
  })

  it('GET /api/v1/auth/me and GET /auth/me return current user profile with cookie', async () => {
    const res1 = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', userACookie)

    expect(res1.status).toBe(200)
    expect(res1.body.user.email).toBe('jane@example.com')

    const res2 = await request(app)
      .get('/auth/me')
      .set('Cookie', userACookie)

    expect(res2.status).toBe(200)
    expect(res2.body.user.email).toBe('jane@example.com')
  })

  it('POST /api/v1/bookings rejects without Idempotency-Key', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', userACookie)
      .send({
        name: 'Jane Traveler',
        startLocation: 'New York',
        endLocation: 'Tokyo',
        startDate: '2026-12-01',
        endDate: '2026-12-10',
        adults: 2,
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED')
  })

  it('POST /api/v1/bookings validates date range (end >= start)', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', userACookie)
      .set('Idempotency-Key', 'key-invalid-date')
      .send({
        name: 'Jane Traveler',
        startLocation: 'New York',
        endLocation: 'Tokyo',
        startDate: '2026-12-10',
        endDate: '2026-12-01',
        adults: 2,
      })

    expect(res.status).toBe(400)
    expect(res.body.error.fields.endDate).toBe(
      'The end date cannot be less than the start date'
    )
  })

  it('POST /api/v1/bookings creates a booking with reference, status events, and idempotency', async () => {
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
    }

    // First request - created 201
    const res1 = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', userACookie)
      .set('Idempotency-Key', idempotencyKey)
      .send(bookingPayload)

    expect(res1.status).toBe(201)
    expect(res1.body.success).toBe(true)
    expect(res1.body.booking.reference).toMatch(/^TT-2026-[A-Z0-9]+$/)
    expect(res1.body.booking.status).toBe('CONFIRMED')
    expect(res1.body.isDuplicate).toBe(false)
    expect(res1.body.booking.currency).toBe('INR')

    bookingA = res1.body.booking
    const reference = bookingA.reference

    // Second request with same idempotency key - returns 200 and existing booking
    const res2 = await request(app)
      .post('/api/v1/bookings')
      .set('Cookie', userACookie)
      .set('Idempotency-Key', idempotencyKey)
      .send(bookingPayload)

    expect(res2.status).toBe(200)
    expect(res2.body.booking.reference).toBe(reference)
    expect(res2.body.isDuplicate).toBe(true)

    // Verify exactly one row in the database for this idempotency key
    const count = await prisma.booking.count({
      where: { idempotencyKey },
    })
    expect(count).toBe(1)

    // Verify StatusEvent exists
    const events = await prisma.statusEvent.findMany({
      where: { bookingId: bookingA.id },
    })
    expect(events.some((e) => e.status === 'PENDING')).toBe(true)
  })

  it('GET /api/v1/bookings lists user bookings with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/bookings')
      .set('Cookie', userACookie)

    expect(res.status).toBe(200)
    expect(res.body.bookings).toHaveLength(1)
    expect(res.body.bookings[0].name).toBe('Jane Traveler')
    expect(res.body.pagination.total).toBe(1)
  })

  it('Authorization: User B cannot read User A booking (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${bookingA.id}`)
      .set('Cookie', userBCookie)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('Authorization: User B cannot cancel User A booking (403 Forbidden)', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingA.id}/cancel`)
      .set('Cookie', userBCookie)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('POST /api/v1/bookings/:id/cancel allows owner to cancel booking', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingA.id}/cancel`)
      .set('Cookie', userACookie)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.booking.status).toBe('CANCELLED')

    const events = await prisma.statusEvent.findMany({
      where: { bookingId: bookingA.id, status: 'CANCELLED' },
    })
    expect(events.length).toBeGreaterThanOrEqual(1)
  })

  // Phase 2: Draft CRUD Tests
  it('Drafts: GET /api/v1/drafts/me returns null when no draft exists', async () => {
    const res = await request(app)
      .get('/api/v1/drafts/me')
      .set('Cookie', userACookie)

    expect(res.status).toBe(200)
    expect(res.body.draft).toBeNull()
  })

  it('Drafts: PUT /api/v1/drafts/me saves a draft and GET retrieves it', async () => {
    const draftPayload = {
      name: 'Jane Traveler',
      startLocation: 'London',
      endLocation: 'Paris',
      startDate: '2026-12-05',
      endDate: '2026-12-15',
      adults: 2,
    }

    const putRes = await request(app)
      .put('/api/v1/drafts/me')
      .set('Cookie', userACookie)
      .send({
        stepId: 'GUESTS',
        payload: draftPayload,
      })

    expect(putRes.status).toBe(200)
    expect(putRes.body.draft.stepId).toBe('GUESTS')
    expect(putRes.body.draft.payload.endLocation).toBe('Paris')

    const getRes = await request(app)
      .get('/api/v1/drafts/me')
      .set('Cookie', userACookie)

    expect(getRes.status).toBe(200)
    expect(getRes.body.draft.stepId).toBe('GUESTS')
    expect(getRes.body.draft.payload.name).toBe('Jane Traveler')
  })

  it('Drafts: DELETE /api/v1/drafts/me removes the draft', async () => {
    const delRes = await request(app)
      .delete('/api/v1/drafts/me')
      .set('Cookie', userACookie)

    expect(delRes.status).toBe(200)

    const getRes = await request(app)
      .get('/api/v1/drafts/me')
      .set('Cookie', userACookie)

    expect(getRes.status).toBe(200)
    expect(getRes.body.draft).toBeNull()
  })

  // Phase 2: PDF Itinerary Endpoint Tests
  it('PDF: GET /api/v1/bookings/:id/itinerary.pdf returns application/pdf with attachment header', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${bookingA.id}/itinerary.pdf`)
      .set('Cookie', userACookie)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
    expect(res.headers['content-disposition']).toBe(
      `attachment; filename="itinerary-${bookingA.reference}.pdf"`
    )
    expect(res.body).toBeDefined()
  })

  it('PDF: GET /api/v1/bookings/:id/itinerary.pdf enforces authorization (403 for other users)', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${bookingA.id}/itinerary.pdf`)
      .set('Cookie', userBCookie)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  // Phase 2: Email Functionality Tests
  it('Email: sendBookingConfirmationEmail dispatches email with booking summary', async () => {
    const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'msg-test-123' })
    emailService.setTransporter({
      sendMail: mockSendMail,
    })

    await emailService.sendBookingConfirmationEmail(bookingA, 'jane@example.com')

    expect(mockSendMail).toHaveBeenCalledTimes(1)
    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.to).toBe('jane@example.com')
    expect(callArgs.subject).toContain(bookingA.reference)
    expect(callArgs.html).toContain(bookingA.reference)
    expect(callArgs.html).toContain('View My Trip Details')
  })

  // Phase 3: Haversine Distance Tests
  describe('Haversine Distance Formula', () => {
    it('calculates accurate distance between coordinates', () => {
      // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) ~ 343.56 km
      const dist = haversineDistanceKm(51.5074, -0.1278, 48.8566, 2.3522)
      expect(dist).toBeGreaterThan(340)
      expect(dist).toBeLessThan(350)
    })

    it('returns 0 for identical points', () => {
      const dist = haversineDistanceKm(19.076, 72.8777, 19.076, 72.8777)
      expect(dist).toBe(0)
    })

    it('returns 0 for invalid or missing coordinates', () => {
      expect(haversineDistanceKm(undefined, 72.8777, 19.076, 72.8777)).toBe(0)
      expect(haversineDistanceKm(NaN, 72.8777, 19.076, 72.8777)).toBe(0)
    })
  })

  // Phase 3: Quote Engine Tests
  describe('Quote Engine: POST /api/v1/quote', () => {
    it('computes quote for solo adult with distance and nights', async () => {
      const res = await request(app)
        .post('/api/v1/quote')
        .send({
          startLat: 51.5074,
          startLng: -0.1278,
          endLat: 48.8566,
          endLng: 2.3522,
          startDate: '2026-06-01',
          endDate: '2026-06-03',
          adults: 1,
          children: 0,
          infants: 0,
          assistanceNeeded: false,
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.currency).toBe('INR')
      expect(res.body.nights).toBe(2)
      expect(res.body.total).toBe(3717.8)
      expect(res.body.breakdown).toHaveLength(2)
    })

    it('applies guest multiplier correctly (2 adults, 2 children, 1 infant)', async () => {
      const res = await request(app)
        .post('/api/v1/quote')
        .send({
          startLat: 51.5074,
          startLng: -0.1278,
          endLat: 48.8566,
          endLng: 2.3522,
          startDate: '2026-06-01',
          endDate: '2026-06-03',
          adults: 2,
          children: 2,
          infants: 1,
          assistanceNeeded: true,
        })

      expect(res.status).toBe(200)
      expect(res.body.total).toBe(11653.4)
      expect(res.body.breakdown.some((b) => b.label.includes('Assistance'))).toBe(true)
    })

    it('uses fallback flat estimate when coordinates are missing', async () => {
      const res = await request(app)
        .post('/api/v1/quote')
        .send({
          startDate: '2026-06-01',
          endDate: '2026-06-02',
          adults: 1,
        })

      expect(res.status).toBe(200)
      expect(res.body.distanceKm).toBe(350)
      expect(res.body.total).toBeGreaterThan(0)
    })
  })

  // Phase 3: Places Search & Nominatim Proxy Tests
  describe('Places Search: GET /api/v1/places/search', () => {
    it('returns empty array when query length < 3', async () => {
      const res = await request(app).get('/api/v1/places/search?q=pa')
      expect(res.status).toBe(200)
      expect(res.body.places).toEqual([])
    })

    it('proxies to Nominatim with proper response format', async () => {
      clearPlacesCache()
      const mockPlaces = [
        {
          display_name: 'Paris, France',
          lat: '48.8566',
          lon: '2.3522',
        },
      ]

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlaces,
      })

      const res = await request(app).get('/api/v1/places/search?q=paris')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.places).toHaveLength(1)
      expect(res.body.places[0]).toEqual({
        label: 'Paris, France',
        lat: 48.8566,
        lng: 2.3522,
      })
      expect(res.body.cached).toBe(false)
      expect(fetchSpy).toHaveBeenCalled()

      fetchSpy.mockRestore()
    })
  })

  // Phase 3: Weather Forecast Tests
  describe('Weather Forecast: GET /api/v1/weather', () => {
    it('rejects without latitude and longitude', async () => {
      const res = await request(app).get('/api/v1/weather')
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('COORDINATES_REQUIRED')
    })

    it('returns friendly message when date is beyond 16 days', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const dateStr = futureDate.toISOString().split('T')[0]

      const res = await request(app).get(
        `/api/v1/weather?lat=48.8566&lng=2.3522&start=${dateStr}`
      )

      expect(res.status).toBe(200)
      expect(res.body.available).toBe(false)
      expect(res.body.message).toContain('16 days')
      expect(res.body.forecast).toEqual([])
    })

    it('fetches Open-Meteo forecast, maps weather codes, and returns daily list', async () => {
      clearWeatherCache()
      const mockDaily = {
        daily: {
          time: ['2026-06-01', '2026-06-02'],
          temperature_2m_max: [24.5, 26.0],
          temperature_2m_min: [14.0, 15.5],
          precipitation_probability_max: [10, 40],
          weathercode: [0, 61],
        },
      }

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockDaily,
      })

      const res = await request(app).get('/api/v1/weather?lat=48.8566&lng=2.3522')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.available).toBe(true)
      expect(res.body.forecast).toHaveLength(2)
      expect(res.body.forecast[0].description).toBe('Clear sky')
      expect(res.body.forecast[0].icon).toBe('☀️')
      expect(res.body.forecast[1].description).toBe('Rain')
      expect(res.body.forecast[1].icon).toBe('🌧️')

      fetchSpy.mockRestore()
    })
  })

  // Phase 4: Admin REST Endpoints & Authorization
  describe('Phase 4: Admin REST Endpoints', () => {
    let adminCookie = null
    let adminUser = null
    let pendingBooking = null

    beforeAll(async () => {
      // Create admin user
      const passwordHash = await bcrypt.hash('adminpassword123', 10)
      adminUser = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'admin@example.com',
          passwordHash,
          role: 'ADMIN',
        },
      })

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'adminpassword123',
        })

      expect(loginRes.status).toBe(200)
      adminCookie = loginRes.headers['set-cookie']

      // Create a PENDING booking for testing admin actions
      const bookingRes = await request(app)
        .post('/api/v1/bookings')
        .set('Cookie', userACookie)
        .set('Idempotency-Key', 'key-pending-admin-test-1')
        .send({
          name: 'Jane Traveler',
          startLocation: 'Delhi',
          endLocation: 'Agra',
          startDate: '2026-07-01',
          endDate: '2026-07-03',
          adults: 2,
          children: 0,
          infants: 0,
          status: 'PENDING',
        })

      expect(bookingRes.status).toBe(201)
      pendingBooking = bookingRes.body.booking
    })

    it('GET /api/v1/admin/bookings rejects non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/bookings')
        .set('Cookie', userACookie)

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('GET /api/v1/admin/bookings allows admin and returns bookings, pagination, and stats', async () => {
      const res = await request(app)
        .get('/api/v1/admin/bookings')
        .set('Cookie', adminCookie)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.bookings)).toBe(true)
      expect(res.body.pagination).toBeDefined()
      expect(res.body.stats).toBeDefined()
      expect(res.body.stats.total).toBeGreaterThanOrEqual(1)
    })

    it('PATCH /api/v1/admin/bookings/:id/status rejects non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/bookings/${pendingBooking.id}/status`)
        .set('Cookie', userACookie)
        .send({
          status: 'CONFIRMED',
          note: 'Hacked by regular user',
        })

      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('PATCH /api/v1/admin/bookings/:id/status updates booking, creates StatusEvent, and sends email', async () => {
      const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'status-msg-123' })
      emailService.setTransporter({ sendMail: mockSendMail })

      const res = await request(app)
        .patch(`/api/v1/admin/bookings/${pendingBooking.id}/status`)
        .set('Cookie', adminCookie)
        .send({
          status: 'CONFIRMED',
          note: 'Approved by admin manually',
        })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.booking.status).toBe('CONFIRMED')

      // Verify StatusEvent was persisted
      const events = await prisma.statusEvent.findMany({
        where: { bookingId: pendingBooking.id },
      })
      expect(events.some((e) => e.status === 'CONFIRMED' && e.note.includes('Approved'))).toBe(true)

      // Verify email was sent
      expect(mockSendMail).toHaveBeenCalled()
    })
  })

  // Phase 4: Socket.IO Authentication & Real-time Events
  describe('Phase 4: Socket.IO Real-Time Features', () => {
    it('rejects socket connection without authentication cookie', async () => {
      let connectionError = null
      const client = Client(socketUrl, {
        autoConnect: false,
        reconnection: false,
        transports: ['websocket'],
      })

      await new Promise((resolve) => {
        client.on('connect_error', (err) => {
          connectionError = err
          client.close()
          resolve()
        })
        client.on('connect', () => {
          client.close()
          resolve()
        })
        client.connect()
      })

      expect(connectionError).toBeDefined()
      expect(connectionError.message).toContain('AUTHENTICATION_ERROR')
    })

    it('authenticates socket connection with httpOnly JWT cookie', async () => {
      const cookieStr = Array.isArray(userACookie) ? userACookie.join('; ') : userACookie
      const client = Client(socketUrl, {
        autoConnect: false,
        reconnection: false,
        transports: ['websocket'],
        extraHeaders: {
          Cookie: cookieStr,
        },
      })

      await new Promise((resolve) => {
        client.on('connect', resolve)
        client.connect()
      })

      expect(client.connected).toBe(true)
      client.close()
    })

    it('syncs drafts in real-time across two simulated clients of the same user', async () => {
      const cookieStr = Array.isArray(userACookie) ? userACookie.join('; ') : userACookie

      const client1 = Client(socketUrl, {
        reconnection: false,
        transports: ['websocket'],
        extraHeaders: { Cookie: cookieStr },
      })

      const client2 = Client(socketUrl, {
        reconnection: false,
        transports: ['websocket'],
        extraHeaders: { Cookie: cookieStr },
      })

      await Promise.all([
        new Promise((resolve) => client1.on('connect', resolve)),
        new Promise((resolve) => client2.on('connect', resolve)),
      ])

      const testPayload = {
        name: 'Jane Traveler',
        startLocation: 'Sydney',
        endLocation: 'Melbourne',
      }

      let receivedEvent = null

      const syncPromise = new Promise((resolve) => {
        client2.on('draft:synced', (data) => {
          receivedEvent = data
          resolve()
        })
      })

      // Client 1 emits draft update
      client1.emit('draft:update', {
        stepId: 'YOUR_DETAILS',
        payload: testPayload,
        updatedAt: new Date().toISOString(),
      })

      await syncPromise

      expect(receivedEvent).toBeDefined()
      expect(receivedEvent.stepId).toBe('YOUR_DETAILS')
      expect(receivedEvent.payload.startLocation).toBe('Sydney')
      expect(receivedEvent.payload.endLocation).toBe('Melbourne')

      client1.close()
      client2.close()
    })

    it('emits booking:status to booking owner and admins room, but not to unrelated users', async () => {
      const userACookieStr = Array.isArray(userACookie) ? userACookie.join('; ') : userACookie
      const userBCookieStr = Array.isArray(userBCookie) ? userBCookie.join('; ') : userBCookie

      const clientA = Client(socketUrl, {
        reconnection: false,
        transports: ['websocket'],
        extraHeaders: { Cookie: userACookieStr },
      })

      const clientB = Client(socketUrl, {
        reconnection: false,
        transports: ['websocket'],
        extraHeaders: { Cookie: userBCookieStr },
      })

      await Promise.all([
        new Promise((resolve) => clientA.on('connect', resolve)),
        new Promise((resolve) => clientB.on('connect', resolve)),
      ])

      let clientAReceived = null
      let clientBReceived = null

      clientA.on('booking:status', (data) => {
        clientAReceived = data
      })

      clientB.on('booking:status', (data) => {
        clientBReceived = data
      })

      // Emit status event targeted to bookingA (owned by User A)
      emitBookingStatus(bookingA.id, 'CONFIRMED', 'Real-time test confirmation', userA.id)

      await new Promise((resolve) => setTimeout(resolve, 300))

      expect(clientAReceived).toBeDefined()
      expect(clientAReceived.bookingId).toBe(bookingA.id)
      expect(clientAReceived.status).toBe('CONFIRMED')
      // User B should not receive User A's booking status
      expect(clientBReceived).toBeNull()

      clientA.close()
      clientB.close()
    })
  })
})
