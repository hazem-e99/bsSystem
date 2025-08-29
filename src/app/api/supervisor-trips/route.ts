import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { autoCompleteTrips } from '@/lib/tripStatus';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId');
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    if (!supervisorId) {
      return NextResponse.json({ error: 'Supervisor ID is required' }, { status: 400 });
    }

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    // Auto-complete trips whose end time has passed
    const changed = autoCompleteTrips(db);
    if (changed) {
      await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    }

    // Get supervisor trips
    let supervisorTrips = db.trips?.filter((trip: any) => 
      trip.supervisorId === supervisorId
    ) || [];

    // Filter by status if provided
    if (status) {
      supervisorTrips = supervisorTrips.filter((trip: any) => trip.status === status);
    }

    // Filter by date if provided
    if (date) {
      supervisorTrips = supervisorTrips.filter((trip: any) => trip.date === date);
    }

    // Enrich trips with additional information
    const enrichedTrips = supervisorTrips.map((trip: any) => {
      const route = db.routes?.find((r: any) => r.id === trip.routeId);
      const bus = db.buses?.find((b: any) => b.id === trip.busId);
      const driver = db.users?.find((u: any) => u.id === trip.driverId);
      const tripBookings = db.bookings?.filter((b: any) => b.tripId === trip.id) || [];
      const tripPayments = db.payments?.filter((p: any) => p.tripId === trip.id) || [];
      const tripAttendance = db.attendance?.filter((a: any) => a.tripId === trip.id) || [];

      return {
        ...trip,
        route: route ? {
          id: route.id,
          name: route.name,
          startPoint: route.startPoint,
          endPoint: route.endPoint,
          distance: route.distance
        } : null,
        bus: bus ? {
          id: bus.id,
          number: bus.number,
          capacity: bus.capacity,
          model: bus.model
        } : null,
        driver: driver ? {
          id: driver.id,
          name: driver.name,
          phone: driver.phone
        } : null,
        bookings: {
          total: tripBookings.length,
          confirmed: tripBookings.filter((b: any) => b.status === 'confirmed').length,
          pending: tripBookings.filter((b: any) => b.status === 'pending').length,
          cancelled: tripBookings.filter((b: any) => b.status === 'cancelled').length
        },
        payments: {
          total: tripPayments.length,
          completed: tripPayments.filter((p: any) => p.status === 'completed').length,
          pending: tripPayments.filter((p: any) => p.status === 'pending').length,
          revenue: tripPayments
            .filter((p: any) => p.status === 'completed')
            .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
        },
        attendance: {
          total: tripAttendance.length,
          present: tripAttendance.filter((a: any) => a.status === 'present').length,
          absent: tripAttendance.filter((a: any) => a.status === 'absent').length,
          rate: tripAttendance.length > 0 ? 
            (tripAttendance.filter((a: any) => a.status === 'present').length / tripAttendance.length) * 100 : 0
        }
      };
    });

    // Sort trips by date (newest first)
    enrichedTrips.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(enrichedTrips);
  } catch (error) {
    console.error('Error fetching supervisor trips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supervisor trips' },
      { status: 500 }
    );
  }
}
