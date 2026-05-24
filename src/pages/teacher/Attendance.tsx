import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Check, X, Clock, Calendar as CalendarIcon, Save, Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import type { Teacher } from '@/types';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const teacher = user as Teacher;
  const { classes, students, attendance, markAttendanceBulk, isLoading } = useAppStore();
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  
  // Staging attendance changes locally { studentId: status }
  const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  const [initialState, setInitialState] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});

  const myClasses = classes.filter(
    (c) => c.teacherIds?.includes(teacher?.id) || c.teacherIds?.includes((teacher as any)?._id)
  );

  const classStudents = students.filter(s => s.classId === selectedClassId);

  const formattedDate = format(date, 'yyyy-MM-dd');

  // Load existing attendance into state
  useEffect(() => {
    if (selectedClassId && formattedDate) {
      const initial: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
      classStudents.forEach(student => {
        const existing = attendance.find(
          a => a.studentId === student.id && a.classId === selectedClassId && a.date === formattedDate
        );
        initial[student.id] = existing?.status || 'present';
      });
      setAttendanceState(initial);
      setInitialState(initial);
    } else {
      setAttendanceState({});
      setInitialState({});
    }
  }, [selectedClassId, formattedDate, attendance]);

  const hasChanges = Object.keys(attendanceState).some(studentId => attendanceState[studentId] !== initialState[studentId]) || Object.keys(initialState).some(studentId => attendanceState[studentId] !== initialState[studentId]);

  const getStatus = (studentId: string) => {
    return attendanceState[studentId] || 'present';
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !teacher || classStudents.length === 0) return;

    const records = classStudents.map(student => ({
      studentId: student.id,
      classId: selectedClassId,
      date: formattedDate,
      status: getStatus(student.id),
      markedBy: teacher.id
    }));

    try {
      await markAttendanceBulk(records as any);
      toast.success('Attendance submitted successfully');
    } catch (e) {
      toast.error('Failed to submit attendance');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">
            Mark daily attendance for your classes.
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={isLoading || !selectedClassId || !hasChanges}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Saving...' : 'Submit Attendance'}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Select 
          value={selectedClassId} 
          onValueChange={setSelectedClassId} 
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
             {myClasses.map(cls => (
              <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        {!selectedClassId ? (
          <div className="text-center p-12 border-2 border-dashed rounded-lg">
             <p className="text-muted-foreground">Select a class to take attendance.</p>
          </div>
        ) : classStudents.length === 0 ? (
           <div className="text-center p-12 border-2 border-dashed rounded-lg">
             <p className="text-muted-foreground">No students in this class.</p>
          </div>
        ) : (
          classStudents.map(student => {
            const status = getStatus(student.id);
            return (
              <Card key={student.id} className="transition-all hover:bg-accent/20">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="font-medium leading-none">{student.name}</p>
                      <p className="text-sm text-muted-foreground">{student.admissionNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={status === 'present' ? 'default' : 'outline'}
                      className={cn(status === 'present' && "bg-green-600 hover:bg-green-700")}
                      onClick={() => handleStatusChange(student.id, 'present')}
                    >
                      <Check className="mr-2 h-4 w-4" /> Present
                    </Button>
                    <Button 
                      size="sm" 
                      variant={status === 'late' ? 'default' : 'outline'}
                      className={cn(status === 'late' && "bg-yellow-600 hover:bg-yellow-700")}
                      onClick={() => handleStatusChange(student.id, 'late')}
                    >
                      <Clock className="mr-2 h-4 w-4" /> Late
                    </Button>
                    <Button 
                      size="sm" 
                      variant={status === 'absent' ? 'default' : 'outline'}
                      className={cn(status === 'absent' && "bg-red-600 hover:bg-red-700")}
                      onClick={() => handleStatusChange(student.id, 'absent')}
                    >
                      <X className="mr-2 h-4 w-4" /> Absent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  );
}
