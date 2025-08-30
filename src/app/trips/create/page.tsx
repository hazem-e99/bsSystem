'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import tripService from '@/services/tripService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useEffect, useState } from 'react';
import { busAPI, userAPI } from '@/lib/api';

const stopSchema = z.object({
  address: z.string().min(1, 'Address is required').max(300, 'Max 300 characters'),
  arrivalTimeOnly: z.string().min(1, 'Arrival time is required'),
  departureTimeOnly: z.string().min(1, 'Departure time is required'),
});

const createTripSchema = z.object({
  busId: z.coerce.number({ invalid_type_error: 'Bus ID is required' }).int('Bus ID must be an integer').gt(0, 'Bus ID is required'),
  driverId: z.coerce.number({ invalid_type_error: 'Driver ID is required' }).int('Driver ID must be an integer').gt(0, 'Driver ID is required'),
  conductorId: z.coerce.number({ invalid_type_error: 'Conductor ID is required' }).int('Conductor ID must be an integer').gt(0, 'Conductor ID is required'),
  startLocation: z.string().min(1, 'Start location is required').max(200, 'Start location must be at most 200 characters'),
  endLocation: z.string().min(1, 'End location is required').max(200, 'End location must be at most 200 characters'),
  tripDate: z.string().min(1, 'Trip date is required'),
  departureTimeOnly: z.string().min(1, 'Departure time is required'),
  arrivalTimeOnly: z.string().min(1, 'Arrival time is required'),
  stopLocations: z.array(stopSchema).default([]),
});

type CreateTripForm = z.infer<typeof createTripSchema>;

export default function CreateTripPage() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<CreateTripForm>({ resolver: zodResolver(createTripSchema), defaultValues: { stopLocations: [] } });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'stopLocations' });
  const [loadingLookups, setLoadingLookups] = useState<boolean>(true);
  const [buses, setBuses] = useState<Array<{ id: number; busNumber?: string }>>([]);
  const [drivers, setDrivers] = useState<Array<{ id: number; fullName?: string; email?: string }>>([]);
  const [conductors, setConductors] = useState<Array<{ id: number; fullName?: string; email?: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingLookups(true);
        const [busesResp, driverUsers, conductorUsers] = await Promise.all([
          busAPI.getAll(),
          userAPI.getByRole('Driver'),
          userAPI.getByRole('Conductor'),
        ]);
        const busList = (busesResp as any)?.data ?? busesResp ?? [];
        setBuses(Array.isArray(busList) ? busList : []);
        setDrivers(Array.isArray(driverUsers) ? driverUsers : []);
        setConductors(Array.isArray(conductorUsers) ? conductorUsers : []);
      } catch (e: any) {
        toast({ title: 'Failed to load lookups', description: String(e?.message || e), variant: 'destructive' });
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, [toast]);

  const onSubmit = async (values: CreateTripForm) => {
    try {
      // Validate selection IDs against loaded lists to avoid backend validation errors
      if (!buses.find((b: any) => Number(b.id) === Number(values.busId))) {
        throw new Error('Selected bus is invalid');
      }
      if (!drivers.find((u: any) => Number(u.id) === Number(values.driverId))) {
        throw new Error('Selected driver is invalid');
      }
      if (!conductors.find((u: any) => Number(u.id) === Number(values.conductorId))) {
        throw new Error('Selected conductor is invalid');
      }
      if (Number(values.driverId) === Number(values.conductorId)) {
        throw new Error('Driver and Conductor must be different users');
      }
      const resp = await tripService.create(values);
      const ok = typeof resp === 'object' ? (resp?.success ?? resp?.data ?? true) : true;
      if (!ok) {
        throw new Error((resp as any)?.message || 'Trip creation failed');
      }
      toast({ title: 'Trip created' });
      router.push('/trips');
    } catch (e: any) {
      toast({ title: 'Create failed', description: String(e?.message || e), variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Create Trip</h1>
      <Card className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Bus ID</label>
              <select {...form.register('busId', { valueAsNumber: true })} className="mt-1 w-full border rounded px-3 py-2 bg-white">
                <option value="">{loadingLookups ? 'Loading...' : 'Select a bus'}</option>
                {buses.map((b: any) => {
                  const label = `${b.busNumber ? b.busNumber : 'Bus'} (ID: ${b.id})`;
                  return <option key={b.id} value={b.id}>{label}</option>;
                })}
              </select>
              {form.formState.errors.busId && <p className="text-red-600 text-sm">{form.formState.errors.busId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Driver ID</label>
              <select {...form.register('driverId', { valueAsNumber: true })} className="mt-1 w-full border rounded px-3 py-2 bg-white">
                <option value="">{loadingLookups ? 'Loading...' : 'Select a driver'}</option>
                {drivers.map((u: any) => {
                  const name = u.fullName || u.name || u.email || `User`;
                  const label = `${name} (ID: ${u.id})`;
                  return <option key={u.id} value={u.id}>{label}</option>;
                })}
              </select>
              {form.formState.errors.driverId && <p className="text-red-600 text-sm">{form.formState.errors.driverId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Conductor ID</label>
              <select {...form.register('conductorId', { valueAsNumber: true })} className="mt-1 w-full border rounded px-3 py-2 bg-white">
                <option value="">{loadingLookups ? 'Loading...' : 'Select a conductor'}</option>
                {conductors.map((u: any) => {
                  const name = u.fullName || u.name || u.email || `User`;
                  const label = `${name} (ID: ${u.id})`;
                  return <option key={u.id} value={u.id}>{label}</option>;
                })}
              </select>
              {form.formState.errors.conductorId && <p className="text-red-600 text-sm">{form.formState.errors.conductorId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Trip Date</label>
              <Input type="date" {...form.register('tripDate')} />
              {form.formState.errors.tripDate && <p className="text-red-600 text-sm">{form.formState.errors.tripDate.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Departure Time</label>
              <Input type="time" {...form.register('departureTimeOnly')} />
              {form.formState.errors.departureTimeOnly && <p className="text-red-600 text-sm">{form.formState.errors.departureTimeOnly.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Arrival Time</label>
              <Input type="time" {...form.register('arrivalTimeOnly')} />
              {form.formState.errors.arrivalTimeOnly && <p className="text-red-600 text-sm">{form.formState.errors.arrivalTimeOnly.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Start Location</label>
              <Input type="text" {...form.register('startLocation')} />
              {form.formState.errors.startLocation && <p className="text-red-600 text-sm">{form.formState.errors.startLocation.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">End Location</label>
              <Input type="text" {...form.register('endLocation')} />
              {form.formState.errors.endLocation && <p className="text-red-600 text-sm">{form.formState.errors.endLocation.message}</p>}
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
            <Button type="submit">Create Trip</Button>
            <Button type="button" variant="secondary" onClick={() => history.back()}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


