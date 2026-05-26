import { useDispatch, useSelector } from 'react-redux'
import type {
	Student,
	Class,
	Notification,
	MessageThread,
	Message,
	Event,
	Announcement,
	Grade,
	AttendanceRecord,
	Homework,
	TeacherUpdate,
	AuditLog
} from '@/types'
import type { RootState, AppDispatch } from '@/store'
import {
	setSidebarOpen as setSidebarOpenAction,
	setCurrentView as setCurrentViewAction
} from '@/store/slices/appSlice'
import {
	fetchStudents,
	fetchClasses,
	fetchAnnouncements,
	fetchEvents,
	fetchGrades,
	fetchAttendance,
	fetchHomework,
	fetchMessageThreads,
	fetchMessages,
	fetchAuditLogs,
	fetchNotifications,
	fetchAnalytics,
	sendMessageThunk,
	updateRSVPThunk,
	addStudentThunk,
	updateStudentThunk,
	addClassThunk,
	updateClassThunk,
	markAttendanceThunk,
	addGradeThunk,
	publishGradesThunk,
	addHomeworkThunk,
	addAnnouncementThunk,
	updateAnnouncementThunk,
	deleteAnnouncementThunk,
	addEventThunk,
	updateEventThunk,
	deleteEventThunk,
	approveUserThunk,
	rejectUserThunk,
	markNotificationReadThunk,
	markAllNotificationsReadThunk,
	markThreadAsRead,
	receiveNotification,
	receiveMessage,
	receiveAnnouncement,
	receiveEvent
} from '@/store/slices/dataSlice'

export const useAppStore = () => {
	const app = useSelector((s: RootState) => s.app)
	const data = useSelector((s: RootState) => s.data)
	const dispatch = useDispatch<AppDispatch>()

	return {
		// --- DATA (State from Redux) ---
		students: data.students as Student[],
		classes: data.classes as Class[],
		notifications: data.notifications as Notification[],
		messageThreads: data.messageThreads as MessageThread[],
		messages: data.messages as Message[],
		events: data.events as Event[],
		announcements: data.announcements as Announcement[],
		grades: data.grades as Grade[],
		attendance: data.attendance as AttendanceRecord[],
		homework: data.homework as Homework[],
		teacherUpdates: [] as TeacherUpdate[], // Legacy fallback, handled by announcements/homework mostly
		auditLogs: data.auditLogs as AuditLog[],
		analytics: data.analytics,
		isLoading: data.isLoading,
		error: data.error,

		// --- UI STATE (Connected to Redux) ---
		sidebarOpen: app.sidebarOpen,
		currentView: app.currentView,

		// --- DATA FETCHING ACTIONS ---
		fetchStudents: (params?: any) => dispatch(fetchStudents(params)),
		fetchClasses: () => dispatch(fetchClasses()),
		fetchAnnouncements: (params?: any) => dispatch(fetchAnnouncements(params)),
		fetchEvents: (params?: any) => dispatch(fetchEvents(params)),
		fetchGrades: (params?: any) => dispatch(fetchGrades(params)),
		fetchAttendance: (params?: any) => dispatch(fetchAttendance(params)),
		fetchHomework: (params?: any) => dispatch(fetchHomework(params)),
		fetchMessageThreads: () => dispatch(fetchMessageThreads()),
		fetchMessages: (threadId: string, params?: any) => dispatch(fetchMessages({ threadId, params })),
		fetchAuditLogs: (params?: any) => dispatch(fetchAuditLogs(params)),
		fetchNotifications: (params?: any) => dispatch(fetchNotifications(params)),
		fetchAnalytics: () => dispatch(fetchAnalytics()),

		// --- UI ACTIONS ---
		setSidebarOpen: (open: boolean) => dispatch(setSidebarOpenAction(open)),

		setCurrentView: (view: string) => dispatch(setCurrentViewAction(view)),

		// --- NOTIFICATION ACTIONS ---
		markNotificationRead: (id: string) =>
			dispatch(markNotificationReadThunk(id)),

		markAllNotificationsRead: (userId?: string) => 
			dispatch(markAllNotificationsReadThunk()),

		addNotification: (notification: Notification) =>
			dispatch(receiveNotification(notification)),

		// --- MESSAGE ACTIONS ---
		sendMessage: async (
			threadId: string,
			senderId: string,
			senderRole: 'parent' | 'teacher' | 'admin',
			content: string
		) => {
			return dispatch(sendMessageThunk({ threadId, content }))
		},

		receiveMessage: (message: Message) => 
			dispatch(receiveMessage(message)),
			
		receiveAnnouncement: (announcement: Announcement) =>
			dispatch(receiveAnnouncement(announcement)),
			
		receiveEvent: (event: Event) =>
			dispatch(receiveEvent(event)),

		markMessageRead: (messageId: string) => {
			// Backend auto-reads on fetch/open thread, or update thunk
		},
		
		markThreadAsRead: (threadId: string) => {
			dispatch(markThreadAsRead(threadId));
		},

		// --- EVENT & STUDENT ACTIONS ---
		updateRSVP: (
			eventId: string,
			userId: string,
			status: 'attending' | 'not_attending'
		) => dispatch(updateRSVPThunk({ eventId, status })),

		updateStudent: (studentId: string, updates: Partial<Student>) => 
			dispatch(updateStudentThunk({ id: studentId, updates })),
		
		addStudent: (student: any) => 
			dispatch(addStudentThunk(student)),

		// --- ACADEMIC ACTIONS ---
		markAttendance: (record: AttendanceRecord) => 
			dispatch(markAttendanceThunk([record])),
		
		markAttendanceBulk: (records: AttendanceRecord[]) => 
			dispatch(markAttendanceThunk(records)),

		addGrade: (grade: any) => 
			dispatch(addGradeThunk(grade)),

		publishGrades: (gradeIds: string[]) => 
			dispatch(publishGradesThunk(gradeIds)),

		addHomework: (homework: any) => 
			dispatch(addHomeworkThunk(homework)),

		addTeacherUpdate: (update: any) => {
			// Adapter route for announcements / teacher updates
			return dispatch(addAnnouncementThunk({
				title: update.title,
				content: update.content,
				targetAudience: 'class',
				targetClassIds: [update.classId],
				targetStudentIds: update.studentId ? [update.studentId] : []
			}))
		},

		// --- ADMIN & SYSTEM ACTIONS ---
		addAnnouncement: (announcement: any) => 
			dispatch(addAnnouncementThunk(announcement)),

		updateAnnouncement: (id: string, updates: any) =>
			dispatch(updateAnnouncementThunk({ id, updates })),

		deleteAnnouncement: (id: string) =>
			dispatch(deleteAnnouncementThunk(id)),

		addEvent: (event: any) => 
			dispatch(addEventThunk(event)),

		updateEvent: (id: string, updates: any) =>
			dispatch(updateEventThunk({ id, updates })),

		deleteEvent: (id: string) =>
			dispatch(deleteEventThunk(id)),

		approveUser: (userId: string, role: 'parent' | 'teacher') => 
			dispatch(approveUserThunk(userId)),

		deactivateUser: (userId: string, role: 'parent' | 'teacher') => 
			dispatch(rejectUserThunk({ userId, reason: 'Deactivated by admin' })),

		addAuditLog: (log: AuditLog) => {}
	}
}
