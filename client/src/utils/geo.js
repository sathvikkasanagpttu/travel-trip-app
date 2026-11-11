/**
 * Computes great-circle distance between two points on Earth using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in kilometers rounded to 2 decimals
 */
export const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null ||
    isNaN(Number(lat1)) ||
    isNaN(Number(lon1)) ||
    isNaN(Number(lat2)) ||
    isNaN(Number(lon2))
  ) {
    return 0
  }

  const p1 = Number(lat1)
  const l1 = Number(lon1)
  const p2 = Number(lat2)
  const l2 = Number(lon2)

  const R = 6371 // Earth radius in kilometers
  const toRad = (deg) => (deg * Math.PI) / 180

  const dLat = toRad(p2 - p1)
  const dLon = toRad(l2 - l1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1)) *
      Math.cos(toRad(p2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c

  return Math.round(d * 100) / 100
}
