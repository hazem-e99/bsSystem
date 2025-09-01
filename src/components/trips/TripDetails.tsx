'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, 
  MapPin, 
  Bus, 
  User, 
  Clock, 
  ArrowLeft,
  Edit,
  Trash2,
  Route,
  Info
} from 'lucide-react';
import type { TripResponse } from '@/types/trip';

interface TripDetailsProps {
  trip: TripResponse;
  onBack: () => void;
  onEdit: (trip: TripResponse) => void;
  onDelete: (trip: TripResponse) => void;
}

export default function TripDetails({ 
  trip, 
  onBack, 
  onEdit, 
  onDelete 
}: TripDetailsProps) {
  const formatTime = (time: string) => {
    try {
      return new Date(time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', text: string, color: string }> = {
      'scheduled': { variant: 'default', text: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
      'in-progress': { variant: 'secondary', text: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      'completed': { variant: 'outline', text: 'Completed', color: 'bg-green-100 text-green-800' },
      'cancelled': { variant: 'destructive', text: 'Cancelled', color: 'bg-red-100 text-red-800' },
      'delayed': { variant: 'secondary', text: 'Delayed', color: 'bg-orange-100 text-orange-800' }
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { variant: 'outline', text: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge variant={statusInfo.variant} className={statusInfo.color}>{statusInfo.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-10 w-10 p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trip Details</h1>
            <p className="text-gray-600">Trip #{trip.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => onEdit(trip)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Trip
          </Button>
          <Button
            variant="outline"
            onClick={() => onDelete(trip)}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Trip Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Status</span>
              {getStatusBadge(trip.status || 'scheduled')}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Trip ID</span>
              <span className="text-sm text-gray-900">#{trip.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Created</span>
              <span className="text-sm text-gray-900">
                {(trip as any).createdAt ? formatDate((trip as any).createdAt) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Last Updated</span>
              <span className="text-sm text-gray-900">
                {(trip as any).updatedAt ? formatDate((trip as any).updatedAt) : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Date</span>
              <span className="text-sm text-gray-900">
                {formatDate(trip.departureTimeOnly)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Departure Time</span>
              <span className="text-sm text-gray-900 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatTime(trip.departureTimeOnly)}
              </span>
            </div>
            {trip.arrivalTimeOnly && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Arrival Time</span>
                <span className="text-sm text-gray-900 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(trip.arrivalTimeOnly)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-500">Origin</span>
              </div>
              <span className="text-sm text-gray-900 ml-6">{(trip as any).origin || (trip as any).startLocation || 'N/A'}</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-gray-500">Destination</span>
              </div>
              <span className="text-sm text-gray-900 ml-6">{(trip as any).destination || (trip as any).endLocation || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Driver</span>
              <span className="text-sm text-gray-900 flex items-center gap-1">
                <User className="h-4 w-4" />
                #{trip.driverId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Bus</span>
              <span className="text-sm text-gray-900 flex items-center gap-1">
                <Bus className="h-4 w-4" />
                #{trip.busId}
              </span>
            </div>
            {trip.conductorId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Conductor</span>
                <span className="text-sm text-gray-900 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  #{trip.conductorId}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Details */}
      {((trip as any).notes || (trip as any).description) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(trip as any).notes && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-500">Notes</span>
                <p className="text-sm text-gray-900">{(trip as any).notes}</p>
              </div>
            )}
            {(trip as any).description && (
              <div className="space-y-2 mt-4">
                <span className="text-sm font-medium text-gray-500">Description</span>
                <p className="text-sm text-gray-900">{(trip as any).description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
