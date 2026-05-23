import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, MoreHorizontal, Search, Edit, Trash2, BookOpen, Layers, Loader2
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
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import { programsApi, subjectGroupsApi } from '@/services/api';
import { toast } from 'sonner';

// Program Schema
const programSchema = z.object({
  name: z.string().min(2, "Name is required"),
  subjects: z.array(z.string()).default([]),
});

type ProgramFormValues = z.infer<typeof programSchema>;

// Subject Group Schema
const subjectGroupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  subjects: z.array(z.string()).default([]),
});

type SubjectGroupFormValues = z.infer<typeof subjectGroupSchema>;

export default function ProgramsManagerPage() {
  const queryClient = useQueryClient();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'programs' | 'subject-groups'>('programs');

  // --- Programs State & Queries ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);

  const { data: programs = [], isLoading: isProgramsLoading } = useQuery({
    queryKey: ['admin-programs'],
    queryFn: () => programsApi.getAll().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => programsApi.create(data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs-subjects'] });
      toast.success('Program created successfully');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => toast.error('Failed to create program')
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => programsApi.update(data._id || data.id, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs-subjects'] });
      toast.success('Program updated successfully');
      setIsDialogOpen(false);
      setEditingProgram(null);
      form.reset();
    },
    onError: () => toast.error('Failed to update program')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programsApi.delete(id).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs-subjects'] });
      toast.success('Program deleted successfully');
      setProgramToDelete(null);
    },
    onError: () => toast.error('Failed to delete program')
  });

  const form = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      subjects: [],
    },
  });

  const filteredPrograms = Array.isArray(programs) ? programs.filter(prog => 
    prog.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const onSubmit = (data: ProgramFormValues) => {
    if (editingProgram) {
      updateMutation.mutate({ ...data, _id: editingProgram._id || editingProgram.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (prog: any) => {
    setEditingProgram(prog);
    form.reset({
      name: prog.name,
      subjects: prog.subjects || [],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProgram(null);
    form.reset({
      name: '',
      subjects: [],
    });
    setIsDialogOpen(true);
  };


  // --- Subject Groups State & Queries ---
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const { data: subjectGroups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ['admin-subject-groups'],
    queryFn: () => subjectGroupsApi.getAll().then(r => r.data.data),
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: any) => subjectGroupsApi.create(data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subject-groups'] });
      toast.success('Subject group created successfully');
      setIsGroupDialogOpen(false);
      groupForm.reset();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Failed to create subject group';
      toast.error(msg);
    }
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => subjectGroupsApi.update(id, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subject-groups'] });
      toast.success('Subject group updated successfully');
      setIsGroupDialogOpen(false);
      setEditingGroup(null);
      groupForm.reset();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || 'Failed to update subject group';
      toast.error(msg);
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => subjectGroupsApi.delete(id).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subject-groups'] });
      toast.success('Subject group deleted successfully');
      setGroupToDelete(null);
    },
    onError: () => toast.error('Failed to delete subject group')
  });

  const groupForm = useForm<SubjectGroupFormValues>({
    resolver: zodResolver(subjectGroupSchema),
    defaultValues: {
      name: '',
      subjects: [],
    },
  });

  const onGroupSubmit = (data: SubjectGroupFormValues) => {
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup._id || editingGroup.id, data });
    } else {
      createGroupMutation.mutate(data);
    }
  };

  const handleEditGroup = (group: any) => {
    setEditingGroup(group);
    groupForm.reset({
      name: group.name,
      subjects: group.subjects || [],
    });
    setIsGroupDialogOpen(true);
  };

  const openCreateGroupDialog = () => {
    setEditingGroup(null);
    groupForm.reset({
      name: '',
      subjects: [],
    });
    setIsGroupDialogOpen(true);
  };

  const filteredGroups = Array.isArray(subjectGroups) ? subjectGroups.filter(g => 
    g.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Programs & Subject Groups</h1>
          <p className="text-muted-foreground">
            Configure school offerings, subject groups, and core curricula.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-muted/60 p-1 rounded-lg">
          <TabsTrigger value="programs" className="rounded-md transition-all">Programs</TabsTrigger>
          <TabsTrigger value="subject-groups" className="rounded-md transition-all">Subject Groups</TabsTrigger>
        </TabsList>
        
        {/* --- PROGRAMS TAB CONTENT --- */}
        <TabsContent value="programs" className="space-y-6 mt-6 focus-visible:outline-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search programs..." 
                className="pl-8 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={openCreateDialog} className="shadow-md hover:shadow-lg transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isProgramsLoading && programs.length === 0 ? (
              <div className="col-span-full flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredPrograms.length === 0 ? (
              <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg bg-secondary/5 border-muted-foreground/20">
                <p className="text-muted-foreground">No programs found.</p>
              </div>
            ) : (
              filteredPrograms.map((prog: any) => (
                <Card key={prog._id || prog.id} className="group hover:shadow-md border-muted-foreground/10 hover:border-primary/20 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold tracking-tight">{prog.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 hover:bg-secondary/80">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(prog)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Program
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive cursor-pointer hover:bg-destructive/5" onClick={() => setProgramToDelete(prog._id || prog.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-4 space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subjects Offered:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {prog.subjects && prog.subjects.length > 0 ? (
                          prog.subjects.map((subj: string) => (
                            <span key={subj} className="px-2.5 py-0.5 bg-secondary/60 text-secondary-foreground rounded-full text-xs font-medium border border-secondary">
                              {subj}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No subjects defined</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-secondary/5 px-6 py-3 border-t border-muted-foreground/5 rounded-b-lg">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-primary/70" />
                      <span className="font-semibold text-foreground">{prog.subjects?.length || 0}</span> Subjects Offered
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* --- SUBJECT GROUPS TAB CONTENT --- */}
        <TabsContent value="subject-groups" className="space-y-6 mt-6 focus-visible:outline-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search subject groups..." 
                className="pl-8 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50"
                value={groupSearchTerm}
                onChange={(e) => setGroupSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={openCreateGroupDialog} className="shadow-md hover:shadow-lg transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" />
              Create Subject Group
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isGroupsLoading && subjectGroups.length === 0 ? (
              <div className="col-span-full flex justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg bg-secondary/5 border-muted-foreground/20">
                <p className="text-muted-foreground">No subject groups found.</p>
              </div>
            ) : (
              filteredGroups.map((group: any) => (
                <Card key={group._id || group.id} className="group hover:shadow-md border-muted-foreground/10 hover:border-primary/20 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-bold tracking-tight">{group.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 hover:bg-secondary/80">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditGroup(group)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Group
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive cursor-pointer hover:bg-destructive/5" onClick={() => setGroupToDelete(group._id || group.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-4 space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subjects Included:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.subjects && group.subjects.length > 0 ? (
                          group.subjects.map((subj: string) => (
                            <span key={subj} className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                              {subj}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No subjects defined</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-secondary/5 px-6 py-3 border-t border-muted-foreground/5 rounded-b-lg">
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-primary/70" />
                      <span className="font-semibold text-foreground">{group.subjects?.length || 0}</span> Subjects Grouped
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* --- PROGRAM CREATE/EDIT DIALOG --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">{editingProgram ? 'Edit Program' : 'Create Program'}</DialogTitle>
            <DialogDescription>
              {editingProgram ? 'Update the details for this program.' : 'Add a new program and define its subjects.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Program Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., High School Science Track" {...field} className="bg-background/50 border-muted-foreground/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => {
                  const [inputValue, setInputValue] = useState('');
                  
                  const handleAdd = (e: React.MouseEvent | React.KeyboardEvent) => {
                    e.preventDefault();
                    if (inputValue.trim() && !field.value.includes(inputValue.trim())) {
                      field.onChange([...field.value, inputValue.trim()]);
                      setInputValue('');
                    }
                  };
                  
                  const handleKeyDown = (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      handleAdd(e);
                    }
                  };

                  const handleRemove = (subject: string) => {
                    field.onChange(field.value.filter(s => s !== subject));
                  };

                  return (
                    <FormItem>
                      <FormLabel className="font-semibold">Subjects</FormLabel>
                      <div className="flex flex-col gap-3">
                        {/* Load from Group Dropdown */}
                        {subjectGroups.length > 0 && (
                          <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5">
                            <label className="text-xs text-primary font-semibold flex items-center gap-1">
                              <Layers className="h-3 w-3" /> Quick Load Subjects from Group
                            </label>
                            <Select 
                              onValueChange={(val) => {
                                const selectedGroup = subjectGroups.find((g: any) => (g._id || g.id) === val);
                                if (selectedGroup && selectedGroup.subjects) {
                                  const currentSubjects = field.value || [];
                                  const newSubjects = [...currentSubjects];
                                  selectedGroup.subjects.forEach((sub: string) => {
                                    if (!newSubjects.includes(sub)) {
                                      newSubjects.push(sub);
                                    }
                                  });
                                  field.onChange(newSubjects);
                                  toast.success(`Loaded subjects from "${selectedGroup.name}"`);
                                }
                              }}
                            >
                              <SelectTrigger className="w-full text-xs h-9 bg-background border-primary/30">
                                <SelectValue placeholder="Select a subject group to append..." />
                              </SelectTrigger>
                              <SelectContent>
                                {subjectGroups.map((g: any) => (
                                  <SelectItem key={g._id || g.id} value={g._id || g.id} className="cursor-pointer">
                                    {g.name} ({g.subjects?.length || 0} subjects)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input 
                            placeholder="Type subject and press Enter or Add..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-background/50 border-muted-foreground/20"
                          />
                          <Button type="button" onClick={handleAdd} variant="secondary" className="hover:bg-secondary/70">Add</Button>
                        </div>

                        {field.value.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1 max-h-[150px] overflow-y-auto p-2 bg-secondary/10 rounded-lg border border-muted-foreground/5">
                            {field.value.map(subj => (
                              <div key={subj} className="flex items-center gap-1 bg-background text-foreground px-2.5 py-1 rounded-full text-xs font-medium border border-muted-foreground/20 shadow-sm animate-in fade-in-50 zoom-in-95">
                                {subj}
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors" 
                                  onClick={() => handleRemove(subj)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormDescription className="text-xs text-muted-foreground">Define all the subjects offered under this program.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <DialogFooter className="pt-2 border-t border-muted-foreground/10">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full sm:w-auto shadow-sm">
                  {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Program'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* --- SUBJECT GROUP CREATE/EDIT DIALOG --- */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">{editingGroup ? 'Edit Subject Group' : 'Create Subject Group'}</DialogTitle>
            <DialogDescription>
              {editingGroup ? 'Update the details for this subject group.' : 'Add a new subject group and define its subjects.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...groupForm}>
            <form onSubmit={groupForm.handleSubmit(onGroupSubmit)} className="space-y-5">
              <FormField
                control={groupForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Group Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., JHS Core Subjects" {...field} className="bg-background/50 border-muted-foreground/20" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={groupForm.control}
                name="subjects"
                render={({ field }) => {
                  const [inputValue, setInputValue] = useState('');
                  
                  const handleAdd = (e: React.MouseEvent | React.KeyboardEvent) => {
                    e.preventDefault();
                    if (inputValue.trim() && !field.value.includes(inputValue.trim())) {
                      field.onChange([...field.value, inputValue.trim()]);
                      setInputValue('');
                    }
                  };
                  
                  const handleKeyDown = (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      handleAdd(e);
                    }
                  };

                  const handleRemove = (subject: string) => {
                    field.onChange(field.value.filter(s => s !== subject));
                  };

                  return (
                    <FormItem>
                      <FormLabel className="font-semibold">Subjects</FormLabel>
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Type subject and press Enter or Add..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-background/50 border-muted-foreground/20"
                          />
                          <Button type="button" onClick={handleAdd} variant="secondary" className="hover:bg-secondary/70">Add</Button>
                        </div>

                        {field.value.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1 max-h-[150px] overflow-y-auto p-2 bg-secondary/10 rounded-lg border border-muted-foreground/5">
                            {field.value.map(subj => (
                              <div key={subj} className="flex items-center gap-1 bg-background text-foreground px-2.5 py-1 rounded-full text-xs font-medium border border-muted-foreground/20 shadow-sm animate-in fade-in-50 zoom-in-95">
                                {subj}
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-full transition-colors" 
                                  onClick={() => handleRemove(subj)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormDescription className="text-xs text-muted-foreground">Define the subjects that belong to this group.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <DialogFooter className="pt-2 border-t border-muted-foreground/10">
                <Button type="submit" disabled={createGroupMutation.isPending || updateGroupMutation.isPending} className="w-full sm:w-auto shadow-sm">
                  {(createGroupMutation.isPending || updateGroupMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {createGroupMutation.isPending || updateGroupMutation.isPending ? 'Saving...' : 'Save Subject Group'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* --- PROGRAM DELETE ALERT --- */}
      <AlertDialog open={!!programToDelete} onOpenChange={(open) => !open && setProgramToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the program. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => programToDelete && deleteMutation.mutate(programToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Program'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- SUBJECT GROUP DELETE ALERT --- */}
      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subject group. Existing programs will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => groupToDelete && deleteGroupMutation.mutate(groupToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {deleteGroupMutation.isPending ? 'Deleting...' : 'Delete Group'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
