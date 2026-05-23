import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Upload, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import type { ParentSignupForm as ParentFormType } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { programsApi } from '@/services/api'

interface Props {
	onSuccess: () => void
	onBack: () => void
}

export default function ParentSignupForm({ onSuccess }: Props) {
	const { signupParent, isLoading } = useAuthStore()
	const [step, setStep] = useState(1)
	const [formData, setFormData] = useState<ParentFormType>({
		name: '',
		email: '',
		phone: '',
		password: '',
		relationship: 'Mother',
		studentName: '',
		studentDob: '',
		studentAdmissionNumber: '',
		studentClass: '',
		studentProgramId: '',
		previousSchool: '',
		emergencyContactName: '',
		emergencyContactPhone: '',
		emergencyContactRelationship: ''
	})

	const { data: programs = [] } = useQuery({
		queryKey: ['programs-list'],
		queryFn: () => programsApi.getAll().then(r => r.data.data)
	})

	const updateField = (field: keyof ParentFormType, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const handleNext = () => {
		if (step === 1) {
			if (
				!formData.name ||
				!formData.email ||
				!formData.phone ||
				!formData.password
			) {
				toast.error('Please fill in all required fields')
				return
			}
		} else if (step === 2) {
			if (!formData.studentName || !formData.studentDob) {
				toast.error('Please fill in student details')
				return
			}
		}
		setStep((prev) => prev + 1)
	}

	const handleBack = () => {
		setStep((prev) => prev - 1)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
			toast.error('Please fill in emergency contact details')
			return
		}

		const result = await signupParent(formData)
		if (result.success) {
			toast.success(result.message)
			onSuccess()
		} else {
			toast.error(result.message)
		}
	}

	return (
		<motion.div
			key='parent-signup'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.3 }}
			className='space-y-6'
		>
			<div>
				<div className='badge-parent inline-block mb-4'>
					<User className='w-4 h-4 inline mr-2' />
					Parent Registration
				</div>
				<h2 className='text-2xl font-bold text-foreground'>
					Create your account
				</h2>
				<p className='text-muted-foreground text-sm mt-1'>Step {step} of 3</p>
			</div>

			{/* Progress bar */}
			<div className='flex gap-2'>
				{[1, 2, 3].map((s) => (
					<div
						key={s}
						className={`h-1.5 flex-1 rounded-full transition-colors ${
							s <= step ? 'bg-parent' : 'bg-muted'
						}`}
					/>
				))}
			</div>

			<form onSubmit={handleSubmit} className='space-y-4'>
				{step === 1 && (
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className='space-y-4'
					>
						<h3 className='font-semibold text-foreground'>
							Parent Information
						</h3>
						<div className='space-y-2'>
							<Label htmlFor='name'>Full Name *</Label>
							<Input
								id='name'
								value={formData.name}
								onChange={(e) => updateField('name', e.target.value)}
								placeholder='Enter your full name'
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email *</Label>
							<Input
								id='email'
								type='email'
								value={formData.email}
								onChange={(e) => updateField('email', e.target.value)}
								placeholder='you@example.com'
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='phone'>Phone Number *</Label>
							<Input
								id='phone'
								type='tel'
								value={formData.phone}
								onChange={(e) => updateField('phone', e.target.value)}
								placeholder='+1 555-0100'
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='password'>Password *</Label>
							<Input
								id='password'
								type='password'
								value={formData.password}
								onChange={(e) => updateField('password', e.target.value)}
								placeholder='Create a strong password'
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label>Relationship to Student *</Label>
							<Select
								value={formData.relationship}
								onValueChange={(value) =>
									updateField('relationship', value as any)
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='Mother'>Mother</SelectItem>
									<SelectItem value='Father'>Father</SelectItem>
									<SelectItem value='Guardian'>Guardian</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</motion.div>
				)}

				{step === 2 && (
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className='space-y-4'
					>
						<h3 className='font-semibold text-foreground'>
							Student Information
						</h3>
						<div className='space-y-2'>
							<Label htmlFor='studentName'>Student Full Name *</Label>
							<Input
								id='studentName'
								value={formData.studentName}
								onChange={(e) => updateField('studentName', e.target.value)}
								placeholder="Enter student's full name"
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='studentDob'>Date of Birth *</Label>
							<Input
								id='studentDob'
								type='date'
								value={formData.studentDob}
								onChange={(e) => updateField('studentDob', e.target.value)}
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='admissionNumber'>
								Admission Number (if existing student)
							</Label>
							<Input
								id='admissionNumber'
								value={formData.studentAdmissionNumber}
								onChange={(e) =>
									updateField('studentAdmissionNumber', e.target.value)
								}
								placeholder='e.g., STU-2024-001'
							/>
						</div>
						<div className='space-y-2'>
							<Label>Class</Label>
							<Select
								value={formData.studentClass}
								onValueChange={(value) => updateField('studentClass', value)}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select class or leave for assignment' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='awaiting'>Awaiting Assignment</SelectItem>
									<SelectItem value='class-1'>Grade 5 Blue</SelectItem>
									<SelectItem value='class-2'>Grade 3 Green</SelectItem>
									<SelectItem value='class-3'>Grade 4 Red</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='space-y-2'>
							<Label>Program</Label>
							<Select
								value={formData.studentProgramId}
								onValueChange={(value) => updateField('studentProgramId', value)}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select a program' />
								</SelectTrigger>
								<SelectContent>
									{programs.map((prog: any) => (
										<SelectItem key={prog._id || prog.id} value={prog._id || prog.id}>
											{prog.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='previousSchool'>Previous School (if any)</Label>
							<Input
								id='previousSchool'
								value={formData.previousSchool}
								onChange={(e) => updateField('previousSchool', e.target.value)}
								placeholder='Enter previous school name'
							/>
						</div>
					</motion.div>
				)}

				{step === 3 && (
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						className='space-y-4'
					>
						<h3 className='font-semibold text-foreground'>Emergency Contact</h3>
						<div className='space-y-2'>
							<Label htmlFor='emergencyName'>Contact Name *</Label>
							<Input
								id='emergencyName'
								value={formData.emergencyContactName}
								onChange={(e) =>
									updateField('emergencyContactName', e.target.value)
								}
								placeholder='Emergency contact name'
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='emergencyPhone'>Contact Phone *</Label>
							<Input
								id='emergencyPhone'
								type='tel'
								value={formData.emergencyContactPhone}
								onChange={(e) =>
									updateField('emergencyContactPhone', e.target.value)
								}
								placeholder='+1 555-0100'
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='emergencyRelationship'>Relationship</Label>
							<Input
								id='emergencyRelationship'
								value={formData.emergencyContactRelationship}
								onChange={(e) =>
									updateField('emergencyContactRelationship', e.target.value)
								}
								placeholder='e.g., Spouse, Grandparent'
							/>
						</div>
					</motion.div>
				)}

				<div className='flex gap-3 pt-4'>
					{step > 1 && (
						<Button
							type='button'
							variant='outline'
							onClick={handleBack}
							className='flex-1'
						>
							Back
						</Button>
					)}
					{step < 3 ? (
						<Button
							type='button'
							onClick={handleNext}
							className='flex-1 bg-role-parent hover:opacity-90'
						>
							Continue
						</Button>
					) : (
						<Button
							type='submit'
							className='flex-1 bg-role-parent hover:opacity-90'
							disabled={isLoading}
						>
							{isLoading ? (
								<>
									<Loader2 className='w-4 h-4 mr-2 animate-spin' />
									Submitting...
								</>
							) : (
								'Submit for Approval'
							)}
						</Button>
					)}
				</div>
			</form>
		</motion.div>
	)
}
