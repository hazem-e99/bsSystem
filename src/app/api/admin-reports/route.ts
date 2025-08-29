import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const routeId = searchParams.get('routeId');
    const busId = searchParams.get('busId');
    const driverId = searchParams.get('driverId');
    const supervisorId = searchParams.get('supervisorId');

    // Read db.json file
    const dbPath = path.join(process.cwd(), 'db.json');
    const dbContent = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(dbContent);
    
    // Get all data
    const trips = db.trips || [];
    const routes = db.routes || [];
    const buses = db.buses || [];
    const users = db.users || [];
    const payments = db.payments || [];
    const bookings = db.bookings || [];
    const attendance = db.attendance || [];
    const maintenance = db.maintenance || [];
    
    // Filter data based on date range
    let filteredTrips = trips;
    let filteredBookings = bookings;
    let filteredPayments = payments;
    let filteredAttendance = attendance;
    let filteredMaintenance = maintenance;
    
    if (dateFrom || dateTo) {
      const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
      const toDate = dateTo ? new Date(dateTo) : new Date();
      
      filteredTrips = filteredTrips.filter((trip: any) => {
        const tripDate = new Date(trip.date);
        return tripDate >= fromDate && tripDate <= toDate;
      });
      
      filteredBookings = filteredBookings.filter((booking: any) => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= fromDate && bookingDate <= toDate;
      });
      
      filteredPayments = filteredPayments.filter((payment: any) => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= fromDate && paymentDate <= toDate;
      });
      
      filteredAttendance = filteredAttendance.filter((record: any) => {
        const attendanceDate = new Date(record.date);
        return attendanceDate >= fromDate && attendanceDate <= toDate;
      });
      
      filteredMaintenance = filteredMaintenance.filter((record: any) => {
        const maintenanceDate = new Date(record.createdAt || record.date);
        return maintenanceDate >= fromDate && maintenanceDate <= toDate;
      });
    }
    
    // Filter by specific entities if provided
    if (routeId) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.routeId === routeId);
    }
    
    if (busId) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.busId === busId);
    }
    
    if (driverId) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.driverId === driverId);
    }
    
    if (supervisorId) {
      filteredTrips = filteredTrips.filter((trip: any) => trip.supervisorId === supervisorId);
    }

    // Generate comprehensive reports based on type
    let reportData = {};
    
    if (!type || type === 'overview') {
      // Overview report
      reportData = generateOverviewReport(
        filteredTrips, filteredBookings, filteredPayments, 
        filteredAttendance, filteredMaintenance, routes, buses, users
      );
    } else if (type === 'financial') {
      // Financial report
      reportData = generateFinancialReport(
        filteredTrips, filteredPayments, filteredBookings, routes, buses
      );
    } else if (type === 'operational') {
      // Operational report
      reportData = generateOperationalReport(
        filteredTrips, filteredBookings, filteredAttendance, routes, buses, users
      );
    } else if (type === 'performance') {
      // Performance report
      reportData = generatePerformanceReport(
        filteredTrips, filteredAttendance, filteredMaintenance, routes, buses, users
      );
    } else if (type === 'maintenance') {
      // Maintenance report
      reportData = generateMaintenanceReport(
        filteredMaintenance, filteredTrips, buses, users
      );
    } else if (type === 'user') {
      // User activity report
      reportData = generateUserReport(
        filteredTrips, filteredBookings, filteredPayments, filteredAttendance, users
      );
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate overview report
function generateOverviewReport(trips: any[], bookings: any[], payments: any[], attendance: any[], maintenance: any[], routes: any[], buses: any[], users: any[]) {
  const totalTrips = trips.length;
  const completedTrips = trips.filter((t: any) => t.status === 'completed').length;
  const activeTrips = trips.filter((t: any) => t.status === 'active').length;
  const scheduledTrips = trips.filter((t: any) => t.status === 'scheduled').length;
  
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed').length;
  const pendingBookings = bookings.filter((b: any) => b.status === 'pending').length;
  
  const totalRevenue = payments
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  
  const totalAttendance = attendance.length;
  const presentAttendance = attendance.filter((a: any) => a.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;
  
  const totalMaintenance = maintenance.length;
  const openMaintenance = maintenance.filter((m: any) => m.status === 'open').length;
  const completedMaintenance = maintenance.filter((m: any) => m.status === 'completed').length;
  
  const totalRoutes = routes.length;
  const totalBuses = buses.length;
  const activeBuses = buses.filter((b: any) => b.status === 'active').length;
  
  const totalUsers = users.length;
  const students = users.filter((u: any) => u.role === 'student').length;
  const drivers = users.filter((u: any) => u.role === 'driver').length;
  const supervisors = users.filter((u: any) => u.role === 'supervisor').length;
  const admins = users.filter((u: any) => u.role === 'admin').length;

  return {
    type: 'overview',
    summary: {
      trips: {
        total: totalTrips,
        completed: completedTrips,
        active: activeTrips,
        scheduled: scheduledTrips,
        completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: pendingBookings,
        confirmationRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0
      },
      financial: {
        totalRevenue,
        averageRevenuePerTrip: totalTrips > 0 ? totalRevenue / totalTrips : 0
      },
      attendance: {
        total: totalAttendance,
        present: presentAttendance,
        rate: Math.round(attendanceRate * 100) / 100
      },
      maintenance: {
        total: totalMaintenance,
        open: openMaintenance,
        completed: completedMaintenance,
        completionRate: totalMaintenance > 0 ? (completedMaintenance / totalMaintenance) * 100 : 0
      },
      fleet: {
        totalRoutes,
        totalBuses,
        activeBuses,
        utilizationRate: totalBuses > 0 ? (activeBuses / totalBuses) * 100 : 0
      },
      users: {
        total: totalUsers,
        students,
        drivers,
        supervisors,
        admins
      }
    }
  };
}

// Helper function to generate financial report
function generateFinancialReport(trips: any[], payments: any[], bookings: any[], routes: any[], buses: any[]) {
  const totalRevenue = payments
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  
  const pendingRevenue = payments
    .filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  
  const failedRevenue = payments
    .filter((p: any) => p.status === 'failed')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  
  const totalTrips = trips.length;
  const revenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0;
  
  // Revenue by route
  const revenueByRoute = routes.map((route: any) => {
    const routeTrips = trips.filter((t: any) => t.routeId === route.id);
    const routePayments = payments.filter((p: any) => 
      routeTrips.some((t: any) => t.id === p.tripId)
    );
    const routeRevenue = routePayments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    return {
      routeId: route.id,
      routeName: route.name,
      trips: routeTrips.length,
      revenue: routeRevenue,
      averageRevenue: routeTrips.length > 0 ? routeRevenue / routeTrips.length : 0
    };
  });
  
  // Revenue by bus
  const revenueByBus = buses.map((bus: any) => {
    const busTrips = trips.filter((t: any) => t.busId === bus.id);
    const busPayments = payments.filter((p: any) => 
      busTrips.some((t: any) => t.id === p.tripId)
    );
    const busRevenue = busPayments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    
    return {
      busId: bus.id,
      busNumber: bus.number,
      trips: busTrips.length,
      revenue: busRevenue,
      averageRevenue: busTrips.length > 0 ? busRevenue / busTrips.length : 0
    };
  });

  return {
    type: 'financial',
    summary: {
      totalRevenue,
      pendingRevenue,
      failedRevenue,
      totalTrips,
      revenuePerTrip: Math.round(revenuePerTrip * 100) / 100,
      successRate: (totalRevenue + pendingRevenue + failedRevenue) > 0 ? 
        (totalRevenue / (totalRevenue + pendingRevenue + failedRevenue)) * 100 : 0
    },
    breakdown: {
      byRoute: revenueByRoute,
      byBus: revenueByBus
    }
  };
}

// Helper function to generate operational report
function generateOperationalReport(trips: any[], bookings: any[], attendance: any[], routes: any[], buses: any[], users: any[]) {
  const totalTrips = trips.length;
  const completedTrips = trips.filter((t: any) => t.status === 'completed').length;
  const cancelledTrips = trips.filter((t: any) => t.status === 'cancelled').length;
  
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b: any) => b.status === 'confirmed').length;
  const cancelledBookings = bookings.filter((b: any) => b.status === 'cancelled').length;
  
  const totalAttendance = attendance.length;
  const presentAttendance = attendance.filter((a: any) => a.status === 'present').length;
  const absentAttendance = attendance.filter((a: any) => a.status === 'absent').length;
  
  // Operational metrics by route
  const operationalByRoute = routes.map((route: any) => {
    const routeTrips = trips.filter((t: any) => t.routeId === route.id);
    const routeBookings = bookings.filter((b: any) => 
      routeTrips.some((t: any) => t.id === b.tripId)
    );
    const routeAttendance = attendance.filter((a: any) => 
      routeTrips.some((t: any) => t.id === a.tripId)
    );
    
    return {
      routeId: route.id,
      routeName: route.name,
      trips: routeTrips.length,
      completedTrips: routeTrips.filter((t: any) => t.status === 'completed').length,
      bookings: routeBookings.length,
      confirmedBookings: routeBookings.filter((b: any) => b.status === 'confirmed').length,
      attendance: routeAttendance.length,
      presentAttendance: routeAttendance.filter((a: any) => a.status === 'present').length
    };
  });

  return {
    type: 'operational',
    summary: {
      trips: {
        total: totalTrips,
        completed: completedTrips,
        cancelled: cancelledTrips,
        completionRate: totalTrips > 0 ? (completedTrips / totalTrips) * 100 : 0
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        confirmationRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0
      },
      attendance: {
        total: totalAttendance,
        present: presentAttendance,
        absent: absentAttendance,
        rate: totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0
      }
    },
    breakdown: {
      byRoute: operationalByRoute
    }
  };
}

