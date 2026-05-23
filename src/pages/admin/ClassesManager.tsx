import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, MoreHorizontal, Search, Edit, Trash2, Users, BookOpen, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/stores/appStore';
import { usersApi, classesApi } from '@/services/api';
import { toast } from 'sonner';

const classSchema = z.object({
  name: z.string().min(2, "Name is required"),
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  teacherIds: z.array(z.string()).default([]),
});

type ClassFormValues = z.infer<typeof classSchema>;

export default function ClassesManagerPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  const { data: classes = [], isLoading: isClassesLoading } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: () => classesApi.getAll().then(r => r.data),
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => usersApi.getAll({ role: 'teacher', limit: 1000 }).then(r => r.data.data || r.data.users || r.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => classesApi.create(data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      toast.success('Class created successfully');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create class')
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => classesApi.update(data.id, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      toast.success('Class updated successfully');
      setIsDialogOpen(false);
      setEditingClass(null);
      form.reset();
    },
    onError: () => toast.error('Failed to update class')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => classesApi.delete(id).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] });
      toast.success('Class deleted successfully');
      setClassToDelete(null);
    },
    onError: () => toast.error('Failed to delete class')
  });

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      grade: '',
      section: '',
      teacherIds: [],
    },
  });

  const getTeacherName = (ids: string[]) => {
    if (!ids || ids.length === 0) return 'Unassigned';
    const assignedTeachers = Array.isArray(teachers) 
      ? teachers.filter((t: any) => ids.includes(t.id) || ids.includes(t._id))
      : [];
    if (assignedTeachers.length === 0) return 'Unassigned';
    if (assignedTeachers.length === 1) return assignedTeachers[0].name;
    return `${assignedTeachers[0].name} +${assignedTeachers.length - 1}`;
  };

  const filteredClasses = Array.isArray(classes) ? classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const onSubmit = (data: ClassFormValues) => {
    const classData = {
      name: data.name,
      grade: Number(data.grade),
      section: data.section,
      teacherIds: data.teacherIds || [],
      subjects: ['Math', 'Science', 'English'],
    };

    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id || editingClass._id, ...classData });
    } else {
      createMutation.mutate(classData);
    }
  };

  const handleEdit = (cls: any) => {
    setEditingClass(cls);
    form.reset({
      name: cls.name,
      grade: String(cls.grade),
      section: cls.section,
      teacherIds: cls.teacherIds || [],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingClass(null);
    form.reset({
      name: '',
      grade: '',
      section: '',
      teacherIds: [],
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
          <p className="text-muted-foreground">
            Create classes, assign teachers, and manage enrollments.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Class
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Class' : 'Create Class'}</DialogTitle>
            <DialogDescription>
              {editingClass ? 'Update class details.' : 'Add a new class to the schedule.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Grade 5 Blue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade</FormLabel>
                      <FormControl>
                        <Input placeholder="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Input placeholder="Blue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="teacherIds"
                render={() => (
                  <FormItem>
                    <div className="mb-2 mt-4">
                      <FormLabel>Assign Teachers</FormLabel>
                      <FormDescription>Select the teachers for this class.</FormDescription>
                    </div>
                    <ScrollArea className="h-48 border rounded-md p-4">
                      {teachers.map((t: any) => (
                        <FormField
                          key={t.id || t._id}
                          control={form.control}
                          name="teacherIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={t.id || t._id}
                                className="flex flex-row items-start space-x-3 space-y-0 py-2"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(t.id || t._id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), t.id || t._id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== (t.id || t._id)
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {t.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Class'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search classes..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isClassesLoading && classes.length === 0 ? (
          <div className="col-span-full flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No classes found.</p>
          </div>
        ) : (
          filteredClasses.map((cls: any) => (
            <Card key={cls.id || cls._id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{cls.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(cls)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit Class
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => setClassToDelete(cls.id || cls._id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  {cls.section} • Grade {cls.grade}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{cls.studentIds?.length || 0} Students</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarFallback className="text-[10px]">T</AvatarFallback>
                    </Avatar>
                    <span>{getTeacherName(cls.teacherIds)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-secondary/10 px-6 py-3">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-3 w-3" />
                  {cls.subjects?.length || 0} Subjects
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the class
              record and unassign any students or teachers associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => classToDelete && deleteMutation.mutate(classToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
