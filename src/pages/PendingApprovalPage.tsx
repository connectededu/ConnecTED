import { motion } from 'framer-motion'
import { Clock, LogOut, School } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

export default function PendingApprovalPage() {
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Clock className="w-10 h-10 text-warning" />
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <School className="w-5 h-5" />
            <span className="text-sm font-medium">ConnecTED School Platform</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Account Pending Approval
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Hi <span className="font-semibold text-foreground">{user?.name || 'there'}</span>! Your{' '}
            <span className="capitalize font-medium">{user?.role}</span> account has been registered
            and is currently awaiting approval from a school administrator.
          </p>
          <p className="text-sm text-muted-foreground">
            You will receive a notification once your account has been reviewed. This usually takes
            1–2 business days.
          </p>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-full text-sm font-medium border border-warning/20">
          <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
          Waiting for Admin Approval
        </div>

        {/* Profile chip */}
        <div className="p-4 bg-muted rounded-xl text-left space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Account Details</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium text-foreground">{user?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-foreground">{user?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium text-foreground capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="text-warning font-medium">Pending</span>
          </div>
        </div>

        {/* Logout button */}
        <Button
          variant="outline"
          onClick={() => logout()}
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </motion.div>
    </div>
  )
}
