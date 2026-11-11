import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
  }
  return 'http://localhost:5001'
}

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState('offline') // 'connected' | 'reconnecting' | 'offline'
  const socketRef = useRef(null)

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      setConnectionStatus('offline')
      return
    }

    const socketUrl = getSocketUrl()
    const socket = io(socketUrl, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnectionStatus('connected')
    })

    socket.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') {
        setConnectionStatus('offline')
      } else {
        setConnectionStatus('reconnecting')
      }
    })

    socket.on('connect_error', () => {
      setConnectionStatus('reconnecting')
    })

    socket.on('reconnect', () => {
      setConnectionStatus('connected')
    })

    socket.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting')
    })

    socket.on('reconnect_failed', () => {
      setConnectionStatus('offline')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnectionStatus('offline')
    }
  }, [user])

  const isConnected = connectionStatus === 'connected'

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connectionStatus,
        isConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    return {
      socket: null,
      connectionStatus: 'offline',
      isConnected: false,
    }
  }
  return context
}

export default SocketContext