// Helper function to generate performance report
function generatePerformanceReport(trips: any[], attendance: any[], maintenance: any[], routes: any[], buses: any[], users: any[]) {
  const totalTrips = trips.length;
  const onTimeTrips = trips.filter((t: any) => {
    if (!t.scheduledTime || !t.actualStartTime) return false;
    const scheduled = new Date(`2000-01-01T${t.scheduledTime}`);
    const actual = new Date(`2000-01-01T${t.actualStartTime}`);
    const diffMinutes = Math.abs(actual.getTime() - scheduled.getTime()) / (1000 * 60);
    return diffMinutes <= 5; // 5 minutes grace period
  }).length;
  
  const totalAttendance = attendance.length;
  const presentAttendance = attendance.filter((a: any) => a.status === 'present').length;
  
  const totalMaintenance = maintenance.length;
  const completedMaintenance = maintenance.filter((m: any) => m.status === 'completed').length;
  
  // Performance by driver
  const performanceByDriver = users
    .filter((u: any) => u.role === 'driver')
    .map((driver: any) => {
      const driverTrips = trips.filter((t: any) => t.driverId === driver.id);
      const driverAttendance = attendance.filter((a: any) => 
        driverTrips.some((t: any) => t.id === a.tripId)
      );
      
      const completedTrips = driverTrips.filter((t: any) => t.status === 'completed').length;
      const onTimeTrips = driverTrips.filter((t: any) => {
        if (!t.scheduledTime || !t.actualStartTime) return false;
        const scheduled = new Date(`2000-01-01T${t.scheduledTime}`);
        const actual = new Date(`2000-01-01T${t.actualStartTime}`);
        const diffMinutes = Math.abs(actual.getTime() - scheduled.getTime()) / (1000 * 60);
        return diffMinutes <= 5;
      }).length;
      
      const presentAttendance = driverAttendance.filter((a: any) => a.status === 'present').length;
      
      return {
        driverId: driver.id,
        driverName: driver.name,
        totalTrips: driverTrips.length,
        completedTrips,
        onTimeTrips,
        completionRate: driverTrips.length > 0 ? (completedTrips / driverTrips.length) * 100 : 0,
        onTimeRate: driverTrips.length > 0 ? (onTimeTrips / driverTrips.length) * 100 : 0,
        attendance: driverAttendance.length,
        presentAttendance,
        attendanceRate: driverAttendance.length > 0 ? (presentAttendance / driverAttendance.length) * 100 : 0
      };
    });

  return {
    type: 'performance',
    summary: {
      trips: {
        total: totalTrips,
        onTime: onTimeTrips,
        onTimeRate: totalTrips > 0 ? (onTimeTrips / totalTrips) * 100 : 0
      },
      attendance: {
        total: totalAttendance,
        present: presentAttendance,
        rate: totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0
      },
      maintenance: {
        total: totalMaintenance,
        completed: completedMaintenance,
        completionRate: totalMaintenance > 0 ? (completedMaintenance / totalMaintenance) * 100 : 0
      }
    },
    breakdown: {
      byDriver: performanceByDriver
    }
  };
}

