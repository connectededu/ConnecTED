/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Users, GraduationCap, Shield, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import type { UserRole, LoginForm } from '@/types'
import authHero from '@/assets/auth-hero.jpg'
import ParentSignupForm from '@/components/auth/ParentSignupForm'
import TeacherSignupForm from '@/components/auth/TeacherSignupForm'
import { useTranslation } from 'react-i18next'
import { t } from 'i18next'

type AuthView =
	| 'role-select'
	| 'login'
	| 'parent-signup'
	| 'teacher-signup'
	| 'pending'

const getRoleConfig = (t: any) => ({
	parent: {
		icon: Users,
		label: t('roles.parent'),
		description: t('rolesDesc.parent'),
		color: 'parent',
		gradient: 'bg-role-parent'
	},
	teacher: {
		icon: GraduationCap,
		label: t('roles.teacher'),
		description: t('rolesDesc.teacher'),
		color: 'teacher',
		gradient: 'bg-role-teacher'
	},
	admin: {
		icon: Shield,
		label: t('roles.admin'),
		description: t('rolesDesc.admin'),
		color: 'admin',
		gradient: 'bg-role-admin'
	}
})

export default function AuthPage() {
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { login, isLoading, pendingApproval } = useAuthStore()
	const [view, setView] = useState<AuthView>('role-select')
	const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
	const [formData, setFormData] = useState<LoginForm>({
		email: '',
		password: '',
		role: 'parent'
	})

	const handleRoleSelect = (role: UserRole) => {
		setSelectedRole(role)
		setFormData((prev) => ({ ...prev, role }))
		setView('login')
	}

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!selectedRole) return

		const result = await login(formData)
		if (result.success) {
			toast.success(result.message)
			// pendingApproval will be set in authStore; App.tsx ProtectedRoute handles redirect
			navigate(`/${selectedRole}`)
		} else {
			toast.error(result.message)
		}
	}

	const handleSignupSuccess = () => {
		setView('pending')
	}

	const goBack = () => {
		if (view === 'login') {
			setView('role-select')
			setSelectedRole(null)
		} else if (view === 'parent-signup' || view === 'teacher-signup') {
			setView('login')
		} else if (view === 'pending') {
			setView('role-select')
			setSelectedRole(null)
		}
	}

	return (
		<div className='flex min-h-screen'>
			{/* Left side - Hero image */}
			<div className='hidden lg:flex lg:w-1/2 relative overflow-hidden'>
				<div className='absolute inset-0'>
					<img
						src={authHero}
						alt='Connected Education'
						className='w-full h-full object-cover'
					/>
					<div className='absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-transparent' />
				</div>
				<div className='relative z-10 flex flex-col justify-end p-12 text-primary-foreground'>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						<h1 className='text-5xl font-bold mb-4'>Connected</h1>
						<p className='text-xl opacity-90 max-w-md'>
							Bridging the gap between parents, teachers, and students for a
							better educational experience.
						</p>
						<div className='mt-8 flex gap-4'>
							{(['parent', 'teacher', 'admin'] as UserRole[]).map((role) => {
								const config = getRoleConfig(t)[role]
								return (
									<div
										key={role}
										className='flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm'
									>
										<config.icon className='w-4 h-4' />
										<span className='text-sm font-medium'>{config.label}</span>
									</div>
								)
							})}
						</div>
					</motion.div>
				</div>
			</div>

			{/* Right side - Auth forms */}
			<div className='relative flex-1 flex items-center justify-center p-8 overflow-hidden md:bg-background'>
				<div className='absolute inset-0 md:hidden'>
					{/* Gradient Layer */}
					<div className='absolute inset-0 bg-gradient-to-br from-indigo-300 via-purple-400 to-blue-300 opacity-90' />

					{/* Subtle Dot Pattern */}
					<div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]' />
				</div>

				<div className='relative z-10 w-full max-w-md'>
					<AnimatePresence mode='wait' initial={false}>
						{view === 'role-select' ? (
							<RoleSelectView 
								key="role-select-view"
								onRoleSelect={handleRoleSelect} 
								t={t} 
							/>
						) : (
							<motion.div
								key={view}
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
								className="w-full"
							>
								{view !== 'pending' && (
									<button
										onClick={goBack}
										className='flex items-center gap-2 md:text-muted-foreground hover:text-foreground mb-6 transition-colors group'
									>
										<ArrowLeft className='w-4 h-4 group-hover:-translate-x-1 transition-transform' />
										Back
									</button>
								)}

								{view === 'login' && selectedRole && (
									<LoginView
										role={selectedRole}
										formData={formData}
										setFormData={setFormData}
										onSubmit={handleLogin}
										isLoading={isLoading}
										onSignup={() =>
											setView(
												selectedRole === 'parent'
													? 'parent-signup'
													: 'teacher-signup'
											)
										}
										t={t}
									/>
								)}

								{view === 'parent-signup' && (
									<ParentSignupForm
										onSuccess={handleSignupSuccess}
										onBack={goBack}
									/>
								)}

								{view === 'teacher-signup' && (
									<TeacherSignupForm
										onSuccess={handleSignupSuccess}
										onBack={goBack}
									/>
								)}

								{view === 'pending' && (
									<PendingApprovalView onBackToLogin={goBack} />
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	)
}

function RoleSelectView({
	onRoleSelect,
	t
}: {
	onRoleSelect: (role: UserRole) => void
	t: any
}) {
	return (
		<motion.div
			key='role-select'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
			className='space-y-8'
		>
			<div className='flex flex-col items-center justify-center'>
				<img
					src='/images/logo.png'
					className='w-24 mb-6'
					alt='connected-logo'
				/>
				<div className='text-center lg:text-left'>
					<h2 className='text-3xl font-bold text-foreground mb-2'>
						{t('auth.joinConnected')}
					</h2>
					<p className='text-muted-foreground'>{t('auth.selectRole')}</p>
				</div>
			</div>

			<div className='space-y-4'>
				{(['parent', 'teacher'] as UserRole[]).map((role, index) => {
					const config = getRoleConfig(t)[role]
					return (
						<motion.button
							key={role + index}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1 }}
							onClick={() => onRoleSelect(role)}
							className={`w-full p-6 rounded-2xl glass-card hover:shadow-xl transition-all duration-300 group text-left border-2 border-transparent hover:border-${config.color}`}
						>
							<div className='flex items-start gap-4'>
								<div className={`p-3 rounded-xl ${config.gradient} text-white`}>
									<config.icon className='w-6 h-6' />
								</div>
								<div className='flex-1'>
									<h3 className='text-lg font-semibold text-foreground group-hover:text-foreground'>
										Continue as {config.label}
									</h3>
									<p className='text-sm md:text-muted-foreground mt-1'>
										{config.description}
									</p>
								</div>
							</div>
						</motion.button>
					)
				})}
			</div>

			<div className='text-center'>
				<button
					onClick={() => onRoleSelect('admin')}
					className='text-sm md:text-muted-foreground hover:text-foreground transition-colors'
				>
					Admin Login →
				</button>
			</div>
		</motion.div>
	)
}

