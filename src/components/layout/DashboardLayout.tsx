import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Menu,
	X,
	Bell,
	LogOut,
	User,
	ChevronDown,
	Home,
	Users,
	BookOpen,
	ClipboardList,
	MessageSquare,
	Calendar,
	Megaphone,
	Settings,
	FileText,
	BarChart3,
	GraduationCap,
	Shield,
	UserCheck,
	Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import type { UserRole } from '@/types'
import socketService from '@/services/socket'
import NotificationPanel from '@/components/shared/NotificationPanel'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { requestNotificationPermission, setupMessageListener } from '@/services/pushNotifications'
import { authApi } from '@/services/api'

interface NavItem {
	icon: React.ElementType
	label: string
	path: string
}

const getNavConfig = (t: TFunction): Record<UserRole, NavItem[]> => ({
	parent: [
		{ icon: Home, label: t('common.dashboard'), path: '/parent' },
		{ icon: Users, label: t('common.students'), path: '/parent/children' },
		{
			icon: MessageSquare,
			label: t('common.messages'),
			path: '/parent/messages'
		},
		{ icon: Calendar, label: t('common.calendar'), path: '/parent/events' },
		{ icon: Megaphone, label: 'Announcements', path: '/parent/announcements' },
		{ icon: User, label: 'Profile', path: '/parent/profile' }
	],
	teacher: [
		{ icon: Home, label: t('common.dashboard'), path: '/teacher' },
		{ icon: BookOpen, label: t('common.classes'), path: '/teacher/classes' },
		{ icon: FileText, label: 'Post Update', path: '/teacher/updates' },
		{ icon: BarChart3, label: 'Grades', path: '/teacher/grades' },
		{ icon: ClipboardList, label: 'Attendance', path: '/teacher/attendance' },
		{ icon: BookOpen, label: 'Homework', path: '/teacher/homework' },
		{
			icon: MessageSquare,
			label: t('common.messages'),
			path: '/teacher/messages'
		},
		{ icon: Megaphone, label: 'Announcements', path: '/teacher/announcements' },
		{ icon: Calendar, label: t('common.calendar'), path: '/teacher/events' },
		{ icon: User, label: 'Profile', path: '/teacher/profile' }
	],
	admin: [
		{ icon: Home, label: t('common.dashboard'), path: '/admin' },
		{ icon: UserCheck, label: 'Users', path: '/admin/users' },
		{ icon: Building, label: t('common.classes'), path: '/admin/classes' },
		{ icon: BookOpen, label: 'Programs', path: '/admin/programs' },
		{
			icon: GraduationCap,
			label: t('common.students'),
			path: '/admin/students'
		},
		{ icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
		{ icon: Calendar, label: t('common.calendar'), path: '/admin/events' },
		{ icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
		{ icon: FileText, label: 'Audit Logs', path: '/admin/logs' },
		{ icon: User, label: 'Profile', path: '/admin/profile' }
	]
})

const roleColors: Record<UserRole, string> = {
	parent: 'parent',
	teacher: 'teacher',
	admin: 'admin'
}

export default function DashboardLayout() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const location = useLocation()
	const { user, logout } = useAuthStore()
	const {
		sidebarOpen,
		setSidebarOpen,
		notifications,
		fetchNotifications,
		fetchStudents,
		fetchClasses,
		fetchAnnouncements,
		fetchEvents,
		fetchMessageThreads,
		fetchAnalytics,
		receiveMessage,
		receiveAnnouncement,
		receiveEvent,
		addNotification
	} = useAppStore()
	const [showNotifications, setShowNotifications] = useState(false)

	useEffect(() => {
		if (!user) {
			navigate('/auth')
		} else {
			// Trigger initial fetches to load real database data
			fetchNotifications()
			fetchStudents()
			fetchClasses()
			fetchAnnouncements()
			fetchEvents()
			fetchMessageThreads()
			fetchAnalytics()

			// Request push notification permission
			requestNotificationPermission()
				.then((token) => {
					if (token) {
						console.log('FCM token obtained, updating backend')
						authApi.updateFcmToken(token).catch((err) => {
							console.error('Failed to update FCM token on backend:', err)
						})
					}
				})
				.catch((err) => {
					console.error('Failed to setup push notifications:', err)
				})

			const handleIncomingMessage = (data: any) => {
				console.log('📨 Incoming message event:', data);
				if (data && data.message) {
					console.log('✅ Processing message:', data.message);
					receiveMessage(data.message)
				}
			}
			const handleIncomingNotification = (notif: any) => {
				if (notif) {
					addNotification(notif)
				}
			}
			const handleIncomingAnnouncement = (announcement: any) => {
				if (announcement) receiveAnnouncement(announcement)
			}
			const handleIncomingEvent = (event: any) => {
				if (event) receiveEvent(event)
			}

			// Listen to socket service
			socketService.on('receive_message', handleIncomingMessage)
			socketService.on('notification', handleIncomingNotification)
			socketService.on('new_announcement', handleIncomingAnnouncement)
			socketService.on('new_event', handleIncomingEvent)

			// Setup foreground message handler for FCM
			setupMessageListener((payload) => {
				console.log('Foreground FCM message:', payload)
				// The notification will be shown by the service worker
				// You can also add to notification panel if needed
				if (payload.data) {
					addNotification({
						id: Date.now().toString(),
						userId: user.id,
						type: payload.data.type || 'notification',
						title: payload.notification?.title || 'Notification',
						message: payload.notification?.body || '',
						isRead: false,
						createdAt: new Date().toISOString()
					})
				}
			})

			return () => {
				socketService.off('receive_message', handleIncomingMessage)
				socketService.off('notification', handleIncomingNotification)
				socketService.off('new_announcement', handleIncomingAnnouncement)
				socketService.off('new_event', handleIncomingEvent)
			}
		}
	}, [user?.id])

	if (!user) return null

	const navConfig = getNavConfig(t)
	const navItems = navConfig[user.role]
	const roleColor = roleColors[user.role]
	const unreadCount = notifications.filter(
		(n) => n.userId === user.id && !n.isRead
	).length

	const handleLogout = () => {
		logout()
		navigate('/auth')
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Mobile header */}
			<header className='lg:hidden fixed top-0 left-0 right-0 z-50 h-16 glass-card border-b flex items-center justify-between px-4'>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => setSidebarOpen(!sidebarOpen)}
				>
					{sidebarOpen ? (
						<X className='w-5 h-5' />
					) : (
						<Menu className='w-5 h-5' />
					)}
				</Button>
				<div className='flex items-center justify-center'>
					<img
						src='/images/logo.png'
						className='w-8 mr-2'
						alt='connected-logo'
					/>
					<h1 className='text-xl mr-4 font-bold text-foreground'>
						{t('app.name')}
					</h1>
				</div>
				<div className='flex items-center gap-2'>
					<LanguageSwitcher />
					<ThemeSwitcher />
					<Button
						variant='ghost'
						size='icon'
						className='relative'
						onClick={() => setShowNotifications(true)}
					>
						<Bell className='w-5 h-5' />
						{unreadCount > 0 && (
							<span className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center'>
								{unreadCount}
							</span>
						)}
					</Button>
				</div>
			</header>

			{/* Sidebar */}
			<AnimatePresence>
				{(sidebarOpen || window.innerWidth >= 1024) && (
					<>
						{/* Overlay for mobile */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40'
							onClick={() => setSidebarOpen(false)}
						/>

						{/* Sidebar */}
						<motion.aside
							initial={{ x: -280 }}
							animate={{ x: 0 }}
							exit={{ x: -280 }}
							transition={{ type: 'spring', damping: 25, stiffness: 200 }}
							className='fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:z-30 bg-sidebar border-r border-sidebar-border flex flex-col'
						>
							{/* Logo */}
							<div className='h-16 flex items-center align-middle px-6 border-b border-sidebar-border'>
								<img
									src='/images/logo.png'
									className='w-8 mr-2'
									alt='connected-logo'
								/>
								<h1 className='text-xl mr-4 font-bold text-foreground'>
									ConnecTED
								</h1>
								<span className={`ml-2 badge-${roleColor} text-[10px]`}>
									{t(`roles.${user.role}`)}
								</span>
							</div>

							{/* Navigation */}
							<nav className='flex-1 overflow-y-auto py-4 px-3 custom-scrollbar'>
								<ul className='space-y-1'>
									{navItems.map((item) => {
										const isActive = location.pathname === item.path
										return (
											<li key={item.path}>
												<button
													onClick={() => {
														navigate(item.path)
														setSidebarOpen(false)
													}}
													className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
														isActive
															? `bg-${roleColor} text-${roleColor}-foreground shadow-role-${roleColor}`
															: 'text-sidebar-foreground hover:bg-sidebar-accent'
													}`}
												>
													<item.icon className='w-5 h-5' />
													{item.label}
												</button>
											</li>
										)
									})}
								</ul>
							</nav>

							{/* User section */}
							<div className='p-4 border-t border-sidebar-border'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors'>
											<Avatar className='w-10 h-10'>
												<AvatarImage src={user.avatar} />
												<AvatarFallback
													className={`bg-${roleColor} text-${roleColor}-foreground`}
												>
													{user.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<div className='flex-1 text-left'>
												<p className='text-sm font-medium text-foreground truncate'>
													{user.name}
												</p>
												<p className='text-xs text-muted-foreground truncate'>
													{user.email}
												</p>
											</div>
											<ChevronDown className='w-4 h-4 text-muted-foreground' />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='w-56'>
										<DropdownMenuItem
											onClick={() => navigate(`/${user.role}/profile`)}
										>
											<User className='w-4 h-4 mr-2' />
											{t('common.profile')}
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => navigate(`/${user.role}/settings`)}
										>
											<Settings className='w-4 h-4 mr-2' />
											{t('common.settings')}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={handleLogout}
											className='text-destructive'
										>
											<LogOut className='w-4 h-4 mr-2' />
											{t('common.logout')}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			{/* Main content */}
			<main className='lg:ml-[280px] pt-16 lg:pt-0 min-h-screen'>
				{/* Desktop header */}
				<header className='hidden lg:flex h-16 items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20'>
					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							{navItems.find((item) => item.path === location.pathname)
								?.label || t('common.dashboard')}
						</h2>
					</div>
					<div className='flex items-center gap-4'>
						<LanguageSwitcher />
						<Button
							variant='ghost'
							size='icon'
							className='relative'
							onClick={() => setShowNotifications(true)}
						>
							<Bell className='w-5 h-5' />
							{unreadCount > 0 && (
								<motion.span
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center'
								>
									{unreadCount}
								</motion.span>
							)}
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' className='flex items-center gap-2'>
									<Avatar className='w-8 h-8'>
										<AvatarImage src={user.avatar} />
										<AvatarFallback
											className={`bg-${roleColor} text-${roleColor}-foreground text-sm`}
										>
											{user.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<span className='font-medium'>{user.name.split(' ')[0]}</span>
									<ChevronDown className='w-4 h-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-56'>
								<DropdownMenuItem
									onClick={() => navigate(`/${user.role}/profile`)}
								>
									<User className='w-4 h-4 mr-2' />
									{t('common.profile')}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleLogout}
									className='text-destructive'
								>
									<LogOut className='w-4 h-4 mr-2' />
									{t('common.logout')}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				{/* Page content */}
				<div className='p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar'>
					<AnimatePresence mode='wait'>
						<motion.div
							key={location.pathname}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
						>
							<Outlet />
						</motion.div>
					</AnimatePresence>
				</div>
			</main>

			{/* Notification Panel */}
			<NotificationPanel
				isOpen={showNotifications}
				onClose={() => setShowNotifications(false)}
			/>
		</div>
	)
}


	if (!user) return null

	const navConfig = getNavConfig(t)
	const navItems = navConfig[user.role]
	const roleColor = roleColors[user.role]
	const unreadCount = notifications.filter(
		(n) => n.userId === user.id && !n.isRead
	).length

	const handleLogout = () => {
		logout()
		navigate('/auth')
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Mobile header */}
			<header className='lg:hidden fixed top-0 left-0 right-0 z-50 h-16 glass-card border-b flex items-center justify-between px-4'>
				<Button
					variant='ghost'
					size='icon'
					onClick={() => setSidebarOpen(!sidebarOpen)}
				>
					{sidebarOpen ? (
						<X className='w-5 h-5' />
					) : (
						<Menu className='w-5 h-5' />
					)}
				</Button>
				<div className='flex items-center justify-center'>
					<img
						src='/images/logo.png'
						className='w-8 mr-2'
						alt='connected-logo'
					/>
					<h1 className='text-xl mr-4 font-bold text-foreground'>
						{t('app.name')}
					</h1>
				</div>
				<div className='flex items-center gap-2'>
					<LanguageSwitcher />
					<ThemeSwitcher />
					<Button
						variant='ghost'
						size='icon'
						className='relative'
						onClick={() => setShowNotifications(true)}
					>
						<Bell className='w-5 h-5' />
						{unreadCount > 0 && (
							<span className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center'>
								{unreadCount}
							</span>
						)}
					</Button>
				</div>
			</header>

			{/* Sidebar */}
			<AnimatePresence>
				{(sidebarOpen || window.innerWidth >= 1024) && (
					<>
						{/* Overlay for mobile */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40'
							onClick={() => setSidebarOpen(false)}
						/>

						{/* Sidebar */}
						<motion.aside
							initial={{ x: -280 }}
							animate={{ x: 0 }}
							exit={{ x: -280 }}
							transition={{ type: 'spring', damping: 25, stiffness: 200 }}
							className='fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:z-30 bg-sidebar border-r border-sidebar-border flex flex-col'
						>
							{/* Logo */}
							<div className='h-16 flex items-center align-middle px-6 border-b border-sidebar-border'>
								<img
									src='/images/logo.png'
									className='w-8 mr-2'
									alt='connected-logo'
								/>
								<h1 className='text-xl mr-4 font-bold text-foreground'>
									ConnecTED
								</h1>
								<span className={`ml-2 badge-${roleColor} text-[10px]`}>
									{t(`roles.${user.role}`)}
								</span>
							</div>

							{/* Navigation */}
							<nav className='flex-1 overflow-y-auto py-4 px-3 custom-scrollbar'>
								<ul className='space-y-1'>
									{navItems.map((item) => {
										const isActive = location.pathname === item.path
										return (
											<li key={item.path}>
												<button
													onClick={() => {
														navigate(item.path)
														setSidebarOpen(false)
													}}
													className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
														isActive
															? `bg-${roleColor} text-${roleColor}-foreground shadow-role-${roleColor}`
															: 'text-sidebar-foreground hover:bg-sidebar-accent'
													}`}
												>
													<item.icon className='w-5 h-5' />
													{item.label}
												</button>
											</li>
										)
									})}
								</ul>
							</nav>

							{/* User section */}
							<div className='p-4 border-t border-sidebar-border'>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className='w-full flex items-center gap-3 p-3 rounded-xl hover:bg-sidebar-accent transition-colors'>
											<Avatar className='w-10 h-10'>
												<AvatarImage src={user.avatar} />
												<AvatarFallback
													className={`bg-${roleColor} text-${roleColor}-foreground`}
												>
													{user.name.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<div className='flex-1 text-left'>
												<p className='text-sm font-medium text-foreground truncate'>
													{user.name}
												</p>
												<p className='text-xs text-muted-foreground truncate'>
													{user.email}
												</p>
											</div>
											<ChevronDown className='w-4 h-4 text-muted-foreground' />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align='end' className='w-56'>
										<DropdownMenuItem
											onClick={() => navigate(`/${user.role}/profile`)}
										>
											<User className='w-4 h-4 mr-2' />
											{t('common.profile')}
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => navigate(`/${user.role}/settings`)}
										>
											<Settings className='w-4 h-4 mr-2' />
											{t('common.settings')}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={handleLogout}
											className='text-destructive'
										>
											<LogOut className='w-4 h-4 mr-2' />
											{t('common.logout')}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			{/* Main content */}
			<main className='lg:ml-[280px] pt-16 lg:pt-0 min-h-screen'>
				{/* Desktop header */}
				<header className='hidden lg:flex h-16 items-center justify-between px-8 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20'>
					<div>
						<h2 className='text-lg font-semibold text-foreground'>
							{navItems.find((item) => item.path === location.pathname)
								?.label || t('common.dashboard')}
						</h2>
					</div>
					<div className='flex items-center gap-4'>
						<LanguageSwitcher />
						<Button
							variant='ghost'
							size='icon'
							className='relative'
							onClick={() => setShowNotifications(true)}
						>
							<Bell className='w-5 h-5' />
							{unreadCount > 0 && (
								<motion.span
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center'
								>
									{unreadCount}
								</motion.span>
							)}
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' className='flex items-center gap-2'>
									<Avatar className='w-8 h-8'>
										<AvatarImage src={user.avatar} />
										<AvatarFallback
											className={`bg-${roleColor} text-${roleColor}-foreground text-sm`}
										>
											{user.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<span className='font-medium'>{user.name.split(' ')[0]}</span>
									<ChevronDown className='w-4 h-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-56'>
								<DropdownMenuItem
									onClick={() => navigate(`/${user.role}/profile`)}
								>
									<User className='w-4 h-4 mr-2' />
									{t('common.profile')}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleLogout}
									className='text-destructive'
								>
									<LogOut className='w-4 h-4 mr-2' />
									{t('common.logout')}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				{/* Page content */}
				<div className='p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto custom-scrollbar'>
					<AnimatePresence mode='wait'>
						<motion.div
							key={location.pathname}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{ duration: 0.2 }}
						>
							<Outlet />
						</motion.div>
					</AnimatePresence>
				</div>
			</main>

			{/* Notification Panel */}
			<NotificationPanel
				isOpen={showNotifications}
				onClose={() => setShowNotifications(false)}
			/>
		</div>
	)
}
