importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Initialize Firebase in service worker
firebase.initializeApp({
	apiKey: 'AIzaSyAYEzV3-27uEjHYwOBmoJX8ynLhkcFOCoI',
	authDomain: 'connected-edu.firebaseapp.com',
	projectId: 'connected-edu',
	storageBucket: 'connected-edu.firebasestorage.app',
	messagingSenderId: '956280774197',
	appId: '1:956280774197:web:8f0f8c0e0e0e0e0e0e0e0e'
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
	console.log('Background message received:', payload)

	const notificationTitle = payload.notification?.title || 'ConnecTED Notification'
	const notificationOptions = {
		body: payload.notification?.body || 'You have a new notification',
		icon: payload.notification?.image || '/images/logo.png',
		badge: '/images/logo.png',
		tag: payload.data?.type || 'notification',
		requireInteraction: false,
		data: payload.data || {}
	}

	self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
	event.notification.close()

	const data = event.notification.data || {}
	const urlToOpen = getNavigationUrl(data)

	event.waitUntil(
		clients.matchAll({
			type: 'window',
			includeUncontrolled: true
		}).then((clientList) => {
			// Check if there's already a window with the target URL open
			for (let i = 0; i < clientList.length; i++) {
				const client = clientList[i]
				if (client.url === urlToOpen && 'focus' in client) {
					return client.focus()
				}
			}
			// If not, open a new window
			if (clients.openWindow) {
				return clients.openWindow(urlToOpen)
			}
		})
	)
})

function getNavigationUrl(data) {
	const baseUrl = new URL(self.location).origin

	if (data.type === 'message' && data.threadId) {
		return `${baseUrl}/messages?threadId=${data.threadId}`
	}
	if (data.type === 'grade' && data.subjectId) {
		return `${baseUrl}/grades?subject=${data.subjectId}`
	}
	if (data.type === 'announcement' && data.announcementId) {
		return `${baseUrl}/announcements`
	}
	if (data.type === 'event' && data.eventId) {
		return `${baseUrl}/events`
	}
	if (data.type === 'attendance') {
		return `${baseUrl}/attendance`
	}
	if (data.type === 'homework' && data.homeworkId) {
		return `${baseUrl}/homework`
	}

	return baseUrl
}
