import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import type { Parent } from '@/types';

export default function MyChildrenPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const parent = user as Parent;
  const { students, attendance, grades, analytics, fetchAnalytics, isLoading } = useAppStore();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const myChildren = students.filter(
    (s) => s.parentIds?.includes(parent?.id) || s.parentIds?.includes((parent as any)?._id)
  );

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-2 bg-muted" />
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
        <p className="text-muted-foreground">
          View updates and academic progress for your children.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {myChildren.map((child) => {
          const childAnalytic = analytics?.children?.find(
            (c: any) => c.id === child.id || c._id === child.id
          );

          const studentAttendance = attendance.filter((a) => a.studentId === child.id);
          const studentGrades = grades.filter((g) => g.studentId === child.id);

          const totalAttendance = studentAttendance.length;
          const presentCount = studentAttendance.filter((a) => a.status === 'present').length;

          // Fix M1: use null instead of hardcoded fallback when no real data exists
          const attendanceRate: number | null = childAnalytic?.attendanceRate
            ?? (totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null);

          const avgGrade: number | null = childAnalytic?.gradeAverage
            ?? (studentGrades.length > 0
                ? Math.round(
                    studentGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) /
                    studentGrades.length
                  )
                : null);

          return (
            <Card key={child.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className="h-2 bg-primary/20" />
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                  <AvatarImage src={child.avatar} />
                  <AvatarFallback className="text-lg">{child.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle>{child.name}</CardTitle>
                  <CardDescription>Admission: {child.admissionNumber}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col items-center p-2 bg-secondary/20 rounded-lg">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Attendance</span>
                    {/* Fix M1: show '—' when no data, no fake numbers */}
                    <span className="font-bold text-lg text-primary">
                      {attendanceRate !== null ? `${attendanceRate}%` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-secondary/20 rounded-lg">
                    <span className="text-xs text-muted-foreground uppercase font-bold">Avg Grade</span>
                    <span className="font-bold text-lg text-primary">
                      {avgGrade !== null ? `${avgGrade}%` : '—'}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/parent/children/${child.id}`)}
                >
                  View Full Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}

        {myChildren.length === 0 && (
          <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg bg-secondary/10">
            <p className="text-muted-foreground">No children linked to your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