// Helper function to generate maintenance report
function generateMaintenanceReport(maintenance: any[], trips: any[], buses: any[], users: any[]) {
  const totalMaintenance = maintenance.length;
  const openMaintenance = maintenance.filter((m: any) => m.status === 'open').length;
  const inProgressMaintenance = maintenance.filter((m: any) => m.status === 'in_progress').length;
  const completedMaintenance = maintenance.filter((m: any) => m.status === 'completed').length;
  
  const criticalMaintenance = maintenance.filter((m: any) => m.priority === 'critical').length;
  const highMaintenance = maintenance.filter((m: any) => m.priority === 'high').length;
  
  const totalEstimatedCost = maintenance.reduce((sum: number, m: any) => sum + (m.estimatedCost || 0), 0);
  const totalActualCost = maintenance.reduce((sum: number, m: any) => sum + (m.actualCost || 0), 0);
  
  // Maintenance by bus
  const maintenanceByBus = buses.map((bus: any) => {
    const busMaintenance = maintenance.filter((m: any) => m.busId === bus.id);
    const busTrips = trips.filter((t: any) => t.busId === bus.id);
    
    return {
      busId: bus.id,
      busNumber: bus.number,
      maintenanceCount: busMaintenance.length,
      openMaintenance: busMaintenance.filter((m: any) => m.status === 'open').length,
      criticalMaintenance: busMaintenance.filter((m: any) => m.priority === 'critical').length,
      trips: busTrips.length,
      lastMaintenance: bus.lastMaintenance,
      nextMaintenance: bus.nextMaintenance
    };
  });

  return {
    type: 'maintenance',
    summary: {
      total: totalMaintenance,
      open: openMaintenance,
      inProgress: inProgressMaintenance,
      completed: completedMaintenance,
      critical: criticalMaintenance,
      high: highMaintenance,
      estimatedCost: totalEstimatedCost,
      actualCost: totalActualCost,
      costVariance: totalActualCost - totalEstimatedCost
    },
    breakdown: {
      byBus: maintenanceByBus
    }
  };
}

