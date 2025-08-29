'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { 
	Bus, 
	Route, 
	CreditCard, 
	Calendar,
	CheckCircle,
	Clock,
	Bell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { studentProfileAPI, paymentAPI, bookingAPI, notificationAPI, tripAPI, subscriptionPlansAPI } from '@/lib/api';

export default function StudentDashboard() {
	const { user } = useAuth();
	const [isLoading, setIsLoading] = useState(true);
	const [stats, setStats] = useState<any>(null);
	const { showToast } = useToast();
	const [requireSubscriptionSetup, setRequireSubscriptionSetup] = useState(false);
	const [plans, setPlans] = useState<any[]>([]);
	const [selectedPlan, setSelectedPlan] = useState<string>('');
	const [paymentMethod, setPaymentMethod] = useState<'bank' | 'cash'>('bank');
	const [submitting, setSubmitting] = useState(false);
	const [waitForConfirmation, setWaitForConfirmation] = useState(false);
	const [latestBooking, setLatestBooking] = useState<any | null>(null);
	const [latestTrip, setLatestTrip] = useState<any | null>(null);
	const [currentPlanName, setCurrentPlanName] = useState<string | null>(null);
	const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
	const [activeBookingsCount, setActiveBookingsCount] = useState<number>(0);

	// Fetch student dashboard data
	useEffect(() => {
		const fetchStudentData = async () => {
			if (!user) return;
			try {
				setIsLoading(true);
				setStats({});
				// determine if subscription setup is required
				try {
					const [profileRes, paymentsRes, plansData, bookingsRes, notifRes] = await Promise.all([
						studentProfileAPI.getProfile(user.id),
						paymentAPI.getByStudent(user.id),
						subscriptionPlansAPI.getAll().catch(() => []),
						bookingAPI.getByStudent(user.id),
						notificationAPI.getByUser(user.id)
					]);
					const profile = profileRes;
					const payments = paymentsRes;
					setPlans(plansData || []);
					const bookings = bookingsRes;
					const notifications = notifRes;

					const hasActive = Array.isArray(payments) && payments.some((p: any) => p.status === 'completed' && !p.tripId);
					const profileActive = profile?.subscriptionStatus === 'active';
					const hasAnySubscriptionRecord = Array.isArray(payments) && payments.some((p: any) => !p.tripId);
					const hasChosenPlan = Boolean(profile?.subscriptionPlan);
					setRequireSubscriptionSetup(!(hasActive || profileActive || hasAnySubscriptionRecord || hasChosenPlan));

					// Show Wait for Confirmation modal when method is cash and not active
					const lastSubPayment = (Array.isArray(payments) ? payments : []).filter((x: any) => !x.tripId)
						.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
					const method = String(lastSubPayment?.method || profile?.paymentMethod || '').toLowerCase();
					const status = String(profile?.subscriptionStatus || lastSubPayment?.status || '').toLowerCase();
					setWaitForConfirmation(method === 'cash' && status !== 'active');

					// determine current plan name
					const planFromProfile = profile?.subscriptionPlan;
					const planFromPayment = lastSubPayment?.description ? String(lastSubPayment.description).replace(/^Subscription\s+/i, '') : '';
					const resolvedPlan = planFromProfile || planFromPayment || null;
					setCurrentPlanName(resolvedPlan);

					// latest booking + trip
					const latest = (Array.isArray(bookings) ? bookings : [])
						.filter((b: any) => b && b.date)
						.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
					setLatestBooking(latest || null);
					if (latest?.tripId) {
						try {
							const tRes = await tripAPI.getById(latest.tripId);
							const trip = tRes;
							setLatestTrip(trip);
						} catch {}
					} else {
						setLatestTrip(null);
					}

					// quick stats
					setActiveBookingsCount((Array.isArray(bookings) ? bookings : []).filter((b: any) => b.status === 'confirmed').length);
					setUnreadNotifications((Array.isArray(notifications) ? notifications : []).filter((n: any) => n.read !== true && n.status !== 'read').length);
				} catch {}
			} catch (error) {
				console.error('Failed to fetch student data:', error);
				showToast({ type: 'error', title: 'Error!', message: 'Failed to load dashboard data. Please try again.' });
			} finally {
				setIsLoading(false);
			}
		};
		fetchStudentData();
	}, [user, showToast]);

	const submitSubscription = async () => {
		if (!user || !selectedPlan) return;
		try {
			setSubmitting(true);
			const res = await subscriptionPlansAPI.create({
				studentId: user.id,
				planId: selectedPlan,
				startDate: new Date().toISOString(),
				endDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Placeholder duration
				status: 'active'
			});
			const data = res;
			if (!res) {
				showToast({ type: 'error', title: 'Error!', message: 'Failed to set subscription' });
				return;
			}
			setRequireSubscriptionSetup(false);
			showToast({ type: 'success', title: 'Success!', message: 'Subscription saved' });
			window.location.reload();
		} catch (e) {
			showToast({ type: 'error', title: 'Error!', message: 'Failed to set subscription' });
		} finally {
			setSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-8 p-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto shadow-lg"></div>
						<p className="mt-6 text-text-secondary text-lg font-medium">Loading dashboard...</p>
					</div>
				</div>
			</div>
		);
	}

	if (!stats) {
		return (
			<div className="space-y-8 p-6">
				<div className="flex items-center justify-center h-64">
					<div className="text-center">
						<div className="text-red-500 text-6xl mb-4">⚠️</div>
						<h3 className="text-lg font-medium mb-2">Failed to load data</h3>
						<p className="text-sm text-gray-500">Unable to load dashboard statistics</p>
						<Button onClick={() => window.location.reload()} className="mt-4" variant="outline">Try Again</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8 p-6">
			{/* Cash Pending Modal */}
			<Modal isOpen={waitForConfirmation} onClose={() => {}} title="Wait for Confirmation" size="md">
				<div className="space-y-4">
					<p className="text-sm text-text-secondary">Your payment method is Cash. Please wait for admin to confirm your subscription before accessing features.</p>
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
						<Button variant="destructive" onClick={() => { window.location.href = '/auth/login'; }}>Logout</Button>
					</div>
				</div>
			</Modal>

			{/* Force subscription setup modal on first login */}
			<Modal isOpen={requireSubscriptionSetup} onClose={() => { /* block close until setup */ }} title="Complete Your Subscription" size="lg">
				<div className="space-y-4">
					<p className="text-sm text-text-secondary">Please choose your subscription plan and payment method to proceed.</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-text-primary mb-1">Plan</label>
							<Select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}
								options={[{ value: '', label: 'Select Plan' }, ...(plans || []).map((p: any) => ({ value: p.type || p.name, label: p.name }))]} />
						</div>
						<div>
							<label className="block text-sm font-medium text-text-primary mb-1">Payment Method</label>
							<Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'bank' | 'cash')}
								options={[{ value: 'bank', label: 'Bank Transfer' }, { value: 'cash', label: 'Cash (manual confirm)' }]} />
						</div>
					</div>
					<div className="flex justify-end gap-2 pt-2">
						<Button onClick={submitSubscription} disabled={submitting || !selectedPlan}>{submitting ? 'Saving...' : 'Save & Continue'}</Button>
					</div>
				</div>
			</Modal>

			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold text-text-primary mb-1">Welcome, {user?.name || 'Student'}</h1>
					<p className="text-text-secondary">Here is your study commute overview</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" onClick={() => { window.location.href = '/dashboard/student/notifications'; }}><Bell className="w-4 h-4 mr-2" /> Notifications</Button>
					<Button onClick={() => { window.location.href = '/dashboard/student/bookings'; }}><Calendar className="w-4 h-4 mr-2" /> Book a Trip</Button>
				</div>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-text-secondary">Unread Notifications</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{unreadNotifications}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-text-secondary">Active Bookings</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{activeBookingsCount}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm text-text-secondary">Current Plan</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-semibold">{currentPlanName || '—'}</div>
						<div className="mt-2">{waitForConfirmation ? (<Badge variant="secondary">Pending</Badge>) : (<Badge>Active</Badge>)}</div>
					</CardContent>
				</Card>
			</div>

			{/* Subscription Overview */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Subscription Overview</CardTitle>
					<CardDescription>Your current plan and subscription status</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div>
							<div className="text-xs text-text-muted">Plan</div>
							<div className="text-xl font-semibold">{currentPlanName || '—'}</div>
						</div>
						<div>
							<div className="text-xs text-text-muted">Status</div>
							<div className="mt-1">{waitForConfirmation ? (<Badge variant="secondary">Pending</Badge>) : (<Badge>Active</Badge>)}</div>
						</div>
						<div>
							<Button variant="outline" onClick={() => { window.location.href = '/dashboard/student/subscription'; }}>Manage Subscription</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Upcoming Trip */}
			{latestBooking && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2"><Bus className="w-5 h-5 text-primary" /> Upcoming Trip</CardTitle>
						<CardDescription>Your most recent booking</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
							<div>
								<div className="text-xs text-text-muted">Date</div>
								<div className="font-medium">{new Date(latestBooking.date).toLocaleDateString()}</div>
							</div>
							<div>
								<div className="text-xs text-text-muted">Route</div>
								<div className="font-medium">{latestTrip ? `${latestTrip.startLocation || 'Start'} → ${latestTrip.endLocation || 'End'}` : '-'}</div>
							</div>
							<div>
								<div className="text-xs text-text-muted">Time</div>
								<div className="font-medium flex items-center gap-2"><Clock className="w-4 h-4" /> {latestTrip?.startTime || '-'}</div>
							</div>
						</div>
						<div className="mt-4">
							<Button variant="outline" onClick={() => { window.location.href = '/dashboard/student/bookings'; }}>View All Bookings</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
