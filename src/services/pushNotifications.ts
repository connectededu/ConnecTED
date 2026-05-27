import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'
import app from '@/lib/firebase'

let messaging: Messaging | null = null

export const initializeMessaging = async (): Promise<Messaging | null> => {
	if (messaging) return messaging

	try {
		messaging = getMessaging(app)
		return messaging
	} catch (error) {
		console.error('Failed to initialize messaging:', error)
		return null
	}
}

export const requestNotificationPermission = async (): Promise<string | null> => {
	if (!('Notification' in window)) {
		console.warn('This browser does not support notifications')
		return null
	}

	if (Notification.permission === 'granted') {
		return await getFCMToken()
	}

	if (Notification.permission !== 'denied') {
		try {
			const permission = await Notification.requestPermission()
			if (permission === 'granted') {
				return await getFCMToken()
			}
		} catch (error) {
			console.error('Failed to request notification permission:', error)
		}
	}

	return null
}

export const getFCMToken = async (): Promise<string | null> => {
	try {
		const msg = await initializeMessaging()
		if (!msg) return null

		const token = await getToken(msg, {
			vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
		})

		return token || null
	} catch (error) {
		console.error('Failed to get FCM token:', error)
		return null
	}
}

export const setupMessageListener = (callback: (payload: any) => void) => {
	try {
		if (!messaging) {
			console.warn('Messaging not initialized')
			return
		}

		onMessage(messaging, (payload) => {
			console.log('Foreground message received:', payload)
			callback(payload)

			// Show notification even in foreground
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.ready.then((registration) => {
					registration.showNotification(
						payload.notification?.title || 'Notification',
						{
							body: payload.notification?.body,
							icon: payload.notification?.image || '/images/logo.png',
							badge: '/images/logo.png',
							tag: payload.data?.type || 'notification',
							requireInteraction: false,
							data: payload.data
						}
					)
				})
			}
		})
	} catch (error) {
		console.error('Failed to setup message listener:', error)
	}
}

export const registerServiceWorker = async (): Promise<boolean> => {
	if (!('serviceWorker' in navigator)) {
		console.warn('Service Workers are not supported')
		return false
	}

	try {
		const registration = await navigator.serviceWorker.register('/service-worker.js', {
			scope: '/'
		})
		console.log('Service Worker registered:', registration)
		return true
	} catch (error) {
		console.error('Service Worker registration failed:', error)
		return false
	}
}
