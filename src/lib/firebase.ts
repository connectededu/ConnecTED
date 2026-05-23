import { initializeApp } from 'firebase/app'
import {
	getAuth,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	User as FirebaseUser,
	sendPasswordResetEmail,
	updateProfile
} from 'firebase/auth'

// Firebase configuration - add to your .env.local
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

/**
 * Sign up with email and password
 */
export const signUp = async (
	email: string,
	password: string,
	displayName: string
) => {
	const userCredential = await createUserWithEmailAndPassword(
		auth,
		email,
		password
	)

	// Update profile with display name
	if (userCredential.user) {
		await updateProfile(userCredential.user, { displayName })
	}

	return userCredential
}

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
	return signInWithEmailAndPassword(auth, email, password)
}

/**
 * Sign out current user
 */
export const logOut = async () => {
	return signOut(auth)
}

/**
 * Send password reset email
 */
export const resetPassword = async (email: string) => {
	return sendPasswordResetEmail(auth, email)
}

/**
 * Get current user's ID token
 */
export const getIdToken = async (forceRefresh: boolean = false): Promise<string | null> => {
	const user = auth.currentUser
	if (!user) return null
	return user.getIdToken(forceRefresh)
}

/**
 * Subscribe to auth state changes
 */
export const subscribeToAuthState = (
	callback: (user: FirebaseUser | null) => void
) => {
	return onAuthStateChanged(auth, callback)
}

export type { FirebaseUser }
export default app
