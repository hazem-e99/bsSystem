'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { studentProfileAPI, paymentAPI, subscriptionPlansAPI } from '@/lib/api';
import { CheckCircle, CreditCard, Banknote, Crown, Shield, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentSubscriptionPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<unknown>(null);
  const [payments, setPayments] = useState<unknown[]>([]);
  const [plans, setPlans] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<unknown | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'cash'>('bank');
  const [submitting, setSubmitting] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const [profileRes, paymentsRes] = await Promise.all([
          studentProfileAPI.getProfile(user.id.toString()),
          paymentAPI.getByStudent(user.id.toString())
        ]);

        if (profileRes) {
          setProfile(profileRes);
        }
        if (paymentsRes) {
          setPayments(paymentsRes);
        }
      } catch {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user]);

  const lastSubscriptionPayment = useMemo(() => (payments || []).filter((x: Payment) => !x.tripId).sort((a: Payment, b: Payment) => new Date(b.date).getTime() - new Date(a.date).getTime())[0], [payments]);

  const currentPlan = profile?.subscriptionPlan || lastSubscriptionPayment?.description?.replace('Subscription ', '') || null;
  const currentMethod = lastSubscriptionPayment?.method || null;
  const status = profile?.subscriptionStatus || (lastSubscriptionPayment?.status === 'completed' ? 'active' : lastSubscriptionPayment?.status || 'inactive');

  const handleChoosePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setPaymentMethod('bank');
    setMethodModalOpen(true);
  };

  const handleSubscribe = async () => {
    if (!user || !selectedPlan) return;
    
    try {
      const res = await subscriptionPlansAPI.create({
        studentId: user.id.toString(),
        planId: selectedPlan.id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      });

      if (res) {
        showToast({
          type: 'success',
          title: 'Success!',
          message: `Successfully subscribed to ${selectedPlan.name} plan!`
        });
        
        // Refresh data
        const [profileRes, paymentsRes] = await Promise.all([
          studentProfileAPI.getProfile(user.id.toString()),
          paymentAPI.getByStudent(user.id.toString())
        ]);

        if (profileRes) {
          setProfile(profileRes);
        }
        if (paymentsRes) {
          setPayments(paymentsRes);
        }
      }
    } catch {
      console.error('Subscription error:', error);
      showToast({
        type: 'error',
        title: 'Error!',
        message: 'Failed to subscribe. Please try again.'
      });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-8">
      {/* Current Subscription Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card className="border-2 border-primary/10 shadow-sm">
          <CardHeader className="flex items-center justify-between flex-row">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Current Subscription
              </CardTitle>
              <CardDescription>Your subscription status and plan details</CardDescription>
            </div>
            <div>
              {status === 'active' && (
                <Badge>
                  <CheckCircle className="w-4 h-4 mr-1" /> Active
                </Badge>
              )}
              {status === 'pending' && (
                <Badge variant="secondary">Pending Admin Approval</Badge>
              )}
              {status !== 'active' && status !== 'pending' && (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-text-muted">Plan</div>
                <div className="text-xl font-semibold">{currentPlan || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Payment Method</div>
                <div className="text-xl font-semibold capitalize">{currentMethod || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Status</div>
                <div className="text-xl font-semibold capitalize">{status}</div>
              </div>
              <div>
                <div className="text-xs text-text-muted">Last Update</div>
                <div className="text-xl font-semibold">{lastSubscriptionPayment?.date ? new Date(lastSubscriptionPayment.date).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Approval Banner for cash */}
      {currentMethod?.toLowerCase() === 'cash' && status !== 'active' && (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="text-amber-800 text-sm">
              <div className="font-semibold mb-1">Wait for confirmation</div>
              <div>Your payment is cash. Please wait for admin to confirm before accessing bus features.</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
              <Button variant="destructive" onClick={logout}>Logout</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Crown className="w-5 h-5 text-secondary" /> Your Plan
          </h2>
          <span className="text-sm text-text-muted">Select a plan and proceed to payment</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(((currentPlan && status) ? (plans || []).filter((p: Plan) => {
              const t = String(p.type || p.name || '').toLowerCase();
              const c = String(currentPlan).toLowerCase();
              return t === c;
            }) : (plans || [])) as Plan[]).map((plan) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.25 }}>
              <Card className={`relative group rounded-2xl border-2 ${ (currentPlan && (plan.name === currentPlan || plan.type === currentPlan)) ? 'border-secondary/50' : 'border-border'} hover:border-primary/40 shadow-sm hover:shadow-md transition` }>
                {(plan.recommended || plan.type === 'Two Terms' || plan.name?.toLowerCase().includes('two')) && (
                  <div className="absolute -top-3 left-4 text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/30 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Recommended
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="font-medium">{plan.duration || 'One term'}</span>
                    <span className="text-text-muted">•</span>
                    <span className="font-semibold">{typeof plan.price === 'number' ? `$${plan.price.toFixed(2)}` : '—'}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {['Access to bus routes','Priority support','Manage bookings'].map((feat, idx) => (
                      <li key={`${plan.id}-f-${idx}`} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-text-secondary">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex gap-3">
                    {(currentPlan && (plan.name === currentPlan || plan.type === currentPlan)) ? (
                      <>
                        <Button className="w-full" disabled>
                          Current Plan
                        </Button>
                        {String(currentPlan).toLowerCase() === 'term' && (
                          <Button variant="outline" onClick={() => handleChoosePlan(plan)}>
                            Upgrade to Two Terms
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button className="w-full" onClick={() => handleChoosePlan(plan)}>
                        {currentPlan ? 'Upgrade' : 'Choose Plan'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Method Modal */}
      <Modal isOpen={methodModalOpen} onClose={() => setMethodModalOpen(false)} title="Select Payment Method" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              className={`p-4 border rounded-xl text-left hover:border-primary/60 transition ${paymentMethod === 'bank' ? 'border-primary bg-primary-light' : 'border-border'}`}
              onClick={() => setPaymentMethod('bank')}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-semibold">Bank Transfer</div>
                  <div className="text-sm text-text-muted">Instant confirmation</div>
                </div>
              </div>
            </button>
            <button
              className={`p-4 border rounded-xl text-left hover:border-primary/60 transition ${paymentMethod === 'cash' ? 'border-primary bg-primary-light' : 'border-border'}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <div className="flex items-center gap-3">
                <Banknote className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-semibold">Cash</div>
                  <div className="text-sm text-text-muted">Pending admin confirmation</div>
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setMethodModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubscribe} disabled={submitting || !selectedPlan}>
              {submitting ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Pending Confirmation Modal for cash */}
      <Modal isOpen={pendingModalOpen} onClose={() => setPendingModalOpen(false)} title="Wait for Confirmation" size="md">
        <div className="space-y-4">
          <p className="text-text-secondary">Your selected method is cash. Please wait for admin to confirm your subscription.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
            <Button variant="destructive" onClick={logout}>Logout</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


