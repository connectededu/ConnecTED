import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { getIdToken } from '@/lib/firebase'

// Create axios instance
const api: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
	timeout: 30000,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json'
	}
})

// Request interceptor to add auth token
api.interceptors.request.use(
	async (config: InternalAxiosRequestConfig) => {
		try {
			const token = await getIdToken()
			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}
		} catch (error) {
			console.error('Failed to get auth token:', error)
		}
		return config
	},
	(error) => Promise.reject(error)
)

// Response interceptor for error handling
let logoutHandler: (() => void) | null = null

export const setLogoutHandler = (handler: (() => void) | null) => {
	logoutHandler = handler
}

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config

		if (error.response) {
			const { status, data } = error.response

			// If 401 and we haven't retried yet
			if (status === 401 && !originalRequest._retry) {
				originalRequest._retry = true

				try {
					// Force refresh Firebase token
					const token = await getIdToken(true)
					if (token) {
						originalRequest.headers.Authorization = `Bearer ${token}`
						return api(originalRequest)
					}
				} catch (refreshError) {
					console.error('Token refresh failed:', refreshError)
				}

				// If refresh fails or no token, logout
				console.warn('Unauthorized request - logging out')
				if (logoutHandler) {
					logoutHandler()
				}
			} else if (status === 403) {
				console.warn('Access denied:', data.message)
			} else if (status === 500) {
				console.error('Server error:', data.error)
			}
		} else if (error.request) {
			console.error('Network error - no response received')
		}

		return Promise.reject(error)
	}
)

// Auth API
export const authApi = {
	register: (data: {
		role: string
		name: string
		phone?: string
		parentData?: {
			relationship: 'Mother' | 'Father' | 'Guardian'
			emergencyContact: {
				name: string
				phone: string
				relationship: string
			}
			studentDetails?: {
				name: string
				dateOfBirth: string
				admissionNumber?: string
				classId?: string
				previousSchool?: string
			}
		}
		teacherData?: {
			staffId?: string
			subjects?: string[]
			yearsOfExperience?: number
			classIds?: string[]
		}
	}) => api.post('/auth/register', data),

	createSession: (idToken: string) => api.post('/auth/session', { idToken }),

	getMe: () => api.get('/auth/me'),

	approveUser: (userId: string) => api.post(`/auth/approve/${userId}`),

	rejectUser: (userId: string, reason?: string) =>
		api.delete(`/auth/reject/${userId}`, { data: { reason } }),

	updateFcmToken: (token: string) => api.post('/auth/fcm-token', { token }),

	logout: () => api.post('/auth/logout'),

	updateMyProfile: (data: {
		name?: string
		phone?: string
		profilePicture?: string
	}) => api.patch('/auth/me', data)
}

// Users API
export const usersApi = {
	getAll: (params?: {
		role?: string
		isApproved?: boolean
		page?: number
		limit?: number
		q?: string
	}) => api.get('/users', { params }),

	getById: (id: string) => api.get(`/users/${id}`),

	create: (data: any) => api.post('/users', data),

	update: (id: string, data: any) => api.put(`/users/${id}`, data),

	delete: (id: string) => api.delete(`/users/${id}`),

	getPendingApprovals: () =>
		api.get('/users', {
			params: { isApproved: false }
		})
}

// Students API
export const studentsApi = {
	getAll: (params?: { classId?: string; parentId?: string }) =>
		api.get('/students', { params }),

	getById: (id: string) => api.get(`/students/${id}`),

	checkAdmissionNumber: (admissionNumber: string) =>
		api.get(`/students/check/${admissionNumber}`),

	generateId: () => api.get('/students/generate-id'),

	create: (data: any) => api.post('/students', data),

	update: (id: string, data: any) => api.put(`/students/${id}`, data),

	delete: (id: string) => api.delete(`/students/${id}`)
}

// Classes API
export const classesApi = {
	getAll: () => api.get('/classes'),
	search: (q: string) => api.get('/classes/search', { params: { q } }),
	getById: (id: string) => api.get(`/classes/${id}`),
	create: (data: any) => api.post('/classes', data),
	update: (id: string, data: any) => api.put(`/classes/${id}`, data),
	delete: (id: string) => api.delete(`/classes/${id}`)
}

// Notifications API
export const notificationsApi = {
	getAll: (params?: {
		limit?: number
		offset?: number
		unreadOnly?: boolean
	}) => api.get('/notifications', { params }),

	markRead: (id: string) => api.patch(`/notifications/${id}/read`),

	markAllRead: () => api.patch('/notifications/read-all'),

	getUnreadCount: () => api.get('/notifications/unread-count')
}

// Audit API (admin only)
export const auditApi = {
	getLogs: (params?: {
		userId?: string
		action?: string
		targetType?: string
		startDate?: string
		endDate?: string
		limit?: number
		offset?: number
	}) => api.get('/audit', { params })
}

