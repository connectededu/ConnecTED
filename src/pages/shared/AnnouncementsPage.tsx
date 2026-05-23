import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Megaphone, Calendar, Paperclip, Plus, MoreHorizontal, Edit, Trash2, Archive, RotateCcw, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const announcementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  targetAudience: z.enum(['all', 'parents', 'teachers', 'class']),
  image: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, isLoading } = useAppStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      targetAudience: 'all',
      image: '',
    },
  });

  const onSubmit = async (data: AnnouncementFormValues) => {
    try {
      const announcementData = {
        title: data.title,
        content: data.content,
        targetAudience: data.targetAudience,
        image: data.image,
        authorId: user?.id || (user as any)?._id,
        authorRole: user?.role,
        attachments: editingAnnouncement ? editingAnnouncement.attachments : [],
      };

      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id || editingAnnouncement._id, announcementData);
        toast.success('Announcement updated successfully');
      } else {
        await addAnnouncement(announcementData);
        toast.success('Announcement published successfully');
      }
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      toast.error('Failed to publish announcement');
    }
  };

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    form.reset({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      image: announcement.image || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      toast.success('Announcement deleted successfully');
      setAnnouncementToDelete(null);
    } catch (e) {
      toast.error('Failed to delete announcement');
    }
  };

  const handleArchive = async (announcement: any) => {
    try {
      const id = announcement.id || announcement._id;
      const { announcementsApi } = await import('@/services/api');
      if (announcement.status === 'archived') {
        await announcementsApi.restore(id);
        toast.success('Announcement restored');
      } else {
        await announcementsApi.archive(id);
        toast.success('Announcement archived — hidden from users');
      }
      // Refresh from store
      await addAnnouncement; // re-fetch handled by socket or manual refresh
      window.location.reload();
    } catch (e) {
      toast.error('Failed to update announcement status');
    }
  };

  const openCreateDialog = () => {
    setEditingAnnouncement(null);
    form.reset({
      title: '',
      content: '',
      targetAudience: 'all',
      image: '',
    });
    setIsDialogOpen(true);
  };

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const canManage = isAdmin || isTeacher;

  // Split by status
  const activeAnnouncements = announcements.filter(a => (a as any).status !== 'archived');
  const archivedAnnouncements = announcements.filter(a => (a as any).status === 'archived');
  const displayedAnnouncements = showArchived ? archivedAnnouncements : activeAnnouncements;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground">Stay updated with the latest school news</p>
        </motion.div>
        
        {canManage && (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
                <Archive className="mr-2 h-4 w-4" />
                {showArchived ? 'View Active' : 'View Archived'}
              </Button>
            )}
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Announcement
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? 'Update existing announcement.' : 'Publish a new announcement to the school.'}
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
                      <Input placeholder="Announcement Title" {...field} />
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
                        <SelectItem value="class">Specific Classes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your announcement here..." 
                        className="min-h-[150px]"
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
                  {isLoading ? 'Publishing...' : 'Publish Announcement'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {showArchived && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
            <Archive className="h-4 w-4" /> Showing archived announcements. These are hidden from all users.
          </div>
        )}
        {displayedAnnouncements.map((announcement, index) => {
          const authorBadge = announcement.authorRole === 'teacher' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700';

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all group relative">
                {isAdmin && (
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(announcement)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(announcement)}>
                          {(announcement as any).status === 'archived'
                            ? <><RotateCcw className="mr-2 h-4 w-4" /> Restore</>
                            : <><Archive className="mr-2 h-4 w-4" /> Archive</>
                          }
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setAnnouncementToDelete(announcement.id || announcement._id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className={authorBadge}>
                        {announcement.authorRole?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-foreground">
                          {announcement.title}
                        </h3>
                        {announcement.targetAudience === 'class' && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            Class Specific
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>Staff Member</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${authorBadge}`}>
                          {announcement.authorRole}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(announcement.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {announcement.image && (
                    <img
                      src={announcement.image}
                      alt={announcement.title}
                      className="w-full h-48 object-cover rounded-xl mt-4"
                    />
                  )}

                  <p className="mt-4 text-foreground leading-relaxed whitespace-pre-wrap">
                    {announcement.content}
                  </p>

                  {announcement.attachments?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {announcement.attachments.map((attachment: any) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                        >
                          <Paperclip className="w-4 h-4" />
                          {attachment.name}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {displayedAnnouncements.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground">No announcements</p>
          <p className="text-muted-foreground">Check back later for updates</p>
        </div>
      )}

      <AlertDialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the announcement
              and notify subscribed users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => announcementToDelete && handleDelete(announcementToDelete)}
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
