import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, GraduationCap, ArrowLeft, MoreHorizontal, Mail 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/stores/appStore';

export default function ClassDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { classes, students, attendance, grades, isLoading } = useAppStore();

  const classData = classes.find((c) => c.id === id || (c as any)._id === id);
  const classStudents = students.filter((s) => s.classId === id || s.classId === (classData as any)?._id);

  const classAttendance = attendance.filter(a => classStudents.some(s => s.id === a.studentId || (s as any)._id === a.studentId));
  const totalAttendanceRecords = classAttendance.length;
  const presentRecords = classAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendancePercentage = totalAttendanceRecords > 0 
    ? Math.round((presentRecords / totalAttendanceRecords) * 100) 
    : 0;

  const classGrades = grades.filter(g => classStudents.some(s => s.id === g.studentId || (s as any)._id === g.studentId));
  const totalScore = classGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0);
  const averageScore = classGrades.length > 0 ? totalScore / classGrades.length : 0;
  
  const getLetterGrade = (score: number) => {
    if (classGrades.length === 0) return 'N/A';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };
  const letterGrade = getLetterGrade(averageScore);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/teacher/classes')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classes
        </Button>
        <p>Class not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/classes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{classData.name}</h1>
          <p className="text-muted-foreground">
            Grade {classData.grade} • {classData.section}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => navigate('/teacher/updates')}>
            Post Update
          </Button>
          <Button variant="outline" onClick={() => navigate('/teacher/attendance')}>
            Take Attendance
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classStudents.length}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendanceRecords > 0 ? `${attendancePercentage}%` : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Term average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Average</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{letterGrade}</div>
            <p className="text-xs text-muted-foreground">Performance average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classStudents.map((student) => (
              <div 
                key={student.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium leading-none">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigate(`/teacher/grades?student=${student.id}`)}>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      View Grades
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/teacher/attendance`)}>
                      <Calendar className="mr-2 h-4 w-4" />
                      View Attendance
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(`/teacher/messages`)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Parent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