// Email API
export const emailApi = {
	sendToUser: (userId: string, data: { subject: string; body: string }) =>
		api.post(`/users/${userId}/email`, data)
}

// Announcements API
export const announcementsApi = {
	getAll: (params?: {
		targetAudience?: string
		classId?: string
		limit?: number
		offset?: number
		status?: string
	}) => api.get('/announcements', { params }),
	getById: (id: string) => api.get(`/announcements/${id}`),
	create: (data: any) => api.post('/announcements', data),
	update: (id: string, data: any) => api.put(`/announcements/${id}`, data),
	delete: (id: string) => api.delete(`/announcements/${id}`),
	archive: (id: string) => api.patch(`/announcements/${id}/archive`),
	restore: (id: string) => api.patch(`/announcements/${id}/restore`)
}

// Events API
export const eventsApi = {
	getAll: (params?: {
		targetAudience?: string
		upcoming?: boolean
		status?: string
	}) => api.get('/events', { params }),
	getById: (id: string) => api.get(`/events/${id}`),
	create: (data: any) => api.post('/events', data),
	update: (id: string, data: any) => api.put(`/events/${id}`, data),
	delete: (id: string) => api.delete(`/events/${id}`),
	rsvp: (id: string, status: 'attending' | 'not_attending') =>
		api.post(`/events/${id}/rsvp`, { status }),
	archive: (id: string) => api.patch(`/events/${id}/archive`),
	restore: (id: string) => api.patch(`/events/${id}/restore`)
}

// Attendance API
export const attendanceApi = {
	get: (params?: {
		classId?: string
		studentId?: string
		date?: string
		startDate?: string
		endDate?: string
	}) => api.get('/attendance', { params }),
	mark: (records: any[]) => api.post('/attendance', { records }),
	update: (id: string, updates: any) => api.put(`/attendance/${id}`, updates),
	getSummary: (studentId: string) => api.get(`/attendance/student/${studentId}`)
}

// Grades API
export const gradesApi = {
	getAll: (params?: {
		classId?: string
		studentId?: string
		subject?: string
		term?: string
		teacherId?: string
	}) => api.get('/grades', { params }),
	create: (data: any) => api.post('/grades', data),
	update: (id: string, data: any) => api.put(`/grades/${id}`, data),
	delete: (id: string) => api.delete(`/grades/${id}`),
	publish: (gradeIds: string[]) => api.post('/grades/publish', { gradeIds })
}

// Homework API
export const homeworkApi = {
	getAll: (params?: {
		classId?: string
		teacherId?: string
		subject?: string
	}) => api.get('/homework', { params }),
	getById: (id: string) => api.get(`/homework/${id}`),
	create: (data: any) => api.post('/homework', data),
	update: (id: string, data: any) => api.put(`/homework/${id}`, data),
	delete: (id: string) => api.delete(`/homework/${id}`)
}

// Messages API
export const messagesApi = {
	getThreads: () => api.get('/messages/threads'),
	getOrCreateThread: (
		participantId: string,
		studentId: string,
		participantRole?: string
	) =>
		api.post('/messages/threads', {
			participantId,
			studentId,
			participantRole
		}),
	getMessages: (
		threadId: string,
		params?: { limit?: number; offset?: number }
	) => api.get(`/messages/threads/${threadId}/messages`, { params }),
	sendMessage: (threadId: string, content: string, attachments?: any[]) =>
		api.post(`/messages/threads/${threadId}/messages`, {
			content,
			attachments
		}),
	markRead: (threadId: string) =>
		api.patch(`/messages/threads/${threadId}/read`)
}

// Analytics API
export const analyticsApi = {
	get: () => api.get('/analytics')
}

// Programs API
export const programsApi = {
	getAll: () => api.get('/programs'),
	getById: (id: string) => api.get(`/programs/${id}`),
	create: (data: any) => api.post('/programs', data),
	update: (id: string, data: any) => api.put(`/programs/${id}`, data),
	delete: (id: string) => api.delete(`/programs/${id}`),
	getSubjects: (q?: string) =>
		api.get(`/programs/subjects`, { params: { q, limit: 5 } })
}

// Subject Groups API
export const subjectGroupsApi = {
	getAll: () => api.get('/subject-groups'),
	getById: (id: string) => api.get(`/subject-groups/${id}`),
	create: (data: { name: string; subjects: string[] }) =>
		api.post('/subject-groups', data),
	update: (id: string, data: { name: string; subjects: string[] }) =>
		api.put(`/subject-groups/${id}`, data),
	delete: (id: string) => api.delete(`/subject-groups/${id}`)
}

// Upload API
export const uploadApi = {
	uploadFile: (file: File) => {
		const formData = new FormData()
		formData.append('file', file)
		return api.post('/upload', formData, {
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		})
	}
}

export default api
