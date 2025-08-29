import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    // Get student bookings
    const studentBookings = db.bookings?.filter((booking: any) => 
      booking.studentId === studentId
    ) || [];

    // Enrich bookings with trip and route information
    const enrichedBookings = studentBookings.map((booking: any) => {
      const trip = db.trips?.find((t: any) => t.id === booking.tripId);
      const route = trip ? db.routes?.find((r: any) => r.id === trip.routeId) : null;
      
      return {
        ...booking,
        trip: trip ? {
          id: trip.id,
          date: trip.date,
          startTime: trip.startTime,
          endTime: trip.endTime,
          status: trip.status
        } : null,
        route: route ? {
          id: route.id,
          name: route.name,
          startPoint: route.startPoint,
          endPoint: route.endPoint
        } : null
      };
    });

    return NextResponse.json(enrichedBookings);
  } catch (error) {
    console.error('Error fetching student bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student bookings' },
      { status: 500 }
    );
  }
}
