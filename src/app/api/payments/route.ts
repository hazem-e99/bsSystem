import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const tripId = searchParams.get('tripId');
    const dateGte = searchParams.get('date_gte');
    const dateLte = searchParams.get('date_lte');
    
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    let payments = db.payments || [];
    
    // Apply filters
    if (studentId) {
      payments = payments.filter((payment: any) => payment.studentId === studentId);
    }
    
    if (status) {
      payments = payments.filter((payment: any) => payment.status === status);
    }
    
    if (method) {
      payments = payments.filter((payment: any) => payment.method === method);
    }
    
    if (tripId) {
      payments = payments.filter((payment: any) => payment.tripId === tripId);
    }
    
    if (dateGte) {
      payments = payments.filter((payment: any) => payment.date >= dateGte);
    }
    
    if (dateLte) {
      payments = payments.filter((payment: any) => payment.date <= dateLte);
    }
    
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error reading payments data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, tripId, amount, method } = body || {};

    if (!studentId || !tripId || typeof amount !== 'number' || !method) {
      return NextResponse.json({ error: 'studentId, tripId, amount, and method are required' }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    // Validate student and trip
    const student = (db.users || []).find((u: any) => u.id === studentId && u.role === 'student');
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const trip = (db.trips || []).find((t: any) => t.id === tripId);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Normalize payment method and status
    // Normalize and map to required domain
    const normalizedMethod = method === 'cash' ? 'cash' : (method === 'bank' || method === 'bank_transfer' || method === 'visa' || method === 'vodafone' || method === 'vodafone_cash') ? 'bank' : 'bank';
    const status = normalizedMethod === 'cash' ? 'pending' : 'completed';

    // Generate new payment ID
    const newPayment = {
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      method: normalizedMethod,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!db.payments) {
      db.payments = [];
    }
    
    db.payments.push(newPayment);
    
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
