import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    // Get all data
    const users = db.users || [];
    const buses = db.buses || [];
    const routes = db.routes || [];
    const trips = db.trips || [];
    const payments = db.payments || [];
    const bookings = db.bookings || [];
    const attendance = db.attendance || [];
    const announcements = db.announcements || [];
    
    // Filter data by date range if provided
    let filteredTrips = trips;
    let filteredPayments = payments;
    let filteredBookings = bookings;
    let filteredAttendance = attendance;
    
    if (startDate && endDate) {
      filteredTrips = trips.filter((trip: any) => 
        trip.date >= startDate && trip.date <= endDate
      );
      
      filteredPayments = payments.filter((payment: any) => 
        payment.date >= startDate && payment.date <= endDate
      );
      
      filteredBookings = bookings.filter((booking: any) => 
        booking.date >= startDate && booking.date <= endDate
      );
      
      filteredAttendance = attendance.filter((record: any) => 
        record.timestamp >= startDate && record.timestamp <= endDate
      );
    }

    // Calculate user statistics by role
    const students = users.filter((user: any) => user.role === 'student');
    const drivers = users.filter((user: any) => user.role === 'driver');
    const supervisors = users.filter((user: any) => user.role === 'supervisor');
    const movementManagers = users.filter((user: any) => user.role === 'movement-manager');
    const admins = users.filter((user: any) => user.role === 'admin');

    // Calculate financial metrics
    const totalRevenue = filteredPayments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    const pendingRevenue = filteredPayments
      .filter((p: any) => p.status === 'pending')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    const failedRevenue = filteredPayments
      .filter((p: any) => p.status === 'failed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Calculate trip statistics
    const totalTrips = filteredTrips.length;
    const completedTrips = filteredTrips.filter((t: any) => t.status === 'completed').length;
    const activeTrips = filteredTrips.filter((t: any) => t.status === 'active').length;
    const scheduledTrips = filteredTrips.filter((t: any) => t.status === 'scheduled').length;
    const cancelledTrips = filteredTrips.filter((t: any) => t.status === 'cancelled').length;

    // Calculate booking statistics
    const totalBookings = filteredBookings.length;
    const confirmedBookings = filteredBookings.filter((b: any) => b.status === 'confirmed').length;
    const pendingBookings = filteredBookings.filter((b: any) => b.status === 'pending').length;
    const cancelledBookings = filteredBookings.filter((b: any) => b.status === 'cancelled').length;

    // Calculate attendance statistics
    const totalAttendance = filteredAttendance.length;
    const presentStudents = filteredAttendance.filter((a: any) => a.status === 'present').length;
    const absentStudents = filteredAttendance.filter((a: any) => a.status === 'absent').length;
    const overallAttendanceRate = totalAttendance > 0 ? (presentStudents / totalAttendance) * 100 : 0;

    // Calculate monthly trends (last 12 months)
    const monthlyTrends = {};
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = month.toISOString().slice(0, 7); // YYYY-MM
      
      const monthTrips = filteredTrips.filter((trip: any) => 
        trip.date && trip.date.startsWith(monthKey)
      );
      
      const monthPayments = filteredPayments.filter((payment: any) => 
        payment.date && payment.date.startsWith(monthKey) && payment.status === 'completed'
      );
      
      const monthBookings = filteredBookings.filter((booking: any) => 
        booking.date && booking.date.startsWith(monthKey)
      );
      
      monthlyTrends[monthKey] = {
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        trips: monthTrips.length,
        revenue: monthPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
        bookings: monthBookings.length,
        passengers: monthTrips.reduce((sum: number, t: any) => sum + (t.passengers || 0), 0)
      };
    }

    // Calculate route performance
    const routePerformance = routes.map((route: any) => {
      const routeTrips = filteredTrips.filter((trip: any) => trip.routeId === route.id);
      const routeBookings = routeTrips.flatMap((trip: any) => 
        filteredBookings.filter((booking: any) => booking.tripId === trip.id)
      );
      
      const routePayments = routeTrips.flatMap((trip: any) => 
        filteredPayments.filter((payment: any) => payment.tripId === trip.id)
      );
      
      const totalCapacity = routeTrips.reduce((sum: number, trip: any) => {
        const bus = buses.find((b: any) => b.id === trip.busId);
        return sum + (bus?.capacity || 0);
      }, 0);
      
      const totalPassengers = routeTrips.reduce((sum: number, trip: any) => 
        sum + (trip.passengers || 0), 0
      );
      
      const totalRevenue = routePayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      const utilization = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
      
      return {
        routeId: route.id,
        routeName: route.name,
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        totalTrips: routeTrips.length,
        totalBookings: routeBookings.length,
        totalPassengers,
        totalCapacity,
        totalRevenue,
        utilization: Math.round(utilization * 100) / 100,
        completionRate: routeTrips.length > 0 ? 
          (routeTrips.filter((t: any) => t.status === 'completed').length / routeTrips.length) * 100 : 0
      };
    });

    // Calculate bus performance
    const busPerformance = buses.map((bus: any) => {
      const busTrips = filteredTrips.filter((trip: any) => trip.busId === bus.id);
      const completedTrips = busTrips.filter((trip: any) => trip.status === 'completed');
      
      const busBookings = busTrips.flatMap((trip: any) => 
        filteredBookings.filter((booking: any) => booking.tripId === trip.id)
      );
      
      const busPayments = busTrips.flatMap((trip: any) => 
        filteredPayments.filter((payment: any) => payment.tripId === trip.id)
      );
      
      const totalRevenue = busPayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      const totalPassengers = busTrips.reduce((sum: number, trip: any) => 
        sum + (trip.passengers || 0), 0
      );
      
      const utilizationRate = busTrips.length > 0 ? 
        (totalPassengers / (bus.capacity * busTrips.length)) * 100 : 0;
      
      return {
        busId: bus.id,
        busNumber: bus.number,
        model: bus.model,
        capacity: bus.capacity,
        status: bus.status,
        totalTrips: busTrips.length,
        completedTrips: completedTrips.length,
        completionRate: busTrips.length > 0 ? (completedTrips.length / busTrips.length) * 100 : 0,
        totalBookings: busBookings.length,
        totalPassengers,
        totalRevenue,
        utilizationRate: Math.round(utilizationRate * 100) / 100
      };
    });

    // Calculate driver performance
    const driverPerformance = drivers.map((driver: any) => {
      const driverTrips = filteredTrips.filter((trip: any) => trip.driverId === driver.id);
      const completedTrips = driverTrips.filter((trip: any) => trip.status === 'completed');
      
      const driverBookings = driverTrips.flatMap((trip: any) => 
        filteredBookings.filter((booking: any) => booking.tripId === trip.id)
      );
      
      const driverPayments = driverTrips.flatMap((trip: any) => 
        filteredPayments.filter((payment: any) => payment.tripId === trip.id)
      );
      
      const totalRevenue = driverPayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      const totalPassengers = driverTrips.reduce((sum: number, trip: any) => 
        sum + (trip.passengers || 0), 0
      );
      
      return {
        driverId: driver.id,
        driverName: driver.name,
        licenseNumber: driver.licenseNumber,
        totalTrips: driverTrips.length,
        completedTrips: completedTrips.length,
        completionRate: driverTrips.length > 0 ? (completedTrips.length / driverTrips.length) * 100 : 0,
        totalBookings: driverBookings.length,
        totalPassengers,
        totalRevenue
      };
    });

    // Calculate supervisor performance
    const supervisorPerformance = supervisors.map((supervisor: any) => {
      const supervisorTrips = filteredTrips.filter((trip: any) => trip.supervisorId === supervisor.id);
      const completedTrips = supervisorTrips.filter((trip: any) => trip.status === 'completed');
      
      const supervisorBookings = supervisorTrips.flatMap((trip: any) => 
        filteredBookings.filter((booking: any) => booking.tripId === trip.id)
      );
      
      const supervisorPayments = supervisorTrips.flatMap((trip: any) => 
        filteredPayments.filter((payment: any) => payment.tripId === trip.id)
      );
      
      const totalRevenue = supervisorPayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      const totalPassengers = supervisorTrips.reduce((sum: number, trip: any) => 
        sum + (trip.passengers || 0), 0
      );
      
      return {
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        totalTrips: supervisorTrips.length,
        completedTrips: completedTrips.length,
        completionRate: supervisorTrips.length > 0 ? (completedTrips.length / supervisorTrips.length) * 100 : 0,
        totalBookings: supervisorBookings.length,
        totalPassengers,
        totalRevenue
      };
    });

    // Calculate payment methods distribution
    const paymentMethods = {};
    filteredPayments.forEach((payment: any) => {
      const method = payment.method || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Calculate booking status distribution
    const bookingStatuses = {};
    filteredBookings.forEach((booking: any) => {
      const status = booking.status || 'unknown';
      bookingStatuses[status] = (bookingStatuses[status] || 0) + 1;
    });

    // Calculate trip status distribution
    const tripStatuses = {};
    filteredTrips.forEach((trip: any) => {
      const status = trip.status || 'unknown';
      tripStatuses[status] = (tripStatuses[status] || 0) + 1;
    });

    const analyticsData = {
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all'
      },
      summary: {
        users: {
          total: users.length,
          students: students.length,
          drivers: drivers.length,
          supervisors: supervisors.length,
          movementManagers: movementManagers.length,
          admins: admins.length
        },
        fleet: {
          totalBuses: buses.length,
          activeBuses: buses.filter((b: any) => b.status === 'active').length,
          maintenanceBuses: buses.filter((b: any) => b.status === 'maintenance').length,
          retiredBuses: buses.filter((b: any) => b.status === 'retired').length
        },
        routes: {
          total: routes.length,
          active: routes.filter((r: any) => r.status === 'active').length,
          inactive: routes.filter((r: any) => r.status === 'inactive').length
        },
        trips: {
          total: totalTrips,
          completed: completedTrips,
          active: activeTrips,
          scheduled: scheduledTrips,
          cancelled: cancelledTrips,
          completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          pending: pendingBookings,
          cancelled: cancelledBookings,
          confirmationRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0
        },
        attendance: {
          total: totalAttendance,
          present: presentStudents,
          absent: absentStudents,
          rate: Math.round(overallAttendanceRate * 100) / 100
        },
        financial: {
          totalRevenue,
          pendingRevenue,
          failedRevenue,
          netRevenue: totalRevenue - failedRevenue,
          averageRevenuePerTrip: totalTrips > 0 ? totalRevenue / totalTrips : 0,
          averageRevenuePerBooking: totalBookings > 0 ? totalRevenue / totalBookings : 0
        }
      },
      trends: {
        monthly: Object.values(monthlyTrends),
        paymentMethods,
        bookingStatuses,
        tripStatuses
      },
      performance: {
        routes: routePerformance.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue),
        buses: busPerformance.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue),
        drivers: driverPerformance.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue),
        supervisors: supervisorPerformance.sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      },
      topPerformers: {
        routes: routePerformance
          .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
          .slice(0, 5),
        buses: busPerformance
          .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
          .slice(0, 5),
        drivers: driverPerformance
          .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
          .slice(0, 5),
        supervisors: supervisorPerformance
          .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
          .slice(0, 5)
      }
    };
    
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error calculating admin analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
