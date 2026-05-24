import { useState, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import { Save, Loader2, MessageSquare } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import type { Teacher } from '@/types';

export default function GradesPage() {
  const { user } = useAuthStore();
  const teacher = user as Teacher; 
  const { classes, students, grades, addGrade, isLoading } = useAppStore();
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('Term 1');
  const [editedGrades, setEditedGrades] = useState<Record<string, number>>({});
  const [gradeComments, setGradeComments] = useState<Record<string, string>>({});
  const [initialGrades, setInitialGrades] = useState<Record<string, number>>({});
  const [initialComments, setInitialComments] = useState<Record<string, string>>({});

  const myClasses = classes.filter(
    (c) => c.teacherIds?.includes(teacher?.id) || c.teacherIds?.includes((teacher as any)?._id)
  );

  const classStudents = students.filter(s => s.classId === selectedClassId);

  // Initialize editedGrades with values from the Redux store when selection changes
  useEffect(() => {
    if (selectedClassId && selectedSubject && selectedTerm) {
      const initial: Record<string, number> = {};
      const initialComms: Record<string, string> = {};
      classStudents.forEach(student => {
        const existingGrade = grades.find(
          g => g.studentId === student.id && 
               g.classId === selectedClassId && 
               g.subject === selectedSubject && 
               g.term === selectedTerm
        );
        if (existingGrade) {
          initial[student.id] = existingGrade.score;
          if (existingGrade.comments) {
            initialComms[student.id] = existingGrade.comments;
          }
        }
      });
      setInitialGrades(initial);
      setEditedGrades(initial);
      setInitialComments(initialComms);
      setGradeComments(initialComms);
    } else {
      setInitialGrades({});
      setEditedGrades({});
      setInitialComments({});
      setGradeComments({});
    }
  }, [selectedClassId, selectedSubject, selectedTerm, grades]);

  const hasChanges = Object.keys(editedGrades).some(studentId => editedGrades[studentId] !== initialGrades[studentId]) || 
                     Object.keys(gradeComments).some(studentId => gradeComments[studentId] !== initialComments[studentId]) ||
                     Object.keys(initialGrades).some(studentId => editedGrades[studentId] !== initialGrades[studentId]);

  const handleSaveAll = async () => {
    if (!teacher || !selectedClassId || !selectedSubject) return;
    
    try {
      const promises = Object.entries(editedGrades).map(([studentId, score]) => {
        return addGrade({
          studentId,
          classId: selectedClassId,
          subject: selectedSubject,
          term: selectedTerm,
          score,
          maxScore: 100,
          teacherId: teacher.id,
          comments: gradeComments[studentId] || '',
        });
      });

      await Promise.all(promises);
      toast.success('All grades saved successfully');
    } catch (e) {
      toast.error('Failed to save grades');
    }
  };

  const currentClass = myClasses.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
          <p className="text-muted-foreground">
            Manage and publish student grades.
          </p>
        </div>
        <Button onClick={handleSaveAll} disabled={isLoading || !hasChanges}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select 
          value={selectedClassId} 
          onValueChange={(val) => {
            setSelectedClassId(val); 
            setSelectedSubject(''); // reset subject
          }}
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

        <Select 
          value={selectedSubject} 
          onValueChange={setSelectedSubject}
          disabled={!selectedClassId}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Subject" />
          </SelectTrigger>
          <SelectContent>
            {(() => {
              const classSubjects = currentClass?.subjects || [];
              const teacherSubjects = (teacher as any)?.teacherData?.subjects || (teacher as any)?.subjects || [];
              const subjectsToShow = teacherSubjects.length > 0 ? teacherSubjects : classSubjects;
              return subjectsToShow.map((sub: string) => (
                <SelectItem key={sub} value={sub}>{sub}</SelectItem>
              ));
            })()}
          </SelectContent>
        </Select>

        <Select value={selectedTerm} onValueChange={setSelectedTerm}>
          <SelectTrigger className="w-[150px]">
             <SelectValue placeholder="Select Term" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Term 1">Term 1</SelectItem>
            <SelectItem value="Term 2">Term 2</SelectItem>
            <SelectItem value="Term 3">Term 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Score / 100</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!selectedClassId || !selectedSubject) ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Please select a class and subject to view grades.
                </TableCell>
              </TableRow>
            ) : classStudents.length === 0 ? (
               <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No students in this class.
                </TableCell>
              </TableRow>
            ) : (
              classStudents.map(student => {
                const val = editedGrades[student.id];
                
                // Simple grade calculation
                const getGradeLetter = (score: number) => {
                  if (score >= 90) return 'A';
                  if (score >= 80) return 'B';
                  if (score >= 70) return 'C';
                  if (score >= 60) return 'D';
                  return 'F';
                };

                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.admissionNumber}</TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100"
                        className="w-20" 
                        value={val !== undefined ? val : ''}
                        placeholder="-"
                        onChange={(e) => {
                          const num = parseInt(e.target.value);
                          if (!isNaN(num) && num >= 0 && num <= 100) {
                            setEditedGrades(prev => ({ ...prev, [student.id]: num }));
                          } else if (e.target.value === '') {
                            setEditedGrades(prev => {
                              const next = { ...prev };
                              delete next[student.id];
                              return next;
                            });
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {val !== undefined && (
                        <Badge variant={val >= 60 ? 'outline' : 'destructive'}>
                          {getGradeLetter(val)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className={gradeComments[student.id] ? "text-primary" : "text-muted-foreground"}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {gradeComments[student.id] ? "Edit Comment" : "Add Comment"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">Feedback</h4>
                              <p className="text-sm text-muted-foreground">
                                Add comments for {student.name}'s grade.
                              </p>
                            </div>
                            <Textarea
                              value={gradeComments[student.id] || ''}
                              onChange={(e) => setGradeComments(prev => ({ ...prev, [student.id]: e.target.value }))}
                              placeholder="Great improvement this term..."
                              className="min-h-[100px]"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
