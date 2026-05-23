import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, GraduationCap, BookOpen, UserCheck, Calendar, 
  TrendingUp, AlertCircle, Building, BarChart3, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { usersApi } from '@/services/api';
import type { Admin } from '@/types';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const admin = user as Admin;
  const { analytics, fetchAnalytics } = useAppStore();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Still fetch the pending approvals details list using query, but stats come from analytics
  const { data: pendingData } = useQuery({
    queryKey: ['admin-pending-users'],
    queryFn: () => usersApi.getAll({ isApproved: false }).then(r => r.data)
  });

  if (!admin) return null;

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-admin" />
      </div>
    );
  }

  const {
    totalStudents,
    totalParents,
    totalTeachers,
    totalClasses,
    pendingApprovals,
    attendanceRate,
    gradeAverage,
    recentActivity,
    studentGrowth,
    parentGrowth,
    teacherGrowth
  } = analytics;

  const pendingUsers: any[] = (pendingData as any)?.data || [];
  const pendingCount = pendingApprovals || pendingUsers.length;


  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-role-admin rounded-2xl p-6 text-admin-foreground"
      >
        <h1 className="text-2xl font-bold mb-2">
          Welcome, {admin.name}! 🏫
        </h1>
        <p className="opacity-90">
          School administration overview and management
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            icon: GraduationCap, 
            label: 'Total Students', 
            value: totalStudents,
            trend: studentGrowth || '+5%',
            color: 'admin'
          },
          { 
            icon: Users, 
            label: 'Parents', 
            value: totalParents,
            trend: parentGrowth || '+3%',
            color: 'parent'
          },
          { 
            icon: BookOpen, 
            label: 'Teachers', 
            value: totalTeachers,
            trend: teacherGrowth || '0%',
            color: 'teacher'
          },
          { 
            icon: UserCheck, 
            label: 'Pending Approvals', 
            value: pendingCount,
            urgent: pendingCount > 0,
            color: 'warning'
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${stat.urgent ? 'border-warning' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    {stat.trend && (
                      <p className="text-xs text-success flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3" />
                        {stat.trend} this month
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl bg-${stat.color}/10`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Pending Approvals & Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Pending Approvals
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingCount === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending approvals
              </p>
            ) : (
              <>
                {pendingUsers.map((u: any) => (
                  <div key={u._id} className="flex items-center gap-4 p-3 bg-muted rounded-xl">
                    <Avatar>
                      <AvatarImage src={u.profilePicture || u.avatar} />
                      <AvatarFallback className={`bg-${u.role}-light text-${u.role}-dark`}>
                        {u.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className={`badge-${u.role} capitalize`}>{u.role}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Quick Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Attendance Rate</span>
                <span className="text-sm font-medium text-foreground">{attendanceRate}%</span>
              </div>
              <Progress value={attendanceRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Average Grade</span>
                <span className="text-sm font-medium text-foreground">{gradeAverage}%</span>
              </div>
              <Progress value={gradeAverage} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-muted rounded-xl">
                <Building className="w-6 h-6 mx-auto text-admin mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalClasses}</p>
                <p className="text-xs text-muted-foreground">Classes</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-xl">
                <Calendar className="w-6 h-6 mx-auto text-admin mb-2" />
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-xs text-muted-foreground">Upcoming Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent System Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Recent System Activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/logs')}>
            View Audit Logs
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!recentActivity || recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            recentActivity.map((activity: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 text-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium capitalize">{activity.type}</p>
                  <p className="text-xs text-muted-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.time}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </div>

  );
}
