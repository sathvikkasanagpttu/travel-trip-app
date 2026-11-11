import { haversineDistanceKm } from '../utils/geo.js'
import { config } from '../config/env.js'

export const calculateQuote = ({
  startLat,
  startLng,
  endLat,
  endLng,
  startDate,
  endDate,
  adults = 1,
  children = 0,
  infants = 0,
  assistanceNeeded = false,
}) => {
  // Nights calculation
  let nights = 1
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    nights = Math.max(1, diff)
  }

  // Distance calculation (haversine or fallback)
  let distanceKm = 0
  let isEstimatedDistance = false

  if (
    startLat !== undefined &&
    startLng !== undefined &&
    endLat !== undefined &&
    endLng !== undefined &&
    startLat !== null &&
    startLng !== null &&
    endLat !== null &&
    endLng !== null
  ) {
    distanceKm = haversineDistanceKm(
      parseFloat(startLat),
      parseFloat(startLng),
      parseFloat(endLat),
      parseFloat(endLng)
    )
  }

  if (distanceKm <= 0) {
    distanceKm = 350 // Fallback flat distance estimate in km
    isEstimatedDistance = true
  }

  // Guest multiplier: Adults 100%, Children 50%, Infants 0%
  const numAdults = Math.max(1, parseInt(adults || 1, 10))
  const numChildren = Math.max(0, parseInt(children || 0, 10))
  const numInfants = Math.max(0, parseInt(infants || 0, 10))
  const effectiveGuests = numAdults * 1.0 + numChildren * 0.5 + numInfants * 0.0

  const ratePerKm = config.quoteRatePerKm
  const nightRate = config.quoteNightRate
  const assistanceSurcharge = config.quoteAssistanceSurcharge

  const distanceFare = Math.round(distanceKm * ratePerKm * effectiveGuests * 100) / 100
  const stayFare = Math.round(nights * nightRate * effectiveGuests * 100) / 100
  const assistanceFare = assistanceNeeded ? assistanceSurcharge : 0
  const total = Math.round((distanceFare + stayFare + assistanceFare) * 100) / 100

  const breakdown = [
    {
      label: `Distance Fare (${distanceKm} km${isEstimatedDistance ? ' est.' : ''})`,
      amount: distanceFare,
    },
    {
      label: `Stay Fare (${nights} night${nights > 1 ? 's' : ''}, ${effectiveGuests} guest factor)`,
      amount: stayFare,
    },
  ]

  if (assistanceNeeded) {
    breakdown.push({
      label: 'Travel Assistance Surcharge',
      amount: assistanceFare,
    })
  }

  return {
    currency: 'INR',
    breakdown,
    total,
    distanceKm,
    nights,
    effectiveGuests,
  }
}
