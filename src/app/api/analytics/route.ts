import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    // Calculate analytics data from existing data
    const users = db.users || [];
    const buses = db.buses || [];
    const routes = db.routes || [];
    const trips = db.trips || [];
    const payments = db.payments || [];
    const bookings = db.bookings || [];
    
    // Calculate monthly revenue (last 6 months)
    const monthlyRevenue = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = month.toISOString().slice(0, 7); // YYYY-MM format
      
      const monthPayments = payments.filter((payment: any) => 
        payment.date && payment.date.startsWith(monthKey) && payment.status === 'completed'
      );
      
      const monthRevenue = monthPayments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
      
      monthlyRevenue.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue
      });
    }
    
    // Calculate payment status distribution
    const paymentStatus = {
      completed: payments.filter((p: any) => p.status === 'completed').length,
      pending: payments.filter((p: any) => p.status === 'pending').length,
      failed: payments.filter((p: any) => p.status === 'failed').length
    };
    
    // Calculate route utilization
    const routeUtilization = routes.map((route: any) => {
      const routeTrips = trips.filter((trip: any) => trip.routeId === route.id);
      const routeBookings = routeTrips.flatMap((trip: any) => 
        bookings.filter((booking: any) => booking.tripId === trip.id)
      );
      
      const totalCapacity = routeTrips.reduce((sum: number, trip: any) => {
        const bus = buses.find((b: any) => b.id === trip.busId);
        return sum + (bus?.capacity || 0);
      }, 0);
      
      const totalBookings = routeBookings.length;
      const utilization = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0;
      
      return {
        routeName: route.name,
        utilization: Math.round(utilization),
        totalTrips: routeTrips.length,
        totalBookings
      };
    });
    
    // Calculate bus performance
    const busPerformance = buses.map((bus: any) => {
      const busTrips = trips.filter((trip: any) => trip.busId === bus.id);
      const completedTrips = busTrips.filter((trip: any) => trip.status === 'completed');
      
      return {
        busNumber: bus.number,
        totalTrips: busTrips.length,
        completedTrips: completedTrips.length,
        completionRate: busTrips.length > 0 ? (completedTrips.length / busTrips.length) * 100 : 0
      };
    });
    
    const analyticsData = {
      monthlyRevenue,
      paymentStatus,
      routeUtilization,
      busPerformance,
      summary: {
        totalUsers: users.length,
        totalBuses: buses.length,
        totalRoutes: routes.length,
        totalTrips: trips.length,
        totalPayments: payments.length,
        totalBookings: bookings.length
      }
    };
    
    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error calculating analytics data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
