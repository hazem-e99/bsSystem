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

    // Get student payments
    const studentPayments = db.payments?.filter((payment: any) => 
      payment.studentId === studentId
    ) || [];

    // Enrich payments with booking information
    const enrichedPayments = studentPayments.map((payment: any) => {
      const booking = db.bookings?.find((b: any) => b.id === payment.bookingId);
      const trip = booking ? db.trips?.find((t: any) => t.id === booking.tripId) : null;
      const route = trip ? db.routes?.find((r: any) => r.id === trip.routeId) : null;
      
      return {
        ...payment,
        booking: booking ? {
          id: booking.id,
          date: booking.date,
          status: booking.status
        } : null,
        trip: trip ? {
          id: trip.id,
          date: trip.date,
          startTime: trip.startTime,
          endTime: trip.endTime
        } : null,
        route: route ? {
          id: route.id,
          name: route.name,
          startPoint: route.startPoint,
          endPoint: route.endPoint
        } : null
      };
    });

    return NextResponse.json(enrichedPayments);
  } catch (error) {
    console.error('Error fetching student payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student payments' },
      { status: 500 }
    );
  }
}
