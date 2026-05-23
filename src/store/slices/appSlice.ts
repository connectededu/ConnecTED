// import { createSlice, PayloadAction } from '@reduxjs/toolkit'
// import type { Notification, AuditLog } from '@/types'

// interface AppState {
// 	notifications: Notification[]
// 	auditLogs: AuditLog[]
// }

// const initialState: AppState = {
// 	notifications: [],
// 	auditLogs: []
// }

// const appSlice = createSlice({
// 	name: 'app',
// 	initialState,
// 	reducers: {
// 		addNotification(state, action: PayloadAction<Notification>) {
// 			state.notifications.unshift(action.payload)
// 		},
// 		markNotificationRead(state, action: PayloadAction<string>) {
// 			const n = state.notifications.find((x) => x.id === action.payload)
// 			if (n) n.isRead = true
// 		},
// 		addAuditLog(state, action: PayloadAction<AuditLog>) {
// 			state.auditLogs.unshift(action.payload)
// 		},
// 		approveUser(state, action: PayloadAction<{ userId: string }>) {
// 			// audit log and notification creation should be handled by caller thunk
// 		}
// 	}
// })

// export const {
// 	addNotification,
// 	markNotificationRead,
// 	addAuditLog,
// 	approveUser
// } = appSlice.actions
// export default appSlice.reducer

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AppState {
	// Added UI state
	sidebarOpen: boolean
	currentView: string
}

const initialState: AppState = {
	// Initial UI state
	sidebarOpen: false,
	currentView: 'dashboard'
}

const appSlice = createSlice({
	name: 'app',
	initialState,
	reducers: {
		// UI Reducers
		setSidebarOpen(state, action: PayloadAction<boolean>) {
			state.sidebarOpen = action.payload
		},
		setCurrentView(state, action: PayloadAction<string>) {
			state.currentView = action.payload
		}
	}
})

export const {
	setSidebarOpen,
	setCurrentView
} = appSlice.actions

export default appSlice.reducer
