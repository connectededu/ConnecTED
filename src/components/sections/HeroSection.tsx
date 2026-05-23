import { Button } from '@/components/ui/button'
import {
	ArrowRight,
	Play,
	Users,
	MessageSquare,
	Bell,
	CheckCircle2
} from 'lucide-react'

const HeroSection = () => {
	const stats = [
		{ value: '10K+', label: 'Schools' },
		{ value: '500K+', label: 'Parents' },
		{ value: '50K+', label: 'Teachers' },
		{ value: '99.9%', label: 'Uptime' }
	]

	return (
		<section className='relative min-h-screen pt-24 pb-16 overflow-hidden gradient-admin'>
			{/* Background Pattern */}
			<div className='absolute inset-0 pattern-dots opacity-50' />

			{/* Gradient Orbs */}
			<div className='absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse' />
			<div
				className='absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse'
				style={{ animationDelay: '1s' }}
			/>

			<div className='section-container relative z-10'>
				<div className='grid lg:grid-cols-2 gap-12 items-center'>
					{/* Left Content */}
					<div className='space-y-8'>
						{/* Badge */}
						<div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in'>
							<span className='flex h-2 w-2 rounded-full bg-primary animate-pulse' />
							<span className='text-sm font-medium text-primary'>
								Now with AI-powered insights
							</span>
						</div>

						{/* Headline */}
						<h1
							className='heading-display animate-fade-in-up'
							style={{ animationDelay: '0.1s' }}
						>
							Bridging the Gap Between{' '}
							<span className='text-gradient'>Home & School</span>
						</h1>

						{/* Subheadline */}
						<p
							className='text-body-large max-w-lg animate-fade-in-up'
							style={{ animationDelay: '0.2s' }}
						>
							ConnecTED replaces scattered WhatsApp groups and paper circulars
							with one powerful platform. Real-time updates, instant messaging,
							and complete transparency for everyone involved in your child's
							education.
						</p>

						{/* CTA Buttons */}
						<div
							className='flex flex-wrap gap-4 animate-fade-in-up'
							style={{ animationDelay: '0.3s' }}
						>
							<Button variant='default' size='lg'>
								Start Free Trial
								<ArrowRight className='h-5 w-5' />
							</Button>
							<Button variant='outline' size='lg'>
								<Play className='h-5 w-5' />
								Watch Demo
							</Button>
						</div>

						{/* Trust Indicators */}
						<div
							className='flex flex-wrap items-center gap-6 pt-4 animate-fade-in-up'
							style={{ animationDelay: '0.4s' }}
						>
							<div className='flex items-center gap-2 text-sm text-muted-foreground'>
								<CheckCircle2 className='h-5 w-5 text-primary' />
								No credit card required
							</div>
							<div className='flex items-center gap-2 text-sm text-muted-foreground'>
								<CheckCircle2 className='h-5 w-5 text-primary' />
								14-day free trial
							</div>
							<div className='flex items-center gap-2 text-sm text-muted-foreground'>
								<CheckCircle2 className='h-5 w-5 text-primary' />
								Cancel anytime
							</div>
						</div>
					</div>

					{/* Right Content - Dashboard Preview */}
					<div
						className='relative animate-fade-in-up'
						style={{ animationDelay: '0.3s' }}
					>
						{/* Main Dashboard Card */}
						<div className='relative rounded-2xl bg-card shadow-large border border-border/50 overflow-hidden'>
							{/* Mock Browser Header */}
							<div className='flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/50'>
								<div className='flex gap-1.5'>
									<div className='w-3 h-3 rounded-full bg-destructive/60' />
									<div className='w-3 h-3 rounded-full bg-yellow-400/60' />
									<div className='w-3 h-3 rounded-full bg-primary/60' />
								</div>
								<div className='flex-1 mx-4'>
									<div className='h-6 bg-background rounded-md flex items-center px-3 text-xs text-muted-foreground'>
										app.connected.edu/dashboard
									</div>
								</div>
							</div>

							{/* Dashboard Content */}
							<div className='p-6 space-y-4'>
								{/* Welcome Banner */}
								<div className='rounded-xl gradient-primary p-4 text-primary-foreground'>
									<p className='text-sm opacity-90'>Welcome back, Sarah!</p>
									<h3 className='font-semibold'>
										Your child Emma has 2 new updates
									</h3>
								</div>

								{/* Quick Stats */}
								<div className='grid grid-cols-3 gap-3'>
									<div className='rounded-lg bg-secondary/50 p-3 text-center'>
										<Users className='h-5 w-5 mx-auto mb-1 text-primary' />
										<p className='text-lg font-bold'>95%</p>
										<p className='text-xs text-muted-foreground'>Attendance</p>
									</div>
									<div className='rounded-lg bg-secondary/50 p-3 text-center'>
										<MessageSquare className='h-5 w-5 mx-auto mb-1 text-primary' />
										<p className='text-lg font-bold'>3</p>
										<p className='text-xs text-muted-foreground'>Messages</p>
									</div>
									<div className='rounded-lg bg-secondary/50 p-3 text-center'>
										<Bell className='h-5 w-5 mx-auto mb-1 text-primary' />
										<p className='text-lg font-bold'>5</p>
										<p className='text-xs text-muted-foreground'>Alerts</p>
									</div>
								</div>

								{/* Recent Activity */}
								<div className='space-y-2'>
									<h4 className='text-sm font-semibold'>Recent Activity</h4>
									<div className='space-y-2'>
										{[
											{
												text: 'Math homework submitted',
												time: '2h ago',
												isPrimary: true
											},
											{
												text: 'New announcement from Principal',
												time: '5h ago',
												isAccent: true
											},
											{
												text: 'Parent-teacher meeting scheduled',
												time: '1d ago',
												isSecondary: true
											}
										].map((item, i) => (
											<div
												key={i}
												className='flex items-center gap-3 p-2 rounded-lg bg-muted/30'
											>
												<div
													className={`w-2 h-2 rounded-full ${item.isPrimary ? 'bg-primary' : item.isAccent ? 'bg-accent' : 'bg-secondary-foreground'}`}
												/>
												<span className='text-sm flex-1'>{item.text}</span>
												<span className='text-xs text-muted-foreground'>
													{item.time}
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Floating Notification Card */}
						<div className='absolute -left-8 top-1/3 animate-float shadow-medium rounded-xl bg-card border border-border/50 p-4 max-w-[200px]'>
							<div className='flex items-start gap-3'>
								<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10'>
									<Bell className='h-4 w-4 text-primary' />
								</div>
								<div>
									<p className='text-xs font-semibold'>New Message</p>
									<p className='text-xs text-muted-foreground'>
										Mrs. Johnson replied...
									</p>
								</div>
							</div>
						</div>

						{/* Floating Stats Card */}
						<div
							className='absolute -right-4 bottom-1/4 animate-float shadow-medium rounded-xl bg-card border border-border/50 p-4'
							style={{ animationDelay: '0.5s' }}
						>
							<div className='flex items-center gap-3'>
								<div className='flex h-10 w-10 items-center justify-center rounded-lg gradient-primary'>
									<CheckCircle2 className='h-5 w-5 text-primary-foreground' />
								</div>
								<div>
									<p className='text-sm font-bold'>A+ Grade</p>
									<p className='text-xs text-muted-foreground'>Science Test</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Stats Bar */}
				<div className='mt-20 pt-10 border-t border-border/50'>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
						{stats.map((stat, i) => (
							<div
								key={stat.label}
								className='text-center animate-fade-in-up'
								style={{ animationDelay: `${0.5 + i * 0.1}s` }}
							>
								<p className='text-3xl md:text-4xl font-bold text-gradient'>
									{stat.value}
								</p>
								<p className='text-sm text-muted-foreground mt-1'>
									{stat.label}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}

export default HeroSection
