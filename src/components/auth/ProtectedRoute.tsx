import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireApproval?: boolean;
}

/**
 * Protected route component that checks authentication and role permissions
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requireApproval = true,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Give auth state time to initialize
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking auth state
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to auth page
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role permissions
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    return <Navigate to={`/${user.role}`} replace />;
  }

  // Check approval status
  if (requireApproval && !user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-warning/10 flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full border-4 border-warning border-t-transparent animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Account Pending Approval
          </h2>
          <p className="text-muted-foreground">
            Your account is awaiting approval from an administrator. 
            You'll receive a notification once your account is approved.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Admin-only route wrapper
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']} requireApproval={true}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Teacher-only route wrapper
 */
export function TeacherRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['teacher', 'admin']} requireApproval={true}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Parent-only route wrapper
 */
export function ParentRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['parent', 'admin']} requireApproval={true}>
      {children}
    </ProtectedRoute>
  );
}
