import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type {
	Admin,
	LoginForm,
	Parent,
	ParentSignupForm,
	Teacher,
	TeacherSignupForm,
	User
} from '@/types'
import {
	signIn,
	signUp,
	logOut,
	subscribeToAuthState,
	getIdToken,
	auth
} from '@/lib/firebase'
import { authApi } from '@/services/api'
import socketService from '@/services/socket'
import { createUserWithEmailAndPassword } from 'firebase/auth'

/**
 * Login with Firebase and fetch user data from backend
 */
export const login = createAsyncThunk(
	'auth/login',
	async (form: LoginForm, { rejectWithValue }) => {
		try {
			// Real Firebase authentication
			await signIn(form.email, form.password)

			// Get the current Firebase ID token and exchange it for a secure cookie session
			const token = await getIdToken(true)
			if (token) {
				await authApi.createSession(token)
			}

			// Fetch user data from backend
			const response = await authApi.getMe()
			const userData = response.data as User

			// Verify role matches
			if (userData.role !== form.role) {
				await logOut()
				return rejectWithValue(
					`This account is registered as ${userData.role}, not ${form.role}`
				)
			}

			// Initialize socket connection
			await socketService.initializeSocket()

			return userData
		} catch (error: any) {
			console.error('Auth Error Details:', {
				code: error.code,
				message: error.message,
				response: error.response?.data
			})

			// Handle Firebase errors
			if (
				error.code === 'auth/user-not-found' ||
				error.code === 'auth/invalid-credential'
			) {
				return rejectWithValue('No account found with this email')
			}
			if (error.code === 'auth/wrong-password') {
				return rejectWithValue('Incorrect password')
			}
			if (error.code === 'auth/invalid-email') {
				return rejectWithValue('Invalid email address')
			}
			if (error.code === 'auth/too-many-requests') {
				return rejectWithValue(
					'Too many failed attempts. Please try again later.'
				)
			}

			// Handle API errors
			if (error.response?.data?.error) {
				return rejectWithValue(error.response.data.error)
			}

			return rejectWithValue(error.message || 'Login failed')
		}
	}
)

/**
 * Parent signup with Firebase and backend registration
 */
export const signupParent = createAsyncThunk(
	'auth/signupParent',
	async (form: ParentSignupForm, { rejectWithValue }) => {
		try {
			// Real Firebase signup
			await signUp(form.email, form.password, form.name)

			// Exchange token for a secure cookie session
			const token = await getIdToken()
			if (token) {
				await authApi.createSession(token)
			}

			// Register with backend
			await authApi.register({
				role: 'parent',
				name: form.name,
				phone: form.phone,
				parentData: {
					relationship: form.relationship,
					emergencyContact: {
						name: form.emergencyContactName,
						phone: form.emergencyContactPhone,
						relationship: form.emergencyContactRelationship
					},
					studentDetails: {
						name: form.studentName,
						dateOfBirth: form.studentDob,
						admissionNumber: form.studentAdmissionNumber,
						classId: form.studentClass || 'awaiting',
						programId: form.studentProgramId,
						previousSchool: form.previousSchool
					}
				}
			})

			// Sign out after registration (user needs approval)
			await logOut()

			return { message: 'Registration submitted for approval.' }
		} catch (error: any) {
			if (error.code === 'auth/email-already-in-use') {
				return rejectWithValue('Email already registered.')
			}
			if (error.code === 'auth/weak-password') {
				return rejectWithValue(
					'Password is too weak. Use at least 6 characters.'
				)
			}
			if (error.response?.data?.error) {
				return rejectWithValue(error.response.data.error)
			}
			return rejectWithValue(error.message || 'Signup failed')
		}
	}
)

/**
 * Teacher signup with Firebase and backend registration
 */
