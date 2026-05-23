import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, BookOpen, MessageSquare, Calendar, ClipboardList, 
  TrendingUp, Clock, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import type { Teacher } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const teacher = user as Teacher;

  const { 
    analytics,
    fetchAnalytics,
    events, 
    notifications,
    fetchNotifications,
    announcements,
    fetchAnnouncements,
    isLoading: dataLoading 
  } = useAppStore();

  useEffect(() => {
    fetchAnalytics();
    fetchNotifications();
    fetchAnnouncements();
  }, []);

  // Fix T1: Build dynamic recent activities from real notifications and announcements
  const recentActivity = useMemo(() => {
    const list: any[] = [];
    
    // Add real notifications
    if (notifications && notifications.length > 0) {
      notifications.slice(0, 2).forEach((n) => {
        list.push({
          icon: MessageSquare,
          text: n.title || n.message,
          time: new Date(n.createdAt || Date.now()).toLocaleDateString(),
          color: 'text-info',
        });
      });
    }

    // Add real announcements
    if (announcements && announcements.length > 0) {
      announcements.slice(0, 2).forEach((a) => {
        list.push({
          icon: FileText,
          text: a.title,
          time: new Date(a.publishedAt || Date.now()).toLocaleDateString(),
          color: 'text-teacher',
        });
      });
    }

    // Default fallback list if no actual history yet
    if (list.length === 0) {
      return [
        { icon: ClipboardList, text: 'Attendance register initialized', time: 'Active', color: 'text-success' },
        { icon: MessageSquare, text: 'Messaging threads verified', time: 'Online', color: 'text-warning' },
      ];
    }

    return list.slice(0, 4);
  }, [notifications, announcements]);

  if (!teacher) return null;

  if (!analytics) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const {
    totalClasses,
    totalStudents,
    attendanceRate,
    gradeAverage,
    activeAssignments,
    classesSummary
  } = analytics;

  return (
    <div className="space-y-6">
      {/* Welcome section with i18n support (Fix T4) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-role-teacher rounded-2xl p-6 text-teacher-foreground"
      >
        <h1 className="text-2xl font-bold mb-2">
          {t('teacher.welcome', { name: teacher.name.split(' ')[0] })}
        </h1>
        <p className="opacity-90">
          {t('teacher.statsSubtitle', { classes: totalClasses, students: totalStudents })}
        </p>
      </motion.div>

      {/* Quick Stats with i18n support */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            icon: BookOpen, 
            label: t('teacher.myClasses'), 
            value: totalClasses,
            color: 'teacher',
            onClick: () => navigate('/teacher/classes')
          },
          { 
            icon: FileText, 
            label: t('teacher.activeHomework'), 
            value: activeAssignments,
            color: 'warning',
            onClick: () => navigate('/teacher/homework')
          },
          { 
            icon: ClipboardList, 
            label: t('teacher.classAttendanceRate'), 
            value: `${attendanceRate || 0}%`,
            color: 'info',
            onClick: () => navigate('/teacher/attendance')
          },
          { 
            icon: TrendingUp, 
            label: t('teacher.avgClassGrade'), 
            value: `${gradeAverage || 0}%`,
            color: 'parent',
            onClick: () => navigate('/teacher/grades')
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all border-2 border-transparent hover:border-teacher"
              onClick={stat.onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/80">
                    <stat.icon className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Classes & Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Classes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">{t('teacher.myClassesSummary')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/classes')}>
              {t('teacher.viewAll')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {classesSummary?.slice(0, 3).map((classItem: any, index: number) => {
              return (
                <motion.div
                  key={classItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-muted rounded-xl cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => navigate(`/teacher/classes/${classItem.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{classItem.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t('teacher.studentsCount', { count: classItem.studentCount })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{t('teacher.active')}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">{t('teacher.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="p-2 rounded-lg bg-muted">
                  <activity.icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">{t('teacher.upcomingEvents')}</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/events')}>
            {t('teacher.viewAll')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {events.slice(0, 3).map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-muted rounded-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-teacher rounded-lg">
                    <Calendar className="w-4 h-4 text-teacher-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
                <h4 className="font-medium text-foreground line-clamp-1">{event.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
