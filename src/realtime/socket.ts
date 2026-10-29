import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connectRealtime(token: string): Socket {
  if (socket?.connected) {
    socket.auth = { token }
    return socket
  }

  socket?.removeAllListeners()
  socket?.disconnect()

  socket = io({
    path: '/socket.io',
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 600,
    timeout: 5000,
    autoConnect: true,
  })

  if (import.meta.env.DEV) {
    ;(window as unknown as { __jgSocket?: Socket }).__jgSocket = socket
  }

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectRealtime(): void {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
}
