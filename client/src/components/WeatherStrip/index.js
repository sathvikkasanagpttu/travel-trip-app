import { useState, useEffect } from 'react'
import { fetchWeather } from '../../api/weather'
import './index.css'

const WeatherStrip = ({ lat, lng, start, end, destinationName }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!lat || !lng) {
      setData(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    fetchWeather({ lat, lng, start, end })
      .then((res) => {
        if (isMounted) {
          setData(res)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.error?.message || 'Failed to fetch weather forecast')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [lat, lng, start, end])

  if (!lat || !lng) {
    return null
  }

  const title = destinationName
    ? `Destination Forecast (${destinationName})`
    : 'Destination Weather Forecast'

  return (
    <div className="weather-strip-container" data-testid="weather-strip">
      <div className="weather-strip-header">
        <span className="weather-strip-title">{title}</span>
      </div>

      {loading && (
        <div className="weather-strip-notice" data-testid="weather-loading">
          Loading weather forecast...
        </div>
      )}

      {!loading && error && (
        <div className="weather-strip-notice">Weather forecast unavailable.</div>
      )}

      {!loading && !error && data && !data.available && (
        <div className="weather-strip-notice" data-testid="weather-unavailable">
          {data.message || 'Weather forecast is unavailable for selected dates.'}
        </div>
      )}

      {!loading && !error && data && data.available && data.forecast && data.forecast.length > 0 && (
        <div className="weather-cards-scroll" data-testid="weather-forecast-list">
          {data.forecast.map((day) => {
            const dateObj = new Date(day.date + 'T00:00:00')
            const dateLabel = isNaN(dateObj)
              ? day.date
              : dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })

            return (
              <div key={day.date} className="weather-card" data-testid={`weather-card-${day.date}`}>
                <span className="weather-card-date">{dateLabel}</span>
                <span className="weather-card-icon" title={day.description}>
                  {day.icon || '☀️'}
                </span>
                <span className="weather-card-desc">{day.description}</span>
                <span className="weather-card-temps">
                  {Math.round(day.tempMax)}° <span className="weather-card-min">/ {Math.round(day.tempMin)}°</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default WeatherStrip
