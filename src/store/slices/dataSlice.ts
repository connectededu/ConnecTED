import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
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
  AuditLog 
} from '@/types'
import {
  studentsApi,
  classesApi,
  announcementsApi,
  eventsApi,
  attendanceApi,
  gradesApi,
  homeworkApi,
  messagesApi,
  notificationsApi,
  auditApi,
  authApi,
  analyticsApi
} from '@/services/api'

interface DataState {
  students: Student[]
  classes: Class[]
  notifications: Notification[]
  messageThreads: MessageThread[]
  messages: Message[]
  events: Event[]
  announcements: Announcement[]
  grades: Grade[]
  attendance: AttendanceRecord[]
  homework: Homework[]
  auditLogs: AuditLog[]
  analytics: any
  isLoading: boolean
  error: string | null
}

const initialState: DataState = {
  students: [],
  classes: [],
  notifications: [],
  messageThreads: [],
  messages: [],
  events: [],
  announcements: [],
  grades: [],
  attendance: [],
  homework: [],
  auditLogs: [],
  analytics: null,
  isLoading: false,
  error: null
}


// Async Thunks
export const fetchStudents = createAsyncThunk('data/fetchStudents', async (params?: any) => {
  const res = await studentsApi.getAll(params)
  return res.data
})

export const fetchClasses = createAsyncThunk('data/fetchClasses', async () => {
  const res = await classesApi.getAll()
  return res.data
})

export const fetchAnnouncements = createAsyncThunk('data/fetchAnnouncements', async (params?: any) => {
  const res = await announcementsApi.getAll(params)
  return res.data.announcements
})

export const fetchEvents = createAsyncThunk('data/fetchEvents', async (params?: any) => {
  const res = await eventsApi.getAll(params)
  return res.data
})

export const fetchGrades = createAsyncThunk('data/fetchGrades', async (params?: any) => {
  const res = await gradesApi.getAll(params)
  return res.data
})

export const fetchAttendance = createAsyncThunk('data/fetchAttendance', async (params?: any) => {
  const res = await attendanceApi.get(params)
  return res.data
})

export const fetchHomework = createAsyncThunk('data/fetchHomework', async (params?: any) => {
  const res = await homeworkApi.getAll(params)
  return res.data
})

export const fetchMessageThreads = createAsyncThunk('data/fetchMessageThreads', async () => {
  const res = await messagesApi.getThreads()
  return res.data
})

export const fetchMessages = createAsyncThunk('data/fetchMessages', async ({ threadId, params }: { threadId: string; params?: any }) => {
  const res = await messagesApi.getMessages(threadId, params)
  return res.data
})

export const fetchAuditLogs = createAsyncThunk('data/fetchAuditLogs', async (params?: any) => {
  const res = await auditApi.getLogs(params)
  return res.data.logs
})

export const fetchNotifications = createAsyncThunk('data/fetchNotifications', async (params?: any) => {
  const res = await notificationsApi.getAll(params)
  return res.data.notifications
})

export const fetchAnalytics = createAsyncThunk('data/fetchAnalytics', async () => {
  const res = await analyticsApi.get()
  return res.data
})


// Mutation Thunks
export const sendMessageThunk = createAsyncThunk(
  'data/sendMessage',
  async ({ threadId, content, attachments }: { threadId: string; content: string; attachments?: any[] }) => {
    const res = await messagesApi.sendMessage(threadId, content, attachments)
    return res.data
  }
)

export const updateRSVPThunk = createAsyncThunk(
  'data/updateRSVP',
  async ({ eventId, status }: { eventId: string; status: 'attending' | 'not_attending' }) => {
    const res = await eventsApi.rsvp(eventId, status)
    return res.data
  }
)

export const addStudentThunk = createAsyncThunk('data/addStudent', async (data: any) => {
  const res = await studentsApi.create(data)
  return res.data
})

export const updateStudentThunk = createAsyncThunk('data/updateStudent', async ({ id, updates }: { id: string; updates: any }) => {
  const res = await studentsApi.update(id, updates)
  return res.data
})

export const addClassThunk = createAsyncThunk('data/addClass', async (data: any) => {
  const res = await classesApi.create(data)
  return res.data
})

export const updateClassThunk = createAsyncThunk('data/updateClass', async ({ id, updates }: { id: string; updates: any }) => {
  const res = await classesApi.update(id, updates)
  return res.data
})

export const markAttendanceThunk = createAsyncThunk('data/markAttendance', async (records: any[]) => {
  const res = await attendanceApi.mark(records)
  return res.data.records
})

export const addGradeThunk = createAsyncThunk('data/addGrade', async (data: any) => {
  const res = await gradesApi.create(data)
  return res.data
})

export const publishGradesThunk = createAsyncThunk('data/publishGrades', async (gradeIds: string[]) => {
  await gradesApi.publish(gradeIds)
  return gradeIds
})

export const addHomeworkThunk = createAsyncThunk('data/addHomework', async (data: any) => {
  const res = await homeworkApi.create(data)
  return res.data
})

export const addAnnouncementThunk = createAsyncThunk('data/addAnnouncement', async (data: any) => {
  const res = await announcementsApi.create(data)
  return res.data
})

export const updateAnnouncementThunk = createAsyncThunk('data/updateAnnouncement', async ({ id, updates }: { id: string; updates: any }) => {
  const res = await announcementsApi.update(id, updates)
  return res.data
})

export const deleteAnnouncementThunk = createAsyncThunk('data/deleteAnnouncement', async (id: string) => {
  await announcementsApi.delete(id)
  return id
})

export const addEventThunk = createAsyncThunk('data/addEvent', async (data: any) => {
  const res = await eventsApi.create(data)
  return res.data
})

