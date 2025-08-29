'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Bell, CheckCircle2, XCircle, Filter, Trash2, Eye, Clock, MapPin, Bus, Send, Users, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatDate';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { notificationAPI, tripAPI, bookingAPI, userAPI } from '@/lib/api';

type NotificationItem = {
  id: string;
  userId: string;
  senderId?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'unread' | 'read';
  read?: boolean;
  title?: string;
  message?: string;
  busId?: string;
  tripId?: string;
  stopId?: string;
  stopName?: string;
  stopTime?: string;
  createdAt?: string;
};

export default function SupervisorNotificationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    target: 'all' as 'all' | 'specific'
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        const res = await notificationAPI.getByUser(user.id);
        setNotifications(res || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, [user]);

  // Enrich notifications missing pickup info by looking up trip/booking
  useEffect(() => {
    const enrich = async () => {
      const needEnrich = notifications.filter(n => n.type === 'booking' && n.tripId && (!n.stopName || !n.stopTime));
      if (needEnrich.length === 0) return;
      const updated: NotificationItem[] = [];
      for (const n of needEnrich) {
        let stopName = n.stopName;
        let stopTime = n.stopTime;
        try {
          const tripRes = await tripAPI.getById(n.tripId);
          const trip = tripRes ? tripRes : null;
          if (trip) {
            let stopId = (n as any).stopId as string | undefined;
            if (!stopId && n.senderId) {
              const bkRes = await bookingAPI.getByTrip(n.tripId, n.senderId);
              const bks = bkRes ? bkRes : [];
              if (Array.isArray(bks) && bks[0]?.stopId) stopId = bks[0].stopId;
            }
            if (stopId && Array.isArray(trip.stops)) {
              const st = trip.stops.find((s: any) => s.id === stopId);
              stopName = st?.stopName || stopName;
              stopTime = st?.stopTime || stopTime;
            }
          }
        } catch {}
        updated.push({ ...n, stopName, stopTime });
      }
      if (updated.length) {
        setNotifications(prev => prev.map(n => {
          const u = updated.find(x => x.id === n.id);
          return u ? u : n;
        }));
      }
    };
    enrich();
  }, [notifications]);

  // Load students for selection
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const res = await userAPI.getByRole('student');
        const data = res ? res : [];
        setStudents(Array.isArray(data) ? data : []);
      } catch {}
    };
    loadStudents();
  }, []);

  const sendNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) return;
    if (notificationForm.target === 'specific' && selectedStudents.length === 0) return;

    setIsSending(true);
    try {
      const targetIds = notificationForm.target === 'all' 
        ? students.map(s => s.id)
        : selectedStudents;

      const promises = targetIds.map(studentId => 
        notificationAPI.create({
          userId: studentId,
          senderId: user?.id,
          type: 'announcement',
          priority: notificationForm.priority,
          status: 'unread',
          read: false,
          title: notificationForm.title,
          message: notificationForm.message,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        showToast({
          type: 'success',
          title: 'Notifications Sent Successfully',
          message: `Successfully sent ${successful} notification(s)${failed > 0 ? `, ${failed} failed` : ''}`
        });
        
        // Reset form and close modal
        setNotificationForm({ title: '', message: '', priority: 'medium', target: 'all' });
        setSelectedStudents([]);
        setSendModalOpen(false);
        
        // Refresh notifications
        const res = await notificationAPI.getByUser(user?.id);
        setNotifications(res || []);
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Send Notifications',
          message: 'All notifications failed to send. Please try again.'
        });
      }
    } catch (error) {
      console.error('Failed to send notifications:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to send notifications. Please try again.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const matchesSearch = search === '' || (n.title || '').toLowerCase().includes(search.toLowerCase()) || (n.message || '').toLowerCase().includes(search.toLowerCase()) || (n.stopName || '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'unread' ? (n.status === 'unread' || n.read === false) : (n.status === 'read' || n.read === true));
      const matchesPriority = priorityFilter === 'all' || n.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [notifications, search, statusFilter, priorityFilter]);

  const markAsRead = async (id: string, read = true) => {
    try {
      await notificationAPI.update(id, { status: read ? 'read' : 'unread', read });
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, status: read ? 'read' : 'unread', read } : n)));
    } catch {
      setNotifications(prev);
    }
  };

  const markAllAsRead = async () => {
    const toMark = filtered.filter(n => n.status !== 'read' && n.read !== true);
    setNotifications(prev => prev.map(n => (toMark.some(t => t.id === n.id) ? { ...n, status: 'read', read: true } : n)));
    try {
      await Promise.all(toMark.map(n => notificationAPI.update(n.id, { status: 'read', read: true })));
    } catch {}
  };

  const removeNotification = async (id: string) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      setNotifications(prev);
    }
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case 'high':
        return <Badge color="destructive">High</Badge>;
      case 'medium':
        return <Badge>Medium</Badge>;
      case 'low':
        return <Badge color="secondary">Low</Badge>;
      default:
        return <Badge color="secondary">-</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#212121] flex items-center gap-2"><Bell className="w-7 h-7 text-primary" /> Notifications</h1>
          <p className="text-[#424242]">Review and manage your latest updates</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSendModalOpen(true)}><Send className="w-4 h-4 mr-2" /> Send Notifications</Button>
          <Button variant="outline" onClick={markAllAsRead}><CheckCircle2 className="w-4 h-4 mr-2" /> Mark all as read</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border-[#E0E0E0]">
        <CardHeader>
          <CardTitle className="text-[#212121]">Filters & Search</CardTitle>
          <CardDescription className="text-[#757575]">Find the notifications you need quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-[#757575]" />
              <Input placeholder="Search title, message, stop..." value={search} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} options={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }]} />
            <Select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)} options={[{ value: 'all', label: 'All Priorities' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
            <div className="flex items-center text-sm text-[#757575]"><Calendar className="w-4 h-4 mr-2" /> {filtered.length} notification(s)</div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="bg-white border-[#E0E0E0]">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>{isLoading ? 'Loading...' : `${filtered.length} result(s)`}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-[#757575]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-[#757575]">
              <Bell className="w-16 h-16 mx-auto mb-4 text-[#BDBDBD]" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((n) => (
                  <TableRow key={n.id} className={n.status !== 'read' && n.read !== true ? 'bg-primary/5' : ''}>
                    <TableCell className="font-medium">{n.title || '-'}</TableCell>
                    <TableCell className="max-w-xl">
                      <div className="text-sm">{n.message}</div>
                      <div className="text-xs text-[#757575] mt-1 flex items-center gap-2"><Clock className="w-3 h-3" /> {n.createdAt ? formatDate(n.createdAt) : '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> {n.stopName || '-'}</div>
                      {n.stopTime && <div className="text-xs text-[#757575]">{n.stopTime}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-[#757575]">Trip: {n.tripId || '-'}</div>
                      <div className="text-xs text-[#757575] flex items-center gap-1"><Bus className="w-3 h-3" /> Bus: {n.busId || '-'}</div>
                    </TableCell>
                    <TableCell>
                      {n.status !== 'read' && n.read !== true ? (
                        <Badge>Unread</Badge>
                      ) : (
                        <Badge color="secondary">Read</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getPriorityBadge(n.priority)}</TableCell>
                    <TableCell className="space-x-2">
                      {n.status !== 'read' && n.read !== true ? (
                        <Button size="sm" onClick={() => markAsRead(n.id, true)}><CheckCircle2 className="w-4 h-4 mr-1" /> Read</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => markAsRead(n.id, false)}><Eye className="w-4 h-4 mr-1" /> Unread</Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => removeNotification(n.id)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Notifications Modal */}
      <Modal isOpen={sendModalOpen} onClose={() => setSendModalOpen(false)} size="2xl">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Send Notifications</h3>
            <button onClick={() => setSendModalOpen(false)} className="p-2 hover:bg-card-hover rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                placeholder="Notification title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                className="w-full p-3 border border-border rounded-lg resize-none h-24"
                placeholder="Notification message"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <Select
                  value={notificationForm.priority}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target</label>
                <Select
                  value={notificationForm.target}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, target: e.target.value as any }))}
                  options={[
                    { value: 'all', label: 'All Students' },
                    { value: 'specific', label: 'Specific Students' }
                  ]}
                />
              </div>
            </div>

            {notificationForm.target === 'specific' && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Students</label>
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
                  {students.map(student => (
                    <label key={student.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents(prev => [...prev, student.id]);
                          } else {
                            setSelectedStudents(prev => prev.filter(id => id !== student.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{student.name || student.email || student.id}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSendModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={sendNotification}
              disabled={isSending || !notificationForm.title.trim() || !notificationForm.message.trim() || (notificationForm.target === 'specific' && selectedStudents.length === 0)}
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notifications
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