// Helper function to generate user activity report
function generateUserReport(trips: any[], bookings: any[], payments: any[], attendance: any[], users: any[]) {
  const students = users.filter((u: any) => u.role === 'student');
  const drivers = users.filter((u: any) => u.role === 'driver');
  const supervisors = users.filter((u: any) => u.role === 'supervisor');
  
  // Student activity
  const studentActivity = students.map((student: any) => {
    const studentBookings = bookings.filter((b: any) => b.studentId === student.id);
    const studentPayments = payments.filter((p: any) => 
      studentBookings.some((b: any) => b.id === p.bookingId)
    );
    const studentAttendance = attendance.filter((a: any) => 
      studentBookings.some((b: any) => b.tripId === a.tripId)
    );
    
    return {
      studentId: student.id,
      studentName: student.name,
      bookings: studentBookings.length,
      confirmedBookings: studentBookings.filter((b: any) => b.status === 'confirmed').length,
      payments: studentPayments.length,
      completedPayments: studentPayments.filter((p: any) => p.status === 'completed').length,
      attendance: studentAttendance.length,
      presentAttendance: studentAttendance.filter((a: any) => a.status === 'present').length
    };
  });
  
  // Driver activity
  const driverActivity = drivers.map((driver: any) => {
    const driverTrips = trips.filter((t: any) => t.driverId === driver.id);
    const completedTrips = driverTrips.filter((t: any) => t.status === 'completed').length;
    
    return {
      driverId: driver.id,
      driverName: driver.name,
      totalTrips: driverTrips.length,
      completedTrips,
      completionRate: driverTrips.length > 0 ? (completedTrips / driverTrips.length) * 100 : 0
    };
  });

  return {
    type: 'user',
    summary: {
      totalUsers: users.length,
      students: students.length,
      drivers: drivers.length,
      supervisors: supervisors.length
    },
    breakdown: {
      studentActivity,
      driverActivity
    }
  };
}
