'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import tripService from '@/services/tripService';
import { TripViewModel } from '@/types/trip';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/Card';

export default function TripDetailsPage() {
  const params = useParams();
  const { toast } = useToast();
  const [trip, setTrip] = useState<TripViewModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await tripService.getById(id);
        setTrip(data);
      } catch (e: any) {
        toast({ title: 'Failed to load trip', description: String(e?.message || e), variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [params, toast]);

  if (loading) return <Card className="p-6">Loading...</Card>;
  if (!trip) return <Card className="p-6">Trip not found</Card>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Trip #{trip.id}</h1>
        <Link href={`/trips/edit/${trip.id}`} className="px-3 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600">Edit</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-2">General</h2>
          <p><span className="font-medium">Bus:</span> {trip.busId}</p>
          <p><span className="font-medium">Driver:</span> {trip.driverId}</p>
          <p><span className="font-medium">Conductor:</span> {trip.conductorId}</p>
          <p><span className="font-medium">Date:</span> {trip.tripDate}</p>
          <p><span className="font-medium">Departure:</span> {trip.departureTimeOnly}</p>
          <p><span className="font-medium">Arrival:</span> {trip.arrivalTimeOnly}</p>
          <p><span className="font-medium">Status:</span> {trip.status}</p>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Seats</h2>
          <p><span className="font-medium">Total:</span> {trip.totalSeats}</p>
          <p><span className="font-medium">Booked:</span> {trip.bookedSeats}</p>
          <p><span className="font-medium">Available:</span> {trip.avalableSeates}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-semibold mb-2">Stop Locations</h2>
        {trip.stopLocations && trip.stopLocations.length > 0 ? (
          <ul className="space-y-2">
            {trip.stopLocations.map((s, idx) => (
              <li key={idx} className="border rounded p-2">
                <div className="font-medium">{s.address}</div>
                <div className="text-sm text-gray-600">Arrival: {s.arrivalTimeOnly} • Departure: {s.departureTimeOnly}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">No stops</div>
        )}
      </Card>

      <Link href="/trips" className="px-3 py-2 rounded bg-gray-100 border hover:bg-gray-200">Back to list</Link>
    </div>
  );
}


