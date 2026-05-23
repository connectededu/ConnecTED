import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, MessageSquare, BarChart3, Calendar, Megaphone, Check, UserCheck, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const notificationIcons: Record<string, React.ElementType> = {
  message: MessageSquare,
  grade: BarChart3,
  absent: UserCheck,
  announcement: Megaphone,
  event: Calendar,
  homework: BookOpen,
  approval: UserCheck
};

export default function NotificationPanel({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();

  if (!user) return null;

  const userNotifications = notifications.filter(n => n.userId === user.id);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead(user.id);
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markNotificationRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <h2 className="font-semibold text-lg">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                    <Check className="w-4 h-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Notifications list */}
            <ScrollArea className="h-[calc(100vh-80px)]">
              <div className="p-4 space-y-2">
                {userNotifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  userNotifications.map((notification, index) => {
                    const Icon = notificationIcons[notification.type] || Bell;
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 rounded-xl cursor-pointer transition-all ${
                          notification.isRead
                            ? 'bg-muted/50'
                            : 'bg-card border border-border shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.isRead ? 'bg-muted' : 'bg-primary/10'
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              notification.isRead ? 'text-muted-foreground' : 'text-primary'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${
                              notification.isRead ? 'text-muted-foreground' : 'font-medium text-foreground'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
