'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Users, Filter, CreditCard, CheckCircle2, AlertCircle, Search, FileDown, RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { userAPI, paymentAPI } from '@/lib/api';
import { formatDate } from '@/utils/formatDate';

export default function AdminSubscriptionsPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'bank'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [usersData, paymentsData] = await Promise.all([
        userAPI.getAll().catch(() => []),
        paymentAPI.getAll().catch(() => [])
      ]);
      setUsers((usersData || []) as any[]);
      setPayments((paymentsData || []) as any[]);
    } finally {
      setLoading(false);
    }
  };

  const students = useMemo(() => (users || []).filter((u: any) => u.role === 'student'), [users]);

  const rows = useMemo(() => {
    const base = students
      .map((s: any) => {
        const subs = (payments || [])
          .filter((p: any) => p.studentId === s.id && !p.tripId)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const last = subs[0];
        const methodRaw = (last?.method || s.paymentMethod || '').toLowerCase();
        // method: cash | bank | '' (not yet)
        const method = methodRaw === 'cash' ? 'cash' : methodRaw === 'bank' ? 'bank' : (methodRaw ? 'bank' : '');
        const rawStatus = (s.subscriptionStatus || (last?.status || '')).toLowerCase();
        const status = rawStatus === 'active' ? 'active' : rawStatus === 'completed' ? 'active' : 'inactive';
        const plan = s.subscriptionPlan || last?.description?.replace('Subscription ', '') || '';
        return { student: s, plan, method, status, paymentId: last?.id || null, lastPayment: last || null };
      })
      .filter((r) => r.student.name?.toLowerCase().includes(search.toLowerCase()) || r.student.email?.toLowerCase().includes(search.toLowerCase()))
      .filter((r) => methodFilter === 'all' || r.method === methodFilter)
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => planFilter === 'all' || (r.plan || '').toLowerCase() === planFilter.toLowerCase())
      .filter((r) => {
        if (!fromDate && !toDate) return true;
        const d = r.lastPayment?.date ? new Date(r.lastPayment.date).getTime() : null;
        if (!d) return false;
        const fromMs = fromDate ? new Date(fromDate + 'T00:00:00').getTime() : null;
        const toMs = toDate ? new Date(toDate + 'T23:59:59.999').getTime() : null;
        if (fromMs !== null && d < fromMs) return false;
        if (toMs !== null && d > toMs) return false;
        return true;
      });
    return base;
  }, [students, payments, search, methodFilter, statusFilter, planFilter, fromDate, toDate]);

  const planOptions = useMemo(() => {
    const set = new Set<string>();
    (students || []).forEach((s: any) => {
      const subs = (payments || [])
        .filter((p: any) => p.studentId === s.id && !p.tripId)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const last = subs[0];
      const p = s.subscriptionPlan || last?.description?.replace('Subscription ', '') || '';
      if (p) set.add(p);
    });
    return ['all', ...Array.from(set)];
  }, [students, payments]);

  const exportCsv = () => {
    if (!rows.length) return;
    const header = ['Name', 'Email', 'Plan', 'Method', 'Status', 'Last Payment Date'];
    const body = rows.map(r => [
      r.student.name || '',
      r.student.email || '',
      r.plan || '',
      r.method || '',
      r.status || '',
      r.lastPayment?.date ? formatDate(r.lastPayment.date) : ''
    ]);
    const csv = [header, ...body].map(line => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_subscriptions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter(r => r.status === 'active').length;
    const inactive = rows.filter(r => r.status === 'inactive').length;
    const pendingCash = rows.filter(r => r.method === 'cash' && (r.status === 'pending' || r.status === 'inactive') && r.paymentId).length;
    return { total, active, inactive, pendingCash };
  }, [rows]);

  const confirmCash = async (paymentId: string, studentId: string) => {
    try {
      await paymentAPI.update(paymentId as any, { status: 'completed' });
      await userAPI.update(String(studentId), { subscriptionStatus: 'active' });
      await load();
      showToast({ type: 'success', title: 'Success', message: 'Subscription confirmed.' });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Error', message: e.message || 'Failed to confirm' });
    }
  };

  const setUserStatus = async (studentId: string, status: 'active' | 'inactive') => {
    await userAPI.update(String(studentId), { subscriptionStatus: status });
  };

  const handleToggleStatus = async (row: any, nextChecked: boolean) => {
    try {
      // Block activation if no plan selected regardless of method
      if (nextChecked && (!row.plan || String(row.plan).trim() === '')) {
        showToast({ type: 'warning', title: 'Action blocked', message: 'STUDENT MUS BE SUBSCRIPE FIRST' });
        return;
      }
      const isBank = row.method === 'bank';
      const isCash = row.method === 'cash';
      if (isBank) {
        showToast({ type: 'info', title: 'Automatic', message: 'Bank method activates automatically.' });
        return;
      }

      if (isCash) {
        if (nextChecked) {
          if (row.paymentId) {
            await confirmCash(row.paymentId, row.student.id);
          } else {
            await setUserStatus(row.student.id, 'active');
            await load();
            showToast({ type: 'success', title: 'Activated', message: `${row.student.name} is now active.` });
          }
        } else {
          await setUserStatus(row.student.id, 'inactive');
          await load();
          showToast({ type: 'success', title: 'Deactivated', message: `${row.student.name} is now inactive.` });
        }
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Update failed', message: e.message || 'Could not change status.' });
    }
  };

  if (loading) return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 w-40 bg-border-light rounded" />
          <div className="h-10 w-64 bg-border-light rounded" />
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 w-full bg-border-light rounded" />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Student Subscriptions</h1>
          <p className="text-text-secondary">Manage plans and confirm cash payments</p>
        </div>
        <div className="flex gap-3 items-center">
          <Button variant="outline" onClick={() => load()}>
            <RotateCcw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
            <FileDown className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input placeholder="Search name or email" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value as any)} className="min-w-[160px]">
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </Select>
            <Select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="min-w-[160px]">
              {planOptions.map((p) => (
                <option key={p} value={p}>{p === 'all' ? 'All Plans' : p}</option>
              ))}
            </Select>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="min-w-[160px]" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="min-w-[160px]" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => { setStatusFilter('all'); setActiveTab('all'); }}
            size="sm"
          >All</Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            onClick={() => { setStatusFilter('active'); setActiveTab('active'); }}
            size="sm"
          >Active</Button>
          <Button
            variant={statusFilter === 'inactive' ? 'default' : 'outline'}
            onClick={() => { setStatusFilter('inactive'); setActiveTab('inactive'); }}
            size="sm"
          >Inactive</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-light rounded-lg"><Users className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-sm text-text-secondary">Total Students</p>
                <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-text-secondary">Active</p>
                <p className="text-2xl font-bold text-text-primary">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg"><AlertCircle className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-sm text-text-secondary">Inactive</p>
                <p className="text-2xl font-bold text-text-primary">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg"><CreditCard className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-sm text-text-secondary">Pending Cash</p>
                <p className="text-2xl font-bold text-text-primary">{stats.pendingCash}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>{rows.length} student(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const columns: ColumnDef<any>[] = [
              {
                header: 'Student',
                accessorKey: 'student.name',
                cell: ({ row }) => (
                  <div>
                    <div className="font-medium text-text-primary">{row.original.student.name}</div>
                    <div className="text-sm text-text-secondary">{row.original.student.email}</div>
                  </div>
                )
              },
              { 
                header: 'Plan', 
                accessorKey: 'plan',
                cell: ({ getValue }) => {
                  const plan = (getValue<string>() || '').trim();
                  if (!plan) return <Badge variant="outline" className="text-xs">No Plan</Badge>;
                  const p = plan.toLowerCase();
                  if (p.includes('basic')) return <Badge className="bg-violet-100 text-violet-700 border-violet-200">{plan}</Badge>;
                  if (p.includes('standard') || p.includes('silver')) return <Badge className="bg-teal-100 text-teal-700 border-teal-200">{plan}</Badge>;
                  if (p.includes('premium') || p.includes('gold')) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">{plan}</Badge>;
                  return <Badge className="bg-primary-light text-primary border-primary/20">{plan}</Badge>;
                }
              },
              {
                header: 'Last Payment',
                accessorKey: 'lastPayment.date',
                cell: ({ row }) => (
                  <span className="text-sm text-text-secondary">{row.original.lastPayment?.date ? formatDate(row.original.lastPayment.date) : '-'}</span>
                ),
              },
              { 
                header: 'Method', 
                accessorKey: 'method', 
                cell: ({ getValue }) => {
                  const m = (getValue<string>() || '').toLowerCase();
                  if (!m) return <Badge variant="outline" className="uppercase text-xs">NOT YET</Badge>;
                  if (m === 'cash') return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Cash</Badge>;
                  return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Bank</Badge>;
                }
              },
              {
                header: 'Status', accessorKey: 'status',
                cell: ({ getValue }) => {
                  const s = (getValue<string>() || '').toLowerCase();
                  if (s === 'active') return <Badge className="bg-green-100 text-green-700 border-green-200 capitalize">active</Badge>;
                  return <Badge className="bg-gray-100 text-gray-700 border-gray-200 capitalize">inactive</Badge>;
                }
              },
              {
                header: 'Actions', id: 'actions',
                cell: ({ row }) => {
                  const isActive = row.original.status === 'active';
                  const isBank = row.original.method === 'bank';
                  return (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => handleToggleStatus(row.original, !!checked)}
                        disabled={isBank}
                        aria-label="Toggle subscription"
                      />
                      {isBank && (
                        <span className="text-xs text-text-muted">Auto (bank)</span>
                      )}
                    </div>
                  );
                }
              }
            ];
            return <DataTable columns={columns} data={rows} searchPlaceholder="Search subscriptions..." hideFirstPrevious />;
          })()}
        </CardContent>
      </Card>
    </div>
  );
}


