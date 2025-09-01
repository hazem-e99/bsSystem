'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { subscriptionPlansAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  maxNumberOfRides: number;
  durationInDays: number;
  isActive: boolean;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ id: '', name: '', description: '', price: 0, maxNumberOfRides: 1, durationInDays: 1, isActive: true });
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState<{ open: boolean; id?: string }>(() => ({ open: false }));

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await subscriptionPlansAPI.getAll();
      setPlans(data || []);
    } catch {
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ id: '', name: '', description: '', price: 0, maxNumberOfRides: 1, durationInDays: 1, isActive: true });
    setShowModal(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setForm({ id: String(plan.id), name: plan.name ?? '', description: plan.description ?? '', price: Number(plan.price ?? 0), maxNumberOfRides: Number(plan.maxNumberOfRides ?? 1), durationInDays: Number(plan.durationInDays ?? 1), isActive: Boolean(plan.isActive) });
    setShowModal(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
        maxNumberOfRides: Number(form.maxNumberOfRides),
        durationInDays: Number(form.durationInDays),
        isActive: Boolean(form.isActive),
      };
      if (editing) {
        const updated = await subscriptionPlansAPI.update(form.id, payload);
        await load();
        showToast({ type: 'success', title: 'Plan updated', message: `${form.name}` });
      } else {
        const created = await subscriptionPlansAPI.create(payload);
        await load();
        showToast({ type: 'success', title: 'Plan created', message: `${created?.data?.name || form.name}` });
      }
      setShowModal(false);
    } catch {
      setError('Failed to save plan');
      showToast({ type: 'error', title: 'Save failed', message: 'Please try again.' });
    }
  };

  const remove = (id: string) => setConfirmState({ open: true, id });
  const handleDeleteConfirmed = async () => {
    if (!confirmState.id) return;
    try {
      await subscriptionPlansAPI.delete(confirmState.id);
      setPlans(prev => prev.filter(p => p.id !== confirmState.id));
      showToast({ type: 'success', title: 'Deleted', message: 'Plan removed.' });
    } catch {
      setError('Failed to delete plan');
      showToast({ type: 'error', title: 'Delete failed', message: 'Please try again.' });
    } finally {
      setConfirmState({ open: false });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-gray-600">Manage available subscription plans</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Plan</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>{plans.length} plan(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration (days)</TableHead>
                <TableHead>Max rides</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map(plan => (
                <TableRow key={plan.id}>
                  <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>${Number(plan.price || 0).toFixed(2)}</TableCell>
                  <TableCell>{plan.durationInDays ?? ''}</TableCell>
                  <TableCell>{plan.maxNumberOfRides ?? ''}</TableCell>
                  <TableCell>{plan.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(plan)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => remove(plan.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Plan' : 'Add Plan'} size="md">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={3} maxLength={100} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} maxLength={500} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} min={0.01} max={10000} step={0.01} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
            <Input type="number" value={form.durationInDays} onChange={e => setForm({ ...form, durationInDays: Number(e.target.value) })} min={1} max={365} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max number of rides</label>
            <Input type="number" value={form.maxNumberOfRides} onChange={e => setForm({ ...form, maxNumberOfRides: Number(e.target.value) })} min={1} max={1000} required />
          </div>
          <div className="flex items-center gap-2">
            <input id="isActive" type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save Changes' : 'Create Plan'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={confirmState.open} onCancel={() => setConfirmState({ open: false })} onConfirm={handleDeleteConfirmed} title="Delete plan?" description="This action cannot be undone." />
    </div>
  );
}


