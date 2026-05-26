import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu, X, GraduationCap } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { ThemeSwitcher } from '@/components/shared/ThemeSwitcher'

const Header = () => {
	// const [sidebarOpen, setIsMenuOpen] = useState(false);
	const { sidebarOpen, setSidebarOpen } = useAppStore()

	const navLinks = [
		{ label: 'Features', href: '#features' },
		{ label: 'For Parents', href: '#parents' },
		{ label: 'For Teachers', href: '#teachers' },
		{ label: 'Pricing', href: '#pricing' }
	]

	return (
		<header className='fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50'>
			<div className='section-container'>
				<div className='flex h-16 items-center justify-between'>
					{/* Logo */}
					<Link to='/' className='flex items-center gap-2 group'>
						<div className='flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-soft group-hover:shadow-medium transition-all duration-300'>
							<GraduationCap className='h-5 w-5 text-primary-foreground' />
						</div>
						<span className='text-xl font-bold text-foreground'>
							Connec<span className='text-gradient'>TED</span>
						</span>
					</Link>

					{/* Desktop Navigation */}
					<nav className='hidden md:flex items-center gap-8'>
						{navLinks.map((link) => (
							<a
								key={link.label}
								href={link.href}
								className='text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200'
							>
								{link.label}
							</a>
						))}
					</nav>

					{/* Desktop CTA */}
					<div className='hidden md:flex items-center gap-3'>
						<ThemeSwitcher />
						<Button variant='ghost' size='sm' asChild>
							<Link to='/auth'>Sign In</Link>
						</Button>
						<Button variant='default' size='sm' asChild>
							<Link to='/auth'>Get Started</Link>
						</Button>
					</div>

					{/* Mobile Menu Button */}
					<button
						className='md:hidden p-2 rounded-lg hover:bg-secondary transition-colors'
						onClick={() => setSidebarOpen(!sidebarOpen)}
						aria-label='Toggle menu'
					>
						{sidebarOpen ? (
							<X className='h-6 w-6 text-foreground' />
						) : (
							<Menu className='h-6 w-6 text-foreground' />
						)}
					</button>
				</div>

				{/* Mobile Navigation */}
				{sidebarOpen && (
					<div className='md:hidden py-4 border-t border-border/50 animate-fade-in'>
						<nav className='flex flex-col gap-2'>
							{navLinks.map((link) => (
								<a
									key={link.label}
									href={link.href}
									className='px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-all duration-200'
									onClick={() => setSidebarOpen(false)}
								>
									{link.label}
								</a>
							))}
							<div className='flex flex-col gap-2 mt-4 px-4'>
								<div className='flex items-center gap-2 pb-2 border-b'>
									<ThemeSwitcher />
									<span className='text-xs text-muted-foreground'>Theme</span>
								</div>
								<Button variant='outline' className='w-full' asChild>
									<Link to='/auth'>Sign In</Link>
								</Button>
								<Button variant='default' className='w-full' asChild>
									<Link to='/auth'>Get Started</Link>
								</Button>
							</div>
						</nav>
					</div>
				)}
			</div>
		</header>
	)
}

export default Header