interface LoginViewProps {
	role: UserRole
	formData: LoginForm
	setFormData: React.Dispatch<React.SetStateAction<LoginForm>>
	onSubmit: (e: React.FormEvent) => void
	isLoading: boolean
	onSignup: () => void
}

function LoginView({
	role,
	formData,
	setFormData,
	onSubmit,
	isLoading,
	onSignup,
	t
}: LoginViewProps & { t?: any }) {
	const config = getRoleConfig(t)[role]

	return (
		<motion.div
			key='login'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
			className='space-y-8'
		>
			<div>
				<div
					className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${config.color === 'parent' ? 'badge-parent' : config.color === 'teacher' ? 'badge-teacher' : 'badge-admin'}`}
				>
					<config.icon className='w-4 h-4' />
					<span>{config.label}</span>
				</div>
				<h2 className='text-3xl font-bold text-foreground mb-2'>
					{t('auth.welcomeBack')}
				</h2>
				<p className='md:text-muted-foreground'>
					{t('auth.signInToAccount', { role: config.label.toLowerCase() })}
				</p>
			</div>

			<form onSubmit={onSubmit} className='space-y-6'>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='email'>{t('auth.email')}</Label>
						<Input
							id='email'
							type='email'
							placeholder={t('auth.emailPlaceholder')}
							value={formData.email}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, email: e.target.value }))
							}
							className='h-12'
							required
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='password'>{t('auth.password')}</Label>
						<Input
							id='password'
							type='password'
							placeholder={t('auth.passwordPlaceholder')}
							value={formData.password}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, password: e.target.value }))
							}
							className='h-12'
							required
						/>
					</div>
				</div>

				<Button
					type='submit'
					className={`w-full h-12 text-base font-semibold ${config.gradient} hover:opacity-90 transition-opacity`}
					disabled={isLoading}
				>
					{isLoading ? (
						<>
							<Loader2 className='w-4 h-4 mr-2 animate-spin' />
							{t('auth.signingIn')}
						</>
					) : (
						t('auth.signInButton')
					)}
				</Button>
			</form>

			{role !== 'admin' && (
				<div className='text-center'>
					<p className='text-sm md:text-muted-foreground'>
						{t('auth.dontHaveAccount')}{' '}
						<button
							onClick={onSignup}
							className={`font-semibold hover:underline text-${config.color}`}
						>
							{t('auth.signUp')}
						</button>
					</p>
				</div>
			)}
		</motion.div>
	)
}

function PendingApprovalView({ onBackToLogin }: { onBackToLogin: () => void }) {
	return (
		<motion.div
			key='pending'
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.3 }}
			className='text-center space-y-6'
		>
			<div className='w-20 h-20 mx-auto rounded-full bg-warning/10 flex items-center justify-center'>
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
					className='w-12 h-12 rounded-full border-4 border-warning border-t-transparent'
				/>
			</div>
			<div>
				<h2 className='text-2xl font-bold text-foreground mb-2'>
					{t('auth.awaitingApprovalTitle')}
				</h2>
				<p className='md:text-muted-foreground max-w-sm mx-auto'>
					{t('auth.awaitingApprovalText')}
				</p>
			</div>
			<Button variant='outline' onClick={onBackToLogin}>
				{t('auth.backToLogin')}
			</Button>
		</motion.div>
	)
}