export const signupTeacher = createAsyncThunk(
	'auth/signupTeacher',
	async (form: TeacherSignupForm, { rejectWithValue }) => {
		try {
			// Real Firebase signup
			await signUp(form.email, form.password, form.name)

			// Exchange token for a secure cookie session
			const token = await getIdToken()
			if (token) {
				await authApi.createSession(token)
			}

			// Register with backend
			await authApi.register({
				role: 'teacher',
				name: form.name,
				phone: form.phone,
				teacherData: {
					staffId: form.staffId,
					subjects: form.subjects,
					yearsOfExperience: form.yearsOfExperience
				}
			})

			// Sign out after registration (user needs approval)
			await logOut()

			return { message: 'Registration submitted for approval.' }
		} catch (error: any) {
			if (error.code === 'auth/email-already-in-use') {
				return rejectWithValue('Email already registered.')
			}
			if (error.code === 'auth/weak-password') {
				return rejectWithValue(
					'Password is too weak. Use at least 6 characters.'
				)
			}
			if (error.response?.data?.error) {
				return rejectWithValue(error.response.data.error)
			}
			return rejectWithValue(error.message || 'Signup failed')
		}
	}
)

/**
 * Initialize auth state from Firebase
 */
export const initializeAuth = createAsyncThunk(
	'auth/initialize',
	async (_, { rejectWithValue }) => {
		try {
			return new Promise<User | null>((resolve, reject) => {
				const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
					unsubscribe()

					if (!firebaseUser) {
						resolve(null)
						return
					}

					try {
						// Ensure secure cookie session is synchronized on refresh
						const token = await getIdToken()
						if (token) {
							await authApi.createSession(token)
						}

						// Fetch user data from backend
						const response = await authApi.getMe()
						const userData = response.data as User

						// Initialize socket connection
						await socketService.initializeSocket()

						resolve(userData)
					} catch (error: any) {
						// User might not be registered in backend yet
						if (error.response?.status === 404) {
							resolve(null)
						} else {
							reject(error)
						}
					}
				})
			})
		} catch (error: any) {
			return rejectWithValue(error.message || 'Failed to initialize auth')
		}
	}
)

interface AuthState {
	user: User | null
	isAuthenticated: boolean
	isLoading: boolean
	isInitialized: boolean
	error?: string | null
	pendingApproval: boolean
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: false,
	isInitialized: false,
	error: null,
	pendingApproval: false
}

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		logout(state) {
			// Disconnect socket
			socketService.disconnectSocket()

			// Clear state
			state.user = null
			state.isAuthenticated = false
			state.pendingApproval = false

			// Sign out from Firebase
			logOut().catch(console.error)
		},
		setUser(state, action: PayloadAction<User | null>) {
			state.user = action.payload
			state.isAuthenticated = !!action.payload
		},
		clearError(state) {
			state.error = null
		}
	},
	extraReducers: (builder) => {
		builder
			// Login
			.addCase(login.pending, (state) => {
				state.isLoading = true
				state.error = null
			})
			.addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
				state.isLoading = false
				state.user = action.payload
				state.isAuthenticated = true
				state.pendingApproval = !action.payload.isApproved
			})
			.addCase(login.rejected, (state, action) => {
				state.isLoading = false
				state.error = action.payload as string
			})
			// Signup Parent
			.addCase(signupParent.pending, (state) => {
				state.isLoading = true
				state.error = null
			})
			.addCase(signupParent.fulfilled, (state) => {
				state.isLoading = false
				state.pendingApproval = true
			})
			.addCase(signupParent.rejected, (state, action) => {
				state.isLoading = false
				state.error = action.payload as string
			})
			// Signup Teacher
			.addCase(signupTeacher.pending, (state) => {
				state.isLoading = true
				state.error = null
			})
			.addCase(signupTeacher.fulfilled, (state) => {
				state.isLoading = false
				state.pendingApproval = true
			})
			.addCase(signupTeacher.rejected, (state, action) => {
				state.isLoading = false
				state.error = action.payload as string
			})
			// Initialize Auth
			.addCase(initializeAuth.pending, (state) => {
				state.isLoading = true
			})
			.addCase(initializeAuth.fulfilled, (state, action) => {
				state.isLoading = false
				state.isInitialized = true
				state.user = action.payload
				state.isAuthenticated = !!action.payload
				state.pendingApproval = action.payload
					? !action.payload.isApproved
					: false
			})
			.addCase(initializeAuth.rejected, (state, action) => {
				state.isLoading = false
				state.isInitialized = true
				state.error = action.payload as string
			})
			.addCase('persist/REHYDRATE', (state) => {
				state.isLoading = false
				state.error = null
			})
	}
})

export const { logout, setUser, clearError } = authSlice.actions
export default authSlice.reducer
