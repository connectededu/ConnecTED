import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
	Plus,
	MoreHorizontal,
	Search,
	UserCheck,
	Shield,
	Edit,
	Trash2,
	Mail,
	X,
	Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormDescription,
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
import { Badge } from '@/components/ui/badge'
import { usersApi, authApi, studentsApi, classesApi, auditApi, programsApi } from '@/services/api'
import { toast } from 'sonner'
import { PaginationControls } from '@/components/ui/pagination-controls'

// Simple debounce hook if not present
function useDebounceValue<T>(value: T, delay: number = 500): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)
		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])
	return debouncedValue
}

function AuditLogsForUser({ userId }: { userId: string }) {
	const { data } = useQuery({
		queryKey: ['audit-logs', userId],
		queryFn: () =>
			auditApi.getLogs({ limit: 100 })
				.then((r) => r.data.filter((l: any) => l.targetId === userId))
	})

	if (!data || data.length === 0)
		return <div className='p-4'>No logs for this user.</div>

	// Group by date (YYYY-MM-DD)
	const grouped: Record<string, any[]> = {}
	data.forEach((log: any) => {
		const ts = log.timestamp || log.createdAt || ''
		const d = ts.split('T')[0]
		if (!grouped[d]) grouped[d] = []
		grouped[d].push(log)
	})

	return (
		<div className='space-y-4'>
			{Object.keys(grouped)
				.sort((a, b) => b.localeCompare(a))
				.map((date) => (
					<div key={date}>
						<div className='text-sm text-muted-foreground mb-2'>{date}</div>
						<div className='space-y-2'>
							{grouped[date].map((log: any) => (
								<div key={log._id || log.id} className='p-2 border rounded'>
									<div className='text-sm font-medium'>{log.action}</div>
									<div className='text-xs text-muted-foreground'>
										{log.details}
									</div>
									<div className='text-xs text-muted-foreground'>
										{new Date(log.timestamp || log.createdAt).toLocaleString()}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
		</div>
	)
}

// --- Compose Email Modal ---
function ComposeEmailModal({
	open,
	onClose,
	targetUser
}: {
	open: boolean
	onClose: () => void
	targetUser: any | null
}) {
	const [subject, setSubject] = useState('')
	const [body, setBody] = useState('')
	const [sending, setSending] = useState(false)

	const handleSend = async () => {
		if (!subject.trim() || !body.trim()) {
			toast.error('Subject and body are required')
			return
		}
		setSending(true)
		try {
			// In a real system this would call an email API endpoint
			// For now we simulate success
			await new Promise(r => setTimeout(r, 800))
			toast.success(`Email sent to ${targetUser?.email}`)
			setSubject('')
			setBody('')
			onClose()
		} catch {
			toast.error('Failed to send email')
		} finally {
			setSending(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
			<DialogContent className='max-w-lg'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Mail className='w-5 h-5' /> Compose Email
					</DialogTitle>
					<DialogDescription>
						Sending to: <span className='font-medium'>{targetUser?.name}</span>{' '}
						({targetUser?.email})
					</DialogDescription>
				</DialogHeader>
				<div className='space-y-4'>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Subject</label>
						<Input
							placeholder='Email subject…'
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
						/>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Message</label>
						<Textarea
							placeholder='Write your message here…'
							rows={6}
							value={body}
							onChange={(e) => setBody(e.target.value)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant='outline' onClick={onClose} disabled={sending}>
						Cancel
					</Button>
					<Button onClick={handleSend} disabled={sending}>
						{sending ? 'Sending…' : (
							<><Send className='w-4 h-4 mr-2' /> Send Email</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// --- Schemas ---
const studentSchema = z.object({
	name: z.string().min(2, 'Name is required'),
	dateOfBirth: z.string().min(1, 'DOB is required'),
	classId: z.string().min(1, 'Class is required'),
	admissionNumber: z.string().optional()
})

const userSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Invalid email address'),
	role: z.enum(['parent', 'teacher', 'admin']),
	isApproved: z.boolean().default(true),
	studentIds: z.array(z.string()).default([]),
	tempPassword: z.string().optional(),
	newStudents: z.array(studentSchema).default([]),
	// teacher editable fields
	staffId: z.string().optional(),
	subjects: z.array(z.string()).default([]),
	// parent editable fields
	studentClassId: z.string().optional(),
})

type UserFormValues = z.infer<typeof userSchema>

function ClassSearchDropdown({ value, onChange }: { value: string, onChange: (val: string) => void }) {
	const [search, setSearch] = useState('')
	const debouncedSearch = useDebounceValue(search, 300)
	
	const { data: classes, isLoading } = useQuery({
		queryKey: ['classes-search', debouncedSearch],
		queryFn: () => classesApi.search(debouncedSearch).then(r => r.data),
		enabled: debouncedSearch.length > 0 || search.length === 0
	})

	const currentClass = classes?.find((c: any) => c.id === value || c._id === value)

	return (
		<div className="relative">
			<Input 
				placeholder="Search class..." 
				value={search || (currentClass?.name || '')} 
				onChange={(e) => setSearch(e.target.value)}
				onFocus={() => setSearch('')}
			/>
			{search.length > 0 && classes && (
				<div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
					{classes.length === 0 ? (
						<div className="p-2 text-sm text-muted-foreground">No classes found</div>
					) : (
						classes.slice(0, 5).map((cls: any) => (
							<div 
								key={cls._id || cls.id} 
								className="p-2 text-sm hover:bg-accent cursor-pointer"
								onClick={() => {
									onChange(cls._id || cls.id)
									setSearch('')
								}}
							>
								{cls.name} ({cls.grade})
							</div>
						))
					)}
				</div>
			)}
		</div>
	)
}

function SubjectSearchDropdown({ value, onChange }: { value: string[], onChange: (val: string[]) => void }) {
	const [search, setSearch] = useState('')
	const debouncedSearch = useDebounceValue(search, 300)
	const [isFocused, setIsFocused] = useState(false)
	
	const { data: subjects } = useQuery({
		queryKey: ['programs-subjects', debouncedSearch],
		queryFn: () => programsApi.getSubjects(debouncedSearch).then(r => r.data.data),
	})

	const handleAdd = (subject: string) => {
		if (!value.includes(subject)) {
			onChange([...value, subject])
		}
		setSearch('')
		setIsFocused(false)
	}

	const handleRemove = (subject: string) => {
		onChange(value.filter(s => s !== subject))
	}

	return (
		<div className="space-y-2">
			{value.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{value.map(subj => (
						<Badge key={subj} variant="secondary" className="flex items-center gap-1">
							{subj}
							<X className="w-3 h-3 cursor-pointer" onClick={() => handleRemove(subj)} />
						</Badge>
					))}
				</div>
			)}
			<div className="relative">
				<Input 
					placeholder="Search and add subjects..." 
					value={search} 
					onChange={(e) => setSearch(e.target.value)}
					onFocus={() => setIsFocused(true)}
				/>
				{isFocused && subjects && (
					<div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
						{subjects.length === 0 && search.length > 0 ? (
							<div className="p-2 text-sm text-muted-foreground">
								No matching subjects found
							</div>
						) : (
							subjects.map((subj: string) => (
								<div 
									key={subj} 
									className="p-2 text-sm hover:bg-accent cursor-pointer"
									onMouseDown={(e) => { e.preventDefault(); handleAdd(subj) }}
								>
									{subj}
								</div>
							))
						)}
					</div>
				)}
			</div>
		</div>
	)
}

export default function UsersPage() {
	const queryClient = useQueryClient()
	const [page, setPage] = useState(1)
	const [searchTerm, setSearchTerm] = useState('')
	const [filterRole, setFilterRole] = useState<
		'all' | 'teacher' | 'parent' | 'admin'
	>('all')
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [editingUser, setEditingUser] = useState<any>(null)

	const [logsDialogOpen, setLogsDialogOpen] = useState(false)
	const [selectedUserForLogs, setSelectedUserForLogs] = useState<any>(null)

	const [emailModalOpen, setEmailModalOpen] = useState(false)
	const [emailTargetUser, setEmailTargetUser] = useState<any>(null)

	const [newSubject, setNewSubject] = useState('')

	const debouncedSearch = useDebounceValue(searchTerm, 500)

	// Reset page when filters change
	useEffect(() => {
		setPage(1)
	}, [debouncedSearch, filterRole])

	const form = useForm<UserFormValues>({
		resolver: zodResolver(userSchema),
		defaultValues: {
			name: '',
			email: '',
			role: 'parent',
			isApproved: true,
			studentIds: [],
			tempPassword: '',
			newStudents: [],
			staffId: '',
			subjects: [],
			studentClassId: ''
		}
	})

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'newStudents'
	})

	const { data: paginatedUsers, isLoading } = useQuery({
		queryKey: ['admin-users', page, debouncedSearch, filterRole],
		queryFn: () =>
			usersApi.getAll({ page, limit: 10, q: debouncedSearch, role: filterRole } as any)
				.then(r => r.data)
	})

	const users = (paginatedUsers as any)?.data || []
	const meta = (paginatedUsers as any)?.meta || { page: 1, totalPages: 1, total: 0 }

	const { data: allStudents } = useQuery({
		queryKey: ['students'],
		queryFn: () => studentsApi.getAll().then(r => r.data)
	})

	const { data: allClasses } = useQuery({
		queryKey: ['classes'],
		queryFn: () => classesApi.getAll().then(r => r.data)
	})

	const createMutation = useMutation({
		mutationFn: (data: any) => usersApi.create(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
			queryClient.invalidateQueries({ queryKey: ['students'] })
			toast.success('User created successfully')
			setIsDialogOpen(false)
			form.reset()
		}
	})

	const updateMutation = useMutation({
		mutationFn: (data: any) => usersApi.update(data._id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
			toast.success('User updated successfully')
			setIsDialogOpen(false)
			setEditingUser(null)
			form.reset()
		}
	})

	const deleteMutation = useMutation({
		mutationFn: (id: string) => usersApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
			toast.success('User deleted successfully')
		}
	})

	const onSubmit = (data: UserFormValues) => {
		if (editingUser) {
			// Build role-specific update payload
			const payload: any = { ...editingUser }

			if (editingUser.role === 'teacher') {
				// Only allow staffId and subjects to be updated
				if (editingUser.teacherData) {
					payload.teacherData = {
						...editingUser.teacherData,
						staffId: data.staffId || editingUser.teacherData.staffId,
						subjects: data.subjects || [],
					}
				}
			} else if (editingUser.role === 'parent') {
				// Only allow studentIds and studentClassId to be updated
				if (editingUser.parentData) {
					payload.parentData = {
						...editingUser.parentData,
						studentIds: data.studentIds || [],
					}
				}
				if (data.studentClassId) {
					payload.studentClassId = data.studentClassId
				}
			}
			// name and email are NOT updated here for frontend-created accounts
			updateMutation.mutate(payload)
		} else {
			createMutation.mutate(data)
		}
	}

	const handleEdit = (user: any) => {
		setEditingUser(user)
		form.reset({
			name: user.name, // displayed but disabled
			email: user.email, // displayed but disabled
			role: user.role,
			isApproved: user.isApproved,
			studentIds: user.parentData?.studentIds || [],
			tempPassword: '',
			newStudents: [],
			staffId: user.teacherData?.staffId || '',
			subjects: user.teacherData?.subjects || [],
			studentClassId: ''
		})
		setIsDialogOpen(true)
	}

	const handleDelete = (id: string) => {
		if (confirm('Are you sure you want to delete this user?')) {
			deleteMutation.mutate(id)
		}
	}

	const openCreateDialog = () => {
		setEditingUser(null)
		form.reset({
			name: '',
			email: '',
			role: 'parent',
			isApproved: true,
			studentIds: [],
			tempPassword: '',
			newStudents: [],
			staffId: '',
			subjects: [],
			studentClassId: ''
		})
		setIsDialogOpen(true)
	}

	const handleApprove = async (user: any) => {
		try {
			await usersApi.update(user._id, { ...user, isApproved: true })
			
			queryClient.invalidateQueries({ queryKey: ['admin-users'] })
			toast.success('User approved')
		} catch (err: any) {
			toast.error(err?.response?.data?.error || 'Failed to approve user')
		}
	}

	const watchedRole = form.watch('role')
	const studentList = Array.isArray(allStudents) ? allStudents : []
	const classList = Array.isArray(allClasses) ? allClasses : []

	return (
		<div className='space-y-6'>
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>User Management</h1>
					<p className='text-muted-foreground'>
						Manage system access for teachers, parents, and administrators.
					</p>
				</div>
				<Button onClick={openCreateDialog}>
					<Plus className='mr-2 h-4 w-4' />
					Add User
				</Button>
			</div>

			{/* Create / Edit User Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full'>
					<DialogHeader>
						<DialogTitle>
							{editingUser ? 'Edit User' : 'Create User'}
						</DialogTitle>
						<DialogDescription>
							{editingUser
								? 'Update role-specific fields.'
								: 'Add a new user to the system.'}
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<FormField
									control={form.control}
									name='name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Full Name</FormLabel>
											<FormControl>
												{/* Disabled for existing accounts */}
												<Input placeholder='John Doe' {...field} disabled={!!editingUser} />
											</FormControl>
											{editingUser && (
												<FormDescription className='text-xs text-muted-foreground'>
													Name cannot be changed by admin.
												</FormDescription>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='email'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input placeholder='john@example.com' {...field} disabled={!!editingUser} />
											</FormControl>
											{editingUser && (
												<FormDescription className='text-xs text-muted-foreground'>
													Email cannot be changed by admin.
												</FormDescription>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
								<FormField
									control={form.control}
									name='role'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Role</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
												disabled={!!editingUser}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder='Select role' />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value='parent'>Parent</SelectItem>
													<SelectItem value='teacher'>Teacher</SelectItem>
													<SelectItem value='admin'>Admin</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								{!editingUser && (
									<FormField
										control={form.control}
										name='tempPassword'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Temporary Password</FormLabel>
												<FormControl>
													<Input
														type='text'
														placeholder='Optional'
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Leave blank to auto-generate.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</div>

							{/* Teacher-specific editable fields */}
							{(watchedRole === 'teacher' || editingUser?.role === 'teacher') && (
								<div className='space-y-4 border-t pt-4'>
									<h3 className='font-medium'>Teacher Details</h3>
									<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
										<FormField
											control={form.control}
											name='staffId'
											render={({ field }) => (
												<FormItem>
													<FormLabel>Staff ID</FormLabel>
													<FormControl>
														<Input placeholder='TCH-001' {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name='subjects'
											render={({ field }) => (
												<FormItem>
													<FormLabel>Subjects</FormLabel>
													<FormControl>
														<SubjectSearchDropdown 
															value={field.value || []} 
															onChange={field.onChange} 
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							)}

							{/* Parent-specific editable fields */}
							{(watchedRole === 'parent' || editingUser?.role === 'parent') && (
								<div className='space-y-4 border-t pt-4'>
									<h3 className='font-medium'>Student Association</h3>

									<FormField
										control={form.control}
										name='studentIds'
										render={({ field }) => (
											<FormItem>
												<FormLabel>Link Existing Students</FormLabel>
												<FormControl>
													<Select
														onValueChange={(value) => {
															const current = field.value || []
															if (!current.includes(value)) {
																field.onChange([...current, value])
															}
														}}
													>
														<SelectTrigger>
															<SelectValue placeholder='Select student to link' />
														</SelectTrigger>
														<SelectContent>
															{studentList.map((student: any) => (
																<SelectItem key={student._id || student.id} value={student._id || student.id}>
																	{student.name} ({student.admissionNumber})
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</FormControl>
												{field.value && field.value.length > 0 && (
													<div className='flex flex-wrap gap-2 mt-2'>
														{field.value.map((id) => {
															const student = studentList.find(
																(s: any) => (s._id || s.id) === id
															)
															if (!student) return null
															return (
																<Badge
																	key={id}
																	variant='secondary'
																	className='flex items-center gap-1'
																>
																	{student.name}
																	<X
																		className='w-3 h-3 cursor-pointer'
																		onClick={() =>
																			field.onChange(
																				field.value?.filter((v) => v !== id)
																			)
																		}
																	/>
																</Badge>
															)
														})}
													</div>
												)}
												<FormMessage />
											</FormItem>
										)}
									/>

									{editingUser?.role === 'parent' && (
										<FormField
											control={form.control}
											name='studentClassId'
											render={({ field }) => (
												<FormItem>
													<FormLabel>Update Student Class</FormLabel>
													<FormControl>
														<ClassSearchDropdown value={field.value || ''} onChange={field.onChange} />
													</FormControl>
													<FormDescription>Optional: update the class for the linked students.</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}

									{!editingUser && (
										<div className='space-y-3'>
											<div className='flex items-center justify-between'>
												<FormLabel>Create & Link New Students</FormLabel>
												<Button
													type='button'
													variant='outline'
													size='sm'
													onClick={() =>
														append({
															name: '',
															dateOfBirth: '',
															classId: '',
															admissionNumber: ''
														})
													}
												>
													<Plus className='w-4 h-4 mr-2' />
													Add Student Profile
												</Button>
											</div>

											{fields.map((field, index) => (
												<div
													key={field.id}
													className='p-3 border rounded-md space-y-3 bg-muted/20'
												>
													<div className='flex justify-between items-center'>
														<span className='text-sm font-medium'>
															New Student {index + 1}
														</span>
														<Button
															type='button'
															variant='ghost'
															size='icon'
															onClick={() => remove(index)}
														>
															<X className='w-4 h-4' />
														</Button>
													</div>
													<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
														<FormField
															control={form.control}
															name={`newStudents.${index}.name`}
															render={({ field }) => (
																<FormItem>
																	<FormControl>
																		<Input
																			placeholder='Student Name'
																			{...field}
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`newStudents.${index}.dateOfBirth`}
															render={({ field }) => (
																<FormItem>
																	<FormControl>
																		<Input type='date' {...field} />
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`newStudents.${index}.classId`}
															render={({ field }) => (
																<FormItem>
																	<FormControl>
																		<ClassSearchDropdown 
																			value={field.value} 
																			onChange={field.onChange} 
																		/>
																	</FormControl>
																	<FormMessage />
																</FormItem>
															)}
														/>
														<FormField
															control={form.control}
															name={`newStudents.${index}.admissionNumber`}
															render={({ field }) => {
																const [checking, setChecking] = useState(false)
																const [exists, setExists] = useState<boolean | null>(null)

																const handleCheck = async () => {
																	if (!field.value) return
																	setChecking(true)
																	try {
																		const res = await studentsApi.checkAdmissionNumber(field.value)
																		setExists(res.data.exists)
																		if (res.data.exists) toast.success('Student found')
																		else toast.warning('New admission number')
																	} catch {
																		toast.error('Check failed')
																	} finally {
																		setChecking(false)
																	}
																}

																const handleGenerate = async () => {
																	try {
																		const res = await studentsApi.generateId()
																		field.onChange(res.data.admissionNumber)
																		setExists(false)
																	} catch {
																		toast.error('Generation failed')
																	}
																}

																return (
																	<FormItem>
																		<FormControl>
																			<div className="flex gap-1">
																				<Input
																					placeholder='Admission # (Opt)'
																					{...field}
																					className={exists === false ? 'border-amber-500' : ''}
																				/>
																				<Button 
																					type="button" 
																					variant="outline" 
																					size="icon"
																					onClick={handleCheck}
																					disabled={checking || !field.value}
																				>
																					<Search className="w-3 h-3" />
																				</Button>
																				<Button 
																					type="button" 
																					variant="outline" 
																					size="icon"
																					onClick={handleGenerate}
																				>
																					<Plus className="w-3 h-3" />
																				</Button>
																			</div>
																		</FormControl>
																		{exists === false && (
																			<p className="text-[10px] text-amber-600 font-medium">New Student (Not in DB)</p>
																		)}
																		<FormMessage />
																	</FormItem>
																)
															}}
														/>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							)}

							<DialogFooter>
								<Button
									type='submit'
									disabled={
										createMutation.isPending || updateMutation.isPending
									}
								>
									{createMutation.isPending || updateMutation.isPending
										? 'Saving...'
										: 'Save User'}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* Audit logs dialog */}
			<Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
				<DialogContent className='max-w-2xl max-h-[70vh] overflow-y-auto w-[95vw] sm:w-full'>
					<DialogHeader>
						<DialogTitle>Audit Logs</DialogTitle>
						<DialogDescription>
							Recent actions related to the selected user, grouped by date.
						</DialogDescription>
					</DialogHeader>
					{selectedUserForLogs ? (
						<AuditLogsForUser userId={selectedUserForLogs._id || selectedUserForLogs.id} />
					) : (
						<p>No user selected.</p>
					)}
					<DialogFooter>
						<Button variant='outline' onClick={() => setLogsDialogOpen(false)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Compose Email Modal */}
			<ComposeEmailModal
				open={emailModalOpen}
				onClose={() => { setEmailModalOpen(false); setEmailTargetUser(null) }}
				targetUser={emailTargetUser}
			/>

			<div className='flex items-center gap-4'>
				<div className='relative flex-1 max-w-sm'>
					<Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
					<Input
						placeholder='Search users...'
						className='pl-8'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<div className='flex gap-2'>
					<Button
						variant={filterRole === 'all' ? 'secondary' : 'ghost'}
						onClick={() => setFilterRole('all')}
					>
						All
					</Button>
					<Button
						variant={filterRole === 'teacher' ? 'secondary' : 'ghost'}
						onClick={() => setFilterRole('teacher')}
					>
						Teachers
					</Button>
					<Button
						variant={filterRole === 'parent' ? 'secondary' : 'ghost'}
						onClick={() => setFilterRole('parent')}
					>
						Parents
					</Button>
					<Button
						variant={filterRole === 'admin' ? 'secondary' : 'ghost'}
						onClick={() => setFilterRole('admin')}
					>
						Admins
					</Button>
				</div>
			</div>

			<div className='border rounded-md overflow-x-auto'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={4} className='h-24 text-center'>
									<div className='flex justify-center'>
										<div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
									</div>
								</TableCell>
							</TableRow>
						) : users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4} className='h-24 text-center'>
									No users found.
								</TableCell>
							</TableRow>
						) : (
							users.map((user: any) => (
								<TableRow key={user._id}>
									<TableCell>
										<div className='flex flex-col'>
											<div className="flex items-center gap-2">
												<span className='font-medium'>{user.name}</span>
												{user.isOnline && (
													<span className="w-2 h-2 rounded-full bg-green-500" title="Online"></span>
												)}
											</div>
											<span className='text-xs text-muted-foreground'>
												{user.email}
											</span>
										</div>
									</TableCell>
									<TableCell>
										<Badge variant='outline' className='capitalize'>
											{user.role}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											variant={user.isApproved ? 'default' : 'destructive'}
											className={
												user.isApproved ? 'bg-green-600 hover:bg-green-700' : ''
											}
										>
											{user.isApproved ? 'Active' : 'Pending'}
										</Badge>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant='ghost' size='icon'>
													<MoreHorizontal className='h-4 w-4' />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align='end'>
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												{/* Edit available for all users */}
												<DropdownMenuItem onClick={() => handleEdit(user)}>
													<Edit className='mr-2 h-4 w-4' /> Edit
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => {
														setEmailTargetUser(user)
														setEmailModalOpen(true)
													}}
												>
													<Mail className='mr-2 h-4 w-4' /> Send Email
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => {
														setSelectedUserForLogs(user)
														setLogsDialogOpen(true)
													}}
												>
													<Shield className='mr-2 h-4 w-4' /> View Logs
												</DropdownMenuItem>
												{!user.isApproved && (
													<DropdownMenuItem
														className='text-green-600'
														onClick={() => handleApprove(user)}
													>
														<UserCheck className='mr-2 h-4 w-4' /> Approve
													</DropdownMenuItem>
												)}
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className='text-destructive'
													onClick={() => handleDelete(user._id)}
												>
													<Trash2 className='mr-2 h-4 w-4' /> Deactivate
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<PaginationControls
				currentPage={page}
				totalPages={meta.totalPages}
				onPageChange={setPage}
				className='mt-4'
			/>
		</div>
	)
}
