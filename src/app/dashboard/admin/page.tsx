'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BarChart } from '@/components/charts/BarChart';
import { PieChart } from '@/components/charts/PieChart';
import { LineChart } from '@/components/charts/LineChart';
import { useToast } from '@/components/ui/Toast';
import { 
  Users, 
  Bus, 
  Route, 
  CreditCard, 
  TrendingUp,
  Activity,
  Shield,
  UserCheck,
  MapPin,
  DollarSign,
  Calendar,
  Clock
} from 'lucide-react';
import { userAPI, busAPI, tripAPI } from '@/lib/api';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

// Type definitions based on db.json structure
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'driver' | 'supervisor' | 'movement-manager';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  phone?: string;
  avatar?: string;
  studentId?: string;
  department?: string;
  year?: number;
  subscriptionStatus?: string;
  subscriptionExpiry?: string;
  assignedBusId?: string;
  assignedRouteId?: string;
  assignedSupervisorId?: string;
  licenseNumber?: string;
  experience?: number;
  permissions?: string[];
  assignedStudents?: string[];
  assignedDrivers?: string[];
}

interface Bus {
  id: number;
  busNumber: string;
  capacity: number;
  status: 'Active' | 'Inactive';
  speed: number;
}

interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  stops: Array<{
    lat: number;
    lng: number;
    name: string;
  }>;
  schedule: {
    departureTime: string;
    arrivalTime: string;
    days: string[];
  };
  estimatedDuration: number;
  distance: number;
  status: 'active' | 'inactive';
  assignedBuses: string[];
  assignedSupervisors: string[];
}

interface Trip {
  id: string;
  busId: string;
  routeId: string;
  driverId: string;
  date: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  passengers: number;
  revenue: number;
  assignedStudents: string[];
  supervisorId?: string;
}

interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  method: string;
  description: string;
  transactionId?: string;
  tripId?: string;
}

interface Analytics {
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  paymentStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  routeUtilization: Array<{
    route: string;
    utilization: number;
    trips: number;
    passengers: number;
  }>;
  busPerformance: Array<{
    bus: string;
    onTimeRate: number;
    fuelEfficiency: number;
    avgSpeed: number;
  }>;
}

interface DashboardStats {
  totalStudents: number;
  totalAdmins: number;
  totalDrivers: number;
  totalSupervisors: number;
  totalMovementManagers: number;
  totalBuses: number;
  totalRoutes: number;
  totalRevenue: number;
  todayTrips: number;
  completedTrips: number;
  activeBuses: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const { showToast } = useToast();

  // Fetch dashboard data from db.json
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [usersData, busesResponse, tripsData] = await Promise.all([
          userAPI.getAll(),
          busAPI.getAll(),
          tripAPI.getAll(),
        ]);

        setUsers(usersData || []);
        setBuses(busesResponse?.data || busesResponse || []);
        setRoutes(routesData || []);
        setTrips(tripsData || []);
        setPayments([]); // No payments data available
        setAnalytics(null); // No analytics data available

        // Calculate comprehensive stats from db.json data
        const totalStudents = (usersData || []).filter((u: User) => u.role === 'student').length;
        const totalAdmins = (usersData || []).filter((u: User) => u.role === 'admin').length;
        const totalDrivers = (usersData || []).filter((u: User) => u.role === 'driver').length;
        const totalSupervisors = (usersData || []).filter((u: User) => u.role === 'supervisor').length;
        const totalMovementManagers = (usersData || []).filter((u: User) => u.role === 'movement-manager').length;
        const totalBuses = (busesResponse?.data || busesResponse || []).length;
        const totalRoutes = (routesData || []).length;
        const totalRevenue = 0; // No payments data available
        const todayTrips = (tripsData || []).filter((t: Trip) => t.date === new Date().toISOString().split('T')[0]).length;
        const completedTrips = (tripsData || []).filter((t: Trip) => t.status === 'completed').length;
        const activeBuses = (busesResponse?.data || busesResponse || []).filter((b: Bus) => b.status === 'Active').length;
        const maintenanceBuses = 0; // New API doesn't have maintenance status

        setStats({
          totalStudents,
          totalAdmins,
          totalDrivers,
          totalSupervisors,
          totalMovementManagers,
          totalBuses,
          totalRoutes,
          totalRevenue,
          todayTrips,
          completedTrips,
          activeBuses,
          totalUsers: (usersData || []).length
        });

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Set empty data on error
        setUsers([]);
        setBuses([]);
        setRoutes([]);
        setTrips([]);
        setPayments([]);
        setAnalytics(null);
        
        // Set default stats
        setStats({
          totalStudents: 0,
          totalAdmins: 0,
          totalDrivers: 0,
          totalSupervisors: 0,
          totalMovementManagers: 0,
          totalBuses: 0,
          totalRoutes: 0,
          totalRevenue: 0,
          todayTrips: 0,
          completedTrips: 0,
          activeBuses: 0,
          totalUsers: 0
        });
        
        showToast({
          type: 'error',
          title: 'Error!',
          message: 'Failed to load dashboard data. Some features may be limited.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    // Empty dependency array to avoid re-runs causing state loops
  }, []);

  // Chart data preparation from db.json
  const monthlyRevenueData = null; // No analytics data available

  const paymentStatusData = {
    labels: ['No Data Available'],
    datasets: [
      {
        label: 'Payments',
        data: [0],
        backgroundColor: ['#6B7280'],
        borderWidth: 2,
      },
    ],
  };

