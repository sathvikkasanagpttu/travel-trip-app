import { z } from 'zod'

export const createBookingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startLocation: z.string().min(1, 'Start location is required'),
  endLocation: z.string().min(1, 'End location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  adults: z.number().int().min(1, 'At least 1 adult is required').default(1),
  children: z.number().int().min(0).default(0),
  infants: z.number().int().min(0).default(0),
  assistanceNeeded: z.boolean().default(false),
  assistanceType: z.string().optional().nullable(),
  assistanceNotes: z.string().optional().nullable(),
  priceTotal: z.number().nonnegative().optional().default(0),
  currency: z.string().default('USD'),
  idempotencyKey: z.string().optional().nullable(),
  startLat: z.number().optional().nullable(),
  startLng: z.number().optional().nullable(),
  endLat: z.number().optional().nullable(),
  endLng: z.number().optional().nullable(),
})
