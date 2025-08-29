'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { 
  Bus, 
  Users, 
  Route, 
  Clock, 
  CheckCircle,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Activity,
  MapPin,
  Fuel,
  Gauge,
  Eye,
  RefreshCw,
  Zap,
  Car,
  Navigation,
  UserCheck,
  UserX,
  Clock3,
  Target,
  Award,
  FileText,
  BarChart3,
  Phone,
  Mail,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import { formatDate } from '@/utils/formatDate';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';
import { busAPI, userAPI, tripAPI } from '@/lib/api';

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
  status: string;
  distance?: number;
  schedule?: {
    frequency: string;
    departureTime: string;
    arrivalTime: string;
  };
  assignedBuses?: string[];
}

interface Driver {
  id: string;
  name: string;
  email: string;
  status: string;
  licenseNumber: string;
  experience: number;
  phone?: string;
}

interface Trip {
  id: string;
  busId: string;
  routeId: string;
  driverId: string;
  date: string;
  status: string;
  startTime: string;
  endTime: string;
  passengers?: number;
}

export default function MovementManagerDashboard() {
  // State for dynamic data
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get movement manager data
  const activeBuses = buses.filter(b => b.status === 'Active');
  const activeDrivers = drivers.filter(d => d.status === 'active');
  const activeRoutes = routes.filter(r => r.status === 'active');

  const { showToast } = useToast();

  // Fetch data on component mount
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const [busesResponse, driversData, tripsData] = await Promise.all([
        busAPI.getAll(),
        userAPI.getByRole('driver'),
        tripAPI.getAll()
      ]);

      setBuses(busesResponse.data);
      setRoutes(routesData);
      setDrivers(driversData);
      setTrips(tripsData);

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast({
        type: 'error',
        title: 'Error!',
        message: 'Failed to load dashboard data. Please refresh the page.'
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate statistics
  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTrips = trips.filter(t => t.date === today);
    
    const totalTrips = trips.length;
    const todayScheduled = todayTrips.filter(t => t.status === 'scheduled').length;
    const todayInProgress = todayTrips.filter(t => t.status === 'in-progress').length;
    const todayCompleted = todayTrips.filter(t => t.status === 'completed').length;
    const todayCancelled = todayTrips.filter(t => t.status === 'cancelled').length;
    
    const totalPassengers = trips.reduce((sum, trip) => sum + (trip.passengers || 0), 0);
    const avgPassengersPerTrip = totalTrips > 0 ? Math.round(totalPassengers / totalTrips) : 0;
    
    const busesInactive = buses.filter(b => b.status === 'Inactive').length;
    
    const driversInactive = drivers.filter(d => d.status === 'inactive').length;
    const driversOnLeave = drivers.filter(d => d.status === 'on-leave').length;

    return {
      totalTrips,
      todayScheduled,
      todayInProgress,
      todayCompleted,
      todayCancelled,
      totalPassengers,
      avgPassengersPerTrip,
      busesInactive,
      driversInactive,
      driversOnLeave
    };
  };

  // Get recent trips
  const getRecentTrips = () => {
    return trips
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  };

  // Get system health status
  const getSystemHealth = () => {
    const totalBuses = buses.length;
    const totalDrivers = drivers.length;
    const totalRoutes = routes.length;
    
    if (totalBuses === 0 || totalDrivers === 0 || totalRoutes === 0) {
      return { status: 'critical', message: 'System incomplete', color: 'text-red-600' };
    }
    
    const activeBusesRatio = activeBuses.length / totalBuses;
    const activeDriversRatio = activeDrivers.length / totalDrivers;
    
    if (activeBusesRatio < 0.5 || activeDriversRatio < 0.5) {
      return { status: 'warning', message: 'Limited capacity', color: 'text-yellow-600' };
    }
    
    return { status: 'operational', message: 'All systems normal', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading dashboard data...</p>
          <p className="mt-2 text-gray-500">Please wait while we gather fleet information</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const recentTrips = getRecentTrips();
  const systemHealth = getSystemHealth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <Navigation className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Movement Manager Dashboard</h1>
                  <p className="text-lg text-gray-600">Monitor fleet operations and coordinate drivers</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-lg font-medium text-gray-900">{formatDate(new Date().toISOString())}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">Active Buses</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Bus className="h-5 w-5 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{activeBuses.length.toLocaleString()}</div>
              <p className="text-sm text-blue-700 mt-1">
                {stats.busesInactive} inactive
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-green-800">Active Drivers</CardTitle>
              <div className="p-2 bg-green-200 rounded-lg">
                <Users className="h-5 w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{activeDrivers.length.toLocaleString()}</div>
              <p className="text-sm text-green-700 mt-1">
                {stats.driversInactive} inactive
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-purple-800">Active Routes</CardTitle>
              <div className="p-2 bg-purple-200 rounded-lg">
                <Route className="h-5 w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{activeRoutes.length.toLocaleString()}</div>
              <p className="text-sm text-purple-700 mt-1">
                {routes.length} total routes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-orange-800">Total Trips</CardTitle>
              <div className="p-2 bg-orange-200 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{stats.totalTrips.toLocaleString()}</div>
              <p className="text-sm text-orange-700 mt-1">
                {stats.totalPassengers} passengers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">Today's Trips</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {stats.todayScheduled + stats.todayInProgress + stats.todayCompleted}
                  </p>
                </div>
                <div className="p-3 bg-indigo-200 rounded-lg">
                  <Clock className="h-6 w-6 text-indigo-700" />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-600">Scheduled: {stats.todayScheduled}</span>
                  <span className="text-indigo-600">In Progress: {stats.todayInProgress}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-600">Completed: {stats.todayCompleted}</span>
                  <span className="text-indigo-600">Cancelled: {stats.todayCancelled}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">System Health</p>
                  <p className={`text-2xl font-bold ${systemHealth.color}`}>
                    {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  systemHealth.status === 'operational' ? 'bg-emerald-200' :
                  systemHealth.status === 'warning' ? 'bg-yellow-200' :
                  'bg-red-200'
                }`}>
                  {systemHealth.status === 'operational' ? (
                    <CheckCircle className="h-6 w-6 text-emerald-700" />
                  ) : systemHealth.status === 'warning' ? (
                    <AlertTriangle className="h-6 w-6 text-yellow-700" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-red-700" />
                  )}
                </div>
              </div>
              <p className="text-xs text-emerald-600 mt-2">{systemHealth.message}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-700">Avg Passengers/Trip</p>
                  <p className="text-2xl font-bold text-rose-900">{stats.avgPassengersPerTrip}</p>
                </div>
                <div className="p-3 bg-rose-200 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-rose-700" />
                </div>
              </div>
              <p className="text-xs text-rose-600 mt-2">Across all trips</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* Trips Overview */}
          <Card className="bg-white shadow-sm border-gray-100 rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Trips Overview
                  </CardTitle>
                  <CardDescription>Today and recent trips</CardDescription>
                </div>
                <Link href="/dashboard/movement-manager/trips">
                  <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                    <Eye className="w-4 h-4 mr-2" />
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">Scheduled</div>
                  <div className="text-xl font-bold text-blue-900">{stats.todayScheduled}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-600 font-medium">In Progress</div>
                  <div className="text-xl font-bold text-purple-900">{stats.todayInProgress}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-600 font-medium">Completed</div>
                  <div className="text-xl font-bold text-green-900">{stats.todayCompleted}</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xs text-red-600 font-medium">Cancelled</div>
                  <div className="text-xl font-bold text-red-900">{stats.todayCancelled}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {recentTrips.slice(0, 6).map((trip) => {
                  const bus = buses.find(b => b.id === trip.busId);
                  const route = routes.find(r => r.id === trip.routeId);
                  const driver = drivers.find(d => d.id === trip.driverId);
                  
                  const statusIcon = trip.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                                   trip.status === 'in-progress' ? <PlayCircle className="h-4 w-4 text-blue-600" /> :
                                   trip.status === 'scheduled' ? <Clock className="h-4 w-4 text-yellow-600" /> :
                                   <StopCircle className="h-4 w-4 text-red-600" />;
                  
                  return (
                    <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        {statusIcon}
                        <div>
                          <p className="font-medium text-gray-900">Trip #{trip.id.slice(-6)}</p>
                          <p className="text-sm text-gray-500">{trip.date} {trip.startTime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{bus ? `Bus ${bus.number}` : '-'}</p>
                        <p className="text-xs text-gray-500">{route ? route.name : '-'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Buses Overview */}
          <Card className="bg-white shadow-sm border-gray-100 rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Bus className="h-5 w-5 text-green-600" />
                    Buses Overview
                  </CardTitle>
                  <CardDescription>Status distribution and recent updates</CardDescription>
                </div>
                <Link href="/dashboard/movement-manager/buses">
                  <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                    <Eye className="w-4 h-4 mr-2" />
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-600 font-medium">Active</div>
                  <div className="text-xl font-bold text-green-900">{activeBuses.length}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium">Inactive</div>
                  <div className="text-xl font-bold text-gray-900">{stats.busesInactive}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {buses.slice(0, 6).map((bus) => {
                  const statusColor = bus.status === 'Active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';
                  
                  return (
                    <div key={bus.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Bus className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Bus {bus.busNumber}</p>
                          <p className="text-sm text-gray-500">Capacity: {bus.capacity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-xs ${statusColor}`}>
                          {bus.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">Speed: {bus.speed} km/h</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Routes Overview */}
          <Card className="bg-white shadow-sm border-gray-100 rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Route className="h-5 w-5 text-purple-600" />
                    Routes Overview
                  </CardTitle>
                  <CardDescription>Key routes and assignments</CardDescription>
                </div>
                <Link href="/dashboard/movement-manager/routes">
                  <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                    <Eye className="w-4 h-4 mr-2" />
                    View all
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xs text-purple-600 font-medium">Active</div>
                  <div className="text-xl font-bold text-purple-900">{activeRoutes.length}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium">Total</div>
                  <div className="text-xl font-bold text-gray-900">{routes.length}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {routes.slice(0, 6).map((route) => (
                  <div key={route.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{route.name}</h4>
                      <Badge variant={route.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {route.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {route.startPoint} → {route.endPoint}
                      </p>
                      {route.distance && (
                        <p className="flex items-center gap-2">
                          <Navigation className="h-3 w-3" />
                          {route.distance} km
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        <Bus className="h-3 w-3" />
                        {Array.isArray(route.assignedBuses) ? route.assignedBuses.length : 0} buses
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-white shadow-sm border-gray-100 rounded-2xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/dashboard/movement-manager/trips">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12">
                  <Calendar className="w-5 h-5 mr-2" />
                  Manage Trips
                </Button>
              </Link>
              <Link href="/dashboard/movement-manager/buses">
                <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 h-12">
                  <Bus className="w-5 h-5 mr-2" />
                  Manage Buses
                </Button>
              </Link>
              <Link href="/dashboard/movement-manager/routes">
                <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 h-12">
                  <Route className="w-5 h-5 mr-2" />
                  Manage Routes
                </Button>
              </Link>
              <Link href="/dashboard/movement-manager/drivers">
                <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50 h-12">
                  <Users className="w-5 h-5 mr-2" />
                  Manage Drivers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