  const userRoleDistributionData = {
    labels: ['Students', 'Drivers', 'Supervisors', 'Movement Managers', 'Admins'],
    datasets: [
      {
        label: 'Users',
        data: [
          stats?.totalStudents || 0,
          stats?.totalDrivers || 0,
          stats?.totalSupervisors || 0,
          stats?.totalMovementManagers || 0,
          stats?.totalAdmins || 0,
        ],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'],
        borderWidth: 2,
      },
    ],
  };

  const busStatusData = {
    labels: ['Active', 'Maintenance', 'Inactive'],
    datasets: [
      {
        label: 'Buses',
        data: [
          stats?.activeBuses || 0,
          stats?.maintenanceBuses || 0,
          (stats?.totalBuses || 0) - (stats?.activeBuses || 0) - (stats?.maintenanceBuses || 0),
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#6B7280'],
        borderWidth: 2,
      },
    ],
  };

  // Recent activities based on real data from db.json
  const getRecentActivities = () => {
    interface Activity {
      id: string;
      action: string;
      user: string;
      time: string;
      type: 'success' | 'info' | 'warning';
      icon: React.ReactNode;
    }
    
    const activities: Activity[] = [];
    
    // No payments data available - payments API removed

    // Add recent trips from db.json
    const recentTrips = trips
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2);
    
    recentTrips.forEach(trip => {
      const driver = users.find(u => u.id === trip.driverId);
      const route = routes.find(r => r.id === trip.routeId);
      activities.push({
        id: `trip-${trip.id}`,
        action: `Trip completed: ${route?.name || 'Unknown Route'}`,
        user: driver?.name || 'Unknown Driver',
        time: formatDate(trip.date),
        type: 'info',
        icon: <Route className="w-4 h-4" />
      });
    });

    // Add recent user registrations from db.json
    const recentUsers = users
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        action: `New ${user.role} registered`,
        user: user.name,
        time: formatDate(user.createdAt),
        type: 'info',
        icon: <Users className="w-4 h-4" />
      });
    });

    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6);
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

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary mb-2">Admin Dashboard</h1>
          <p className="text-text-secondary text-lg">Comprehensive overview of your bus system operations</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-text-muted">Last Updated</p>
            <p className="text-sm font-medium">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Total Students</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              <Users className="h-4 w-4 text-blue-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{formatNumber(stats?.totalStudents || 0)}</div>
            <p className="text-xs text-text-muted">
              Active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Total Drivers</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
              <UserCheck className="h-4 w-4 text-green-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">{formatNumber(stats?.totalDrivers || 0)}</div>
            <p className="text-xs text-text-muted">
              Licensed drivers
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Active Buses</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
              <Bus className="h-4 w-4 text-purple-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">{formatNumber(stats?.activeBuses || 0)}</div>
            <p className="text-xs text-text-muted">
              {stats?.maintenanceBuses || 0} in maintenance
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Total Routes</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
              <MapPin className="h-4 w-4 text-orange-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">{formatNumber(stats?.totalRoutes || 0)}</div>
            <p className="text-xs text-text-muted">
              Active routes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Total Revenue</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <DollarSign className="h-4 w-4 text-emerald-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 mb-1">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-text-muted">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Today&apos;s Trips</CardTitle>
            <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <Calendar className="h-4 w-4 text-indigo-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600 mb-1">{formatNumber(stats?.todayTrips || 0)}</div>
            <p className="text-xs text-text-muted">
              {stats?.completedTrips || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Supervisors</CardTitle>
            <div className="p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
              <Shield className="h-4 w-4 text-cyan-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-600 mb-1">{formatNumber(stats?.totalSupervisors || 0)}</div>
            <p className="text-xs text-text-muted">
              Active supervisors
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Movement Managers</CardTitle>
            <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
              <Activity className="h-4 w-4 text-rose-600 group-hover:text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-600 mb-1">{formatNumber(stats?.totalMovementManagers || 0)}</div>
            <p className="text-xs text-text-muted">
              Fleet managers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Monthly Revenue</span>
            </CardTitle>
            <CardDescription>Revenue trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRevenueData ? (
              <BarChart data={monthlyRevenueData} height={300} />
            ) : (
              <div className="h-64 flex items-center justify-center text-text-muted">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>Payment Status Distribution</span>
            </CardTitle>
            <CardDescription>Overview of payment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={paymentStatusData} height={300} />
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>User Role Distribution</span>
            </CardTitle>
            <CardDescription>Breakdown of users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={userRoleDistributionData} height={300} />
          </CardContent>
        </Card>

        {/* Bus Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bus className="w-5 h-5 text-orange-600" />
              <span>Bus Status Distribution</span>
            </CardTitle>
            <CardDescription>Current status of all buses</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={busStatusData} height={300} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Latest system activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getRecentActivities().map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-4 rounded-lg hover:bg-card-hover transition-colors duration-200">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'success' ? 'bg-green-100 text-green-600' :
                  activity.type === 'info' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">{activity.action}</p>
                  <p className="text-xs text-text-muted flex items-center space-x-2">
                    <span>by {activity.user}</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{activity.time}</span>
                    </span>
                  </p>
                </div>
                <Badge variant={activity.type === 'success' ? 'success' : 'secondary'}>
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{formatNumber(stats?.totalUsers || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-500 rounded-lg">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Fleet Size</p>
                <p className="text-2xl font-bold text-green-900">{formatNumber(stats?.totalBuses || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Route className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-700">Active Routes</p>
                <p className="text-2xl font-bold text-purple-900">{formatNumber(stats?.totalRoutes || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
