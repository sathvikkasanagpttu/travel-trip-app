import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { haversineDistanceKm } from '../../utils/geo'
import './index.css'

// Fix default marker icon paths for Vite
try {
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
  })
} catch {}

const MapController = ({ start, end }) => {
  const map = useMap()
  useEffect(() => {
    if (start && end && map) {
      try {
        const bounds = L.latLngBounds([
          [start.lat, start.lng],
          [end.lat, end.lng],
        ])
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] })
        }
      } catch {}
    }
  }, [map, start, end])
  return null
}

const RouteMap = ({
  startLat,
  startLng,
  endLat,
  endLng,
  startLabel = 'Start',
  endLabel = 'Destination',
}) => {
  // Guard so it renders nothing in jsdom tests
  const isJsdom =
    typeof window === 'undefined' ||
    (typeof navigator !== 'undefined' &&
      navigator.userAgent &&
      navigator.userAgent.includes('jsdom'))

  if (isJsdom) {
    return null
  }

  const sLat = parseFloat(startLat)
  const sLng = parseFloat(startLng)
  const eLat = parseFloat(endLat)
  const eLng = parseFloat(endLng)

  if (isNaN(sLat) || isNaN(sLng) || isNaN(eLat) || isNaN(eLng)) {
    return null
  }

  const start = { lat: sLat, lng: sLng }
  const end = { lat: eLat, lng: eLng }
  const distanceKm = haversineDistanceKm(sLat, sLng, eLat, eLng)

  const centerLat = (sLat + eLat) / 2
  const centerLng = (sLng + eLng) / 2

  return (
    <div className="route-map-wrapper">
      <div className="route-map-header">
        <span className="route-map-title">Route Preview</span>
        <span className="route-map-distance">Distance: {distanceKm} km</span>
      </div>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={6}
        scrollWheelZoom={false}
        className="route-map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[sLat, sLng]}>
          <Popup>{startLabel}</Popup>
        </Marker>
        <Marker position={[eLat, eLng]}>
          <Popup>{endLabel}</Popup>
        </Marker>
        <Polyline
          positions={[
            [sLat, sLng],
            [eLat, eLng],
          ]}
          color="#2563eb"
          weight={4}
          opacity={0.8}
        />
        <MapController start={start} end={end} />
      </MapContainer>
    </div>
  )
}

export default RouteMap
