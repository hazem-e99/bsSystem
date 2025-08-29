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

    // Get student user data
    const student = db.users?.find((user: any) => 
      user.id === studentId && user.role === 'student'
    );

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Return student settings/profile data
    const studentSettings = {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      avatar: student.avatar,
      preferences: student.preferences || {},
      notifications: student.notifications || {
        email: true,
        sms: false,
        push: true
      }
    };

    return NextResponse.json(studentSettings);
  } catch (error) {
    console.error('Error fetching student settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    // Find and update student
    const studentIndex = db.users?.findIndex((user: any) => 
      user.id === studentId && user.role === 'student'
    );

    if (studentIndex === -1 || studentIndex === undefined) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Update student data
    db.users[studentIndex] = {
      ...db.users[studentIndex],
      ...body,
      id: studentId, // Ensure ID doesn't change
      role: 'student' // Ensure role doesn't change
    };

    // Write back to db.json
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));

    return NextResponse.json({ 
      message: 'Student settings updated successfully',
      student: db.users[studentIndex]
    });
  } catch (error) {
    console.error('Error updating student settings:', error);
    return NextResponse.json(
      { error: 'Failed to update student settings' },
      { status: 500 }
    );
  }
}
