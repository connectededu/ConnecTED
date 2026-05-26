import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
	Users,
	BookOpen,
	Calendar,
	Clock,
	TrendingUp,
	AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import type { Parent } from '@/types'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function ParentDashboard() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { user } = useAuthStore()
	const parent = user as Parent

	const { 
		analytics,
		fetchAnalytics,
		announcements, 
		events,
		// Fix P1: pull classes so we can resolve class name for each child
		classes,
		isLoading: dataLoading 
	} = useAppStore()

	useEffect(() => {
		fetchAnalytics()
	}, [])

	if (!parent) return null

	const upcomingEvents = events
		.filter((e) => e.targetAudience === 'all' || e.targetAudience === 'parents')
		.slice(0, 2)

	const recentAnnouncements = announcements
		.filter((a) => a.targetAudience === 'all' || a.targetAudience === 'parents')
		.slice(0, 2)

	return (
		<div className='space-y-6'>
			{/* Welcome section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-role-parent rounded-2xl p-6 text-parent-foreground'
			>
				<h1 className='text-2xl font-bold mb-2'>
					{t('parent.welcome', { name: parent.name.split(' ')[0] })}
				</h1>
				<p className='opacity-90'>{t('parent.stayConnected')}</p>
			</motion.div>

			{/* Children overview */}
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<h2 className='text-xl font-semibold text-foreground'>
						{parent.studentIds && parent.studentIds.length === 1
							? 'My Child'
							: 'My Children'}
					</h2>
					<Button
						variant='outline'
						size='sm'
						onClick={() => navigate('/parent/children')}
					>
						{t('parent.viewAll')}
					</Button>
				</div>

				{!analytics ? (
					<div className='grid gap-4 md:grid-cols-2'>
						{[1, 2].map((i) => (
							<Card key={i} className='overflow-hidden'>
								<CardContent className='p-6'>
									<div className='flex items-center gap-4'>
										<Skeleton className='w-16 h-16 rounded-full' />
										<div className='flex-1 space-y-2'>
											<Skeleton className='h-5 w-32' />
											<Skeleton className='h-4 w-24' />
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className='grid gap-4 md:grid-cols-2'>
						{analytics.children?.map((student: any, index: number) => {
							return (
								<motion.div
									key={student.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<Card
										className='overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-parent'
										onClick={() => navigate(`/parent/children/${student.id}`)}
									>
										<CardContent className='p-6'>
											<div className='flex items-start gap-4'>
												<Avatar className='w-16 h-16 border-2 border-parent'>
													<AvatarImage src={student.avatar} />
													<AvatarFallback className='bg-parent-light text-parent-dark text-lg'>
														{student.name.charAt(0)}
													</AvatarFallback>
												</Avatar>
												<div className='flex-1'>
													<h3 className='font-semibold text-lg text-foreground'>
														{student.name}
													</h3>
													{/* Fix P1: resolve actual class name */}
													<p className='text-sm text-muted-foreground'>
														{classes.find(c => c.id === student.classId || (c as any)._id === student.classId)?.name ?? 'No class assigned'}
													</p>
													<p className='text-xs text-muted-foreground mt-1'>
														{t('parent.admission', {
															admission: student.admissionNumber
														})}
													</p>
												</div>
											</div>

											<div className='grid grid-cols-3 gap-4 mt-6'>
												<div className='text-center p-3 bg-muted rounded-xl'>
													<TrendingUp className='w-5 h-5 mx-auto text-success mb-1' />
													<p className='text-lg font-bold text-foreground'>
														{student.gradeAverage}%
													</p>
													<p className='text-xs text-muted-foreground'>
														{t('parent.avgGrade')}
													</p>
												</div>
												<div className='text-center p-3 bg-muted rounded-xl'>
													<Clock className='w-5 h-5 mx-auto text-info mb-1' />
													<p className='text-lg font-bold text-foreground'>
														{student.attendanceRate}%
													</p>
													<p className='text-xs text-muted-foreground'>
														{t('parent.attendance')}
													</p>
												</div>
												<div className='text-center p-3 bg-muted rounded-xl'>
													<BookOpen className='w-5 h-5 mx-auto text-warning mb-1' />
													<p className='text-lg font-bold text-foreground'>
														{student.pendingHomeworkCount}
													</p>
													<p className='text-xs text-muted-foreground'>
														{t('parent.homework')}
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							)
						})}
					</div>
				)}
			</div>


			{/* Quick stats & upcoming */}
			<div className='grid gap-6 lg:grid-cols-2'>
				{/* Upcoming Events */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-lg font-semibold'>
							{t('parent.upcomingEvents')}
						</CardTitle>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => navigate('/parent/events')}
						>
							{t('parent.viewAll')}
						</Button>
					</CardHeader>
					<CardContent className='space-y-4'>
						{upcomingEvents.length === 0 ? (
							<p className='text-sm text-muted-foreground text-center py-4'>
								{t('parent.noUpcomingEvents')}
							</p>
						) : (
							upcomingEvents.map((event) => (
								<div
									key={event.id}
									className='flex items-center gap-4 p-3 bg-muted rounded-xl'
								>
									<div className='p-2 bg-parent rounded-lg'>
										<Calendar className='w-5 h-5 text-parent-foreground' />
									</div>
									<div className='flex-1'>
										<p className='font-medium text-foreground'>{event.title}</p>
										<p className='text-xs text-muted-foreground'>
											{new Date(event.date).toLocaleDateString()} • {event.time}
										</p>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				{/* Recent Announcements */}
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardTitle className='text-lg font-semibold'>
							{t('parent.announcements')}
						</CardTitle>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => navigate('/parent/announcements')}
						>
							{t('parent.viewAll')}
						</Button>
					</CardHeader>
					<CardContent className='space-y-4'>
						{recentAnnouncements.length === 0 ? (
							<p className='text-sm text-muted-foreground text-center py-4'>
								{t('parent.noAnnouncements')}
							</p>
						) : (
							recentAnnouncements.map((announcement) => (
								<div key={announcement.id} className='p-3 bg-muted rounded-xl'>
									<p className='font-medium text-foreground line-clamp-1'>
										{announcement.title}
									</p>
									<p className='text-xs text-muted-foreground line-clamp-2 mt-1'>
										{announcement.content}
									</p>
									<p className='text-xs text-muted-foreground mt-2'>
										{new Date(announcement.publishedAt).toLocaleDateString()}
									</p>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
