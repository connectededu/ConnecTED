import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

const CTASection = () => {
	const benefits = [
		'14-day free trial',
		'No credit card required',
		'Full access to all features',
		'Free onboarding support'
	]

	return (
		<section className='py-24 relative overflow-hidden'>
			{/* Background */}
			<div className='absolute inset-0 gradient-primary opacity-95' />
			<div className='absolute inset-0 pattern-dots opacity-10' />

			{/* Decorative Elements */}
			<div className='absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl' />
			<div className='absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl' />

			<div className='section-container relative z-10'>
				<div className='max-w-3xl mx-auto text-center'>
					{/* Badge */}
					<div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6'>
						<Sparkles className='h-4 w-4 text-white' />
						<span className='text-sm font-medium text-white'>
							Start Your Journey Today
						</span>
					</div>

					{/* Headline */}
					<h2 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight'>
						Ready to Transform Your School's Communication?
					</h2>

					{/* Description */}
					<p className='text-lg text-white/80 mb-8 max-w-2xl mx-auto'>
						Join thousands of schools that have streamlined their parent-teacher
						communication. Get started in minutes, see results from day one.
					</p>

					{/* Benefits */}
					<div className='flex flex-wrap justify-center gap-4 mb-10'>
						{benefits.map((benefit) => (
							<div
								key={benefit}
								className='flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm'
							>
								<CheckCircle2 className='h-4 w-4 text-white' />
								<span className='text-sm text-white'>{benefit}</span>
							</div>
						))}
					</div>

					{/* CTA Buttons */}
					<div className='flex flex-wrap justify-center gap-4'>
						<Button
							size='lg'
							className='bg-white text-primary hover:bg-white/90 shadow-large hover:shadow-xl hover:scale-[1.02] transition-all duration-300'
						>
							Start Free Trial
							<ArrowRight className='h-5 w-5' />
						</Button>
						<Button variant='outline' size='lg'>
							Schedule a Demo
						</Button>
					</div>

					{/* Trust Text */}
					<p className='mt-8 text-sm text-white/60'>
						Trusted by 10,000+ schools worldwide • GDPR Compliant • SOC 2
						Certified
					</p>
				</div>
			</div>
		</section>
	)
}

export default CTASection
