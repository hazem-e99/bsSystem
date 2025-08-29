import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

function getDefaultFormsConfig() {
  return {
    commonFields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'text', required: true },
      { name: 'nationalId', label: 'National ID', type: 'text', required: true }
    ],
    roleSpecificFields: {
      student: [
        { name: 'department', label: 'Department', type: 'select', required: true, options: [
          'Computer Science', 'Engineering', 'Business Administration', 'Medicine', 'Law', 
          'Arts', 'Sciences', 'Education', 'Agriculture', 'Pharmacy'
        ]},
        { name: 'academicYear', label: 'Academic Year', type: 'select', required: true, options: [
          'First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Fifth Year', 'Sixth Year', 'Seventh Year'
        ]}
      ],
      driver: [
        // No additional fields beyond common fields
      ],
      supervisor: [
        // No additional fields beyond common fields
      ],
      movementManager: [
        // No additional fields beyond common fields
      ],
      admin: [
        // No additional fields beyond common fields
      ]
    }
  };
}

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    const forms = db.forms || getDefaultFormsConfig();
    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    db.forms = { ...(db.forms || {}), ...body };
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return NextResponse.json(db.forms);
  } catch (error) {
    console.error('Error updating forms config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


