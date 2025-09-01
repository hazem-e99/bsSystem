'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { 
  Bus, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye
} from 'lucide-react';
import { busAPI, userAPI } from '@/lib/api';
import { Bus as BusType, BusRequest, BusListParams } from '@/types/bus';
import { formatDate } from '@/utils/formatDate';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';

export default function BusesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive' | 'UnderMaintenance' | 'OutOfService'>('all');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusType | null>(null);
  const [newBus, setNewBus] = useState<BusRequest>({
    busNumber: '',
    capacity: 50,
    status: 'Active',
    speed: 0
  });
  const [buses, setBuses] = useState<BusType[]>([]);
  const [users, setUsers] = useState<unknown[]>([]);
  const [routes, setRoutes] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingBus, setIsAddingBus] = useState(false);
  const [addMessage, setAddMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState<{ open: boolean; busId?: number; message?: string }>({ open: false });
  const [hiddenDeletedIds, setHiddenDeletedIds] = useState<Set<string>>(new Set());
  const buildParams = (): BusListParams => {
    let minCapacity = 0;
    let maxCapacity = 0;
    if (capacityFilter === 'small') { minCapacity = 0; maxCapacity = 30; }
    if (capacityFilter === 'medium') { minCapacity = 31; maxCapacity = 60; }
    if (capacityFilter === 'large') { minCapacity = 61; maxCapacity = 0; }
    return {
      page: 0,
      pageSize: 1000, // Get all buses initially
      busNumber: searchTerm,
      status: statusFilter === 'all' ? '' : (statusFilter as 'Active' | 'Inactive' | 'UnderMaintenance' | 'OutOfService'),
      minSpeed: 0,
      maxSpeed: 0,
      minCapacity,
      maxCapacity,
    };
  };

  const validateBusDTO = (data: BusRequest) => {
    if (!data.busNumber || data.busNumber.trim().length === 0 || data.busNumber.length > 20) {
      throw new Error('Bus number is required and must be ≤ 20 characters');
    }
    if (typeof data.speed !== 'number' || data.speed < 0 || data.speed > 200) {
      throw new Error('Speed must be between 0 and 200');
    }
    if (!Number.isInteger(data.capacity) || data.capacity < 10 || data.capacity > 100) {
      throw new Error('Capacity must be an integer between 10 and 100');
    }
    const validStatuses = ['Active','Inactive','UnderMaintenance','OutOfService'];
    if (!validStatuses.includes(data.status)) {
      throw new Error('Status must be Active, Inactive, UnderMaintenance, or OutOfService');
    }
  };

  const checkBusNumberExists = async (busNumber: string): Promise<boolean> => {
    try {
      // Check if bus number exists in current loaded buses
      const existingBus = buses.find(bus => bus.busNumber === busNumber);
      if (existingBus) return true;
      
      // Also check against server to catch any duplicates not in current list
      const response = await busAPI.getAll({ 
        page: 0, 
        pageSize: 1000, 
        busNumber: busNumber,
        status: '',
        minSpeed: 0,
        maxSpeed: 0,
        minCapacity: 0,
        maxCapacity: 0
      });
      
      const busesList = Array.isArray(response) ? response : (response?.data || []);
      return busesList.some((bus: BusType) => bus.busNumber === busNumber);
    } catch (error) {
      console.error('Error checking bus number existence:', error);
      // If we can&apos;t check server, fall back to local check
      return buses.find(bus => bus.busNumber === busNumber) !== undefined;
    }
  };

  // Fetch data from API
  useEffect(() => {
    // Load hidden deleted ids from storage to avoid reappearing items after refresh until server confirms deletion
    try {
      const raw = localStorage.getItem('hiddenDeletedBuses');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setHiddenDeletedIds(new Set(arr.map(String)));
      }
    } catch {}

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Use default params for initial load (no filters)
        const initialParams: BusListParams = {
          page: 0,
          pageSize: 1000,
          busNumber: '',
          status: '',
          minSpeed: 0,
          maxSpeed: 0,
          minCapacity: 0,
          maxCapacity: 0,
        };
        
        console.log('🔍 Fetching buses with initial params:', initialParams);
        
        const [busesResponse, usersData] = await Promise.all([
          busAPI.getAll(initialParams),
          userAPI.getAll()
        ]);
        
        console.log('📡 Raw buses response:', busesResponse);
        
        // Extract data from the new API response format (wrapped) or fallback to array
        const busesList = Array.isArray(busesResponse) ? busesResponse : (busesResponse?.data || []);
        console.log('📋 Extracted buses list:', busesList);
        
        const cleanBusesData = busesList
          .filter((bus: BusType) => bus && bus.id)
          .filter((bus: BusType) => !hiddenDeletedIds.has(String(bus.id)))
          .map((bus: BusType) => ({
            ...bus,
            id: bus.id || 0,
            busNumber: bus.busNumber || 'Unknown',
            capacity: bus.capacity || 50,
            status: bus.status || 'Active',
            speed: bus.speed || 0,
            fuelLevel: bus.fuelLevel ?? 0,
            location: bus.location && typeof bus.location === 'object'
              ? { lat: Number(bus.location.lat) || 0, lng: Number(bus.location.lng) || 0 }
              : { lat: 0, lng: 0 }
          }));
        
        console.log('✨ Clean buses data:', cleanBusesData);
        setBuses(cleanBusesData);
        setUsers(usersData);
        // setRoutes([]); // Routes not implemented yet
        
        if (cleanBusesData.length === 0) {
          console.log('ℹ️ No buses found in the system');
        } else {
          console.log(`✅ Successfully loaded ${cleanBusesData.length} buses`);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Set empty arrays on error to prevent crashes
        setBuses([]);
        setUsers([]);
        setRoutes([]);
        
        // Show error toast
        showToast({ 
          type: 'error', 
          title: 'Failed to load buses', 
          message: 'Please check your connection and try again.' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter buses based on search and filters
  const filteredBuses = buses
    .filter(bus => {
      const matchesSearch = bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || bus.status === statusFilter;
      const matchesCapacity = capacityFilter === 'all' || 
        (capacityFilter === 'small' && bus.capacity <= 30) ||
        (capacityFilter === 'medium' && bus.capacity > 30 && bus.capacity <= 60) ||
        (capacityFilter === 'large' && bus.capacity > 60);
      
      return matchesSearch && matchesStatus && matchesCapacity;
    })
    // Remove duplicates based on ID
    .filter((bus, index, self) => 
      index === self.findIndex(b => b.id === bus.id)
    );

  const handleApplyFilters = async () => {
    try {
      setIsLoading(true);
      const updatedBusesResponse = await busAPI.getAll(buildParams());
      const busesList = Array.isArray(updatedBusesResponse) ? updatedBusesResponse : (updatedBusesResponse?.data || []);
      const cleanBusesData = busesList
        .filter((bus: BusType) => bus && bus.id)
        .filter((bus: BusType) => !hiddenDeletedIds.has(String(bus.id)))
        .map((bus: BusType) => ({
          ...bus,
          id: bus.id || 0,
          busNumber: bus.busNumber || 'Unknown',
          capacity: bus.capacity || 50,
          status: bus.status || 'Active',
          speed: bus.speed || 0,
          fuelLevel: bus.fuelLevel ?? 0,
          location: bus.location && typeof bus.location === 'object'
            ? { lat: Number(bus.location.lat) || 0, lng: Number(bus.location.lng) || 0 }
            : { lat: 0, lng: 0 }
        }));
      setBuses(cleanBusesData);
    } catch (error) {
      console.error('Failed to apply filters:', error);
      setBuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBus(true);
    setAddMessage(null);
    
    try {
      // Validate bus number uniqueness (check both local and server)
      const busNumberExists = await checkBusNumberExists(newBus.busNumber);
      if (busNumberExists) {
        showToast({ type: 'warning', title: 'Duplicate bus number', message: `Bus number ${newBus.busNumber} already exists. Please use a different number.` });
        setIsAddingBus(false);
        return;
      }
      
      // Create bus data with proper structure for new API
      const busData: BusRequest = {
        busNumber: newBus.busNumber,
        capacity: newBus.capacity,
        status: newBus.status,
        speed: newBus.speed
      };
      validateBusDTO(busData);

      // Create bus via API
      const response = await busAPI.create(busData);
      
      if (response && (response as { success: boolean }).success) {
        // Refresh the buses list
        const updatedBusesResponse = await busAPI.getAll(buildParams());
        const busesList = Array.isArray(updatedBusesResponse) ? updatedBusesResponse : (updatedBusesResponse?.data || []);
        const cleanBusesData = busesList
          .filter((bus: BusType) => bus && bus.id)
          .map((bus: BusType) => ({
            ...bus,
            id: bus.id || 0,
            busNumber: bus.busNumber || 'Unknown',
            capacity: bus.capacity || 50,
            status: bus.status || 'Active',
            speed: bus.speed || 0,
            fuelLevel: bus.fuelLevel ?? 0,
            location: bus.location && typeof bus.location === 'object'
              ? { lat: Number(bus.location.lat) || 0, lng: Number(bus.location.lng) || 0 }
              : { lat: 0, lng: 0 }
          }));
        setBuses(cleanBusesData);
        
        showToast({ type: 'success', title: 'Bus added', message: `Bus ${newBus.busNumber} added successfully.` });
        if ((response as { message?: string }).message) setAddMessage({ type: 'success', text: String((response as { message?: string }).message) });
        
        setShowAddModal(false);
        setNewBus({ 
          busNumber: '', 
          capacity: 50, 
          status: 'Active', 
          speed: 0
        });
      } else {
        const msg = (response as { message?: string })?.message || 'Server rejected create request.';
        setAddMessage({ type: 'error', text: msg });
      }
    } catch (error) {
      console.error('Failed to add bus:', error);
      const message = error instanceof Error ? error.message : 'Failed to add bus. Please try again.';
      showToast({ type: 'error', title: 'Add failed', message });
      setAddMessage({ type: 'error', text: message });
    } finally {
      setIsAddingBus(false);
    }
  };

  const handleEditBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;
    setEditMessage(null);
    
    try {
      // Check if bus number is being changed and if it conflicts with existing buses
      // We need to compare against the original bus number from when edit was opened
      const originalBus = buses.find(bus => bus.id === selectedBus.id);
      if (originalBus && selectedBus.busNumber !== originalBus.busNumber) {
        const busNumberExists = await checkBusNumberExists(selectedBus.busNumber);
        if (busNumberExists) {
          showToast({ type: 'warning', title: 'Duplicate bus number', message: `Bus number ${selectedBus.busNumber} already exists. Please use a different number.` });
          return;
        }
      }

      // Update bus data with proper structure for new API
      const busData: BusRequest = {
        busNumber: selectedBus.busNumber,
        capacity: selectedBus.capacity,
        status: selectedBus.status,
        speed: selectedBus.speed
      };
      validateBusDTO(busData);
      
      // Update bus via API
      const response = await busAPI.update(selectedBus.id, busData);
      
      if (response && (response as { success: boolean }).success) {
        // Refresh the buses list
        const updatedBusesResponse = await busAPI.getAll(buildParams());
        const busesList = Array.isArray(updatedBusesResponse) ? updatedBusesResponse : (updatedBusesResponse?.data || []);
        const cleanBusesData = busesList
          .filter((bus: BusType) => bus && bus.id)
          .map((bus: BusType) => ({
            ...bus,
            id: bus.id || 0,
            busNumber: bus.busNumber || 'Unknown',
            capacity: bus.capacity || 50,
            status: bus.status || 'Active',
            speed: bus.speed || 0
          }));
        setBuses(cleanBusesData);
        
        showToast({ type: 'success', title: 'Bus updated', message: `Bus ${selectedBus.busNumber} updated successfully.` });
        if ((response as { message?: string }).message) setEditMessage({ type: 'success', text: String((response as { message?: string }).message) });
        setShowEditModal(false);
        setSelectedBus(null);
      } else {
        const msg = (response as { message?: string })?.message || 'Server rejected update request.';
        setEditMessage({ type: 'error', text: msg });
      }
    } catch (error) {
      console.error('Failed to update bus:', error);
      const message = error instanceof Error ? error.message : 'Failed to update bus. Please try again.';
      showToast({ type: 'error', title: 'Update failed', message });
      setEditMessage({ type: 'error', text: message });
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmState.busId) return;
    try {
      const response = await busAPI.delete(confirmState.busId);
      if (response.success) {
        // Refresh the buses list
        const updatedBusesResponse = await busAPI.getAll(buildParams());
        const busesList = Array.isArray(updatedBusesResponse) ? updatedBusesResponse : (updatedBusesResponse?.data || []);
        let cleanBusesData = busesList
          .filter((bus: BusType) => bus && bus.id)
          .map((bus: BusType) => ({
            ...bus,
            id: bus.id || 0,
            busNumber: bus.busNumber || 'Unknown',
            capacity: bus.capacity || 50,
            status: bus.status || 'Active',
            speed: bus.speed || 0,
            fuelLevel: bus.fuelLevel ?? 0,
            location: bus.location && typeof bus.location === 'object'
              ? { lat: Number(bus.location.lat) || 0, lng: Number(bus.location.lng) || 0 }
              : { lat: 0, lng: 0 }
          }));

        // Always hide the deleted id locally immediately
        cleanBusesData = cleanBusesData.filter((b: BusType) => String(b.id) !== String(confirmState.busId));
        const newHidden = new Set(hiddenDeletedIds);
        newHidden.add(String(confirmState.busId));
        setHiddenDeletedIds(newHidden);
        try {
          localStorage.setItem('hiddenDeletedBuses', JSON.stringify(Array.from(newHidden)));
        } catch {}

        // Background verification: poll GET /Buses/{id} a few times; if 404, remove from hidden list
        (async () => {
          const idStr = String(confirmState.busId);
          for (let i = 0; i < 5; i++) {
            try {
              await new Promise(r => setTimeout(r, 1500));
              const verify = await busAPI.getById(Number(idStr));
              const stillExists = verify && (verify as { data?: unknown }).data;
              if (!stillExists) {
                const updated = new Set(newHidden);
                updated.delete(idStr);
                setHiddenDeletedIds(updated);
                try { localStorage.setItem('hiddenDeletedBuses', JSON.stringify(Array.from(updated))); } catch {}
                break;
              }
            } catch {
              // treat errors as not found
              const updated = new Set(hiddenDeletedIds);
              updated.delete(idStr);
              setHiddenDeletedIds(updated);
              try { localStorage.setItem('hiddenDeletedBuses', JSON.stringify(Array.from(updated))); } catch {}
              break;
            }
          }
        })();

        setBuses(cleanBusesData);
        showToast({ type: 'success', title: 'Bus deleted' });
      }
    } catch (error) {
      console.error('Failed to delete bus:', error);
      showToast({ type: 'error', title: 'Delete failed', message: 'Failed to delete bus. Please try again.' });
    } finally {
      setConfirmState({ open: false });
    }
  };

  // Helper function to ensure unique keys
  const getUniqueKey = (bus: BusType, index: number) => {
    return `${bus.id}-${bus.busNumber}-${index}`;
  };

  const getBusStats = () => {
    if (buses.length === 0) {
      return {
        total: 0,
        active: 0,
        maintenance: 0,
        outOfService: 0,
        totalCapacity: 0,
        avgFuelLevel: 0
      };
    }
    
    // Filter out invalid buses
    const validBuses = buses.filter(bus => bus && bus.id && bus.status);
    
    const stats = {
      total: validBuses.length,
      active: validBuses.filter(b => b.status === 'Active').length,
      maintenance: validBuses.filter(b => b.status === 'UnderMaintenance').length,
      outOfService: validBuses.filter(b => b.status === 'OutOfService').length,
      totalCapacity: validBuses.reduce((sum, b) => sum + (b.capacity || 0), 0),
      avgFuelLevel: validBuses.length > 0 ? 
        Math.round(validBuses.reduce((sum, b) => sum + (b.fuelLevel || 0), 0) / validBuses.length) : 0
    };
    return stats;
  };

  const busStats = getBusStats();

  const getDriverName = (driverId?: number) => {
    if (!driverId) return 'Not assigned';
    const driver = users.find((u: { id: number; name?: string }) => u.id === driverId) as { id: number; name?: string } | undefined;
    return driver ? (driver.name || 'Unknown') : 'Unknown';
  };

  const getRouteName = (routeId?: number) => {
    if (!routeId) return 'Not assigned';
    const route = routes.find((r: { id: number; name?: string }) => r.id === routeId) as { id: number; name?: string } | undefined;
    return route ? (route.name || 'Unknown') : 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto shadow-lg"></div>
            <p className="mt-6 text-text-secondary text-lg font-medium">Loading buses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bus Management</h1>
          <p className="text-gray-600">Manage fleet vehicles and their assignments</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Bus
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{busStats.total}</div>
            <p className="text-xs text-gray-500">Total Buses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{busStats.active}</div>
            <p className="text-xs text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{busStats.maintenance}</div>
            <p className="text-xs text-gray-500">Maintenance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{busStats.outOfService}</div>
            <p className="text-xs text-gray-500">Out of Service</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{busStats.totalCapacity}</div>
            <p className="text-xs text-gray-500">Total Capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-indigo-600">{busStats.avgFuelLevel}%</div>
            <p className="text-xs text-gray-500">Avg Fuel</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>Find specific buses or filter by criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search buses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'UnderMaintenance', label: 'Under Maintenance' },
                { value: 'OutOfService', label: 'Out of Service' },
              ]}
              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Active' | 'Inactive' | 'UnderMaintenance' | 'OutOfService')}
            />
            <Select
              options={[
                { value: 'all', label: 'All Capacities' },
                { value: 'small', label: 'Small (≤30)' },
                { value: 'medium', label: 'Medium (31-60)' },
                { value: 'large', label: 'Large (>60)' }
              ]}
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
            />
            <Button variant="outline" className="w-full" onClick={handleApplyFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Buses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet ({buses.length} total, {filteredBuses.length} filtered)</CardTitle>
          <CardDescription>Manage bus assignments and status</CardDescription>
        </CardHeader>
        <CardContent>
          {buses.length === 0 ? (
            <div className="text-center py-8">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No buses found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first bus to the fleet.</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Bus
              </Button>
            </div>
          ) : (
            (() => {
              const columns: ColumnDef<BusType>[] = [
                {
                  header: 'Bus',
                  accessorKey: 'busNumber',
                  cell: ({ row }) => (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Bus {row.original.busNumber}</p>
                        <p className="text-sm text-gray-500">ID: {row.original.id}</p>
                      </div>
                    </div>
                  ),
                },
              {
                header: 'Status',
                accessorKey: 'status',
                cell: ({ getValue }) => (
                  (() => {
                    const value = getValue<string>();
                    const pretty = value === 'UnderMaintenance' ? 'Under Maintenance' : value === 'OutOfService' ? 'Out of Service' : value;
                    const variant = value === 'Active' ? 'default' : value === 'UnderMaintenance' ? 'secondary' : value === 'Inactive' ? 'secondary' : 'destructive';
                    return <Badge variant={variant}>{pretty}</Badge>;
                  })()
                ),
              },
              {
                header: 'Capacity',
                accessorKey: 'capacity',
                cell: ({ getValue }) => <span className="font-medium">{getValue<number>()} seats</span>,
              },
              {
                header: 'Speed',
                accessorKey: 'speed',
                cell: ({ getValue }) => <span className="font-medium">{getValue<number>()} km/h</span>,
              },
              {
                header: 'Actions',
                id: 'actions',
                cell: ({ row }) => (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBus(row.original);
                        setShowViewModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBus(row.original);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmState({ open: true, busId: row.original.id, message: `Delete bus ${row.original.busNumber}?` })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ),
              },
            ];
            return <DataTable columns={columns} data={filteredBuses} searchPlaceholder="Search buses..." hideFirstPrevious />;
          })()
        )}
        </CardContent>
      </Card>

      {/* Add Bus Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Bus"
        size="lg"
      >
        <form onSubmit={handleAddBus} className="space-y-4">
          {addMessage && (
            <div className={addMessage.type === 'error' ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
              {addMessage.text}
            </div>
          )}
                      <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus Number
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Must be unique. Only letters, numbers, spaces, hyphens, and underscores allowed.
                </p>
                <Input
                  value={newBus.busNumber}
                  onChange={(e) => setNewBus({ ...newBus, busNumber: e.target.value })}
                  placeholder="Enter bus number"
                  required
                  minLength={1}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9\s\-_]+$"
                  title="Bus number can contain letters, numbers, spaces, hyphens, and underscores. Maximum 20 characters."
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <Input
                type="number"
                value={newBus.capacity}
                onChange={(e) => setNewBus({ ...newBus, capacity: Number(e.target.value) })}
                placeholder="Enter capacity"
                min="10"
                max="100"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'UnderMaintenance', label: 'Under Maintenance' },
                  { value: 'OutOfService', label: 'Out of Service' }
                ]}
                value={newBus.status}
                onChange={(e) => setNewBus({ ...newBus, status: e.target.value as 'Active' | 'Inactive' | 'UnderMaintenance' | 'OutOfService' })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speed (km/h)
              </label>
              <Input
                type="number"
                value={newBus.speed}
                onChange={(e) => setNewBus({ ...newBus, speed: Number(e.target.value) })}
                placeholder="Enter speed"
                min="0"
                max="200"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Add Bus
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Bus Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Bus"
        size="lg"
      >
        {selectedBus && (
          <form onSubmit={handleEditBus} className="space-y-4">
            {editMessage && (
              <div className={editMessage.type === 'error' ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
                {editMessage.text}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus Number
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Must be unique. Only letters, numbers, spaces, hyphens, and underscores allowed.
                </p>
                <Input
                  value={selectedBus.busNumber}
                  onChange={(e) => setSelectedBus({ ...selectedBus, busNumber: e.target.value })}
                  placeholder="Enter bus number"
                  required
                  minLength={1}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9\s\-_]+$"
                  title="Bus number can contain letters, numbers, spaces, hyphens, and underscores allowed."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <Input
                  type="number"
                  value={selectedBus.capacity}
                  onChange={(e) => setSelectedBus({ ...selectedBus, capacity: Number(e.target.value) })}
                  placeholder="Enter capacity"
                  min="10"
                  max="100"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                    { value: 'UnderMaintenance', label: 'Under Maintenance' },
                    { value: 'OutOfService', label: 'Out of Service' }
                  ]}
                  value={selectedBus.status}
                  onChange={(e) => setSelectedBus({ ...selectedBus, status: e.target.value as 'Active' | 'Inactive' | 'UnderMaintenance' | 'OutOfService' })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Speed (km/h)
                </label>
                <Input
                  type="number"
                  value={selectedBus.speed}
                  onChange={(e) => setSelectedBus({ ...selectedBus, speed: Number(e.target.value) })}
                  placeholder="Enter speed"
                  min="0"
                  max="200"
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update Bus
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* View Bus Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Bus Details"
        size="md"
      >
        {selectedBus && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow">
                  <Bus className="w-10 h-10 text-blue-600" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Bus {selectedBus.busNumber ?? '—'}</h3>
                    <p className="text-sm text-gray-500">ID: <span className="font-medium text-gray-700">{selectedBus.id ?? 'N/A'}</span></p>
                  </div>

                  <div>
                    <Badge
                      variant={
                        selectedBus.status === 'Active' ? 'default' :
                        selectedBus.status === 'UnderMaintenance' ? 'secondary' :
                        selectedBus.status === 'Inactive' ? 'secondary' : 'destructive'
                      }
                    >
                      {selectedBus.status ? (selectedBus.status === 'UnderMaintenance' ? 'Under Maintenance' : selectedBus.status === 'OutOfService' ? 'Out of Service' : selectedBus.status) : 'Unknown'}
                    </Badge>
                  </div>
                </div>

                <p className="mt-2 text-sm text-gray-600">A quick overview of the vehicle status and recent telemetry.</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gradient-to-br from-white to-slate-50 rounded-lg shadow-sm">
                <p className="text-xs text-gray-400">Capacity</p>
                <div className="mt-1 text-lg font-semibold text-gray-800">{selectedBus.capacity ?? 'N/A'} seats</div>
              </div>

              <div className="p-3 bg-gradient-to-br from-white to-slate-50 rounded-lg shadow-sm">
                <p className="text-xs text-gray-400">Speed</p>
                <div className="mt-1 text-lg font-semibold text-gray-800">{selectedBus.speed != null ? `${selectedBus.speed} km/h` : 'N/A'}</div>
              </div>

              <div className="col-span-2 p-3 bg-gradient-to-br from-white to-slate-50 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Fuel Level</p>
                  <p className="text-sm font-medium text-gray-700">{selectedBus.fuelLevel != null ? `${selectedBus.fuelLevel}%` : 'N/A'}</p>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded mt-2 overflow-hidden">
                  <div
                    className={`h-2 ${((selectedBus.fuelLevel ?? 0) > 30) ? 'bg-emerald-500' : ((selectedBus.fuelLevel ?? 0) > 10) ? 'bg-yellow-400' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, Number(selectedBus.fuelLevel ?? 0)))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer lines */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>Last updated: <span className="text-gray-700 font-medium">{selectedBus.updatedAt ? formatDate(selectedBus.updatedAt) : 'Unknown'}</span></div>
              <div>Location: <span className="text-gray-700 font-medium">{selectedBus.location?.lat != null ? `${String(selectedBus.location.lat).slice(0,10)}, ${String(selectedBus.location?.lng).slice(0,10)}` : 'N/A'}</span></div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
              <Button type="button" onClick={() => { setShowEditModal(true); setShowViewModal(false); }}>Edit Bus</Button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={confirmState.open}
        title="Delete bus?"
        description={confirmState.message}
        onCancel={() => setConfirmState({ open: false })}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
