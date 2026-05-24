import {
	GraduationCap,
	Mail,
	Phone,
	MapPin,
	Twitter,
	Facebook,
	Linkedin,
	Instagram
} from 'lucide-react'

const Footer = () => {
	const footerLinks = {
		product: [
			{ label: 'Features', href: '#features' },
			{ label: 'Pricing', href: '#pricing' },
			{ label: 'Security', href: '#security' }
		],
		company: [
			{ label: 'About Us', href: '#about' },
			{ label: 'Careers', href: '#careers' },
			{ label: 'Press', href: '#press' },
			{ label: 'Contact', href: '#contact' }
		],
		resources: [
			{ label: 'Blog', href: '#blog' },
			{ label: 'Help Center', href: '#help' },
			{ label: 'Webinars', href: '#webinars' },
			{ label: 'Case Studies', href: '#cases' }
		],
		legal: [
			{ label: 'Privacy Policy', href: '#privacy' },
			{ label: 'Terms of Service', href: '#terms' },
			{ label: 'Cookie Policy', href: '#cookies' },
			{ label: 'GDPR', href: '#gdpr' }
		]
	}

	const socialLinks = [
		{ icon: Twitter, href: '#twitter', label: 'Twitter' },
		{ icon: Facebook, href: '#facebook', label: 'Facebook' },
		{ icon: Linkedin, href: '#linkedin', label: 'LinkedIn' },
		{ icon: Instagram, href: '#instagram', label: 'Instagram' }
	]

	return (
		<footer className='bg-foreground text-background/90 pt-16 pb-8'>
			<div className='section-container'>
				<div className='grid grid-cols-2 md:grid-cols-6 gap-8 pb-12 border-b border-background/10'>
					{/* Brand Column */}
					<div className='col-span-2'>
						<a href='/' className='flex items-center gap-2 mb-4'>
							<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary'>
								<GraduationCap className='h-5 w-5 text-primary-foreground' />
							</div>
							<span className='text-xl font-bold text-background'>
								ConnecTED
							</span>
						</a>
						<p className='text-background/60 text-sm mb-6 max-w-xs'>
							Strengthening the home-school partnership through seamless
							communication.
						</p>
						<div className='flex gap-3'>
							{socialLinks.map((social) => (
								<a
									key={social.label}
									href={social.href}
									className='flex h-9 w-9 items-center justify-center rounded-lg bg-background/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300'
									aria-label={social.label}
								>
									<social.icon className='h-4 w-4' />
								</a>
							))}
						</div>
					</div>

					{/* Product Links */}
					<div>
						<h4 className='font-semibold text-background mb-4'>Product</h4>
						<ul className='space-y-3'>
							{footerLinks.product.map((link) => (
								<li key={link.label}>
									<a
										href={link.href}
										className='text-sm text-background/60 hover:text-primary transition-colors duration-200'
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Company Links */}
					<div>
						<h4 className='font-semibold text-background mb-4'>Company</h4>
						<ul className='space-y-3'>
							{footerLinks.company.map((link) => (
								<li key={link.label}>
									<a
										href={link.href}
										className='text-sm text-background/60 hover:text-primary transition-colors duration-200'
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Resources Links */}
					<div>
						<h4 className='font-semibold text-background mb-4'>Resources</h4>
						<ul className='space-y-3'>
							{footerLinks.resources.map((link) => (
								<li key={link.label}>
									<a
										href={link.href}
										className='text-sm text-background/60 hover:text-primary transition-colors duration-200'
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>

					{/* Legal Links */}
					<div>
						<h4 className='font-semibold text-background mb-4'>Legal</h4>
						<ul className='space-y-3'>
							{footerLinks.legal.map((link) => (
								<li key={link.label}>
									<a
										href={link.href}
										className='text-sm text-background/60 hover:text-primary transition-colors duration-200'
									>
										{link.label}
									</a>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Contact Info */}
				<div className='flex flex-col md:flex-row justify-between items-center gap-4 pt-8'>
					<div className='flex flex-wrap justify-center md:justify-start gap-6 text-sm text-background/60'>
						<a
							href='mailto:hello@connected.edu'
							className='flex items-center gap-2 hover:text-primary transition-colors'
						>
							<Mail className='h-4 w-4' />
							hello@connected.edu
						</a>
						<a
							href='tel:+1234567890'
							className='flex items-center gap-2 hover:text-primary transition-colors'
						>
							<Phone className='h-4 w-4' />
							(123) 456-7890
						</a>
					</div>
					<p className='text-sm text-background/40'>
						© {new Date().getFullYear()} ConnecTED. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	)
}

export default Footer
