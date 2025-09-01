import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  department: string;
  year: string;
  subscriptionStatus: string;
  subscriptionExpiry: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

// GET: جلب بيانات الطالب
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

    // Find student by ID
    const student = db.users?.find((user: User) => user.id.toString() === studentId);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Return student profile data
    const profileData = {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      studentId: student.studentId,
      department: student.department,
      year: student.year,
      subscriptionStatus: student.subscriptionStatus,
      subscriptionExpiry: student.subscriptionExpiry,
      avatar: student.avatar,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt
    };

    return NextResponse.json(profileData);
  } catch {
    console.error('Error fetching student profile:', Error);
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}

// PUT: تحديث بيانات الطالب
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const updateData = await request.json();

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    // Find student index
    const studentIndex = db.users?.findIndex((user: User) => user.id.toString() === studentId);

    if (studentIndex === -1) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Update student data
    const updatedStudent = {
      ...db.users[studentIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    db.users[studentIndex] = updatedStudent;

    // Write back to db.json
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));

    // Return updated profile data
    const profileData = {
      id: updatedStudent.id,
      name: updatedStudent.name,
      email: updatedStudent.email,
      phone: updatedStudent.phone,
      studentId: updatedStudent.studentId,
      department: updatedStudent.department,
      year: updatedStudent.year,
      subscriptionStatus: updatedStudent.subscriptionStatus,
      subscriptionExpiry: updatedStudent.subscriptionExpiry,
      avatar: updatedStudent.avatar,
      createdAt: updatedStudent.createdAt,
      updatedAt: updatedStudent.updatedAt
    };

    return NextResponse.json(profileData);
  } catch {
    console.error('Error updating student profile:', Error);
    return NextResponse.json(
      { error: 'Failed to update student profile' },
      { status: 500 }
    );
  }
}
