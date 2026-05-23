import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { 
  Plus, Calendar as CalendarIcon, Upload, Trash2, Edit, Loader2 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import type { Teacher } from '@/types';

const homeworkSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  classId: z.string().min(1, "Please select a class"),
  subject: z.string().min(1, "Subject is required"),
  dueDate: z.date({ required_error: "Due date is required" }),
});

type HomeworkFormValues = z.infer<typeof homeworkSchema>;

export default function HomeworkPage() {
  const { user } = useAuthStore();
  const teacher = user as Teacher;
  const { classes, homework, addHomework, isLoading } = useAppStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const form = useForm<HomeworkFormValues>({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const myClasses = classes.filter(
    (c) => c.teacherIds?.includes(teacher?.id) || c.teacherIds?.includes((teacher as any)?._id)
  );

  const homeworkList = homework.filter(
    (h) => h.classId === selectedClassId
  );

  const onSubmit = async (data: HomeworkFormValues) => {
    if (!teacher) return;
    
    try {
      await addHomework({
        teacherId: teacher.id,
        classId: data.classId,
        title: data.title,
        description: data.description,
        subject: data.subject,
        dueDate: data.dueDate.toISOString().split('T')[0],
        attachments: [],
      });
      toast.success('Homework assigned successfully');
      form.reset();
      setIsCreateOpen(false);
    } catch (e) {
      toast.error('Failed to assign homework');
    }
  };

  const currentClass = myClasses.find(c => c.id === form.watch('classId'));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Homework</h1>
          <p className="text-muted-foreground">
            Assign and manage homework for your classes.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create Homework Assignment</DialogTitle>
              <DialogDescription>
                Assign work to your students. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="classId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {myClasses.map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!form.watch('classId')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Assignment title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detailed instructions..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-2 text-sm text-muted-foreground border-2 border-dashed rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>Upload materials (simulated)</span>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Assigning...' : 'Assign Homework'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="w-[200px]">
        <Select 
          value={selectedClassId} 
          onValueChange={setSelectedClassId} 
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by Class" />
          </SelectTrigger>
          <SelectContent>
            {myClasses.map(cls => (
              <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {!selectedClassId ? (
          <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg">
             <p className="text-muted-foreground">Select a class to view assignments.</p>
          </div>
        ) : homeworkList.length === 0 ? (
          <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg bg-secondary/10">
            <p className="text-muted-foreground">No active assignments for this class.</p>
          </div>
        ) : (
          homeworkList.map((hw) => (
            <Card key={hw.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{hw.title}</CardTitle>
                  <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                    {hw.subject}
                  </span>
                </div>
                <CardDescription className="line-clamp-2">
                  {hw.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-2 text-sm text-red-500 font-medium">
                  <CalendarIcon className="h-4 w-4" />
                  Due: {format(new Date(hw.dueDate), 'MMM d, yyyy')}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
