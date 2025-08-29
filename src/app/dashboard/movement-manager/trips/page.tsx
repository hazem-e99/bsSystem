'use client';

import { useEffect, useState } from 'react';
import TripList from '@/components/trips/TripList';
import TripDetails from '@/components/trips/TripDetails';
import { tripService } from '@/lib/tripService';
import type { TripResponse } from '@/types/trip';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { api, busAPI } from '@/lib/api';

type Mode = 'list' | 'view';

export default function MovementManagerTripsPage() {
  const [mode, setMode] = useState<Mode>('list');
  const [items, setItems] = useState<TripResponse[]>([]);
  const [current, setCurrent] = useState<TripResponse | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterDriver, setFilterDriver] = useState('');
  const [filterBus, setFilterBus] = useState('');
  const [drivers, setDrivers] = useState<{ id: number; name: string }[]>([]);
  const [buses, setBuses] = useState<{ id: number; label: string }[]>([]);
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
    } catch (e: any) {
      setError(e?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [usersRes, busesRes] = await Promise.all([
          api.get<any>('/Users'),
          busAPI.getAll(),
        ]);
        const users = Array.isArray((usersRes as any)?.data) ? (usersRes as any).data : (Array.isArray(usersRes) ? usersRes : []);
        const toNum = (u: any) => Number(u?.id ?? u?.userId);
        const toName = (u: any) => (u?.fullName || `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.name || u?.email || 'User');
        const role = (u: any) => String(u?.role || '').toLowerCase();
        setDrivers(users.filter((u: any) => role(u) === 'driver').map((u: any) => ({ id: toNum(u), name: `${toName(u)} (#${toNum(u)})` })).filter(d => Number.isFinite(d.id) && d.id > 0));
        const busesList = (busesRes as any)?.data ?? [];
        setBuses((Array.isArray(busesList) ? busesList : []).map((b: any) => {
          const id = Number(b?.id ?? b?.busId);
          const label = b?.busNumber ? `${b.busNumber} (#${id})` : `#${id}`;
          return { id, label };
        }).filter(b => Number.isFinite(b.id) && b.id > 0));
      } catch {}
    };
    loadRefs();
  }, []);

  const onView = (t: TripResponse) => { setCurrent(t); setMode('view'); };

  const resetFilters = () => { setFilterDate(''); setFilterDriver(''); setFilterBus(''); };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trips</h1>
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

          <TripList trips={items} onView={onView} onEdit={() => {}} onDelete={() => {}} />
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


