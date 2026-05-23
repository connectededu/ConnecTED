import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Shield,
  UserCheck,
  Settings,
  Trash2,
  PlusCircle,
  Edit,
  LogIn,
  LogOut,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { auditApi } from '@/services/api';
import { motion } from 'framer-motion';

// ─── Human-readable action maps ───────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  CREATE_USER: 'Created a user account',
  UPDATE_USER: 'Updated user details',
  DELETE_USER: 'Deleted a user account',
  APPROVE_USER: 'Approved user account',
  REJECT_USER: 'Rejected user account',
  CREATE_STUDENT: 'Enrolled a new student',
  UPDATE_STUDENT: 'Updated student profile',
  DELETE_STUDENT: 'Removed a student',
  CREATE_CLASS: 'Created a class',
  UPDATE_CLASS: 'Updated class details',
  DELETE_CLASS: 'Deleted a class',
  CREATE_ANNOUNCEMENT: 'Published an announcement',
  UPDATE_ANNOUNCEMENT: 'Edited an announcement',
  DELETE_ANNOUNCEMENT: 'Deleted an announcement',
  ARCHIVE_ANNOUNCEMENT: 'Archived an announcement',
  CREATE_EVENT: 'Scheduled an event',
  UPDATE_EVENT: 'Updated an event',
  DELETE_EVENT: 'Deleted an event',
  ARCHIVE_EVENT: 'Archived an event',
  CREATE_GRADE: 'Recorded grades',
  UPDATE_GRADE: 'Updated grades',
  MARK_ATTENDANCE: 'Marked attendance',
  LOGIN: 'Signed in',
  LOGOUT: 'Signed out',
  SETTINGS_UPDATE: 'Updated system settings',
};

const TARGET_LABELS: Record<string, string> = {
  user: 'User',
  student: 'Student',
  class: 'Class',
  announcement: 'Announcement',
  event: 'Event',
  grade: 'Grade',
  attendance: 'Attendance',
  settings: 'System',
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  CREATE_USER: PlusCircle,
  UPDATE_USER: Edit,
  DELETE_USER: Trash2,
  APPROVE_USER: UserCheck,
  REJECT_USER: UserCheck,
  CREATE_STUDENT: PlusCircle,
  UPDATE_STUDENT: Edit,
  DELETE_STUDENT: Trash2,
  CREATE_CLASS: PlusCircle,
  UPDATE_CLASS: Edit,
  DELETE_CLASS: Trash2,
  CREATE_ANNOUNCEMENT: PlusCircle,
  UPDATE_ANNOUNCEMENT: Edit,
  DELETE_ANNOUNCEMENT: Trash2,
  ARCHIVE_ANNOUNCEMENT: Shield,
  CREATE_EVENT: PlusCircle,
  UPDATE_EVENT: Edit,
  DELETE_EVENT: Trash2,
  ARCHIVE_EVENT: Shield,
  CREATE_GRADE: PlusCircle,
  UPDATE_GRADE: Edit,
  MARK_ATTENDANCE: UserCheck,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  SETTINGS_UPDATE: Settings,
};

const ACTION_COLORS: Record<string, string> = {
  CREATE_USER: 'text-green-600 bg-green-50',
  APPROVE_USER: 'text-green-600 bg-green-50',
  CREATE_STUDENT: 'text-green-600 bg-green-50',
  CREATE_CLASS: 'text-green-600 bg-green-50',
  CREATE_ANNOUNCEMENT: 'text-blue-600 bg-blue-50',
  CREATE_EVENT: 'text-blue-600 bg-blue-50',
  CREATE_GRADE: 'text-blue-600 bg-blue-50',
  MARK_ATTENDANCE: 'text-blue-600 bg-blue-50',
  UPDATE_USER: 'text-amber-600 bg-amber-50',
  UPDATE_STUDENT: 'text-amber-600 bg-amber-50',
  UPDATE_CLASS: 'text-amber-600 bg-amber-50',
  UPDATE_ANNOUNCEMENT: 'text-amber-600 bg-amber-50',
  UPDATE_EVENT: 'text-amber-600 bg-amber-50',
  UPDATE_GRADE: 'text-amber-600 bg-amber-50',
  SETTINGS_UPDATE: 'text-amber-600 bg-amber-50',
  DELETE_USER: 'text-red-600 bg-red-50',
  DELETE_STUDENT: 'text-red-600 bg-red-50',
  DELETE_CLASS: 'text-red-600 bg-red-50',
  DELETE_ANNOUNCEMENT: 'text-red-600 bg-red-50',
  DELETE_EVENT: 'text-red-600 bg-red-50',
  REJECT_USER: 'text-red-600 bg-red-50',
  ARCHIVE_ANNOUNCEMENT: 'text-purple-600 bg-purple-50',
  ARCHIVE_EVENT: 'text-purple-600 bg-purple-50',
  LOGIN: 'text-slate-600 bg-slate-50',
  LOGOUT: 'text-slate-600 bg-slate-50',
};

const getActionLabel = (action: string) =>
  ACTION_LABELS[action] || action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

const getTargetLabel = (targetType: string) =>
  TARGET_LABELS[targetType] || targetType;

const getInitials = (name: string) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A';

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => auditApi.getLogs().then(r => r.data),
  });

  const logs = logsData?.logs || [];

  const filteredLogs = logs.filter((log: any) => {
    const term = searchTerm.toLowerCase();
    return (
      log.adminName?.toLowerCase().includes(term) ||
      log.adminEmail?.toLowerCase().includes(term) ||
      getActionLabel(log.action).toLowerCase().includes(term) ||
      getTargetLabel(log.targetType).toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            A clear record of all administrative actions taken in the system.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="self-start sm:self-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, action, or resource…"
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Summary badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="h-4 w-4" />
        Showing <span className="font-semibold text-foreground">{filteredLogs.length}</span> activity records
      </div>

      {/* Log entries */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted/40 rounded-xl animate-pulse" />
          ))
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No activity logs found.</p>
          </div>
        ) : (
          filteredLogs.map((log: any, index: number) => {
            const Icon = ACTION_ICONS[log.action] || Shield;
            const colorClass = ACTION_COLORS[log.action] || 'text-slate-600 bg-slate-50';
            const actionLabel = getActionLabel(log.action);
            const targetLabel = getTargetLabel(log.targetType);

            return (
              <motion.div
                key={log.id || log._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-start gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-sm transition-all"
              >
                {/* Icon */}
                <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {getInitials(log.adminName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-sm text-foreground">{log.adminName}</span>
                      <Badge variant="outline" className="text-xs capitalize">{log.adminRole}</Badge>
                      <span className="text-sm text-muted-foreground">{actionLabel}</span>
                      {log.targetType && (
                        <Badge variant="secondary" className="text-xs">{targetLabel}</Badge>
                      )}
                    </div>
                    <time
                      className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0"
                      title={format(new Date(log.timestamp), 'PPPp')}
                    >
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </time>
                  </div>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{log.details}</p>
                  )}
                  {log.adminEmail && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{log.adminEmail}</p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
