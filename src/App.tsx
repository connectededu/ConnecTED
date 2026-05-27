import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useAuthStore } from "@/stores/authStore";
import { initializeAuth } from "@/store/slices/authSlice";
import type { AppDispatch } from "@/store";

// Landing Page 
import LandingPage from "./pages/Landing"

// Auth
import AuthPage from "./pages/AuthPage";

// Layout
import DashboardLayout from "./components/layout/DashboardLayout";

// Parent Pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import MyChildrenPage from "./pages/parent/MyChildren";
import StudentDetailsPage from "./pages/parent/StudentDetails";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ClassesPage from "./pages/teacher/Classes";
import ClassDetailsPage from "./pages/teacher/ClassDetails";
import UpdatesPage from "./pages/teacher/Updates";
import GradesPage from "./pages/teacher/Grades";
import AttendancePage from "./pages/teacher/Attendance";
import HomeworkPage from "./pages/teacher/Homework";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/Users";
import StudentsPage from "./pages/admin/Students";
import ClassesManagerPage from "./pages/admin/ClassesManager";
import ProgramsManagerPage from "./pages/admin/ProgramsManager";
import AnalyticsPage from "./pages/admin/Analytics";
import AuditLogsPage from "./pages/admin/AuditLogs";

// Shared Pages
import ProfilePage from "./pages/shared/ProfilePage";
import EventsPage from "./pages/shared/EventsPage";
import AnnouncementsPage from "./pages/shared/AnnouncementsPage";
import MessagesPage from "./pages/shared/MessagesPage";

import NotFound from "./pages/NotFound";
import PendingApprovalPage from "./pages/PendingApprovalPage";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, pendingApproval, isInitialized } = useAuthStore();
  
  // Wait for initial auth check to finish
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Unapproved users (non-admin) always see pending screen
  if (pendingApproval && user && user.role !== 'admin') {
    return <Navigate to="/pending" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <Routes>
      {/* Landing Page */}
        <Route path="/landing" element={<LandingPage />} />
      
      {/* Root redirect */}
      <Route path="/" element={
        isAuthenticated && user 
          ? <Navigate to={`/${user.role}`} replace /> 
          : <Navigate to="/auth" replace />
      } />
      
      {/* Pending Approval page for unapproved users */}
      <Route path="/pending" element={
        !isAuthenticated 
          ? <Navigate to="/auth" replace />
          : <PendingApprovalPage />
      } />
      
      {/* Auth */}
      <Route path="/auth" element={
        isAuthenticated && user 
          ? <Navigate to={`/${user.role}`} replace />
          : <AuthPage />
      } />

      {/* Parent Routes */}
      <Route path="/parent" element={
        <ProtectedRoute allowedRoles={['parent']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ParentDashboard />} />
        <Route path="children" element={<MyChildrenPage />} />
        <Route path="children/:id" element={<StudentDetailsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<TeacherDashboard />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="classes/:id" element={<ClassDetailsPage />} />
        <Route path="updates" element={<UpdatesPage />} />
        <Route path="grades" element={<GradesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="homework" element={<HomeworkPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="classes" element={<ClassesManagerPage />} />
        <Route path="programs" element={<ProgramsManagerPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentDetailsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="logs" element={<AuditLogsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
