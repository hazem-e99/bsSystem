'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Bell, Filter, Clock, CheckCircle2, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, getRelativeTime } from '@/utils/formatDate';
import { notificationAPI } from '@/lib/api';

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
  createdAt?: string;
};

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [specificDate, setSpecificDate] = useState('');
  const [toMark, setToMark] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        const res = await notificationAPI.getByUser(user.id.toString());
        setNotifications((res as NotificationItem[]) || []);
      } catch {
        console.error('Failed to fetch notifications:', Error);
        setNotifications([]);
      }
    };

    fetchNotifications();
  }, [user]);

  const filtered = notifications.filter(n => {
    const matchesSearch = search === '' || (n.title || '').toLowerCase().includes(search.toLowerCase()) || (n.message || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'unread' ? (n.status === 'unread' || n.read === false) : (n.status === 'read' || n.read === true));

    // Date filter based on createdAt
    let matchesDate = true;
    const created = n.createdAt ? new Date(n.createdAt) : null;
    if (specificDate) {
      // match by same day YYYY-MM-DD
      if (!created || isNaN(created.getTime())) {
        matchesDate = false;
      } else {
        const createdYmd = created.toISOString().split('T')[0];
        matchesDate = createdYmd === specificDate;
      }
    } else if (dateFilter !== 'all') {
      if (!created || isNaN(created.getTime())) {
        matchesDate = false;
      } else {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') {
          matchesDate = created >= startOfToday;
        } else if (dateFilter === '7d') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchesDate = created >= sevenDaysAgo;
        } else if (dateFilter === '30d') {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          matchesDate = created >= thirtyDaysAgo;
        }
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const markAsRead = async (id: string, read: boolean) => {
    try {
      await notificationAPI.update(id, { status: read ? 'read' : 'unread', read });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: read ? 'read' : 'unread', read } : n));
    } catch {
      console.error('Failed to mark notification:', Error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      console.error('Failed to delete notification:', Error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(toMark.map(n => notificationAPI.update(n.id, { status: 'read', read: true })));
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read', read: true })));
      setToMark([]);
    } catch {
      console.error('Failed to mark all as read:', Error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#212121] flex items-center gap-2"><Bell className="w-7 h-7 text-primary" /> My Notifications</h1>
          <p className="text-[#424242]">View notifications from supervisors and system</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{unreadCount} Unread</Badge>
          <Button variant="outline" onClick={markAllAsRead}><CheckCircle2 className="w-4 h-4 mr-2" /> Mark filtered as read</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border-[#E0E0E0]">
        <CardHeader>
          <CardTitle className="text-[#212121]">Filters & Search</CardTitle>
          <CardDescription className="text-[#757575]">Find the notifications you need quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-[#757575]" />
              <Input placeholder="Search title, message..." value={search} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | 'unread' | 'read')} options={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }, { value: 'read', label: 'Read' }]} />
            <Select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as 'all' | 'today' | '7d' | '30d')}
              options={[
                { value: 'all', label: 'All Dates' },
                { value: 'today', label: 'Today' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
              ]}
            />
            <div>
              <Input type="date" value={specificDate} onChange={(e: unknown) => setSpecificDate((e as any).target.value)} />
            </div>
            <div className="flex items-center text-sm text-[#757575]"><Clock className="w-4 h-4 mr-2" /> {filtered.length} notification(s)</div>
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
              <p className="text-sm">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n) => (
                <div key={n.id} className={`p-4 transition-colors ${n.status !== 'read' && n.read !== true ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                      n.type === 'announcement' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                    }`}>
                      <Bell className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold truncate ${n.status !== 'read' && n.read !== true ? 'text-primary' : 'text-text-primary'}`}>{n.title || 'Notification'}</p>
                            {n.status !== 'read' && n.read !== true && <span className="inline-block w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          {n.message && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{n.message}</p>}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
                            <span><Clock className="inline w-3 h-3 mr-1" />{n.createdAt ? getRelativeTime(n.createdAt) : '-'}</span>
                            <span>•</span>
                            <span>{n.type === 'announcement' ? 'Announcement' : (n.type || 'General')}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          {n.status !== 'read' && n.read !== true ? (
                            <Button size="sm" onClick={() => markAsRead(n.id, true)}><CheckCircle2 className="w-4 h-4 mr-1" /> Read</Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => markAsRead(n.id, false)}><Eye className="w-4 h-4 mr-1" /> Unread</Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => deleteNotification(n.id)}>
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
