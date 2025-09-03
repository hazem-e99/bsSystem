'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import tripService from '@/services/tripService';
import { TripViewModel } from '@/types/trip';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

export default function TripsPage() {
  const { toast } = useToast();
  const [trips, setTrips] = useState<TripViewModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [driverFilter, setDriverFilter] = useState<string>('');
  const [busFilter, setBusFilter] = useState<string>('');

  const fetchTrips = async () => {
    try {
      setLoading(true);
      let data: TripViewModel[] = [];
      if (dateFilter) {
        data = await tripService.getByDate(dateFilter);
      } else if (driverFilter) {
        data = await tripService.getByDriver(driverFilter);
      } else if (busFilter) {
        data = await tripService.getByBus(busFilter);
      } else {
        data = await tripService.getAll();
      }
      setTrips(data);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Failed to load trips:', errorMessage);
      // toast({ title: 'Failed to load trips', description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDelete = async (id: number) => {
    try {
      await tripService.remove(id);
      console.log('Trip deleted successfully');
      // toast({ title: 'Trip deleted' });
      fetchTrips();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Delete failed:', errorMessage);
      // toast({ title: 'Delete failed', description: errorMessage });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Trips</h1>
        <div className="flex items-center gap-3">
          <Badge>عدد الرحلات: {trips.length}</Badge>
          <Link href="/trips/create"><Button>New Trip</Button></Link>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} placeholder="Trip Date" />
          <Input type="number" placeholder="Driver ID" value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} />
          <Input type="number" placeholder="Bus ID" value={busFilter} onChange={(e) => setBusFilter(e.target.value)} />
          <Button variant="secondary" onClick={fetchTrips}>Apply Filters</Button>
        </div>
      </Card>

      {loading ? (
        <Card className="p-6">Loading...</Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3">ID</th>
                  <th className="p-3">Bus</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Conductor</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Departure</th>
                  <th className="p-3">Arrival</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3">{t.id}</td>
                    <td className="p-3">{t.busNumber ?? t.busId}</td>
                    <td className="p-3">{t.driverName ?? t.driverId}</td>
                    <td className="p-3">{t.conductorName ?? t.conductorId}</td>
                    <td className="p-3">{t.tripDate}</td>
                    <td className="p-3">{t.departureTimeOnly}</td>
                    <td className="p-3">{t.arrivalTimeOnly}</td>
                    <td className="p-3 flex gap-2">
                      <Link href={`/trips/${t.id}`}><Button variant="secondary" size="sm">View</Button></Link>
                      <Link href={`/trips/edit/${t.id}`}><Button variant="outline" size="sm">Edit</Button></Link>
                      <Button variant="destructive" size="sm" onClick={() => onDelete(t.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
                {trips.length === 0 && (
                  <tr>
                    <td className="p-10 text-center text-gray-500" colSpan={8}>No trips found. Try adjusting filters or create a new trip.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}








