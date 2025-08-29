'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Bus, 
  Clock, 
  Download,
  Calendar,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Route,
  Activity,
  Target,
  Award,
  Zap,
  Search,
  Eye,
  RefreshCw,
  TrendingDown,
  UserCheck,
  UserX,
  Clock3,
  MapPin
} from 'lucide-react';
import { userAPI, busAPI, tripAPI, bookingAPI } from '@/lib/api';

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: number;
  assignedBusId: string;
  assignedRouteId: string;
  assignedSupervisorId: string;
}

interface Booking {
  id: string;
  studentId: string;
  tripId: string;
  date: string;
  status: string;
  seatNumber: number;
  paymentMethod: string;
  price: number;
}

interface LocalTrip {
  id: string;
  busId: string;
  driverId: string;
  conductorId?: string;
  date: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
  startLocation: string;
  endLocation: string;
  passengers?: number;
  revenue?: number;
  assignedStudents?: string[];
  supervisorId?: string;
}

interface Bus {
  id: string;
  number: string;
  capacity: number;
  driverId: string | null;
  status: string;
  assignedSupervisorId: string | null;
}

export default function SupervisorReportsPage() {
  const [dateRange, setDateRange] = useState('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [trips, setTrips] = useState<LocalTrip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Fetch data from db.json
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const [studentsRes, busesRes, tripsRes, bookingsRes] = await Promise.all([
        userAPI.getByRole('student'),
        busAPI.getAll(),
        tripAPI.getAll(),
        bookingAPI.getAll()
      ]);

      // Transform Trip data to LocalTrip format for this component
      const transformedTrips = tripsRes.map((trip: any) => ({
        id: trip.id,
        busId: trip.busId,
        driverId: trip.driverId,
        conductorId: trip.conductorId,
        date: trip.tripDate,
        status: 'scheduled' as const, // Default status since new schema doesn't include status
        startTime: trip.startTime,
        endTime: trip.endTime,
        startLocation: trip.startLocation,
        endLocation: trip.endLocation,
        passengers: trip.passengers,
        revenue: trip.revenue,
        assignedStudents: trip.assignedStudents,
        supervisorId: trip.supervisorId
      }));

      setStudents(studentsRes);
      setBuses(busesRes);
      setTrips(transformedTrips);
      setBookings(bookingsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get filtered data based on date range
  const getFilteredData = () => {
    const today = new Date();
    let startDate = new Date();
    let endDate = today;
    
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      switch (dateRange) {
        case 'today':
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          break;
        case 'week':
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          break;
        case 'quarter':
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
          break;
        default:
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }
    
    const filteredTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate >= startDate && tripDate <= endDate;
    });
    
    const filteredBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
    
    return { filteredTrips, filteredBookings, startDate, endDate };
  };

  // Calculate statistics
  const calculateStats = () => {
    const { filteredTrips, filteredBookings } = getFilteredData();
    
    const totalStudents = students.length;
    const activeStudents = students.filter(s => 
      filteredBookings.some(b => b.studentId === s.id)
    ).length;
    
    const totalTrips = filteredTrips.length;
    const completedTrips = filteredTrips.filter(t => t.status === 'completed').length;
    const inProgressTrips = filteredTrips.filter(t => t.status === 'in-progress').length;
    const cancelledTrips = filteredTrips.filter(t => t.status === 'cancelled').length;
    
    const totalPassengers = filteredTrips.reduce((sum, trip) => sum + (trip.passengers || 0), 0);
    
    const attendanceRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;
    const completionRate = totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0;
    const cancellationRate = totalTrips > 0 ? Math.round((cancelledTrips / totalTrips) * 100) : 0;
    
    const avgPassengersPerTrip = totalTrips > 0 ? Math.round(totalPassengers / totalTrips) : 0;
    
    return {
      totalStudents,
      activeStudents,
      totalTrips,
      completedTrips,
      inProgressTrips,
      cancelledTrips,
      totalPassengers,
      attendanceRate,
      completionRate,
      cancellationRate,
      avgPassengersPerTrip
    };
  };

  // Generate chart data
  const generateChartData = () => {
    const { filteredTrips, filteredBookings } = getFilteredData();
    
    // Daily attendance chart
    const dailyData = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayBookings = filteredBookings.filter(b => b.date === dateStr);
      const uniqueStudents = [...new Set(dayBookings.map(b => b.studentId))];
      
      dailyData.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        students: uniqueStudents.length,
        fullDate: dateStr
      });
    }

    // Trip status distribution
    const statusData: {status: string; count: number; percentage: number}[] = [];
    const statuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    statuses.forEach(status => {
      const statusTrips = filteredTrips.filter(t => t.status === status);
      statusData.push({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: statusTrips.length,
        percentage: filteredTrips.length > 0 ? Math.round((statusTrips.length / filteredTrips.length) * 100) : 0
      });
    });

    return { dailyData, statusData };
  };

  // Export report
  const exportReport = () => {
    const stats = calculateStats();
    const { dailyData, statusData } = generateChartData();
    const { startDate, endDate } = getFilteredData();
    
    const reportData = {
      dateRange: dateRange === 'custom' ? `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}` : dateRange,
      generatedAt: new Date().toISOString(),
      statistics: stats,
      dailyAttendance: dailyData,
      tripStatusDistribution: statusData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supervisor-report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get filtered and searched trips
  const getFilteredTrips = () => {
    const { filteredTrips } = getFilteredData();
    
    if (!searchTerm) return filteredTrips;
    
    return filteredTrips.filter(trip => 
      trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.date.includes(searchTerm) ||
      trip.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Loading reports data...</p>
          <p className="mt-2 text-gray-500">Please wait while we gather your insights</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const { dailyData, statusData } = generateChartData();
  const filteredTrips = getFilteredTrips();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Supervisor Reports</h1>
                  <p className="text-lg text-gray-600">Comprehensive insights and analytics for bus operations</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button onClick={exportReport} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm border-gray-100 rounded-2xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date Range</label>
                <Select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="custom">Custom Range</option>
                </Select>
              </div>
              
              {dateRange === 'custom' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Search Trips</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by ID, date, status..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">Total Students</CardTitle>
              <div className="p-2 bg-blue-200 rounded-lg">
                <Users className="h-5 w-5 text-blue-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.totalStudents.toLocaleString()}</div>
              <p className="text-sm text-blue-700 mt-1">Enrolled students</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-green-800">Active Students</CardTitle>
              <div className="p-2 bg-green-200 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{stats.activeStudents.toLocaleString()}</div>
              <p className="text-sm text-green-700 mt-1">{stats.attendanceRate}% attendance rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-purple-800">Total Trips</CardTitle>
              <div className="p-2 bg-purple-200 rounded-lg">
                <Route className="h-5 w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats.totalTrips.toLocaleString()}</div>
              <p className="text-sm text-purple-700 mt-1">{stats.completionRate}% completion rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-orange-800">Total Passengers</CardTitle>
              <div className="p-2 bg-orange-200 rounded-lg">
                <Users className="h-5 w-5 text-orange-700" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{stats.totalPassengers.toLocaleString()}</div>
              <p className="text-sm text-orange-700 mt-1">Across all trips</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-700">In Progress</p>
                  <p className="text-2xl font-bold text-indigo-900">{stats.inProgressTrips}</p>
                </div>
                <div className="p-3 bg-indigo-200 rounded-lg">
                  <Clock3 className="h-6 w-6 text-indigo-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Cancelled</p>
                  <p className="text-2xl font-bold text-red-900">{stats.cancelledTrips}</p>
                </div>
                <div className="p-3 bg-red-200 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Avg Passengers/Trip</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.avgPassengersPerTrip}</p>
                </div>
                <div className="p-3 bg-emerald-200 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Attendance Chart */}
          <Card className="bg-white shadow-sm border-gray-100 rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Daily Student Attendance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80">
                <div className="flex items-end justify-between h-64 space-x-3">
                  {dailyData.map((item, index) => (
                    <div key={index} className="flex flex-col items-center space-y-3 flex-1">
                      <div className="text-sm font-medium text-gray-700 text-center">
                        {item.students}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700 cursor-pointer group"
                        style={{ height: `${Math.max(item.students * 4, 20)}px` }}
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-xs font-medium text-center pt-1">
                          {item.students}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 font-medium text-center">{item.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trip Status Distribution */}
          <Card className="bg-white shadow-sm border-gray-100 rounded-2xl">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Trip Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'Completed' ? 'bg-green-500' :
                        item.status === 'In-progress' ? 'bg-blue-500' :
                        item.status === 'Scheduled' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700">{item.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                      <span className="text-xs text-gray-500">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trips Table */}
        <Card className="bg-white shadow-sm border-gray-100 rounded-2xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Recent Trips
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Trip ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Passengers</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrips.slice(0, 10).map((trip, index) => (
                    <tr key={trip.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-gray-900">#{trip.id.slice(-6)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">{new Date(trip.date).toLocaleDateString()}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">{trip.startTime} - {trip.endTime}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant={
                            trip.status === 'completed' ? 'default' :
                            trip.status === 'in-progress' ? 'secondary' :
                            trip.status === 'scheduled' ? 'outline' :
                            'destructive'
                          }
                          className="capitalize"
                        >
                          {trip.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{trip.passengers || 0}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTrips.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No trips found for the selected criteria</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or date range</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
