import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Send, Users, Clock, Trash2, Edit, X, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { toast } from 'sonner'
import type { Teacher } from '@/types'

const updateSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters'),
	content: z.string().min(10, 'Content must be at least 10 characters'),
	classId: z.string().min(1, 'Please select a class'),
	type: z.enum(['update', 'behavior', 'achievement']),
	audience: z.enum(['all', 'student']),
	studentId: z.string().optional()
})

type UpdateFormValues = z.infer<typeof updateSchema>

export default function UpdatesPage() {
	const { user } = useAuthStore()
	const teacher = user as Teacher
	const {
		classes,
		students,
		announcements,
		addTeacherUpdate,
		updateAnnouncement,
		deleteAnnouncement,
		isLoading
	} = useAppStore()

	const [selectedClassId, setSelectedClassId] = useState<string>('')
	const [editingId, setEditingId] = useState<string | null>(null)

	const form = useForm<UpdateFormValues>({
		resolver: zodResolver(updateSchema),
		defaultValues: {
			title: '',
			content: '',
			type: 'update',
			audience: 'all',
			studentId: ''
		}
	})

	// Filter items matching current teacher
	const myClasses = classes.filter(
		(c) =>
			c.teacherIds?.includes(teacher?.id) ||
			c.teacherIds?.includes((teacher as any)?._id)
	)

	const myStudents = students.filter((s) => s.classId === selectedClassId)

	const myUpdates = announcements.filter(
		(a) => a.authorId === teacher?.id || a.authorId === (teacher as any)?._id
	)

	const onSubmit = async (data: UpdateFormValues) => {
		if (!teacher) return

		try {
			// Fix U3: Preserve update type (behavior/achievement) by appending to title/content prefix
			const titleWithPrefix =
				data.type !== 'update'
					? `[${data.type.toUpperCase()}] ${data.title}`
					: data.title

			if (editingId) {
				await updateAnnouncement(editingId, {
					title: titleWithPrefix,
					content: data.content,
					targetClassIds: [data.classId]
				})
				toast.success('Update updated successfully')
				setEditingId(null)
			} else {
				await addTeacherUpdate({
					title: titleWithPrefix,
					content: data.content,
					classId: data.classId,
					type: data.type,
					studentId: data.audience === 'student' ? data.studentId : undefined
				})
				toast.success('Update published successfully')
			}
			form.reset({
				title: '',
				content: '',
				type: 'update',
				audience: 'all',
				classId: data.classId, // preserve selected class
				studentId: ''
			})
		} catch (err) {
			toast.error(editingId ? 'Failed to update' : 'Failed to post update')
		}
	}

	const handleEdit = (update: any) => {
		setEditingId(update.id || update._id)

		// Check if title has prefix
		let cleanTitle = update.title
		let type: 'update' | 'behavior' | 'achievement' = 'update'
		if (update.title.startsWith('[BEHAVIOR] ')) {
			cleanTitle = update.title.replace('[BEHAVIOR] ', '')
			type = 'behavior'
		} else if (update.title.startsWith('[ACHIEVEMENT] ')) {
			cleanTitle = update.title.replace('[ACHIEVEMENT] ', '')
			type = 'achievement'
		}

		const classId = update.targetClassIds?.[0] || ''
		setSelectedClassId(classId)

		form.reset({
			title: cleanTitle,
			content: update.content,
			type,
			audience: 'all',
			classId,
			studentId: ''
		})

		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleDelete = async (id: string) => {
		if (!window.confirm('Are you sure you want to delete this update?')) return
		try {
			await deleteAnnouncement(id)
			toast.success('Update deleted successfully')
			if (editingId === id) {
				cancelEdit()
			}
		} catch (err) {
			toast.error('Failed to delete update')
		}
	}

	const cancelEdit = () => {
		setEditingId(null)
		form.reset({
			title: '',
			content: '',
			type: 'update',
			audience: 'all',
			studentId: ''
		})
	}

	const watchAudience = form.watch('audience')

	return (
		<div className='grid gap-6 lg:grid-cols-2'>
			{/* Create/Edit Update Form */}
			<div className='space-y-6'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>
						{editingId ? 'Edit Update' : 'Post Update'}
					</h1>
					<p className='text-muted-foreground'>
						Send announcements, behavioral notes, or achievements to parents.
					</p>
				</div>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between'>
						<div>
							<CardTitle>
								{editingId ? 'Modify Update' : 'New Update'}
							</CardTitle>
							<CardDescription>
								Compose a message to your class or a specific student's parents.
							</CardDescription>
						</div>
						{editingId && (
							<Button variant='ghost' size='sm' onClick={cancelEdit}>
								<X className='h-4 w-4 mr-1' /> Cancel Edit
							</Button>
						)}
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className='space-y-4'
							>
								<FormField
									control={form.control}
									name='classId'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Class</FormLabel>
											<Select
												onValueChange={(value) => {
													field.onChange(value)
													setSelectedClassId(value)
												}}
												value={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Select a class' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{myClasses.map((cls) => (
														<SelectItem
															key={cls.id || cls._id}
															value={cls.id || cls._id}
														>
															{cls.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className='grid grid-cols-2 gap-4'>
									<FormField
										control={form.control}
										name='type'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Type</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder='Select type' />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value='update'>
															General Update
														</SelectItem>
														<SelectItem value='behavior'>
															Behavior Report
														</SelectItem>
														<SelectItem value='achievement'>
															Achievement
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name='audience'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Audience</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder='Select audience' />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value='all'>Entire Class</SelectItem>
														<SelectItem value='student'>
															Specific Student
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								{watchAudience === 'student' && (
									<FormField
										control={form.control}
										name='studentId'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Student</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder='Select student' />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{myStudents.map((s) => (
															<SelectItem
																key={s.id || s._id}
																value={s.id || s._id}
															>
																{s.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								<FormField
									control={form.control}
									name='title'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Title</FormLabel>
											<FormControl>
												<Input
													placeholder='e.g. Science Fair Project Due'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name='content'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Message</FormLabel>
											<FormControl>
												<Textarea
													placeholder='Type your message here...'
													className='min-h-[120px]'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Fix U1: Cleaned up dynamic / simulated file attachments to look professional */}
								<div className='text-xs text-muted-foreground border rounded-md p-3 bg-muted/20'>
									Note: Custom parent updates are pushed as priority
									notifications to the ConnecTED app.
								</div>

								<Button type='submit' className='w-full' disabled={isLoading}>
									{isLoading ? (
										<Loader2 className='mr-2 h-4 w-4 animate-spin' />
									) : null}
									{isLoading
										? editingId
											? 'Saving Changes...'
											: 'Sending Update...'
										: editingId
											? 'Save Changes'
											: 'Send Update'}
									{!isLoading && <Send className='ml-2 h-4 w-4' />}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>

			{/* History List */}
			<div className='space-y-6'>
				<div>
					<h2 className='text-2xl font-bold tracking-tight'>History</h2>
					<p className='text-muted-foreground'>Recent updates you've sent</p>
				</div>

				<div className='space-y-4'>
					{myUpdates.length === 0 ? (
						<div className='text-center p-8 border-2 border-dashed rounded-lg'>
							<p className='text-muted-foreground'>No updates sent yet.</p>
						</div>
					) : (
						myUpdates.map((update) => (
							<Card key={update.id || update._id}>
								<CardHeader className='pb-3'>
									<div className='flex justify-between items-start'>
										<div className='space-y-1'>
											<CardTitle className='text-base'>
												{update.title}
											</CardTitle>
											<CardDescription className='flex items-center gap-2 text-xs'>
												<Clock className='h-3 w-3' />
												{format(new Date(update.publishedAt), 'PPP p')}
											</CardDescription>
										</div>
									</div>
								</CardHeader>
								<CardContent className='text-sm'>
									<p>{update.content}</p>
									<div className='mt-4 flex items-center gap-4 text-xs text-muted-foreground'>
										<div className='flex items-center gap-1'>
											<Users className='h-3 w-3' />
											Class Announcement
										</div>
									</div>
								</CardContent>
								{/* Fix U2: Wire up Edit and Delete buttons */}
								<CardFooter className='pt-0 flex justify-end gap-2'>
									<Button
										variant='ghost'
										size='sm'
										onClick={() => handleEdit(update)}
									>
										<Edit className='h-4 w-4 mr-1' /> Edit
									</Button>
									<Button
										variant='ghost'
										size='sm'
										className='text-destructive hover:text-destructive'
										onClick={() => handleDelete(update.id || update._id)}
									>
										<Trash2 className='h-4 w-4 mr-1' /> Delete
									</Button>
								</CardFooter>
							</Card>
						))
					)}
				</div>
			</div>
		</div>
	)
}
