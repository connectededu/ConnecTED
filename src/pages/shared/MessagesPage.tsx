import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageSquare, Search, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { usersApi, messagesApi } from '@/services/api';
import socketService from '@/services/socket';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

// ─── Fix Msg4: explicit Tailwind class maps (no dynamic string interpolation) ───
const ROLE_BUBBLE_OWN: Record<string, string> = {
  parent: 'bg-parent text-parent-foreground rounded-tr-sm',
  teacher: 'bg-teacher text-teacher-foreground rounded-tr-sm',
  admin: 'bg-admin text-admin-foreground rounded-tr-sm',
};
const ROLE_THREAD_SELECTED: Record<string, string> = {
  parent: 'bg-parent text-parent-foreground border-transparent',
  teacher: 'bg-teacher text-teacher-foreground border-transparent',
  admin: 'bg-admin text-admin-foreground border-transparent',
};
const ROLE_SEND_BTN: Record<string, string> = {
  parent: 'bg-parent hover:bg-parent/90 text-parent-foreground',
  teacher: 'bg-teacher hover:bg-teacher/90 text-teacher-foreground',
  admin: 'bg-admin hover:bg-admin/90 text-admin-foreground',
};

export default function MessagesPage() {
  const location = useLocation();
  const { user } = useAuthStore();
  const {
    messageThreads,
    messages,
    students,
    classes,
    fetchMessages,
    fetchStudents,
    fetchClasses,
    fetchMessageThreads,
    sendMessage,
    isLoading: dataLoading,
  } = useAppStore();

  const [selectedThread, setSelectedThread] = useState<string | null>(
    location.state?.selectedThreadId || null
  );
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [threadSearch, setThreadSearch] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // ─── Fix B6: ref for auto-scroll ───
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessageThreads();
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      fetchMessages(selectedThread);
      // Mark thread as read when opened
      messagesApi.markRead(selectedThread).catch(() => {});
      setTypingUsers([]); // reset typing users on thread switch
      // Join thread room for real-time events
      socketService.joinThread(selectedThread);
    }
    return () => {
      if (selectedThread) socketService.leaveThread(selectedThread);
    };
  }, [selectedThread]);

  useEffect(() => {
    const handleTypingStart = ({ userId, threadId }: any) => {
      if (selectedThread === threadId && userId !== user?.id) {
        setTypingUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
      }
    };
    const handleTypingStop = ({ userId, threadId }: any) => {
      if (selectedThread === threadId) {
        setTypingUsers(prev => prev.filter(id => id !== userId));
      }
    };
    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => new Set(prev).add(userId));
    };
    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };
    
    socketService.on('typing:start', handleTypingStart);
    socketService.on('typing:stop', handleTypingStop);
    socketService.onUserOnline(handleUserOnline);
    socketService.onUserOffline(handleUserOffline);
    
    return () => {
      socketService.off('typing:start', handleTypingStart);
      socketService.off('typing:stop', handleTypingStop);
      socketService.off('user:online', handleUserOnline);
      socketService.off('user:offline', handleUserOffline);
    };
  }, [selectedThread, user?.id]);

  // ─── Fix B6: auto-scroll when messages change ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedThread]);

  const role = user?.role ?? 'parent';
  const bubbleOwnClass = ROLE_BUBBLE_OWN[role] ?? ROLE_BUBBLE_OWN.parent;
  const threadSelectedClass = ROLE_THREAD_SELECTED[role] ?? ROLE_THREAD_SELECTED.parent;
  const sendBtnClass = ROLE_SEND_BTN[role] ?? ROLE_SEND_BTN.parent;

  // ─── Fix Msg2: scoped contacts — only fetch teachers of my children / parents of my students ───
  const { data: teachers = [] } = useQuery({
    queryKey: ['messages-teachers'],
    queryFn: () =>
      usersApi.getAll({ role: 'teacher', limit: 1000 }).then(
        (r) => r.data.data || r.data.users || r.data || []
      ),
    enabled: user?.role === 'parent',
  });

  const { data: parents = [] } = useQuery({
    queryKey: ['messages-parents'],
    queryFn: () =>
      usersApi.getAll({ role: 'parent', limit: 1000 }).then(
        (r) => r.data.data || r.data.users || r.data || []
      ),
    enabled: user?.role === 'teacher',
  });

  // Build scoped contact lists
  const myChildren = useMemo(
    () =>
      students.filter(
        (s) =>
          s.parentIds?.includes(user?.id) ||
          s.parentIds?.includes((user as any)?._id)
      ),
    [students, user]
  );

  // Teachers who teach my children's classes
  const myTeachers = useMemo(() => {
    if (user?.role !== 'parent') return [];
    return (teachers as any[]).filter((teacher) =>
      myChildren.some((child) => {
        const cls = classes.find(
          (c) => c.id === child.classId || c._id === child.classId
        );
        return (
          cls?.teacherIds?.includes(teacher.id) ||
          cls?.teacherIds?.includes(teacher._id) ||
          cls?.teacherIds?.includes(teacher.uid) ||
          cls?.teacherIds?.includes(teacher.firebaseUid)
        );
      })
    );
  }, [teachers, myChildren, classes, user]);

  const myClasses = useMemo(
    () =>
      classes.filter(
        (c) =>
          c.teacherIds?.includes(user?.id) ||
          c.teacherIds?.includes((user as any)?._id)
      ),
    [classes, user]
  );
  const myStudents = useMemo(
    () =>
      students.filter((s) =>
        myClasses.some(
          (c) => c.id === s.classId || c._id === s.classId
        )
      ),
    [students, myClasses]
  );

  // Parents of my students
  const myParents = useMemo(() => {
    if (user?.role !== 'teacher') return [];
    return (parents as any[]).filter((parent) =>
      myStudents.some(
        (student) =>
          student.parentIds?.includes(parent.id) ||
          student.parentIds?.includes(parent._id) ||
          student.parentIds?.includes(parent.uid) ||
          student.parentIds?.includes(parent.firebaseUid)
      )
    );
  }, [parents, myStudents, user]);

  // ─── Fix Msg1: build a lookup map for participant names ───
  const participantNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (teachers as any[]).forEach((t) => {
      if (t.id) map[t.id] = t.name;
      if (t._id) map[t._id] = t.name;
      if (t.uid) map[t.uid] = t.name;
      if (t.firebaseUid) map[t.firebaseUid] = t.name;
    });
    (parents as any[]).forEach((p) => {
      if (p.id) map[p.id] = p.name;
      if (p._id) map[p._id] = p.name;
      if (p.uid) map[p.uid] = p.name;
      if (p.firebaseUid) map[p.firebaseUid] = p.name;
    });
    return map;
  }, [teachers, parents]);

  useEffect(() => {
    const initialOnline = new Set<string>();
    (teachers as any[]).forEach((t) => {
      if (t.isOnline) initialOnline.add(t.id || t._id || t.uid || t.firebaseUid);
    });
    (parents as any[]).forEach((p) => {
      if (p.isOnline) initialOnline.add(p.id || p._id || p.uid || p.firebaseUid);
    });
    if (initialOnline.size > 0) {
      setOnlineUsers(prev => new Set([...prev, ...initialOnline]));
    }
  }, [teachers, parents]);

  const getParticipantId = (thread: any): string => {
    const otherParticipant = thread.participants?.find(
      (p: any) =>
        p.id !== user?.id &&
        p.id !== (user as any)?._id &&
        p._id !== user?.id &&
        p._id !== (user as any)?._id
    );
    if (!otherParticipant) return '';
    return otherParticipant.id || otherParticipant._id || otherParticipant.uid || otherParticipant.firebaseUid;
  };

  const getParticipantName = (thread: any): string => {
    const otherParticipant = thread.participants?.find(
      (p: any) =>
        p.id !== user?.id &&
        p.id !== (user as any)?._id &&
        p._id !== user?.id &&
        p._id !== (user as any)?._id
    );
    if (!otherParticipant) return '';
    const targetId = getParticipantId(thread);
    return (
      participantNameMap[targetId] ||
      otherParticipant.name ||
      otherParticipant.email ||
      ''
    );
  };

  // ─── Fix Msg1: resolve sender name in message bubbles ───
  const getSenderName = (senderId: string): string => {
    if (senderId === user?.id || senderId === (user as any)?._id) {
      return user?.name ?? 'You';
    }
    return participantNameMap[senderId] || '';
  };

  const getStudent = (studentId: string) =>
    students.find((s) => s.id === studentId || (s as any)._id === studentId);

  const handleStartConversation = async (
    participantId: string,
    studentId: string
  ) => {
    try {
      const res = await messagesApi.getOrCreateThread(participantId, studentId);
      const newThread = res.data;
      await fetchMessageThreads();
      setSelectedThread(newThread.id || newThread._id);
      toast.success('Conversation started!');
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedThread || !user) return;
    setSending(true);
    try {
      await sendMessage(selectedThread, user.id, user.role as any, newMessage);
      setNewMessage('');
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // ─── Fix Msg3: filtered thread and contact lists ───
  const filteredThreads = useMemo(
    () =>
      messageThreads.filter((thread) => {
        if (!threadSearch) return true;
        const name = getParticipantName(thread).toLowerCase();
        const student = getStudent(thread.studentId);
        return (
          name.includes(threadSearch.toLowerCase()) ||
          student?.name?.toLowerCase().includes(threadSearch.toLowerCase())
        );
      }),
    [messageThreads, threadSearch, participantNameMap]
  );

  const filteredTeachers = useMemo(
    () =>
      myTeachers.filter(
        (t: any) =>
          !contactSearch ||
          t.name?.toLowerCase().includes(contactSearch.toLowerCase())
      ),
    [myTeachers, contactSearch]
  );

  const filteredParents = useMemo(
    () =>
      myParents.filter(
        (p: any) =>
          !contactSearch ||
          p.name?.toLowerCase().includes(contactSearch.toLowerCase())
      ),
    [myParents, contactSearch]
  );

  const currentThread = messageThreads.find((t) => t.id === selectedThread || (t as any)._id === selectedThread);
  const currentMessages = messages.filter(
    (m) => {
      if (!currentThread) return false;
      return m.threadId === currentThread.id || m.threadId === (currentThread as any)._id;
    }
  );

  return (
    <div className="h-[calc(100vh-10rem)] lg:h-[calc(100vh-6rem)] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex-shrink-0"
      >
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with{' '}
          {user?.role === 'parent' ? 'teachers' : 'parents'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* ─── Thread List & Contacts ─── */}
        <Card className={cn("lg:col-span-1 overflow-hidden flex-col", selectedThread ? "hidden lg:flex" : "flex")}>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">Conversations</CardTitle>
            {/* Fix Msg3: search bar */}
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations…"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </CardHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Active Conversations */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Active Conversations
                </h3>
                <div className="space-y-2">
                  {dataLoading && messageThreads.length === 0 ? (
                    [1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))
                  ) : filteredThreads.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {threadSearch ? 'No results found' : 'No conversations yet'}
                    </p>
                  ) : (
                    filteredThreads.map((thread) => {
                      const participantName = getParticipantName(thread);
                      const student = getStudent(thread.studentId);
                      const isSelected =
                        selectedThread === thread.id ||
                        selectedThread === (thread as any)._id;

                      return (
                        <button
                          key={thread.id || (thread as any)._id}
                          onClick={() =>
                            setSelectedThread(thread.id || (thread as any)._id)
                          }
                          className={`w-full p-4 rounded-xl text-left transition-all border ${
                            isSelected
                              ? threadSelectedClass
                              : 'bg-muted hover:bg-muted/80 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar>
                                <AvatarFallback>
                                  {participantName ? participantName.charAt(0) : <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                                </AvatarFallback>
                              </Avatar>
                              {onlineUsers.has(getParticipantId(thread)) && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate flex items-center gap-2">
                                {participantName || <Skeleton className="h-4 w-24" />}
                              </p>
                              <p
                                className={`text-xs truncate ${
                                  isSelected
                                    ? 'opacity-80'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                Re: {student?.name || 'Student'}
                              </p>
                              {thread.lastMessage && (
                                <p
                                  className={`text-xs truncate mt-0.5 ${
                                    isSelected
                                      ? 'opacity-70'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {(thread.lastMessage as any).content}
                                </p>
                              )}
                            </div>
                            {thread.unreadCount > 0 && !isSelected && (
                              <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center flex-shrink-0">
                                {thread.unreadCount}
                              </span>
                            )}
                            {!(thread.unreadCount > 0 && !isSelected) && thread.lastMessage && (thread.lastMessage as any).timestamp && !isNaN(new Date((thread.lastMessage as any).timestamp).getTime()) && (
                              <p
                                className={`text-xs ${
                                  isSelected
                                    ? 'opacity-70'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {formatDistanceToNow(
                                  new Date((thread.lastMessage as any).timestamp),
                                  { addSuffix: true }
                                )}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* All Contacts */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  All Contacts
                </h3>
                {/* Fix Msg3: contact search */}
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts…"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  {user?.role === 'parent' &&
                    (filteredTeachers.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-4">
                        {contactSearch
                          ? 'No teachers match your search.'
                          : 'No class teachers found.'}
                      </p>
                    ) : (
                      filteredTeachers.map((teacher: any) => {
                        const child = myChildren.find((c) => {
                          const cls = classes.find(
                            (cl) =>
                              cl.id === c.classId || cl._id === c.classId
                          );
                          return (
                            cls?.teacherIds?.includes(teacher.id) ||
                            cls?.teacherIds?.includes(teacher._id) ||
                            cls?.teacherIds?.includes(teacher.uid)
                          );
                        });

                        return (
                          <button
                            key={teacher.id || teacher._id}
                            onClick={() =>
                              handleStartConversation(
                                teacher.id || teacher._id,
                                child?.id || ''
                              )
                            }
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left border"
                          >
                            <Avatar>
                              <AvatarFallback>
                                {teacher.name?.charAt(0) || 'T'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {teacher.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Child: {child?.name || 'Student'}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    ))}

                  {user?.role === 'teacher' &&
                    (filteredParents.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic text-center py-4">
                        {contactSearch
                          ? 'No parents match your search.'
                          : 'No student parents found.'}
                      </p>
                    ) : (
                      filteredParents.map((parent: any) => {
                        const student = myStudents.find(
                          (s) =>
                            s.parentIds?.includes(parent.id) ||
                            s.parentIds?.includes(parent._id)
                        );

                        return (
                          <button
                            key={parent.id || parent._id}
                            onClick={() =>
                              handleStartConversation(
                                parent.id || parent._id,
                                student?.id || ''
                              )
                            }
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left border"
                          >
                            <Avatar>
                              <AvatarFallback>
                                {parent.name?.charAt(0) || 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {parent.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                Child: {student?.name || 'Student'}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* ─── Message View ─── */}
        <Card className={cn("lg:col-span-2 flex-col overflow-hidden", selectedThread ? "flex" : "hidden lg:flex")}>
          <AnimatePresence mode="wait">
            {selectedThread && currentThread ? (
              <motion.div
                key={selectedThread}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full overflow-hidden"
              >
                {/* Header */}
                <CardHeader className="border-b pb-4 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setSelectedThread(null)}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Avatar>
                      <AvatarFallback>
                        {getParticipantName(currentThread).charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {getParticipantName(currentThread)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Regarding:{' '}
                        {getStudent(currentThread.studentId)?.name ||
                          'Student'}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {currentMessages.map((message, index) => {
                      const isOwn =
                        message.senderId === user?.id ||
                        message.senderId === (user as any)?._id;
                      const senderName = getSenderName(message.senderId);

                      return (
                        <motion.div
                          key={message.id || (message as any)._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {senderName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}
                          >
                            <div
                              className={`p-3 rounded-2xl ${
                                isOwn
                                  ? bubbleOwnClass
                                  : 'bg-muted text-foreground rounded-tl-sm'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(
                                new Date(message.timestamp),
                                { addSuffix: true }
                              )}
                              {message.isRead && isOwn && (
                                <span className="ml-2 opacity-70">✓ Read</span>
                              )}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                      >
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {getSenderName(typingUsers[0])?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted text-foreground p-3 rounded-2xl rounded-tl-sm text-sm flex items-center gap-1">
                          <span className="animate-pulse">●</span>
                          <span className="animate-pulse delay-75">●</span>
                          <span className="animate-pulse delay-150">●</span>
                        </div>
                      </motion.div>
                    )}
                    {/* Fix B6: anchor for auto-scroll */}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t flex-shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex gap-3"
                  >
                    <Input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        if (selectedThread) {
                          socketService.sendTypingStart(selectedThread);
                          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                          typingTimeoutRef.current = setTimeout(() => {
                            socketService.sendTypingStop(selectedThread);
                          }, 1500);
                        }
                      }}
                      placeholder="Type a message…"
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className={sendBtnClass}
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center text-center p-8"
              >
                <div>
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground">
                    Select a conversation
                  </p>
                  <p className="text-muted-foreground">
                    Choose from your conversations on the left, or start a new
                    one from the contacts list
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
