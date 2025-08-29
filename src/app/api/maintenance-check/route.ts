import { NextResponse } from 'next/server';
import { settingsAPI } from '@/lib/api';

export async function GET() {
  try {
    const maintenanceMode = await settingsAPI.getMaintenanceMode();
    
    return NextResponse.json({
      maintenanceMode,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Maintenance check API error:', error);
    
    // Return false as default if there's an error
    return NextResponse.json({
      maintenanceMode: false,
      timestamp: new Date().toISOString(),
      error: 'Failed to check maintenance mode'
    });
  }
}
