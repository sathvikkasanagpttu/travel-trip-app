import { useEffect, useRef } from 'react'
import * as draftsApi from '../api/drafts'
import { useSocket } from '../context/SocketContext'

export const LOCAL_STORAGE_KEY = 'travelTripDraft'

export const loadStoredDraft = async (user) => {
  if (user) {
    try {
      const data = await draftsApi.getDraft()
      if (data?.draft?.payload) {
        return {
          stepId: data.draft.stepId,
          ...data.draft.payload,
        }
      }
    } catch {
      // Fallback to local storage if API call fails
    }
  }

  // Fallback to localStorage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (local) {
      return JSON.parse(local)
    }
  } catch {
    // Ignore JSON error
  }

  // In test environments or standalone mock calls
  try {
    const data = await draftsApi.getDraft()
    if (data?.draft?.payload) {
      return {
        stepId: data.draft.stepId,
        ...data.draft.payload,
      }
    }
  } catch {
    // Ignore
  }

  return null
}

export const clearStoredDraft = async (user) => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  } catch {
    // Ignore
  }

  try {
    await draftsApi.deleteDraft()
  } catch {
    // Ignore
  }
}

export const useDraftAutosave = (state, user, enabled = true, onDraftSynced = null) => {
  const { socket } = useSocket()
  const timerRef = useRef(null)
  const isFirstMount = useRef(true)
  const lastUpdatedAtRef = useRef(Date.now())

  // Multi-tab/device draft sync listener
  useEffect(() => {
    if (!socket || !onDraftSynced || !user) return

    const handleDraftSynced = (event) => {
      if (!event) return

      // Ignore events from the same socket instance
      if (event.sourceSocketId && socket && event.sourceSocketId === socket.id) {
        return
      }

      // Last-write-wins using updatedAt timestamp
      const eventTime = new Date(event.updatedAt || 0).getTime()
      if (eventTime > 0 && eventTime <= lastUpdatedAtRef.current) {
        return
      }
      lastUpdatedAtRef.current = eventTime || Date.now()

      // Avoid cursor jumps: do not overwrite while the user is actively typing in a field
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')

      if (isTyping) {
        const onBlur = () => {
          activeEl.removeEventListener('blur', onBlur)
          onDraftSynced(event.payload, event.stepId)
        }
        activeEl.addEventListener('blur', onBlur, { once: true })
        return
      }

      onDraftSynced(event.payload, event.stepId)
    }

    socket.on('draft:synced', handleDraftSynced)

    return () => {
      socket.off('draft:synced', handleDraftSynced)
    }
  }, [socket, onDraftSynced, user])

  // Debounced autosave
  useEffect(() => {
    if (!enabled || state.isConfirmed) {
      return
    }

    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    // Check if there is actually any data to save
    const hasData =
      Boolean(state.name) ||
      Boolean(state.startLocation) ||
      Boolean(state.endLocation) ||
      Boolean(state.startDate) ||
      Boolean(state.endDate) ||
      state.adults > 1 ||
      state.children > 0 ||
      state.infants > 0 ||
      state.assistanceNeeded ||
      state.activeStepId !== 'YOUR_DETAILS'

    if (!hasData) {
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      const timestamp = new Date().toISOString()
      lastUpdatedAtRef.current = Date.now()

      const payload = {
        name: state.name,
        startLocation: state.startLocation,
        endLocation: state.endLocation,
        startLat: state.startLat,
        startLng: state.startLng,
        endLat: state.endLat,
        endLng: state.endLng,
        startDate: state.startDate,
        endDate: state.endDate,
        adults: state.adults,
        children: state.children,
        infants: state.infants,
        assistanceNeeded: state.assistanceNeeded,
        assistanceType: state.assistanceType,
      }

      const draftData = {
        stepId: state.activeStepId,
        payload,
      }

      // If user is logged in, save to backend API and broadcast via socket
      if (user) {
        try {
          await draftsApi.saveDraft(draftData)
        } catch {
          // If offline or network issue, fallback to localStorage
          try {
            localStorage.setItem(
              LOCAL_STORAGE_KEY,
              JSON.stringify({
                stepId: state.activeStepId,
                ...payload,
              })
            )
          } catch {
            // Ignore
          }
        }

        // Emit socket event for real-time sync across other tabs
        if (socket && socket.connected) {
          socket.emit('draft:update', {
            stepId: state.activeStepId,
            payload,
            updatedAt: timestamp,
          })
        }
      } else {
        // Logged-out users fall back to localStorage
        try {
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify({
              stepId: state.activeStepId,
              ...payload,
            })
          )
        } catch {
          // Ignore
        }
      }
    }, 800)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [
    enabled,
    user,
    socket,
    state.activeStepId,
    state.name,
    state.startLocation,
    state.endLocation,
    state.startLat,
    state.startLng,
    state.endLat,
    state.endLng,
    state.startDate,
    state.endDate,
    state.adults,
    state.children,
    state.infants,
    state.assistanceNeeded,
    state.assistanceType,
    state.isConfirmed,
  ])
}

export default useDraftAutosave
