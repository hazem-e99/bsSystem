'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import tripService from '@/services/tripService';
import { TripViewModel } from '@/types/trip';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { MapPin, Clock, Calendar, Users, Bus, ArrowLeft, Edit, Route } from 'lucide-react';

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
        toast({ 
          title: 'Failed to load trip', 
          description: String(e?.message || e), 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [params, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'InProgress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Delayed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <TripDetailsSkeleton />;
  if (!trip) return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-6 text-center">
        <h1 className="text-2xl font-semibold mb-4">Trip not found</h1>
        <p className="text-gray-600 mb-6">The trip you're looking for doesn't exist or may have been removed.</p>
        <Link href="/trips">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to trips
          </Button>
        </Link>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/trips">
              <Button variant="outline" size="icon" className="rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Trip #{trip.id}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStatusColor(trip.status)}>
                  {trip.status}
                </Badge>
                <span className="text-sm text-gray-500">• ID: {trip.id}</span>
              </div>
            </div>
          </div>
          <Link href={`/trips/edit/${trip.id}`}>
            <Button className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Trip
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<Bus className="h-5 w-5" />} 
            label="Bus ID" 
            value={trip.busId} 
          />
          <StatCard 
            icon={<Users className="h-5 w-5" />} 
            label="Available Seats" 
            value={`${trip.avalableSeates}/${trip.totalSeats}`} 
          />
          <StatCard 
            icon={<Calendar className="h-5 w-5" />} 
            label="Date" 
            value={new Date(trip.tripDate).toLocaleDateString()} 
          />
          <StatCard 
            icon={<Clock className="h-5 w-5" />} 
            label="Duration" 
            value={`${trip.departureTimeOnly} - ${trip.arrivalTimeOnly}`} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trip Details Card */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Route className="h-5 w-5" />
              Trip Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem label="Driver ID" value={trip.driverId} />
              <DetailItem label="Conductor ID" value={trip.conductorId} />
              <DetailItem label="Departure Time" value={trip.departureTimeOnly} />
              <DetailItem label="Arrival Time" value={trip.arrivalTimeOnly} />
              <DetailItem label="Total Seats" value={trip.totalSeats} />
              <DetailItem label="Booked Seats" value={trip.bookedSeats} />
            </div>
          </Card>

          {/* Route Map Placeholder */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Route Map
            </h2>
            <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p>Interactive map would appear here</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stop Locations */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Stop Locations
            </h2>
            <Badge variant="outline">
              {trip.stopLocations?.length || 0} stops
            </Badge>
          </div>
          
          {trip.stopLocations && trip.stopLocations.length > 0 ? (
            <div className="space-y-4">
              {trip.stopLocations.map((stop, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-800">{index + 1}</span>
                    </div>
                    {index < trip.stopLocations.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{stop.address}</h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Arrival: {stop.arrivalTimeOnly}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Departure: {stop.departureTimeOnly}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No stops scheduled for this trip</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Component for statistic cards
const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <Card className="p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </Card>
);

// Component for detail items
const DetailItem = ({ label, value }: { label: string, value: string | number }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

// Skeleton loader for better loading experience
const TripDetailsSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4 md:p-6">
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  </div>
);