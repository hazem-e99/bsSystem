import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const busType = searchParams.get('busType');

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    // Get all data
    const buses = db.buses || [];
    const trips = db.trips || [];
    const routes = db.routes || [];
    const payments = db.payments || [];
    const bookings = db.bookings || [];
    const attendance = db.attendance || [];
    
    // Filter buses by status if provided
    let filteredBuses = buses;
    if (status) {
      filteredBuses = buses.filter((bus: any) => bus.status === status);
    }
    
    // Filter buses by type if provided
    if (busType) {
      filteredBuses = filteredBuses.filter((bus: any) => bus.type === busType);
    }

    // Enrich bus data with performance metrics
    const enrichedFleet = filteredBuses.map((bus: any) => {
      const busTrips = trips.filter((trip: any) => trip.busId === bus.id);
      const completedTrips = busTrips.filter((trip: any) => trip.status === 'completed');
      const activeTrips = busTrips.filter((trip: any) => trip.status === 'active');
      const cancelledTrips = busTrips.filter((trip: any) => trip.status === 'cancelled');
      
      const busBookings = bookings.filter((booking: any) => 
        busTrips.some((trip: any) => trip.id === booking.tripId)
      );
      
      const busPayments = payments.filter((payment: any) => 
        busTrips.some((trip: any) => trip.id === payment.tripId)
      );
      
      const totalRevenue = busPayments
        .filter((p: any) => p.status === 'completed')
        .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      
      const totalPassengers = busTrips.reduce((sum: number, trip: any) => 
        sum + (trip.passengers || 0), 0
      );
      
      const utilizationRate = busTrips.length > 0 ? 
        (totalPassengers / (bus.capacity * busTrips.length)) * 100 : 0;
      
      const completionRate = busTrips.length > 0 ? 
        (completedTrips.length / busTrips.length) * 100 : 0;
      
      // Calculate average trip duration
      const completedTripDurations = completedTrips.map((trip: any) => {
        if (trip.startTime && trip.endTime) {
          const start = new Date(`2000-01-01T${trip.startTime}`);
          const end = new Date(`2000-01-01T${trip.endTime}`);
          return (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
        }
        return 0;
      }).filter(duration => duration > 0);
      
      const averageTripDuration = completedTripDurations.length > 0 ? 
        completedTripDurations.reduce((sum: number, duration: number) => sum + duration, 0) / completedTripDurations.length : 0;
      
      // Get recent trips
      const recentTrips = busTrips
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((trip: any) => {
          const route = routes.find((r: any) => r.id === trip.routeId);
          return {
            id: trip.id,
            date: trip.date,
            startTime: trip.startTime,
            endTime: trip.endTime,
            status: trip.status,
            passengers: trip.passengers,
            route: route ? {
              id: route.id,
              name: route.name,
              startPoint: route.startPoint,
              endPoint: route.endPoint
            } : null
          };
        });

      // Calculate maintenance status
      const lastMaintenance = bus.lastMaintenance ? new Date(bus.lastMaintenance) : null;
      const maintenanceDue = bus.maintenanceInterval ? 
        lastMaintenance ? 
          new Date(lastMaintenance.getTime() + (bus.maintenanceInterval * 24 * 60 * 60 * 1000)) : 
          new Date() : 
        null;
      
      const isMaintenanceDue = maintenanceDue ? new Date() > maintenanceDue : false;
      const daysUntilMaintenance = maintenanceDue ? 
        Math.ceil((maintenanceDue.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) : 
        null;

      return {
        ...bus,
        performance: {
          totalTrips: busTrips.length,
          completedTrips: completedTrips.length,
          activeTrips: activeTrips.length,
          cancelledTrips: cancelledTrips.length,
          completionRate: Math.round(completionRate * 100) / 100,
          totalBookings: busBookings.length,
          totalPassengers,
          totalRevenue,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          averageTripDuration: Math.round(averageTripDuration * 100) / 100
        },
        maintenance: {
          lastMaintenance: bus.lastMaintenance,
          maintenanceInterval: bus.maintenanceInterval,
          maintenanceDue,
          isMaintenanceDue,
          daysUntilMaintenance,
          status: isMaintenanceDue ? 'overdue' : 
                 daysUntilMaintenance && daysUntilMaintenance <= 7 ? 'due_soon' : 'ok'
        },
        recentTrips,
        lastTrip: busTrips.length > 0 ? busTrips[busTrips.length - 1] : null
      };
    });

    // Sort by performance (total revenue)
    enrichedFleet.sort((a: any, b: any) => b.performance.totalRevenue - a.performance.totalRevenue);

    // Calculate fleet summary
    const fleetSummary = {
      totalBuses: enrichedFleet.length,
      activeBuses: enrichedFleet.filter((bus: any) => bus.status === 'active').length,
      maintenanceBuses: enrichedFleet.filter((bus: any) => bus.status === 'maintenance').length,
      retiredBuses: enrichedFleet.filter((bus: any) => bus.status === 'retired').length,
      totalCapacity: enrichedFleet.reduce((sum: number, bus: any) => sum + (bus.capacity || 0), 0),
      totalRevenue: enrichedFleet.reduce((sum: number, bus: any) => sum + bus.performance.totalRevenue, 0),
      averageUtilization: enrichedFleet.length > 0 ? 
        enrichedFleet.reduce((sum: number, bus: any) => sum + bus.performance.utilizationRate, 0) / enrichedFleet.length : 0,
      maintenanceDue: enrichedFleet.filter((bus: any) => bus.maintenance.isMaintenanceDue).length,
      maintenanceDueSoon: enrichedFleet.filter((bus: any) => 
        bus.maintenance.status === 'due_soon'
      ).length
    };

    return NextResponse.json({
      fleet: enrichedFleet,
      summary: fleetSummary
    });
  } catch (error) {
    console.error('Error fetching fleet data:', error);
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
    
    // Generate new bus ID
    const newBus = {
      id: `bus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    if (!db.buses) {
      db.buses = [];
    }
    
    db.buses.push(newBus);
    
    // Write back to db.json
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    
    return NextResponse.json(newBus, { status: 201 });
  } catch (error) {
    console.error('Error creating bus:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
