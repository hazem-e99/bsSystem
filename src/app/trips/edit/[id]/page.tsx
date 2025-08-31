"use client";

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import tripService from '@/services/tripService';
import { busAPI, userAPI } from '@/lib/api';
import { getApiConfig } from '@/lib/config';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const stopSchema = z.object({
  address: z.string().min(1, 'Address is required').max(300, 'Max 300 characters'),
  arrivalTimeOnly: z.string().min(1, 'Arrival time is required'),
  departureTimeOnly: z.string().min(1, 'Departure time is required'),
});

const updateTripSchema = z.object({
  busId: z.coerce.number().optional(),
  driverId: z.coerce.number().optional(),
  conductorId: z.coerce.number().optional(),
  startLocation: z.string().max(200, 'Max 200 characters').optional(),
  endLocation: z.string().max(200, 'Max 200 characters').optional(),
  tripDate: z.string().optional(),
  departureTimeOnly: z.string().optional(),
  arrivalTimeOnly: z.string().optional(),
  stopLocations: z.array(stopSchema).optional(),
});

type UpdateTripForm = z.infer<typeof updateTripSchema>;

export default function EditTripPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<UpdateTripForm>({ resolver: zodResolver(updateTripSchema), defaultValues: { stopLocations: [] } });
  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: 'stopLocations' as const });
  const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
  const [buses, setBuses] = useState<Array<{ id: number; busNumber?: string }>>([]);
  const [drivers, setDrivers] = useState<Array<{ id: number; fullName?: string; name?: string; email?: string }>>([]);
  const [conductors, setConductors] = useState<Array<{ id: number; fullName?: string; name?: string; email?: string }>>([]);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    (async () => {
      try {
        const data = await tripService.getById(id);
        if (data) {
          form.reset({
            busId: data.busId,
            driverId: data.driverId,
            conductorId: data.conductorId,
            startLocation: data.startLocation ?? '',
            endLocation: data.endLocation ?? '',
            tripDate: data.tripDate,
            departureTimeOnly: data.departureTimeOnly,
            arrivalTimeOnly: data.arrivalTimeOnly,
          });
          replace((data.stopLocations || []).map((s: { id: string; stopName: string; stopTime: string }) => ({ ...s })));
        }
      } catch (e: unknown) {
        toast({ title: 'Failed to load trip', description: String(e?.message || e), variant: 'destructive' });
      }
    })();
  }, [params, form, replace, toast]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingLookups(true);
        const [busesResp, driverUsers, conductorUsers] = await Promise.all([
          busAPI.getAll(),
          userAPI.getByRole('Driver'),
          userAPI.getByRole('Conductor'),
        ]);
        const busList = (busesResp as { data?: unknown })?.data ?? busesResp ?? [];
        setBuses(Array.isArray(busList) ? busList : []);
        setDrivers(Array.isArray(driverUsers) ? driverUsers : []);
        setConductors(Array.isArray(conductorUsers) ? conductorUsers : []);
      } catch (e: unknown) {
        toast({ title: 'Failed to load lookups', description: String(e?.message || e), variant: 'destructive' });
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, [toast]);

  const onSubmit = async (values: UpdateTripForm) => {
    try {
      const id = params?.id as string;
      const url = getApiConfig().buildUrl(`/Trip/${id}`);

      // read token from localStorage if present
      let token: string | undefined;
      try {
        if (typeof window !== 'undefined') {
          const raw = window.localStorage.getItem('user');
          if (raw) {
            const parsed = JSON.parse(raw);
            token = parsed?.token || parsed?.accessToken;
          }
        }
      } catch {}

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(values),
        redirect: 'follow',
      });

      const text = await resp.text();
      if (!resp.ok) {
        // try to extract message from text
        let msg = text || `${resp.status} ${resp.statusText}`;
        try { const j = JSON.parse(text); msg = j?.message || JSON.stringify(j); } catch {}
        throw new Error(msg);
      }

      // success
      toast({ title: 'Trip updated' });
      router.push('/trips');
    } catch (e: unknown) {
      toast({ title: 'Update failed', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Edit Trip</h1>
      <Card className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Bus ID</label>
              <select {...form.register('busId', { valueAsNumber: true })} className="mt-1 w-full border rounded px-3 py-2 bg-white">
                  <option value="">{loadingLookups ? 'Loading...' : 'Select a bus'}</option>
                  {buses.map((b) => {
                    const label = `${b.busNumber ? b.busNumber : 'Bus'} (ID: ${b.id})`;
                    return <option key={b.id} value={b.id}>{label}</option>;
                  })}
                </select>
              {form.formState.errors.busId && <p className="text-red-600 text-sm">{form.formState.errors.busId.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Driver ID</label>
              <select {...form.register('driverId', { valueAsNumber: true })} className="mt-1 w-full border rounded px-3 py-2 bg-white">
                <option value="">{loadingLookups ? 'Loading...' : 'Select a driver'}</option>
                {drivers.map((u) => {
                  const name = u.fullName || u.name || u.email || `User`;
                  const label = `${name} (ID: ${u.id})`;
                  return <option key={u.id} value={u.id}>{label}</option>;
                })}
              </select>
              {form.formState.errors.driverId && <p className="text-red-600 text-sm">{form.formState.errors.driverId.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Conductor ID</label>
              <select {...form.register('conductorId', { valueAsNumber: true })} className="mt-1 w-full border rounded px-3 py-2 bg-white">
                <option value="">{loadingLookups ? 'Loading...' : 'Select a conductor'}</option>
                {conductors.map((u) => {
                  const name = u.fullName || u.name || u.email || `User`;
                  const label = `${name} (ID: ${u.id})`;
                  return <option key={u.id} value={u.id}>{label}</option>;
                })}
              </select>
              {form.formState.errors.conductorId && <p className="text-red-600 text-sm">{form.formState.errors.conductorId.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Trip Date</label>
              <Input type="date" {...form.register('tripDate')} />
              {form.formState.errors.tripDate && <p className="text-red-600 text-sm">{form.formState.errors.tripDate.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Departure Time</label>
              <Input type="time" {...form.register('departureTimeOnly')} />
              {form.formState.errors.departureTimeOnly && <p className="text-red-600 text-sm">{form.formState.errors.departureTimeOnly.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Arrival Time</label>
              <Input type="time" {...form.register('arrivalTimeOnly')} />
              {form.formState.errors.arrivalTimeOnly && <p className="text-red-600 text-sm">{form.formState.errors.arrivalTimeOnly.message as string}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Stop Locations</h2>
              <Button type="button" variant="secondary" onClick={() => append({ address: '', arrivalTimeOnly: '', departureTimeOnly: '' })}>Add Stop</Button>
            </div>
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Address</label>
                    <Input type="text" {...form.register(`stopLocations.${index}.address` as const)} />
                    {form.formState.errors.stopLocations?.[index]?.address && <p className="text-red-600 text-sm">{form.formState.errors.stopLocations?.[index]?.address?.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Arrival</label>
                    <Input type="time" {...form.register(`stopLocations.${index}.arrivalTimeOnly` as const)} />
                    {form.formState.errors.stopLocations?.[index]?.arrivalTimeOnly && <p className="text-red-600 text-sm">{form.formState.errors.stopLocations?.[index]?.arrivalTimeOnly?.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Departure</label>
                    <Input type="time" {...form.register(`stopLocations.${index}.departureTimeOnly` as const)} />
                    {form.formState.errors.stopLocations?.[index]?.departureTimeOnly && <p className="text-red-600 text-sm">{form.formState.errors.stopLocations?.[index]?.departureTimeOnly?.message as string}</p>}
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <Button type="button" variant="destructive" onClick={() => remove(index)}>Remove</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => history.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


