'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card';
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
  X
} from 'lucide-react';
import { BookingModal } from '@/components/booking/BookingModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { bookingAPI, tripAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatDate';
import { Modal } from '@/components/ui/Modal';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [specificDate, setSpecificDate] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [studentBookings, setStudentBookings] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrichedBookings, setEnrichedBookings] = useState<unknown[]>([]);
  const { showToast } = useToast();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<unknown | null>(null);

  // Fetch student-specific bookings from API and join trip data
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const bookings = await bookingAPI.getByStudent(user.id.toString());
        setStudentBookings(bookings);
        // fetch trips for those bookings
        const tripIds = Array.from(new Set((bookings || []).map((b: Booking) => b.tripId)));
        const tripsResp = await Promise.all(tripIds.map((id: string) => tripAPI.getById(id)));
        const tripsData = tripsResp.filter(Boolean);
        const idToTrip = new Map<string, Trip>();
        tripsData.forEach((t: Trip) => { if (t?.id) idToTrip.set(t.id, t); });

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
      } catch {
        console.error('Failed to fetch bookings:', error);
        setStudentBookings([]);
        setEnrichedBookings([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [user]);
  
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
        const bookings = await bookingAPI.getByStudent(user.id.toString());
        setStudentBookings(bookings);
        
        // Enrich bookings with trip data
        const tripIds = Array.from(new Set(bookings.map((b) => b.tripId)));
        const tripsResp = await Promise.all(tripIds.map((id: string) => tripAPI.getById(id)));
        const tripsData = tripsResp.filter(Boolean);
        const idToTrip = new Map();
        tripsData.forEach((t) => { if (t?.id) idToTrip.set(t.id, t); });

        const enriched = bookings.map((b) => {
          const trip = idToTrip.get(b.tripId) || null;
          let stopName = '';
          if (trip?.stopLocations && b.stopId) {
            const st = trip.stopLocations.find((s) => s.stopId === b.stopId);
            stopName = st?.stopName || '';
          }
          return { ...b, _trip: trip, _stopName: stopName };
        });
        
        setEnrichedBookings(enriched);
      } catch {
        console.error('Failed to refresh bookings:', error);
      }
    }
    
    const paymentMethodText = booking.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash';
    showToast({
      type: 'success',
      title: 'Booking confirmed',
      message: `Trip on ${booking.date} at ${booking.time}. Seat ${booking.seatNumber}. ${paymentMethodText}. Total: $${booking.price}`
    });
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

            <Input type="date" value={specificDate} onChange={(e: unknown) => setSpecificDate(e.target.value)} />
            
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
                    <TableCell>{formatDate(b.date || b.createdAt)}</TableCell>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
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

  const trip = booking?._trip || booking?.trip || null;
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
            <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4" /> <span>{formatDate(trip?.tripDate || booking.date)}</span></div>
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
