import { useDispatch, useSelector } from 'react-redux'
import type {
	User,
	UserRole,
	LoginForm,
	ParentSignupForm,
	TeacherSignupForm
} from '@/types'
import type { RootState, AppDispatch } from '@/store'
import {
	login,
	signupParent,
	signupTeacher,
	logout,
	setUser,
	clearError,
	initializeAuth
} from '@/store/slices/authSlice'

export const useAuthStore = () => {
	const auth = useSelector((s: RootState) => s.auth)
	const dispatch = useDispatch<AppDispatch>()

	return {
		user: auth.user as User | null,
		isAuthenticated: auth.isAuthenticated,
		isLoading: auth.isLoading,
		isInitialized: (auth as any).isInitialized ?? true,
		pendingApproval: auth.pendingApproval,
		error: auth.error,
		login: async (form: LoginForm) => {
			const res = await dispatch(login(form))
			if (login.fulfilled.match(res))
				return { success: true, message: 'Login successful!' }
			return {
				success: false,
				message:
					(res.payload as any) ||
					(res.error && res.error.message) ||
					'Login failed'
			}
		},
		logout: () => dispatch(logout()),
		signupParent: async (form: ParentSignupForm) => {
			const res = await dispatch(signupParent(form))
			if (signupParent.fulfilled.match(res))
				return {
					success: true,
					message: 'Registration submitted for approval.'
				}
			return {
				success: false,
				message:
					(res.payload as any) ||
					(res.error && res.error.message) ||
					'Signup failed'
			}
		},
		signupTeacher: async (form: TeacherSignupForm) => {
			const res = await dispatch(signupTeacher(form))
			if (signupTeacher.fulfilled.match(res))
				return {
					success: true,
					message: 'Registration submitted for approval.'
				}
			return {
				success: false,
				message:
					(res.payload as any) ||
					(res.error && res.error.message) ||
					'Signup failed'
			}
		},
		clearError: () => dispatch(clearError()),
		initialize: () => dispatch(initializeAuth()),
		updateProfile: (updates: Partial<User>) => {
			if (auth.user) {
				dispatch(setUser({ ...auth.user, ...updates } as User))
			}
		},
		updateAvatar: (avatar: string) => {
			if (auth.user) {
				dispatch(setUser({ ...auth.user, avatar } as User))
			}
		}
	}
}

