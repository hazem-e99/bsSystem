'use client';

import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { userAPI, paymentAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function StudentSubscriptionsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [usersData, paymentsData] = await Promise.all([
        userAPI.getAll().catch(() => []),
        paymentAPI.getAll().catch(() => []),
      ]);
      setUsers((usersData || []) as any[]);
      setPayments((paymentsData || []) as any[]);
    } finally {
      setLoading(false);
    }
  };

  const students = useMemo(() => users.filter((u: any) => u.role === 'student'), [users]);

  const byStudent = useMemo(() => {
    const map = new Map<string, any>();
    for (const s of students) map.set(s.id, s);
    return map;
  }, [students]);

  const studentSubscriptions = useMemo(() => {
    return students.map(s => {
      const subPayments = payments
        .filter((p: any) => p.studentId === s.id && (!p.tripId))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const last = subPayments[0];
      return {
        studentId: s.id,
        name: s.name,
        plan: s.subscriptionPlan || last?.description?.replace('Subscription ', '') || '',
        method: last?.method || s.paymentMethod || '',
        status: s.subscriptionStatus || (last?.status === 'completed' ? 'active' : last?.status || 'inactive'),
        paymentId: last?.id || null,
      };
    }).filter(row => row.name?.toLowerCase().includes(search.toLowerCase()));
  }, [students, payments, search]);

  const confirmCash = async (paymentId: string, studentId: string) => {
    try {
      await paymentAPI.update(paymentId as any, { status: 'completed' });
      await userAPI.update(String(studentId), { subscriptionStatus: 'active' });
      await load();
      showToast({ type: 'success', title: 'Subscription confirmed' });
    } catch (e) {
      console.error(e);
      showToast({ type: 'error', title: 'Failed to confirm' });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Subscriptions</h1>
          <p className="text-gray-600">Manage student plan payments and status</p>
        </div>
        <div className="w-64">
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>{studentSubscriptions.length} student(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentSubscriptions.map(row => (
                <TableRow key={row.studentId}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.plan || '-'}</TableCell>
                  <TableCell className="capitalize">{row.method || '-'}</TableCell>
                  <TableCell className="capitalize">{row.status || '-'}</TableCell>
                  <TableCell>
                    {row.method === 'cash' && (row.status === 'pending' || row.status === 'inactive') && row.paymentId && (
                      <Button size="sm" onClick={() => confirmCash(row.paymentId, row.studentId)}>Confirm</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


