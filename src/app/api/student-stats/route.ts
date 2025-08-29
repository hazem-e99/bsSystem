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

    // Get student payments
    const studentPayments = db.payments?.filter((payment: any) => 
      payment.studentId === studentId
    ) || [];

    // Calculate statistics
    const totalBookings = studentBookings.length;
    const activeBookings = studentBookings.filter((booking: any) => 
      ['confirmed', 'pending'].includes(booking.status)
    ).length;
    const completedBookings = studentBookings.filter((booking: any) => 
      booking.status === 'completed'
    ).length;

    const totalPayments = studentPayments.reduce((sum: number, payment: any) => 
      sum + (payment.amount || 0), 0
    );
    const completedPayments = studentPayments.filter((payment: any) => 
      payment.status === 'completed'
    ).reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);
    const pendingPayments = studentPayments.filter((payment: any) => 
      payment.status === 'pending'
    ).reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

    // Get monthly booking trends for charts
    const monthlyBookings = {};
    const monthlyPayments = {};
    
    studentBookings.forEach((booking: any) => {
      const month = new Date(booking.date).toISOString().slice(0, 7); // YYYY-MM
      monthlyBookings[month] = (monthlyBookings[month] || 0) + 1;
    });

    studentPayments.forEach((payment: any) => {
      const month = new Date(payment.date).toISOString().slice(0, 7); // YYYY-MM
      monthlyPayments[month] = (monthlyPayments[month] || 0) + (payment.amount || 0);
    });

    // Get payment methods distribution
    const paymentMethods = {};
    studentPayments.forEach((payment: any) => {
      const method = payment.method || 'unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Get booking status distribution
    const bookingStatuses = {};
    studentBookings.forEach((booking: any) => {
      const status = booking.status || 'unknown';
      bookingStatuses[status] = (bookingStatuses[status] || 0) + 1;
    });

    const stats = {
      totalBookings,
      activeBookings,
      completedBookings,
      totalPayments,
      completedPayments,
      pendingPayments,
      monthlyBookings,
      monthlyPayments,
      paymentMethods,
      bookingStatuses
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student statistics' },
      { status: 500 }
    );
  }
}
