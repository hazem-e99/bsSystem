import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!supervisorId) {
      return NextResponse.json({ error: 'Supervisor ID is required' }, { status: 400 });
    }

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    // Get supervisor trips
    let supervisorTrips = db.trips?.filter((trip: any) => 
      trip.supervisorId === supervisorId
    ) || [];

    // Filter by date range if provided
    if (startDate && endDate) {
      supervisorTrips = supervisorTrips.filter((trip: any) => 
        trip.date >= startDate && trip.date <= endDate
      );
    }

    // Get attendance records for these trips
    const tripIds = supervisorTrips.map((trip: any) => trip.id);
    const attendanceRecords = db.attendance?.filter((record: any) => 
      tripIds.includes(record.tripId)
    ) || [];

    // Get payments for these trips
    const payments = db.payments?.filter((payment: any) => 
      tripIds.includes(payment.tripId)
    ) || [];

    // Calculate report statistics
    const totalTrips = supervisorTrips.length;
    const completedTrips = supervisorTrips.filter((trip: any) => trip.status === 'completed').length;
    const activeTrips = supervisorTrips.filter((trip: any) => trip.status === 'active').length;
    const cancelledTrips = supervisorTrips.filter((trip: any) => trip.status === 'cancelled').length;

    const totalPassengers = supervisorTrips.reduce((sum: number, trip: any) => 
      sum + (trip.passengers || 0), 0
    );

    const totalRevenue = payments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const totalAttendance = attendanceRecords.length;
    const presentStudents = attendanceRecords.filter((record: any) => 
      record.status === 'present'
    ).length;
    const absentStudents = attendanceRecords.filter((record: any) => 
      record.status === 'absent'
    ).length;

    // Get monthly statistics
    const monthlyStats = {};
    supervisorTrips.forEach((trip: any) => {
      const month = new Date(trip.date).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          trips: 0,
          passengers: 0,
          revenue: 0
        };
      }
      monthlyStats[month].trips += 1;
      monthlyStats[month].passengers += trip.passengers || 0;
    });

    // Add revenue to monthly stats
    payments.forEach((payment: any) => {
      if (payment.status === 'completed') {
        const trip = supervisorTrips.find((t: any) => t.id === payment.tripId);
        if (trip) {
          const month = new Date(trip.date).toISOString().slice(0, 7);
          if (monthlyStats[month]) {
            monthlyStats[month].revenue += payment.amount || 0;
          }
        }
      }
    });

    // Convert monthly stats to array format
    const monthlyStatsArray = Object.entries(monthlyStats).map(([month, stats]: [string, any]) => ({
      month,
      ...stats
    }));

    const report = {
      supervisorId,
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all'
      },
      summary: {
        totalTrips,
        completedTrips,
        activeTrips,
        cancelledTrips,
        totalPassengers,
        totalRevenue,
        totalAttendance,
        presentStudents,
        absentStudents,
        attendanceRate: totalAttendance > 0 ? (presentStudents / totalAttendance) * 100 : 0
      },
      monthlyStats: monthlyStatsArray,
      trips: supervisorTrips.map((trip: any) => {
        const route = db.routes?.find((r: any) => r.id === trip.routeId);
        const bus = db.buses?.find((b: any) => b.id === trip.busId);
        const tripPayments = payments.filter((p: any) => p.tripId === trip.id);
        const tripAttendance = attendanceRecords.filter((a: any) => a.tripId === trip.id);
        
        return {
          ...trip,
          route: route ? {
            id: route.id,
            name: route.name,
            startPoint: route.startPoint,
            endPoint: route.endPoint
          } : null,
          bus: bus ? {
            id: bus.id,
            number: bus.number,
            capacity: bus.capacity
          } : null,
          revenue: tripPayments
            .filter((p: any) => p.status === 'completed')
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
          attendance: {
            total: tripAttendance.length,
            present: tripAttendance.filter((a: any) => a.status === 'present').length,
            absent: tripAttendance.filter((a: any) => a.status === 'absent').length
          }
        };
      })
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating supervisor report:', error);
    return NextResponse.json(
      { error: 'Failed to generate supervisor report' },
      { status: 500 }
    );
  }
}
