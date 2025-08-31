'use client';

import { useEffect, useState } from 'react';
import TripForm from '@/components/trips/TripForm';
import TripList from '@/components/trips/TripList';
import TripDetails from '@/components/trips/TripDetails';
import { tripService } from '@/lib/tripService';
import type { CreateTripDTO, TripResponse } from '@/types/trip';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api, busAPI } from '@/lib/api';

// User interface
interface User {
  id?: number;
  userId?: number;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  role?: string;
}

// Bus interface
interface Bus {
  id?: number;
  busId?: number;
  busNumber?: string;
}

// API response interfaces
interface ApiResponse<T> {
  data: T;
}

// Driver and bus filter interfaces
interface DriverFilter {
  id: number;
  name: string;
}

interface BusFilter {
  id: number;
  label: string;
}

type Mode = 'list' | 'create' | 'edit' | 'view';

export default function AdminTripsPage() {
  const [mode, setMode] = useState<Mode>('list');
  const [items, setItems] = useState<TripResponse[]>([]);
  const [current, setCurrent] = useState<TripResponse | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterBus, setFilterBus] = useState('');
  const [drivers, setDrivers] = useState<DriverFilter[]>([]);
  const [buses, setBuses] = useState<BusFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: TripResponse[] = [];
      if (filterDate) data = await tripService.getByDate(filterDate);
      else if (filterDriver) data = await tripService.getByDriver(filterDriver);
      else if (filterBus) data = await tripService.getByBus(filterBus);
      else data = await tripService.getAll();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const error = e as Error;
      setError(error?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [usersRes, busesRes] = await Promise.all([
          api.get<ApiResponse<User[]>>('/Users'),
          busAPI.getAll(),
        ]);
        const users = Array.isArray((usersRes as ApiResponse<User[]>)?.data) ? (usersRes as ApiResponse<User[]>).data : (Array.isArray(usersRes) ? usersRes : []);
        const toNum = (u: User) => Number(u?.id ?? u?.userId);
        const toName = (u: User) => (u?.fullName || `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.name || u?.email || 'User');
        const role = (u: User) => String(u?.role || '').toLowerCase();
        setDrivers(users.filter((u: User) => role(u) === 'driver').map((u: User) => ({ id: toNum(u), name: `${toName(u)} (#${toNum(u)})` })).filter(d => Number.isFinite(d.id) && d.id > 0));
        const busesList = (busesRes as ApiResponse<Bus[]>)?.data ?? [];
        setBuses((Array.isArray(busesList) ? busesList : []).map((b: Bus) => {
          const id = Number(b?.id ?? b?.busId);
          const label = b?.busNumber ? `${b.busNumber} (#${id})` : `#${id}`;
          return { id, label };
        }).filter(b => Number.isFinite(b.id) && b.id > 0));
      } catch {}
    };
    loadRefs();
  }, []);

  const onCreate = () => { setCurrent(null); setMode('create'); };
  const onEdit = (t: TripResponse) => { setCurrent(t); setMode('edit'); };
  const onView = (t: TripResponse) => { setCurrent(t); setMode('view'); };
  const onDelete = async (t: TripResponse) => {
    if (!confirm(`Delete trip #${t.id}?`)) return;
    try { 
      await tripService.delete(t.id); 
      await load(); 
    } catch (e: unknown) { 
      const error = e as Error;
      alert(error?.message || 'Delete failed'); 
    }
  };

  const onSaved = async (trip: TripResponse) => { 
    console.log('Trip saved:', trip);
    setMode('list'); 
    await load(); 
  };

  const resetFilters = () => { setFilterDate(''); setFilterDriver(''); setFilterBus(''); };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trips</h1>
        {mode === 'list' && <Button onClick={onCreate}>New Trip</Button>}
      </div>

      {mode === 'list' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Driver</label>
              <Select value={filterDriver} onChange={e => setFilterDriver((e.target as HTMLSelectElement).value)}>
                <option value="">All drivers</option>
                {drivers.map(d => (
                  <option key={d.id} value={String(d.id)}>{d.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Bus</label>
              <Select value={filterBus} onChange={e => setFilterBus((e.target as HTMLSelectElement).value)}>
                <option value="">All buses</option>
                {buses.map(b => (
                  <option key={b.id} value={String(b.id)}>{b.label}</option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={load} disabled={loading}>Apply</Button>
              <Button variant="outline" onClick={resetFilters}>Reset</Button>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <TripList trips={items} onView={onView} onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}

      {mode === 'create' && (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setMode('list')}>Back</Button>
          <TripForm onSaved={onSaved} onCancel={() => setMode('list')} />
        </div>
      )}

      {mode === 'edit' && current && (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setMode('list')}>Back</Button>
          <TripForm initial={{
            id: current.id,
            busId: current.busId,
            driverId: current.driverId,
            conductorId: current.conductorId,
            startLocation: current.startLocation,
            endLocation: current.endLocation,
            tripDate: current.tripDate,
            departureTimeOnly: current.departureTimeOnly,
            arrivalTimeOnly: current.arrivalTimeOnly,
            stopLocations: current.stopLocations || [],
          }} onSaved={onSaved} onCancel={() => setMode('list')} />
        </div>
      )}

      {mode === 'view' && current && (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setMode('list')}>Back</Button>
          <TripDetails trip={current} />
        </div>
      )}
    </div>
  );
}


