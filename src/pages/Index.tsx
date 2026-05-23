import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CTASection from '@/components/sections/CTASection'
import HeroSection from '@/components/sections/HeroSection'
import FeaturesSection from '@/components/sections/FeaturesSection'
import RolesSection from '@/components/sections/RolesSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'

const Index = () => {
	return (
		<div className='min-h-screen bg-background'>
			<Header />
			<main>
				<HeroSection />
				<FeaturesSection />
				<RolesSection />
				<TestimonialsSection />
				<CTASection />
			</main>
			<Footer />
		</div>
	)
}

export default Index
