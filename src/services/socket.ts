import { io, Socket } from 'socket.io-client'
import { getIdToken } from '@/lib/firebase'

let socket: Socket | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

// Event listeners registry
const eventListeners = new Map<string, Set<(...args: any[]) => void>>()

/**
 * Initialize socket connection with authentication
 */
export const initializeSocket = async (): Promise<Socket | null> => {
	if (socket?.connected) {
		console.log('Socket already connected')
		return socket
	}

	try {
		const token = await getIdToken()

		if (!token) {
			console.warn('No auth token available for socket connection')
			return null
		}
		const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
		const socketUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl

		console.log('Initializing socket connection to:', socketUrl)
		socket = io(socketUrl, {
			auth: { token },
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000
		})

		// Connection events
		socket.on('connect', () => {
			console.log('Socket connected, ID:', socket?.id)
			reconnectAttempts = 0

			// Re-register all event listeners
			eventListeners.forEach((listeners, event) => {
				listeners.forEach((callback) => {
					socket?.on(event, callback)
					console.log(`Re-registered listener for: ${event}`)
				})
			})
		})

		socket.on('disconnect', (reason) => {
			console.log('Socket disconnected:', reason)
		})

		socket.on('connect_error', (error) => {
			console.error('Socket connection error:', error.message)
			reconnectAttempts++

			if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
				console.error('Max reconnection attempts reached')
			}
		})

		return socket
	} catch (error) {
		console.error('Failed to initialize socket:', error)
		return null
	}
}

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
	if (socket) {
		socket.disconnect()
		socket = null
		eventListeners.clear()
	}
}

/**
 * Get socket instance
 */
export const getSocket = (): Socket | null => socket

/**
 * Check if socket is connected
 */
export const isConnected = (): boolean => socket?.connected ?? false

/**
 * Subscribe to a socket event
 */
export const on = (event: string, callback: (...args: any[]) => void): void => {
	console.log(`Registering socket listener for: ${event}`)
	// Store in registry for reconnection
	if (!eventListeners.has(event)) {
		eventListeners.set(event, new Set())
	}
	eventListeners.get(event)!.add(callback)

	// Add to socket if connected
	if (socket) {
		socket.on(event, callback)
		console.log(`Socket listener active for: ${event}`)
	} else {
		console.warn(
			`Socket not connected yet, listener will be added on reconnection: ${event}`
		)
	}
}

/**
 * Unsubscribe from a socket event
 */
export const off = (
	event: string,
	callback: (...args: any[]) => void
): void => {
	eventListeners.get(event)?.delete(callback)

	if (socket) {
		socket.off(event, callback)
	}
}

/**
 * Emit an event to the server
 */
export const emit = (event: string, data?: any): void => {
	if (socket?.connected) {
		socket.emit(event, data)
	} else {
		console.warn('Socket not connected, cannot emit:', event)
	}
}

// Convenience methods for common operations

/**
 * Join a class room for real-time updates
 */
export const joinClass = (classId: string): void => {
	emit('join:class', classId)
}

/**
 * Leave a class room
 */
export const leaveClass = (classId: string): void => {
	emit('leave:class', classId)
}

/**
 * Join a message thread
 */
export const joinThread = (threadId: string): void => {
	emit('join:thread', threadId)
}

/**
 * Leave a message thread
 */
export const leaveThread = (threadId: string): void => {
	emit('leave:thread', threadId)
}

/**
 * Send typing indicator
 */
export const sendTypingStart = (threadId: string): void => {
	emit('typing:start', { threadId })
}

/**
 * Stop typing indicator
 */
export const sendTypingStop = (threadId: string): void => {
	emit('typing:stop', { threadId })
}

// Notification events
export const onNotification = (callback: (notification: any) => void): void => {
	on('notification:new', callback)
}

export const offNotification = (
	callback: (notification: any) => void
): void => {
	off('notification:new', callback)
}

// User presence events
export const onUserOnline = (
	callback: (data: { userId: string }) => void
): void => {
	on('user:online', callback)
}

export const onUserOffline = (
	callback: (data: { userId: string }) => void
): void => {
	on('user:offline', callback)
}

// Typing events
export const onTypingStart = (
	callback: (data: { userId: string; threadId: string }) => void
): void => {
	on('typing:start', callback)
}

export const onTypingStop = (
	callback: (data: { userId: string; threadId: string }) => void
): void => {
	on('typing:stop', callback)
}

export default {
	initializeSocket,
	disconnectSocket,
	getSocket,
	isConnected,
	on,
	off,
	emit,
	joinClass,
	leaveClass,
	joinThread,
	leaveThread,
	sendTypingStart,
	sendTypingStop,
	onNotification,
	offNotification,
	onUserOnline,
	onUserOffline,
	onTypingStart,
	onTypingStop
}
