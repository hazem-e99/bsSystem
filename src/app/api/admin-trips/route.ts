import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { autoCompleteTrips } from '@/lib/tripStatus';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const routeId = searchParams.get('routeId');
    const driverId = searchParams.get('driverId');
    const busId = searchParams.get('busId');
    const supervisorId = searchParams.get('supervisorId');
    const search = searchParams.get('search');

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    // Auto-complete trips whose end time has passed
    const changed = autoCompleteTrips(db);
    if (changed) {
      await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    }
    
    // Get all data
    const trips = db.trips || [];
    const routes = db.routes || [];
    const buses = db.buses || [];
    const users = db.users || [];
    const payments = db.payments || [];
    const bookings = db.bookings || [];
    const attendance = db.attendance || [];
    
    // Filter trips based on parameters
    let filteredTrips = trips;
    
    if (status) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.status === status);
    }
    
    if (date) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.date === date);
    }
    
    if (routeId) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.routeId === routeId);
    }
    
    if (driverId) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.driverId === driverId);
    }
    
    if (busId) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.busId === busId);
    }
    
    if (supervisorId) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.supervisorId === supervisorId);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTrips = filteredTrips.filter((trip: any) => {
        const route = routes.find((r: any) => r.id === trip.routeId);
        const bus = buses.find((b: any) => b.id === trip.busId);
        const driver = users.find((u: any) => u.id === trip.driverId);
        const supervisor = users.find((u: any) => u.id === trip.supervisorId);
        
        return (
          trip.id?.toLowerCase().includes(searchLower) ||
          route?.name?.toLowerCase().includes(searchLower) ||
          bus?.number?.toLowerCase().includes(searchLower) ||
          driver?.name?.toLowerCase().includes(searchLower) ||
          supervisor?.name?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Enrich trip data with additional information
    const enrichedTrips = filteredTrips.map((trip: any) => {
      const route = routes.find((r: any) => r.id === trip.routeId);
      const bus = buses.find((b: any) => b.id === trip.busId);
      const driver = users.find((u: any) => u.id === trip.driverId);
      const supervisor = users.find((u: any) => u.id === trip.supervisorId);
      
      const tripBookings = bookings.filter((booking: any) => booking.tripId === trip.id);
      const tripPayments = payments.filter((payment: any) => payment.tripId === trip.id);
      const tripAttendance = attendance.filter((record: any) => record.tripId === trip.id);
      
      const totalRevenue = tripPayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      const pendingRevenue = tripPayments
        .filter((p: any) => p.status === 'pending')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      const confirmedBookings = tripBookings.filter((b: any) => b.status === 'confirmed');
      const pendingBookings = tripBookings.filter((b: any) => b.status === 'pending');
      const cancelledBookings = tripBookings.filter((b: any) => b.status === 'cancelled');
      
      const presentStudents = tripAttendance.filter((a: any) => a.status === 'present').length;
      const absentStudents = tripAttendance.filter((a: any) => a.status === 'absent').length;
      const attendanceRate = tripAttendance.length > 0 ? (presentStudents / tripAttendance.length) * 100 : 0;
      
      // Calculate trip duration
      let tripDuration = 0;
      if (trip.startTime && trip.endTime) {
        const start = new Date(`2000-01-01T${trip.startTime}`);
        const end = new Date(`2000-01-01T${trip.endTime}`);
        tripDuration = (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
      }
      
      // Calculate utilization rate
      const utilizationRate = bus && bus.capacity ? 
        ((trip.passengers || 0) / bus.capacity) * 100 : 0;
      
      // Calculate profitability metrics
      const totalCost = trip.operationalCost || 0;
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      // Calculate on-time performance
      const scheduledTime = trip.scheduledTime || trip.startTime;
      const actualTime = trip.actualStartTime || trip.startTime;
      const isOnTime = scheduledTime === actualTime;
      const delayMinutes = scheduledTime && actualTime ? 
        Math.abs(new Date(`2000-01-01T${actualTime}`).getTime() - new Date(`2000-01-01T${scheduledTime}`).getTime()) / (1000 * 60) : 0;

      return {
        ...trip,
        route: route ? {
          id: route.id,
          name: route.name,
          startPoint: route.startPoint,
          endPoint: route.endPoint,
          distance: route.distance,
          estimatedDuration: route.estimatedDuration
        } : null,
        bus: bus ? {
          id: bus.id,
          number: bus.number,
          model: bus.model,
          capacity: bus.capacity,
          status: bus.status
        } : null,
        driver: driver ? {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber
        } : null,
        supervisor: supervisor ? {
          id: supervisor.id,
          name: supervisor.name,
          phone: supervisor.phone
        } : null,
        bookings: {
          total: tripBookings.length,
          confirmed: confirmedBookings.length,
          pending: pendingBookings.length,
          cancelled: cancelledBookings.length,
          confirmationRate: tripBookings.length > 0 ? (confirmedBookings.length / tripBookings.length) * 100 : 0,
          list: tripBookings.map((booking: any) => {
            const student = users.find((u: any) => u.id === booking.studentId);
            return {
              id: booking.id,
              status: booking.status,
              date: booking.date,
              student: student ? {
                id: student.id,
                name: student.name,
                studentId: student.studentId
              } : null
            };
          })
        },
        payments: {
          total: tripPayments.length,
          completed: tripPayments.filter((p: any) => p.status === 'completed').length,
          pending: tripPayments.filter((p: any) => p.status === 'pending').length,
          failed: tripPayments.filter((p: any) => p.status === 'failed').length,
          totalRevenue,
          pendingRevenue,
          totalCost,
          profit,
          profitMargin: Math.round(profitMargin * 100) / 100
        },
        attendance: {
          total: tripAttendance.length,
          present: presentStudents,
          absent: absentStudents,
          rate: Math.round(attendanceRate * 100) / 100
        },
        performance: {
          tripDuration: Math.round(tripDuration * 100) / 100,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          revenuePerPassenger: trip.passengers > 0 ? totalRevenue / trip.passengers : 0,
          isOnTime,
          delayMinutes: Math.round(delayMinutes * 100) / 100,
          onTimeRate: isOnTime ? 100 : 0
        }
      };
    });

    // Sort trips by date (newest first)
    enrichedTrips.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate trips summary
    const totalTrips = enrichedTrips.length;
    const completedTrips = enrichedTrips.filter((trip: any) => trip.status === 'completed').length;
    const activeTrips = enrichedTrips.filter((trip: any) => trip.status === 'active').length;
    const scheduledTrips = enrichedTrips.filter((trip: any) => trip.status === 'scheduled').length;
    const cancelledTrips = enrichedTrips.filter((trip: any) => trip.status === 'cancelled').length;

    const totalBookings = enrichedTrips.reduce((sum: number, trip: any) => sum + trip.bookings.total, 0);
    const totalRevenue = enrichedTrips.reduce((sum: number, trip: any) => sum + trip.payments.totalRevenue, 0);
    const totalCost = enrichedTrips.reduce((sum: number, trip: any) => sum + trip.payments.totalCost, 0);
    const totalProfit = enrichedTrips.reduce((sum: number, trip: any) => sum + trip.payments.profit, 0);
    const totalPassengers = enrichedTrips.reduce((sum: number, trip: any) => sum + (trip.passengers || 0), 0);

    const averageUtilization = enrichedTrips.length > 0 ? 
      enrichedTrips.reduce((sum: number, trip: any) => sum + trip.performance.utilizationRate, 0) / enrichedTrips.length : 0;
    
    const averageAttendanceRate = enrichedTrips.length > 0 ? 
      enrichedTrips.reduce((sum: number, trip: any) => sum + trip.attendance.rate, 0) / enrichedTrips.length : 0;
    
    const averageProfitMargin = enrichedTrips.length > 0 ? 
      enrichedTrips.reduce((sum: number, trip: any) => sum + trip.payments.profitMargin, 0) / enrichedTrips.length : 0;
    
    const onTimeTrips = enrichedTrips.filter((trip: any) => trip.performance.isOnTime).length;
    const onTimeRate = totalTrips > 0 ? (onTimeTrips / totalTrips) * 100 : 0;

    const summary = {
      totalTrips,
      completedTrips,
      activeTrips,
      scheduledTrips,
      cancelledTrips,
      completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0,
      totalBookings,
      totalRevenue,
      totalCost,
      totalProfit,
      totalPassengers,
      averageUtilization: Math.round(averageUtilization * 100) / 100,
      averageAttendanceRate: Math.round(averageAttendanceRate * 100) / 100,
      averageProfitMargin: Math.round(averageProfitMargin * 100) / 100,
      onTimeRate: Math.round(onTimeRate * 100) / 100
    };

    return NextResponse.json({
      trips: enrichedTrips,
      summary
    });
  } catch (error) {
    console.error('Error fetching trips data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    // Generate new trip ID
    const newTrip = {
      id: `trip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      status: body.status || 'scheduled',
      passengers: body.passengers || 0,
      revenue: body.revenue || 0,
      operationalCost: body.operationalCost || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!db.trips) {
      db.trips = [];
    }
    
    db.trips.push(newTrip);
    
    // Create notifications for assigned supervisor and driver
    try {
      if (!db.notifications) db.notifications = [];
      const bus = (db.buses || []).find((b: any) => b.id === newTrip.busId);
      const route = (db.routes || []).find((r: any) => r.id === newTrip.routeId);
      const startLoc = (route && (route.startLocation || route.startPoint)) || '';
      const endLoc = (route && (route.endLocation || route.endPoint)) || '';
      const busNumber = bus?.number || '';
      const when = `${newTrip.date} ${newTrip.startTime}`;

      if (newTrip.supervisorId) {
        db.notifications.push({
          id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: newTrip.supervisorId,
          senderId: 'system',
          type: 'trip_created',
          priority: 'medium',
          status: 'unread',
          read: false,
          title: 'تم إنشاء رحلة جديدة',
          message: `تم تعيينك كمشرف على رحلة ${newTrip.id} - باص ${busNumber} - ${startLoc} → ${endLoc} - ${when}.`,
          busId: newTrip.busId,
          routeId: newTrip.routeId,
          tripId: newTrip.id,
          actionUrl: '/dashboard/supervisor/trips',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      if (newTrip.driverId) {
        db.notifications.push({
          id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: newTrip.driverId,
          senderId: 'system',
          type: 'trip_created',
          priority: 'medium',
          status: 'unread',
          read: false,
          title: 'تم تعيين رحلة جديدة لك',
          message: `تم تعيينك كسائق للرحلة ${newTrip.id} - باص ${busNumber} - ${startLoc} → ${endLoc} - ${when}.`,
          busId: newTrip.busId,
          routeId: newTrip.routeId,
          tripId: newTrip.id,
          actionUrl: '/dashboard/driver/trips',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) { console.error('Failed to create notifications for new trip (admin):', e); }

    // Write back to db.json
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json(newTrip, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get('id');
    const body = await request.json();
    const id = idFromQuery || body?.id;

    if (!id) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    if (!db.trips) db.trips = [];

    const index = db.trips.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    db.trips[index] = {
      ...db.trips[index],
      ...body,
      id: db.trips[index].id,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return NextResponse.json(db.trips[index]);
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return PUT(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);

    if (!db.trips) db.trips = [];

    const index = db.trips.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const deleted = db.trips.splice(index, 1)[0];

    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return NextResponse.json({ message: 'Trip deleted', trip: deleted });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
