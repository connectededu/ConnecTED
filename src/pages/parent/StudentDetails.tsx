import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  ArrowLeft, GraduationCap, Calendar, BookOpen, Clock, MessageSquare
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { useQuery } from '@tanstack/react-query';
import { usersApi, messagesApi } from '@/services/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    students, 
    grades, 
    attendance, 
    classes, 
    homework, 
    isLoading,
    fetchStudents,
    fetchGrades,
    fetchAttendance,
    fetchHomework
  } = useAppStore();

  const student = students.find((s) => s.id === id || (s as any)._id === id);

  // Fix S3: Query class teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['student-details-teachers', student?.classId],
    queryFn: () => usersApi.getAll({ role: 'teacher', limit: 100 }).then(r => r.data.data || r.data.users || r.data || []),
    enabled: user?.role === 'parent' && !!student?.classId,
  });

  useEffect(() => {
    fetchStudents();
    if (id) {
      fetchGrades({ studentId: id });
      fetchAttendance({ studentId: id });
    }
  }, [id]);

  useEffect(() => {
    if (student?.classId) {
      fetchHomework({ classId: student.classId });
    }
  }, [student?.classId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p>Student not found</p>
      </div>
    );
  }

  const studentGrades = grades.filter((g) => g.studentId === student.id);
  const studentAttendance = attendance.filter((a) => a.studentId === student.id);
  const classData = classes.find((c) => c.id === student.classId || (c as any)._id === student.classId);
  const studentHomework = homework.filter((h) => h.classId === student.classId);

  // Calculate attendance rate
  const totalAttendance = studentAttendance.length;
  const presentCount = studentAttendance.filter(a => a.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : null;

  const classTeacher = (teachers as any[]).find((t: any) => 
    classData?.teacherIds?.includes(t.id) || 
    classData?.teacherIds?.includes(t._id) || 
    classData?.teacherIds?.includes(t.uid)
  );

  const handleMessageTeacher = async () => {
    if (!classTeacher) return;
    try {
      const res = await messagesApi.getOrCreateThread(classTeacher.id || classTeacher._id, student.id);
      navigate('/parent/messages', { state: { selectedThreadId: res.data.id || res.data._id } });
      toast.success('Opening conversation...');
    } catch {
      toast.error('Failed to start conversation with teacher');
    }
  };

  const handleBack = () => {
    if (user?.role === 'admin') {
      navigate('/admin/students');
    } else {
      navigate('/parent/children');
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={handleBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to {user?.role === 'admin' ? 'Students' : 'Dashboard'}
      </Button>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start bg-card p-6 rounded-lg border shadow-sm">
        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
          <AvatarImage src={student.avatar} />
          <AvatarFallback className="text-2xl">{student.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left space-y-2 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
             <div className="flex items-center gap-1">
               <span className="font-semibold text-foreground">Admission:</span> {student.admissionNumber}
             </div>
             <div className="flex items-center gap-1">
               <span className="font-semibold text-foreground">Class:</span> {classData?.name || 'N/A'}
             </div>
             <div className="flex items-center gap-1">
               <span className="font-semibold text-foreground">DOB:</span> {student.dateOfBirth ? format(new Date(student.dateOfBirth), 'MMM d, yyyy') : 'N/A'}
             </div>
          </div>
        </div>
        {/* Fix S3: Message Teacher button */}
        {user?.role === 'parent' && classTeacher && (
          <div className="flex items-center justify-center md:self-center">
            <Button onClick={handleMessageTeacher} className="gap-2 bg-parent hover:bg-parent/90 text-parent-foreground shadow-sm">
              <MessageSquare className="h-4 w-4" /> Message Teacher ({classTeacher.name})
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceRate !== null ? `${Math.round(attendanceRate)}%` : '—'}</div>
                {attendanceRate !== null && <Progress value={attendanceRate} className="mt-2" />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentHomework.length}</div>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Grade</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {studentGrades.length > 0 ? `${studentGrades[studentGrades.length - 1].score}%` : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {studentGrades.length > 0 ? studentGrades[studentGrades.length - 1].subject : ''}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>Grades and assessments.</CardDescription>
            </CardHeader>
            <CardContent>
              {studentGrades.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">No grades recorded yet.</div>
              ) : (
                <div className="space-y-4">
                  {studentGrades.map(grade => (
                    <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{grade.subject}</p>
                        <p className="text-sm text-muted-foreground">{grade.term}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={grade.score >= 60 ? "outline" : "destructive"}>
                          {grade.score >= 90 ? 'A' : grade.score >= 80 ? 'B' : grade.score >= 70 ? 'C' : grade.score >= 60 ? 'D' : 'F'}
                        </Badge>
                        <span className="font-bold text-lg w-12 text-right">{grade.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
               {studentAttendance.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">No attendance records found.</div>
              ) : (
                <div className="space-y-2">
                  {studentAttendance.slice().reverse().map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(record.date), 'PPP')}</span>
                      </div>
                      <Badge variant={
                          record.status === 'present' ? 'default' : 
                          record.status === 'late' ? 'secondary' : 'destructive'
                        }
                        className={record.status === 'present' ? 'bg-green-600' : ''}
                      >
                        {record.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homework Tab */}
        <TabsContent value="homework">
          <Card>
            <CardHeader>
              <CardTitle>Homework & Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {studentHomework.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">No pending homework.</div>
              ) : (
                <div className="grid gap-4">
                  {studentHomework.map(hw => (
                    <div key={hw.id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-lg gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{hw.subject}</Badge>
                          <h4 className="font-semibold">{hw.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{hw.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                        <Clock className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-red-500">
                          Due: {format(new Date(hw.dueDate), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
