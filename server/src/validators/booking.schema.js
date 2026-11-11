import { z } from 'zod'

export const createBookingSchema = z
  .object({
    name: z.string().min(1, 'Enter your name'),
    startLocation: z.string().min(1, 'Enter your start location'),
    endLocation: z.string().min(1, 'Enter your end location'),
    startDate: z.string().min(1, 'Select start date'),
    endDate: z.string().min(1, 'Select end date'),
    adults: z.number().int().min(1, 'At least 1 adult is required').default(1),
    children: z.number().int().min(0, 'Children cannot be negative').default(0),
    infants: z.number().int().min(0, 'Infants cannot be negative').default(0),
    assistanceNeeded: z.boolean().default(false),
    assistanceType: z.string().optional().nullable(),
    assistanceNotes: z.string().optional().nullable(),
    priceTotal: z.number().nonnegative().optional().default(0),
    currency: z.string().default('INR'),
    idempotencyKey: z.string().optional().nullable(),
    startLat: z.number().optional().nullable(),
    startLng: z.number().optional().nullable(),
    endLat: z.number().optional().nullable(),
    endLng: z.number().optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true
      return data.endDate >= data.startDate
    },
    {
      message: 'The end date cannot be less than the start date',
      path: ['endDate'],
    }
  )