export const updateEventThunk = createAsyncThunk('data/updateEvent', async ({ id, updates }: { id: string; updates: any }) => {
  const res = await eventsApi.update(id, updates)
  return res.data
})

export const deleteEventThunk = createAsyncThunk('data/deleteEvent', async (id: string) => {
  await eventsApi.delete(id)
  return id
})

export const approveUserThunk = createAsyncThunk('data/approveUser', async (userId: string) => {
  const res = await authApi.approveUser(userId)
  return { userId, user: res.data.user }
})

export const rejectUserThunk = createAsyncThunk('data/rejectUser', async ({ userId, reason }: { userId: string; reason?: string }) => {
  await authApi.rejectUser(userId, reason)
  return userId
})

export const markNotificationReadThunk = createAsyncThunk('data/markNotificationRead', async (id: string) => {
  await notificationsApi.markRead(id)
  return id
})

export const markAllNotificationsReadThunk = createAsyncThunk('data/markAllNotificationsRead', async () => {
  await notificationsApi.markAllRead()
})

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    // Socket listener actions to update state in real-time
    receiveMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload)
      const thread = state.messageThreads.find(t => t.id === action.payload.threadId)
      if (thread) {
        thread.lastMessage = action.payload
        thread.unreadCount += 1
      }
    },
    receiveNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload)
    },
    receiveAnnouncement(state, action: PayloadAction<Announcement>) {
      // Avoid duplicates
      const exists = state.announcements.some(a => a.id === action.payload.id || a._id === action.payload._id);
      if (!exists) {
        state.announcements.unshift(action.payload)
      }
    },
    receiveEvent(state, action: PayloadAction<Event>) {
      // Avoid duplicates
      const exists = state.events.some(e => e.id === action.payload.id || e._id === action.payload._id);
      if (!exists) {
        state.events.push(action.payload)
        // Re-sort events by date
        state.events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetching
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.students = action.payload
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.classes = action.payload
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.announcements = action.payload
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.events = action.payload
      })
      .addCase(fetchGrades.fulfilled, (state, action) => {
        state.grades = action.payload
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.attendance = action.payload
      })
      .addCase(fetchHomework.fulfilled, (state, action) => {
        state.homework = action.payload
      })
      .addCase(fetchMessageThreads.fulfilled, (state, action) => {
        state.messageThreads = action.payload
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages = action.payload
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.auditLogs = action.payload
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload
      })


      // Mutations
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        state.messages.push(action.payload)
        const thread = state.messageThreads.find(t => t.id === action.payload.threadId)
        if (thread) {
          thread.lastMessage = action.payload
          thread.unreadCount = 0
        }
      })
      .addCase(updateRSVPThunk.fulfilled, (state, action) => {
        const idx = state.events.findIndex(e => e.id === action.payload.id)
        if (idx !== -1) {
          state.events[idx] = action.payload
        }
      })
      .addCase(addStudentThunk.fulfilled, (state, action) => {
        state.students.push(action.payload)
      })
      .addCase(updateStudentThunk.fulfilled, (state, action) => {
        const idx = state.students.findIndex(s => s.id === action.payload.id)
        if (idx !== -1) {
          state.students[idx] = action.payload
        }
      })
      .addCase(addClassThunk.fulfilled, (state, action) => {
        state.classes.push(action.payload)
      })
      .addCase(updateClassThunk.fulfilled, (state, action) => {
        const idx = state.classes.findIndex(c => c.id === action.payload.id)
        if (idx !== -1) {
          state.classes[idx] = action.payload
        }
      })
      .addCase(markAttendanceThunk.fulfilled, (state, action) => {
        // Merge or replace marked attendance records
        action.payload.forEach((newRec: AttendanceRecord) => {
          const idx = state.attendance.findIndex(a => a.studentId === newRec.studentId && a.date === newRec.date)
          if (idx !== -1) {
            state.attendance[idx] = newRec
          } else {
            state.attendance.push(newRec)
          }
        })
      })
      .addCase(addGradeThunk.fulfilled, (state, action) => {
        state.grades.push(action.payload)
      })
      .addCase(publishGradesThunk.fulfilled, (state, action) => {
        state.grades.forEach(g => {
          if (action.payload.includes(g.id)) {
            g.publishedAt = new Date().toISOString()
          }
        })
      })
      .addCase(addHomeworkThunk.fulfilled, (state, action) => {
        state.homework.push(action.payload)
      })
      .addCase(addAnnouncementThunk.fulfilled, (state, action) => {
        state.announcements.unshift(action.payload)
      })
      .addCase(updateAnnouncementThunk.fulfilled, (state, action) => {
        const idx = state.announcements.findIndex(a => a.id === action.payload.id || a._id === action.payload._id)
        if (idx !== -1) {
          state.announcements[idx] = action.payload
        }
      })
      .addCase(deleteAnnouncementThunk.fulfilled, (state, action) => {
        state.announcements = state.announcements.filter(a => a.id !== action.payload && a._id !== action.payload)
      })
      .addCase(addEventThunk.fulfilled, (state, action) => {
        state.events.push(action.payload)
      })
      .addCase(updateEventThunk.fulfilled, (state, action) => {
        const idx = state.events.findIndex(e => e.id === action.payload.id || e._id === action.payload._id)
        if (idx !== -1) {
          state.events[idx] = action.payload
        }
      })
      .addCase(deleteEventThunk.fulfilled, (state, action) => {
        state.events = state.events.filter(e => e.id !== action.payload && e._id !== action.payload)
      })
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        const n = state.notifications.find(x => x.id === action.payload || x._id === action.payload)
        if (n) n.isRead = true
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.isRead = true
        })
      })
  }
})

export const { receiveMessage, receiveNotification, receiveAnnouncement, receiveEvent } = dataSlice.actions
export default dataSlice.reducer
