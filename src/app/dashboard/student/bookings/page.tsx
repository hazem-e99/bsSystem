'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Bus as BusIcon,
  Search,
  Download,
  Eye,
  X,
  Plus,
  Users
} from 'lucide-react';
import { BookingModal } from '@/components/booking/BookingModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { bookingAPI, tripAPI, busAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatDate';
import { Modal } from '@/components/ui/Modal';

interface Booking {
  id: string;
  tripId: string;
  stopId?: string;
  date: string;
  status: string;
  seatNumber?: number;
  createdAt?: string;
}

interface Trip {
  id: string | number;
  tripDate: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime?: string;
  busId?: string | number;
  capacity?: number;
  duration?: number;
  date?: string;
  displayDate?: string;
  busDetails?: any;
  stopLocations?: Array<{
    stopId: string;
    stopName: string;
    arrivalTime: string;
  }>;
  stops?: Array<{
    id: string;
    stopName: string;
    stopTime: string;
  }>;
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [studentBookings, setStudentBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrichedBookings, setEnrichedBookings] = useState<(Booking & { _trip: Trip | null; _stopName: string })[]>([]);
  const { showToast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<(Booking & { _trip: Trip | null; _stopName: string }) | null>(null);
  
  // New state for available trips section
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [tripSearchTerm, setTripSearchTerm] = useState('');
  const [tripDateFilter, setTripDateFilter] = useState('all');
  const [selectedTripForBooking, setSelectedTripForBooking] = useState<any | null>(null);
  const [bookingLoadingTripId, setBookingLoadingTripId] = useState<string | number | null>(null);

  // Fetch student-specific bookings from API and join trip data
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const bookings = await bookingAPI.getByStudent(user.id.toString()) as Booking[];
        setStudentBookings(bookings);
        // fetch trips for those bookings
        const tripIds = Array.from(new Set((bookings || []).map((b: Booking) => b.tripId)));
        const tripsResp = await Promise.all(tripIds.map((id: string) => tripAPI.getById(id)));
        const tripsData = tripsResp.filter(Boolean);
        const idToTrip = new Map<string, any>();
        tripsData.forEach((t: any) => { if (t?.id) idToTrip.set(t.id, t); });

        const enriched = (bookings || []).map((b: Booking) => {
          const trip = idToTrip.get(b.tripId) || null;
          let stopName = '';
          if (trip?.stopLocations && b.stopId) {
            const st = trip.stopLocations.find((s: { stopId: string; stopName: string }) => s.stopId === b.stopId);
            stopName = st?.stopName || '';
          }
          return { ...b, _trip: trip, _stopName: stopName };
        });
        setEnrichedBookings(enriched);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        setStudentBookings([]);
        setEnrichedBookings([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  // Fetch all available trips
  useEffect(() => {
    const fetchAvailableTrips = async () => {
      try {
        setIsLoadingTrips(true);
        // Get trips for the next 30 days
        const today = new Date();
        const futureTrips: any[] = [];
        
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          try {
            const trips = await tripAPI.getByDate(dateStr);
            if (Array.isArray(trips) && trips.length > 0) {
              // Process each trip and fetch bus details
              for (const trip of trips) {
                let busDetails = null;
                
                // Try to fetch bus details if busId exists (but don't fail if forbidden)
                console.log(`Trip ${trip.id} has busId:`, trip.busId);
                if (trip.busId) {
                  try {
                    // Convert busId to number if it's a string
                    const busIdNumber = typeof trip.busId === 'string' ? parseInt(trip.busId) : trip.busId;
                    console.log(`Converting busId to number:`, busIdNumber);
                    busDetails = await busAPI.getById(busIdNumber);
                    console.log(`Bus details for trip ${trip.id}:`, busDetails);
                    console.log(`Bus capacity:`, busDetails?.data?.capacity);
                    console.log(`Bus number:`, busDetails?.data?.busNumber);
                  } catch (error) {
                    console.error(`Failed to fetch bus details for bus ${trip.busId}:`, error);
                    // Set busDetails to null if API fails
                    busDetails = null;
                  }
                }
                
                futureTrips.push({
                  ...trip,
                  tripDate: dateStr,
                  date: dateStr,
                  displayDate: dateStr,
                  busDetails: busDetails
                });
              }
            }
          } catch (error) {
            console.error(`Failed to fetch trips for ${dateStr}:`, error);
          }
        }
        
        setAvailableTrips(futureTrips);
      } catch (error) {
        console.error('Failed to fetch available trips:', error);
        setAvailableTrips([]);
      } finally {
        setIsLoadingTrips(false);
      }
    };
    
    fetchAvailableTrips();
  }, []);
  
  // Filter bookings based on search and filters
  const filteredBookings = enrichedBookings.filter(booking => {
    const trip = booking._trip;
    const start = trip?.startLocation || '';
    const end = trip?.endLocation || '';
    const matchesSearch = searchTerm === '' ||
      start.toLowerCase().includes(searchTerm.toLowerCase()) ||
      end.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking._stopName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    let matchesDate = true;
    if (specificDate) {
      matchesDate = booking.date === specificDate;
    } else {
      matchesDate = dateFilter === 'all' || 
        (dateFilter === 'today' && booking.date === new Date().toISOString().split('T')[0]) ||
        (dateFilter === 'upcoming' && new Date(booking.date) > new Date()) ||
        (dateFilter === 'past' && new Date(booking.date) < new Date());
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Filter available trips
  const filteredAvailableTrips = availableTrips.filter(trip => {
    const matchesSearch = tripSearchTerm === '' ||
      trip.startLocation?.toLowerCase().includes(tripSearchTerm.toLowerCase()) ||
      trip.endLocation?.toLowerCase().includes(tripSearchTerm.toLowerCase());
    
    let matchesDate = true;
    const tripDate = trip.displayDate || trip.tripDate || trip.date;
    
    if (tripDateFilter === 'today') {
      matchesDate = tripDate === new Date().toISOString().split('T')[0];
    } else if (tripDateFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      matchesDate = tripDate === tomorrow.toISOString().split('T')[0];
    } else if (tripDateFilter === 'this-week') {
      const today = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(today.getDate() + 7);
      matchesDate = new Date(tripDate) >= today && new Date(tripDate) <= weekFromNow;
    }
    
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return '🟢';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  const exportBookings = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Trip,From,To,Time,Status,Seat\n" +
      filteredBookings.map(booking => {
        const trip = booking._trip;
        return `${booking.date},${trip ? `${trip.startLocation} → ${trip.endLocation}` : 'N/A'},${trip?.startLocation || 'N/A'},${trip?.endLocation || 'N/A'},${trip ? `${trip.startTime}-${trip.endTime}` : 'N/A'},${booking.status},${booking.seatNumber || 'N/A'}`;
      }).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_bookings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDetails = (booking: Booking & { _trip: Trip | null; _stopName: string }) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedBooking(null);
  };

  const handleBookingSuccess = async (booking: { date: string; time: string; seatNumber: number; paymentMethod: string; price: number }) => {
    // Refresh bookings data
    if (user) {
      try {
        const bookings = await bookingAPI.getByStudent(user.id.toString()) as Booking[];
        setStudentBookings(bookings);
        
        // Enrich bookings with trip data
        const tripIds = Array.from(new Set(bookings.map((b: Booking) => b.tripId)));
        const tripsResp = await Promise.all(tripIds.map((id: string) => tripAPI.getById(id)));
        const tripsData = tripsResp.filter(Boolean);
        const idToTrip = new Map<string, any>();
        tripsData.forEach((t: any) => { if (t?.id) idToTrip.set(t.id, t); });

        const enriched = bookings.map((b: Booking) => {
          const trip = idToTrip.get(b.tripId) || null;
          let stopName = '';
          if (trip?.stopLocations && b.stopId) {
            const st = trip.stopLocations.find((s: any) => s.stopId === b.stopId);
            stopName = st?.stopName || '';
          }
          return { ...b, _trip: trip, _stopName: stopName };
        });
        
        setEnrichedBookings(enriched);
      } catch {
        console.error('Failed to refresh bookings:', Error);
      }
    }
    
    const paymentMethodText = booking.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash';
    showToast({
      type: 'success',
      title: 'Booking confirmed',
      message: `Trip on ${booking.date} at ${booking.time}. Seat ${booking.seatNumber}. ${paymentMethodText}. Total: $${booking.price}`
    });
  };

  const handleBookNow = async (trip: Trip) => {
    try {
      setBookingLoadingTripId(trip.id);
      // Load detailed trip data using /api/Trip/{id} endpoint
      const detailedTrip = await tripAPI.getById(trip.id);
      if (detailedTrip) {
        // Merge basic trip data with detailed data
        const enhancedTrip = {
          ...trip,
          ...detailedTrip,
          // Map stop locations to the expected format
          stops: detailedTrip.stopLocations?.map((stop: any, index: number) => ({
            id: `stop-${index}`,
            stopName: stop.address || `Stop ${index + 1}`,
            stopTime: stop.departureTimeOnly || stop.arrivalTimeOnly || 'TBD'
          })) || []
        };
        
        setSelectedTripForBooking(enhancedTrip);
        setIsBookingModalOpen(true);
        console.log('Trip details loaded successfully for booking:', enhancedTrip);
      } else {
        console.warn('No detailed trip data received, using basic data');
        setSelectedTripForBooking(trip);
        setIsBookingModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to load trip details for booking:', error);
      // Show error message to user
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load trip details. Please try again.'
      });
      // Still open modal with basic trip data
      setSelectedTripForBooking(trip);
      setIsBookingModalOpen(true);
    } finally {
      setBookingLoadingTripId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#212121]">My Bookings</h1>
          <p className="text-[#424242]">Manage and track your bus trip bookings</p>
        </div>
        <Button onClick={() => setIsBookingModalOpen(true)}>
          <Calendar className="w-4 h-4 mr-2" />
          Book New Trip
        </Button>
      </div>

      {/* Available Trips Section */}
      <Card className="bg-white border-[#E0E0E0]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BusIcon className="w-5 h-5 text-primary" />
            Available Trips
          </CardTitle>
          <CardDescription className="text-[#757575]">Browse and book from all available trips</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Trip Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#757575]" />
              <Input
                placeholder="Search routes, locations..."
                value={tripSearchTerm}
                onChange={(e) => setTripSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={tripDateFilter}
              onChange={(e) => setTripDateFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Dates' },
                { value: 'today', label: 'Today' },
                { value: 'tomorrow', label: 'Tomorrow' },
                { value: 'this-week', label: 'This Week' }
              ]}
            />
            
            <div className="text-sm text-[#757575] flex items-center">
              <Users className="w-4 h-4 mr-2" />
              {filteredAvailableTrips.length} trips available
            </div>
          </div>

          {/* Available Trips Table */}
          {isLoadingTrips ? (
            <div className="text-center py-12 text-[#757575]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading available trips...</p>
            </div>
          ) : filteredAvailableTrips.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Route</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Capacity</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAvailableTrips.map((trip) => (
                    <TableRow key={trip.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {formatDate(trip.displayDate || trip.tripDate || trip.date)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {trip.startLocation || 'Start'} → {trip.endLocation || 'End'}
                          </div>
                          <div className="text-xs text-[#757575]">
                            Route #{trip.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">
                            {(trip.departureTimeOnly || trip.startTime || 'TBD')} - {(trip.arrivalTimeOnly || trip.endTime || 'TBD')}
                          </div>
                          {trip.duration ? (
                            <div className="text-xs text-[#757575]">{`${trip.duration} min`}</div>
                          ) : null}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#757575]" />
                          <span className="font-medium">
                            {trip.busDetails?.data?.capacity || trip.busDetails?.capacity || trip.capacity || trip.totalSeats || 'N/A'}
                          </span>
                          <span className="text-xs text-[#757575]">
                            seats
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="text-xs">
                          Available
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleBookNow(trip)}
                          size="sm"
                          disabled={bookingLoadingTripId === trip.id}
                        >
                          {bookingLoadingTripId === trip.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Book Now
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-[#757575]">
              <BusIcon className="w-16 h-16 mx-auto mb-4 text-[#BDBDBD]" />
              <h3 className="text-lg font-medium mb-2">No trips available</h3>
              <p className="text-sm">Try adjusting your search criteria or check back later.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modern Filters */}
      
      {/* Filters and Search */}
      <Card className="bg-white border-[#E0E0E0]">
        <CardHeader>
          <CardTitle className="text-[#212121]">Filters & Search</CardTitle>
          <CardDescription className="text-[#757575]">Find specific bookings quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#757575]" />
              <Input
                placeholder="Search routes, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
            />
            
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Dates' },
                { value: 'today', label: 'Today' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'past', label: 'Past' }
              ]}
            />

            <Input type="date" value={specificDate} onChange={(e: unknown) => setSpecificDate((e as any).target.value)} />
            
            <Button onClick={exportBookings} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card className="bg-white border-[#E0E0E0]">
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>{isLoading ? 'Loading...' : `${filteredBookings.length} booking(s)`}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-[#757575]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading your bookings...</p>
            </div>
          ) : filteredBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Trip</TableHead>
                  <TableHead>Stop</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((b) => (
                  <TableRow key={`bk-row-${b.id}`}>
                     <TableCell>{formatDate(b.date || b.createdAt || null)}</TableCell>
                    <TableCell>{b._trip ? `${b._trip.startLocation || '—'} → ${b._trip.endLocation || '—'}` : '-'}</TableCell>
                    <TableCell>{b._stopName || '-'}</TableCell>
                    <TableCell>
                      <Badge>{(b.status || 'confirmed').toString().charAt(0).toUpperCase() + (b.status || 'confirmed').toString().slice(1)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openDetails(b)}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-[#757575]">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-[#BDBDBD]" />
              <h3 className="text-lg font-medium mb-2">No bookings yet.</h3>
              <p className="text-sm mb-4">Start by booking a trip from the available trips above.</p>
              <Button onClick={() => setIsBookingModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Book Your First Trip
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedTripForBooking(null);
          setBookingLoadingTripId(null);
        }}
        onSuccess={handleBookingSuccess}
        preSelectedTrip={selectedTripForBooking}
      />

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          isOpen={detailsOpen}
          onClose={closeDetails}
          booking={selectedBooking}
        />)
      }
    </div>
  );
}

function BookingDetailsModal({ isOpen, onClose, booking }: { isOpen: boolean; onClose: () => void; booking: Booking & { _trip: Trip | null; _stopName: string } }) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const trip = booking?._trip || null;
  const stop = trip?.stopLocations?.find((s: { stopId: string; stopName: string; arrivalTime: string }) => s.stopId === booking.stopId);

  useEffect(() => {
    if (!trip || !stop?.arrivalTime) { setRemainingMs(null); return; }
    const target = new Date(`${trip.tripDate || booking.date}T${stop.arrivalTime}:00`);
    const tick = () => {
      const diff = target.getTime() - Date.now();
      setRemainingMs(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [trip?.tripDate, stop?.arrivalTime, booking.date]);

  const formatHms = (ms: number) => {
    if (ms <= 0) return 'Arrived';
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">My Booked Trip</h3>
          <button onClick={onClose} className="p-2 hover:bg-card-hover rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" /> <span>{formatDate(trip?.tripDate || booking.date || null)}</span></div>
            <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4" /> <span>{trip?.startTime} {trip?.endTime ? `- ${trip.endTime}` : ''}</span></div>
            <div className="flex items-center gap-2 text-sm"><BusIcon className="w-4 h-4" /> <span>Bus: {trip?.busId || '-'}</span></div>
            <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4" /> <span>Pickup: {stop?.stopName || booking._stopName || '-'}</span></div>
            <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4" /> <span>Pickup time: {stop?.arrivalTime || '-'}</span></div>
          </div>
          <div className="space-y-2">
            <div className="text-sm"><span className="text-text-muted">Trip:</span> <span className="font-medium">{`${trip?.startLocation || 'Start'} → ${trip?.endLocation || 'End'}`}</span></div>
            <div className="text-sm"><span className="text-text-muted">Booking Status:</span> <span className="font-medium">{booking.status || 'confirmed'}</span></div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
          <div className="text-sm text-text-muted mb-1">Time until arrival at your stop</div>
          <div className="text-2xl font-bold">{remainingMs == null ? '-' : formatHms(remainingMs)}</div>
        </div>
      </div>
    </Modal>
  );
}
