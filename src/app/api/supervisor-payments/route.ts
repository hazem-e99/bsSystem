import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId');

    if (!supervisorId) {
      return NextResponse.json({ error: 'Supervisor ID is required' }, { status: 400 });
    }

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    // Get supervisor trips
    const supervisorTrips = db.trips?.filter((trip: any) => 
      trip.supervisorId === supervisorId
    ) || [];

    // Get payments for trips supervised by this supervisor
    const tripIds = supervisorTrips.map((trip: any) => trip.id);
    const supervisorPayments = db.payments?.filter((payment: any) => 
      tripIds.includes(payment.tripId)
    ) || [];

    // Enrich payments with trip and route information
    const enrichedPayments = supervisorPayments.map((payment: any) => {
      const trip = db.trips?.find((t: any) => t.id === payment.tripId);
      const route = trip ? db.routes?.find((r: any) => r.id === trip.routeId) : null;
      const student = db.users?.find((u: any) => u.id === payment.studentId);
      
      return {
        ...payment,
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
        } : null,
        student: student ? {
          id: student.id,
          name: student.name,
          studentId: student.studentId
        } : null
      };
    });

    // Calculate summary statistics
    const totalPayments = supervisorPayments.length;
    const completedPayments = supervisorPayments.filter((p: any) => p.status === 'completed').length;
    const pendingPayments = supervisorPayments.filter((p: any) => p.status === 'pending').length;
    const totalRevenue = supervisorPayments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const summary = {
      totalPayments,
      completedPayments,
      pendingPayments,
      totalRevenue
    };

    return NextResponse.json({
      payments: enrichedPayments,
      summary
    });
  } catch (error) {
    console.error('Error fetching supervisor payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supervisor payments' },
      { status: 500 }
    );
  }
}

// Allow supervisors to mark pending cash payments as completed for their trips
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisorId');
    if (!supervisorId) {
      return NextResponse.json({ error: 'Supervisor ID is required' }, { status: 400 });
    }

    const { paymentId, status } = await request.json();
    if (!paymentId || !status) {
      return NextResponse.json({ error: 'paymentId and status are required' }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    const paymentIndex = (db.payments || []).findIndex((p: any) => p.id === paymentId);
    if (paymentIndex === -1) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = db.payments[paymentIndex];
    const trip = (db.trips || []).find((t: any) => t.id === payment.tripId);
    if (!trip || trip.supervisorId !== supervisorId) {
      return NextResponse.json({ error: 'Not authorized to update this payment' }, { status: 403 });
    }

    // Only allow updating from pending->completed or pending->failed
    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending payments can be updated' }, { status: 409 });
    }

    db.payments[paymentIndex] = {
      ...payment,
      status,
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return NextResponse.json(db.payments[paymentIndex]);
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}