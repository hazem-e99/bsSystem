import { api } from '@/lib/api';
import { CreateTripDTO, UpdateTripDTO, TripViewModel } from '@/types/trip';

// Central Trip Service matching Swagger endpoints at base URL http://busmanagementsystem.runasp.net
// Endpoints (relative to /api):
// GET    /Trip
// GET    /Trip/{id}
// POST   /Trip
// PUT    /Trip/{id}
// DELETE /Trip/{id}
// GET    /Trip/by-date/{date}
// GET    /Trip/by-driver/{driverId}
// GET    /Trip/by-bus/{busId}

const unwrap = (resp: any) => (resp?.data ?? resp ?? null);

export const tripService = {
  // List all trips
  async getAll(): Promise<TripViewModel[]> {
    const resp = await api.get<any>('/Trip');
    const list = resp?.data ?? resp ?? [];
    return Array.isArray(list) ? list : [];
  },

  // Trip details
  async getById(id: number | string): Promise<TripViewModel | null> {
    const resp = await api.get<any>(`/Trip/${id}`);
    const item = resp?.data ?? resp ?? null;
    return item ?? null;
  },

  // Create trip
  async create(payload: CreateTripDTO): Promise<any> {
    const body = {
      ...payload,
      busId: Number((payload as any).busId),
      driverId: Number((payload as any).driverId),
      conductorId: Number((payload as any).conductorId),
      stopLocations: (payload.stopLocations && payload.stopLocations.length > 0) ? payload.stopLocations : undefined,
    } as any;
    const resp = await api.post<any>('/Trip', body);
    const unwrapped = unwrap(resp);
    if (unwrapped && typeof unwrapped === 'object' && 'success' in unwrapped && (unwrapped as any).success === false) {
      throw new Error((unwrapped as any).message || 'Trip creation failed');
    }
    return unwrapped ?? resp;
  },

  // Update trip
  async update(id: number | string, payload: UpdateTripDTO): Promise<any> {
    const body = { ...payload } as any;
    if (Array.isArray(body.stopLocations) && body.stopLocations.length === 0) {
      body.stopLocations = undefined;
    }
    const resp = await api.put<any>(`/Trip/${id}`, body);
    if (resp && typeof resp === 'object' && 'success' in resp && resp.success === false) {
      throw new Error(resp.message || 'Trip update failed');
    }
    return resp;
  },

  // Delete trip
  async remove(id: number | string): Promise<any> {
    const resp = await api.delete<any>(`/Trip/${id}`);
    if (resp && typeof resp === 'object' && 'success' in resp && resp.success === false) {
      throw new Error(resp.message || 'Trip delete failed');
    }
    return resp;
  },

  // Filters
  async getByDate(date: string): Promise<TripViewModel[]> {
    const resp = await api.get<any>(`/Trip/by-date/${encodeURIComponent(date)}`);
    const list = resp?.data ?? resp ?? [];
    return Array.isArray(list) ? list : [];
  },

  async getByDriver(driverId: number | string): Promise<TripViewModel[]> {
    const resp = await api.get<any>(`/Trip/by-driver/${driverId}`);
    const list = resp?.data ?? resp ?? [];
    return Array.isArray(list) ? list : [];
  },

  async getByBus(busId: number | string): Promise<TripViewModel[]> {
    const resp = await api.get<any>(`/Trip/by-bus/${busId}`);
    const list = resp?.data ?? resp ?? [];
    return Array.isArray(list) ? list : [];
  },
};

export default tripService;


