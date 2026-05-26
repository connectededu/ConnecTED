import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Calendar, MapPin, Clock, Users, Check, X, Plus, MoreHorizontal, Edit, Trash2, Archive, RotateCcw, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(5, "Description is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(2, "Location is required"),
  targetAudience: z.enum(['all', 'parents', 'teachers', 'class']),
  image: z.string().optional(),
  targetClassIds: z.array(z.string()).optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

export default function EventsPage() {
  const { user } = useAuthStore();
  const { events, addEvent, updateEvent, deleteEvent, updateRSVP, isLoading } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [optimisticRSVPs, setOptimisticRSVPs] = useState<Record<string, 'attending' | 'not_attending'>>({});
  const [showArchived, setShowArchived] = useState(false);
  const { classes } = useAppStore();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      targetAudience: 'all',
      image: '',
      targetClassIds: [],
    },
  });

  const selectedAudience = form.watch('targetAudience');

  const handleRSVP = async (eventId: string, status: 'attending' | 'not_attending') => {
    if (!user) return;
    const prevStatus = optimisticRSVPs[eventId] || getRSVPStatus(events.find(e => (e.id === eventId || e._id === eventId)));
    
    // Optimistic update
    setOptimisticRSVPs(prev => ({ ...prev, [eventId]: status }));
    
    try {
      await updateRSVP(eventId, user.id, status);
      toast.success(status === 'attending' ? 'You\'re attending!' : 'RSVP updated');
    } catch (e) {
      // Rollback
      setOptimisticRSVPs(prev => {
        const next = { ...prev };
        if (prevStatus === undefined) {
          delete next[eventId];
        } else {
          next[eventId] = prevStatus;
        }
        return next;
      });
      toast.error('Failed to submit RSVP');
    }
  };

  const onSubmit = async (data: EventFormValues) => {
    try {
      const eventData = {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        targetAudience: data.targetAudience,
        image: data.image,
        createdBy: user?.id || 'admin-1',
        targetClassIds: data.targetAudience === 'class' ? data.targetClassIds : [],
        rsvps: editingEvent ? editingEvent.rsvps : [],
      };

      if (editingEvent) {
        await updateEvent(editingEvent.id || editingEvent._id, eventData);
        toast.success('Event updated successfully');
      } else {
        await addEvent(eventData);
        toast.success('Event created successfully');
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    form.reset({
      title: event.title,
      description: event.description,
      date: event.date ? event.date.split('T')[0] : '',
      time: event.time,
      location: event.location,
      targetAudience: event.targetAudience,
      image: event.image || '',
      targetClassIds: event.targetClassIds || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      toast.success('Event deleted successfully');
      setEventToDelete(null);
    } catch (e) {
      toast.error('Failed to delete event');
    }
  };

  const handleArchive = async (event: any) => {
    try {
      const id = event.id || event._id;
      const { eventsApi } = await import('@/services/api');
      if ((event as any).status === 'archived') {
        await eventsApi.restore(id);
        toast.success('Event restored');
      } else {
        await eventsApi.archive(id);
        toast.success('Event archived — hidden from users');
      }
      window.location.reload();
    } catch (e) {
      toast.error('Failed to update event status');
    }
  };

  const openCreateDialog = () => {
    setEditingEvent(null);
    form.reset({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      targetAudience: 'all',
      image: '',
      targetClassIds: [],
    });
    setIsDialogOpen(true);
  };

  const getRSVPStatus = (event: any) => {
    return event.rsvps?.find((r: any) => r.userId === user?.id)?.status;
  };

  const roleColor = user?.role === 'parent' ? 'parent' : user?.role === 'teacher' ? 'teacher' : 'admin';
  const isAdmin = user?.role === 'admin';

  const activeEvents = events.filter(e => (e as any).status !== 'archived');
  const archivedEvents = events.filter(e => (e as any).status === 'archived');
  const displayedEvents = showArchived ? archivedEvents : activeEvents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground">View and RSVP to upcoming school events</p>
        </motion.div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
              <Archive className="mr-2 h-4 w-4" />
              {showArchived ? 'View Active' : 'View Archived'}
            </Button>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update event details.' : 'Schedule a new event.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Event Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Event Location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All School</SelectItem>
                        <SelectItem value="parents">Parents Only</SelectItem>
                        <SelectItem value="teachers">Teachers Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedAudience === 'class' && (
                <FormField
                  control={form.control}
                  name="targetClassIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Class</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange([val])}
                        defaultValue={field.value?.[0]}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classes.map((c) => (
                            <SelectItem key={c.id || (c as any)._id} value={c.id || (c as any)._id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Event description..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Saving...' : 'Save Event'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {showArchived && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
          <Archive className="h-4 w-4" /> Showing archived events. These are hidden from all users.
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayedEvents.map((event, index) => {
          const optimisticStatus = optimisticRSVPs[event.id || event._id];
          const rsvpStatus = optimisticStatus !== undefined ? optimisticStatus : getRSVPStatus(event);

          const otherRsvps = event.rsvps?.filter((r: any) => r.userId !== user?.id && r.userId !== (user as any)?._id) || [];
          const otherAttendingCount = otherRsvps.filter((r: any) => r.status === 'attending').length;
          const attendingCount = otherAttendingCount + (rsvpStatus === 'attending' ? 1 : 0);

          const isPast = new Date(event.date) < new Date();

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`overflow-hidden hover:shadow-lg transition-all ${isPast ? 'opacity-60' : ''} group relative`}>
                {isAdmin && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(event)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchive(event)}>
                            {(event as any).status === 'archived'
                              ? <><RotateCcw className="mr-2 h-4 w-4" /> Restore</>
                              : <><Archive className="mr-2 h-4 w-4" /> Archive</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setEventToDelete(event.id || event._id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className={`w-full h-48 bg-${roleColor}/10 flex items-center justify-center`}>
                    <Calendar className={`w-16 h-16 text-${roleColor}`} />
                  </div>
                )}
                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{attendingCount} attending</span>
                    </div>
                  </div>

                  {!isPast && user?.role !== 'admin' && (
                    <div className="pt-2">
                      {!rsvpStatus ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRSVP(event.id || event._id, 'attending')}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Attending
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRSVP(event.id || event._id, 'not_attending')}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Not Attending
                          </Button>
                        </div>
                      ) : rsvpStatus === 'attending' ? (
                        <div className="flex items-center gap-1.5 text-green-600 font-medium text-sm bg-green-50/50 dark:bg-green-950/20 px-3 py-2 rounded-lg w-fit">
                          <Check className="w-4 h-4" />
                          You're attending!
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-sm bg-secondary/50 px-3 py-2 rounded-lg w-fit">
                          <X className="w-4 h-4" />
                          You marked as not attending
                        </div>
                      )}
                    </div>
                  )}

                  {isPast && (
                    <p className="text-sm text-muted-foreground italic">This event has passed</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {displayedEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground">No events found</p>
          <p className="text-muted-foreground">Check back later for upcoming events</p>
        </div>
      )}

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              record and notify users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => eventToDelete && handleDelete(eventToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
