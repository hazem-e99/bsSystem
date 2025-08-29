import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, busId } = body || {};
    if (!studentId || !busId) {
      return NextResponse.json({ error: 'studentId and busId are required' }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    const studentIndex = (db.users || []).findIndex((u: any) => u.id === studentId && u.role === 'student');
    if (studentIndex === -1) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const busIndex = (db.buses || []).findIndex((b: any) => b.id === busId);
    if (busIndex === -1) return NextResponse.json({ error: 'Bus not found' }, { status: 404 });

    const bus = db.buses[busIndex];
    const capacity = Number(bus.capacity) || 0;
    const assignedStudents: string[] = Array.isArray(bus.assignedStudents) ? bus.assignedStudents : [];

    // Check subscription
    const hasActivePayment = (db.payments || []).some((p: any) => p.studentId === studentId && p.status === 'completed');
    if (!hasActivePayment) return NextResponse.json({ error: 'Subscription inactive. Complete payment first.' }, { status: 403 });

    if (assignedStudents.includes(studentId)) {
      return NextResponse.json({ error: 'Student already assigned to this bus' }, { status: 409 });
    }
    if (assignedStudents.length >= capacity) {
      return NextResponse.json({ error: 'Bus is full' }, { status: 409 });
    }

    assignedStudents.push(studentId);
    db.buses[busIndex] = { ...bus, assignedStudents, updatedAt: new Date().toISOString() };

    db.users[studentIndex] = { ...db.users[studentIndex], assignedBusId: busId, updatedAt: new Date().toISOString() };

    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return NextResponse.json({ success: true, user: db.users[studentIndex], bus: db.buses[busIndex] });
  } catch (error) {
    console.error('Error assigning bus to student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


