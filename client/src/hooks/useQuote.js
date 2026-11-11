import { useState, useEffect, useRef } from 'react'
import { fetchQuote } from '../api/quote'

export const useQuote = (params) => {
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const timerRef = useRef(null)
  const paramsKey = JSON.stringify(params)

  useEffect(() => {
    if (!params || params.adults === undefined || params.adults < 1) {
      setQuote(null)
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setLoading(true)
    setError(null)

    timerRef.current = setTimeout(async () => {
      try {
        const data = await fetchQuote({
          startLat: params.startLat,
          startLng: params.startLng,
          endLat: params.endLat,
          endLng: params.endLng,
          startDate: params.startDate,
          endDate: params.endDate,
          adults: Number(params.adults) || 1,
          children: Number(params.children) || 0,
          infants: Number(params.infants) || 0,
          assistanceNeeded: Boolean(params.assistanceNeeded),
        })
        setQuote(data)
      } catch (err) {
        setError(err?.response?.data?.error?.message || 'Failed to calculate quote')
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [paramsKey])

  return { quote, loading, error }
}
