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
    
    // Filter data by date range if provided
    let filteredTrips = trips;
    if (startDate && endDate) {
      filteredTrips = trips.filter((trip: any) => 
        trip.date >= startDate && trip.date <= endDate
      );
    }
    
    // Filter other data based on filtered trips
    const tripIds = filteredTrips.map((trip: any) => trip.id);
    const filteredPayments = payments.filter((payment: any) => 
      tripIds.includes(payment.tripId)
    );
    const filteredBookings = bookings.filter((booking: any) => 
      tripIds.includes(booking.tripId)
    );
    const filteredAttendance = attendance.filter((record: any) => 
      tripIds.includes(record.tripId)
    );

    // Calculate fleet performance metrics
    const fleetPerformance = buses.map((bus: any) => {
      const busTrips = filteredTrips.filter((trip: any) => trip.busId === bus.id);
      const completedTrips = busTrips.filter((trip: any) => trip.status === 'completed');
      const activeTrips = busTrips.filter((trip: any) => trip.status === 'active');
      const cancelledTrips = busTrips.filter((trip: any) => trip.status === 'cancelled');
      
      const busBookings = filteredBookings.filter((booking: any) => 
        busTrips.some((trip: any) => trip.id === booking.tripId)
      );
      
      const busPayments = filteredPayments.filter((payment: any) => 
        busTrips.some((trip: any) => trip.id === payment.tripId)
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
        totalTrips: busTrips.length,
        completedTrips: completedTrips.length,
        activeTrips: activeTrips.length,
        cancelledTrips: cancelledTrips.length,
        completionRate: busTrips.length > 0 ? (completedTrips.length / busTrips.length) * 100 : 0,
        totalBookings: busBookings.length,
        totalPassengers,
        totalRevenue,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        lastTrip: busTrips.length > 0 ? busTrips[busTrips.length - 1] : null
      };
    });

    // Calculate driver performance metrics
    const drivers = users.filter((user: any) => user.role === 'driver');
    const driverPerformance = drivers.map((driver: any) => {
      const driverTrips = filteredTrips.filter((trip: any) => trip.driverId === driver.id);
      const completedTrips = driverTrips.filter((trip: any) => trip.status === 'completed');
      const activeTrips = driverTrips.filter((trip: any) => trip.status === 'active');
      
      const driverBookings = filteredBookings.filter((booking: any) => 
        driverTrips.some((trip: any) => trip.id === booking.tripId)
      );
      
      const driverPayments = filteredPayments.filter((payment: any) => 
        driverTrips.some((trip: any) => trip.id === payment.tripId)
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
        phone: driver.phone,
        totalTrips: driverTrips.length,
        completedTrips: completedTrips.length,
        activeTrips: activeTrips.length,
        completionRate: driverTrips.length > 0 ? (completedTrips.length / driverTrips.length) * 100 : 0,
        totalBookings: driverBookings.length,
        totalPassengers,
        totalRevenue,
        lastTrip: driverTrips.length > 0 ? driverTrips[driverTrips.length - 1] : null
      };
    });

    // Calculate route performance metrics
    const routePerformance = routes.map((route: any) => {
      const routeTrips = filteredTrips.filter((trip: any) => trip.routeId === route.id);
      const completedTrips = routeTrips.filter((trip: any) => trip.status === 'completed');
      
      const routeBookings = filteredBookings.filter((booking: any) => 
        routeTrips.some((trip: any) => trip.id === booking.tripId)
      );
      
      const routePayments = filteredPayments.filter((payment: any) => 
        routeTrips.some((trip: any) => trip.id === payment.tripId)
      );
      
      const totalRevenue = routePayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      const totalPassengers = routeTrips.reduce((sum: number, trip: any) => 
        sum + (trip.passengers || 0), 0
      );
      
      const totalCapacity = routeTrips.reduce((sum: number, trip: any) => {
        const bus = buses.find((b: any) => b.id === trip.busId);
        return sum + (bus?.capacity || 0);
      }, 0);
      
      const utilizationRate = totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
      
      return {
        routeId: route.id,
        routeName: route.name,
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        distance: route.distance,
        totalTrips: routeTrips.length,
        completedTrips: completedTrips.length,
        completionRate: routeTrips.length > 0 ? (completedTrips.length / routeTrips.length) * 100 : 0,
        totalBookings: routeBookings.length,
        totalPassengers,
        totalCapacity,
        totalRevenue,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        lastTrip: routeTrips.length > 0 ? routeTrips[routeTrips.length - 1] : null
      };
    });

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

    // Calculate monthly trends
    const monthlyTrends = {};
    filteredTrips.forEach((trip: any) => {
      const month = new Date(trip.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = {
          trips: 0,
          passengers: 0,
          revenue: 0
        };
      }
      monthlyTrends[month].trips += 1;
      monthlyTrends[month].passengers += trip.passengers || 0;
    });

    // Add revenue to monthly trends
    filteredPayments.forEach((payment: any) => {
      if (payment.status === 'completed') {
        const trip = filteredTrips.find((t: any) => t.id === payment.tripId);
        if (trip) {
          const month = new Date(trip.date).toISOString().slice(0, 7);
          if (monthlyTrends[month]) {
            monthlyTrends[month].revenue += payment.amount || 0;
          }
        }
      }
    });

    // Convert monthly trends to array format
    const monthlyTrendsArray = Object.entries(monthlyTrends).map(([month, stats]: [string, any]) => ({
      month,
      ...stats
    }));

    // Calculate attendance metrics
    const totalAttendance = filteredAttendance.length;
    const presentStudents = filteredAttendance.filter((record: any) => 
      record.status === 'present'
    ).length;
    const absentStudents = filteredAttendance.filter((record: any) => 
      record.status === 'absent'
    ).length;
    const overallAttendanceRate = totalAttendance > 0 ? (presentStudents / totalAttendance) * 100 : 0;

    const analyticsData = {
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all'
      },
      summary: {
        totalTrips: filteredTrips.length,
        completedTrips: filteredTrips.filter((t: any) => t.status === 'completed').length,
        activeTrips: filteredTrips.filter((t: any) => t.status === 'active').length,
        cancelledTrips: filteredTrips.filter((t: any) => t.status === 'cancelled').length,
        totalBookings: filteredBookings.length,
        totalPayments: filteredPayments.length,
        totalAttendance,
        presentStudents,
        absentStudents,
        overallAttendanceRate: Math.round(overallAttendanceRate * 100) / 100
      },
      financial: {
        totalRevenue,
        pendingRevenue,
        failedRevenue,
        netRevenue: totalRevenue - failedRevenue
      },
      fleetPerformance,
      driverPerformance,
      routePerformance,
      monthlyTrends: monthlyTrendsArray,
      topPerformingBuses: fleetPerformance
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5),
      topPerformingDrivers: driverPerformance
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5),
      topPerformingRoutes: routePerformance
        .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)
    };
    
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error calculating movement manager analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
