'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { subscriptionPlansAPI } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SubscriptionPlanViewModel, CreateSubscriptionPlanDTO, UpdateSubscriptionPlanDTO } from '@/types/subscription';

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlanViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlanViewModel | null>(null);
  const [form, setForm] = useState<CreateSubscriptionPlanDTO>({
    name: '',
    description: '',
    price: 0,
    maxNumberOfRides: 1,
    durationInDays: 1,
    isActive: true
  });
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState<{ 
    open: boolean; 
    id?: number; 
    action?: 'delete' | 'activate' | 'deactivate';
    title?: string;
    description?: string;
  }>({ open: false });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await subscriptionPlansAPI.getAll();
      setPlans(data || []);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load plans';
      setError(errorMessage);
      showToast({ 
        type: 'error', 
        title: 'Load Failed', 
        message: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      price: 0,
      maxNumberOfRides: 1,
      durationInDays: 1,
      isActive: true
    });
    setShowModal(true);
  };

  const openEdit = async (plan: SubscriptionPlanViewModel) => {
    try {
      // Fetch the latest plan data by ID
      const fetchedPlan = await subscriptionPlansAPI.getById(plan.id);
      if (fetchedPlan) {
        setEditing(fetchedPlan);
        setForm({
          name: fetchedPlan.name || '',
          description: fetchedPlan.description || '',
          price: fetchedPlan.price,
          maxNumberOfRides: fetchedPlan.maxNumberOfRides,
          durationInDays: fetchedPlan.durationInDays,
          isActive: fetchedPlan.isActive
        });
        setShowModal(true);
      } else {
        showToast({ 
          type: 'error', 
          title: 'Error', 
          message: 'Failed to load plan details' 
        });
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to load plan details';
      showToast({ 
        type: 'error', 
        title: 'Error', 
        message: errorMessage 
      });
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const updateData: UpdateSubscriptionPlanDTO = {
          name: form.name,
          description: form.description || null,
          price: form.price,
          maxNumberOfRides: form.maxNumberOfRides,
          durationInDays: form.durationInDays,
          isActive: form.isActive
        };
        const response = await subscriptionPlansAPI.update(editing.id, updateData);
        if (response.success) {
          await load();
          showToast({ 
            type: 'success', 
            title: 'Plan Updated', 
            message: `${form.name} has been updated successfully` 
          });
        } else {
          throw new Error(response.message || 'Update failed');
        }
      } else {
        const createData: CreateSubscriptionPlanDTO = {
          name: form.name,
          description: form.description || undefined,
          price: form.price,
          maxNumberOfRides: form.maxNumberOfRides,
          durationInDays: form.durationInDays,
          isActive: form.isActive
        };
        const response = await subscriptionPlansAPI.create(createData);
        if (response.success) {
          await load();
          showToast({ 
            type: 'success', 
            title: 'Plan Created', 
            message: `${form.name} has been created successfully` 
          });
        } else {
          throw new Error(response.message || 'Creation failed');
        }
      }
      setShowModal(false);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to save plan';
      showToast({ 
        type: 'error', 
        title: 'Save Failed', 
        message: errorMessage 
      });
    }
  };

  const handleDelete = (id: number) => {
    setConfirmState({ 
      open: true, 
      id, 
      action: 'delete',
      title: 'Delete Plan',
      description: 'Are you sure you want to delete this plan? This action cannot be undone.'
    });
  };

  const handleActivate = (id: number) => {
    setConfirmState({ 
      open: true, 
      id, 
      action: 'activate',
      title: 'Activate Plan',
      description: 'Are you sure you want to activate this plan?'
    });
  };

  const handleDeactivate = (id: number) => {
    setConfirmState({ 
      open: true, 
      id, 
      action: 'deactivate',
      title: 'Deactivate Plan',
      description: 'Are you sure you want to deactivate this plan?'
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmState.id || !confirmState.action) return;
    
    try {
      let response;
      let successMessage = '';
      
      switch (confirmState.action) {
        case 'delete':
          response = await subscriptionPlansAPI.delete(confirmState.id);
          successMessage = 'Plan deleted successfully';
          break;
        case 'activate':
          response = await subscriptionPlansAPI.activate(confirmState.id);
          successMessage = 'Plan activated successfully';
          break;
        case 'deactivate':
          response = await subscriptionPlansAPI.deactivate(confirmState.id);
          successMessage = 'Plan deactivated successfully';
          break;
      }

      if (response.success) {
        await load();
        showToast({ 
          type: 'success', 
          title: 'Success', 
          message: successMessage 
        });
      } else {
        throw new Error(response.message || 'Action failed');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Action failed';
      showToast({ 
        type: 'error', 
        title: 'Action Failed', 
        message: errorMessage 
      });
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

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
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration (days)</TableHead>
                <TableHead>Max rides</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map(plan => (
                <TableRow key={plan.id}>
                  <TableCell className="font-mono text-xs">{plan.id}</TableCell>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{plan.description || '-'}</TableCell>
                  <TableCell>${Number(plan.price || 0).toFixed(2)}</TableCell>
                  <TableCell>{plan.durationInDays}</TableCell>
                  <TableCell>{plan.maxNumberOfRides}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEdit(plan)}
                        title="Edit Plan"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {plan.isActive ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeactivate(plan.id)}
                          title="Deactivate Plan"
                        >
                          <PowerOff className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleActivate(plan.id)}
                          title="Activate Plan"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(plan.id)}
                        title="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              required 
              minLength={3} 
              maxLength={100}
              placeholder="Enter plan name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Input 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              maxLength={500}
              placeholder="Enter plan description (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
            <Input 
              type="number" 
              value={form.price} 
              onChange={e => setForm({ ...form, price: Number(e.target.value) })} 
              min={0.01} 
              max={10000} 
              step={0.01} 
              required
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days) *</label>
            <Input 
              type="number" 
              value={form.durationInDays} 
              onChange={e => setForm({ ...form, durationInDays: Number(e.target.value) })} 
              min={1} 
              max={365} 
              required
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max number of rides *</label>
            <Input 
              type="number" 
              value={form.maxNumberOfRides} 
              onChange={e => setForm({ ...form, maxNumberOfRides: Number(e.target.value) })} 
              min={1} 
              max={1000} 
              required
              placeholder="10"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              id="isActive" 
              type="checkbox" 
              checked={form.isActive} 
              onChange={e => setForm({ ...form, isActive: e.target.checked })} 
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editing ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
      
      <ConfirmDialog 
        open={confirmState.open} 
        onCancel={() => setConfirmState({ open: false })} 
        onConfirm={handleConfirmAction} 
        title={confirmState.title || 'Confirm Action'}
        description={confirmState.description || 'Are you sure?'}
      />
    </div>
  );
}


