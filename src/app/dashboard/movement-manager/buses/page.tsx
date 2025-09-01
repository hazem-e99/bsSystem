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
  Eye,
  MapPin,
  Fuel,
  Gauge,
  User
} from 'lucide-react';
import { busAPI, userAPI } from '@/lib/api';
import { Bus as BusType, BusRequest, BusListParams } from '@/types/bus';
import { formatDate } from '@/utils/formatDate';

export default function MovementManagerBusesPage() {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingBus, setIsAddingBus] = useState(false);
  const buildParams = (): BusListParams => {
    let minCapacity = 0;
    let maxCapacity = 0;
    if (capacityFilter === 'small') { minCapacity = 0; maxCapacity = 30; }
    if (capacityFilter === 'medium') { minCapacity = 31; maxCapacity = 60; }
    if (capacityFilter === 'large') { minCapacity = 61; maxCapacity = 0; }
    return {
      page: 0,
      pageSize: 0,
      busNumber: searchTerm,
      status: statusFilter === 'all' ? '' : statusFilter as 'Active' | 'Inactive' | 'UnderMaintenance' | 'OutOfService',
      minSpeed: 0,
      maxSpeed: 0,
      minCapacity,
      maxCapacity,
    };
  };

  const handleApplyFilters = async () => {
    try {
      setIsLoading(true);
      const busesResponse = await busAPI.getAll(buildParams());
      const cleanBusesData = busesResponse.data
        .filter(bus => bus && bus.id)
        .map(bus => ({
          ...bus,
          id: bus.id || 0,
          busNumber: bus.busNumber || 'Unknown',
          capacity: bus.capacity || 50,
          status: bus.status || 'Active',
          speed: bus.speed || 0
        }));
      setBuses(cleanBusesData);
    } catch (error) {
      console.error('Failed to apply filters:', error);
      setBuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [busesResponse, usersData] = await Promise.all([
          busAPI.getAll(buildParams()),
          userAPI.getAll()
        ]);
        
        // Extract data from the new API response format
        const cleanBusesData = busesResponse.data
          .filter(bus => bus && bus.id)
          .map(bus => ({
            ...bus,
            id: bus.id || 0,
            busNumber: bus.busNumber || 'Unknown',
            capacity: bus.capacity || 50,
            status: bus.status || 'Active',
            speed: bus.speed || 0
          }));
        setBuses(cleanBusesData);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setBuses([]);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

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
    .filter((bus, index, self) => index === self.findIndex(b => b.id === bus.id));

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

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBus(true);
    try {
      const existingBus = buses.find(bus => bus.busNumber === newBus.busNumber);
      if (existingBus) {
        console.warn('Duplicate bus number');
        return;
      }
      
      const busData: BusRequest = {
        busNumber: newBus.busNumber,
        capacity: newBus.capacity,
        status: newBus.status,
        speed: newBus.speed
      };
      validateBusDTO(busData);
      
      const response = await busAPI.create(busData);
      if (response.success) {
        // Refresh the buses list
        const updatedBusesResponse = await busAPI.getAll(buildParams());
        setBuses(updatedBusesResponse.data);
        console.log('Bus added');
        setShowAddModal(false);
        setNewBus({ busNumber: '', capacity: 50, status: 'Active', speed: 0 });
      }
    } catch {
      console.error('Failed to add bus:', Error);
      console.error(Error instanceof Error ? Error.message : 'Failed to add bus. Please try again.');
    } finally {
      setIsAddingBus(false);
    }
  };

  const handleEditBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBus) return;
    try {
      const busData: BusRequest = {
        busNumber: selectedBus.busNumber,
        capacity: selectedBus.capacity,
        status: selectedBus.status,
        speed: selectedBus.speed
      };
      validateBusDTO(busData);
      
      const response = await busAPI.update(selectedBus.id, busData);
      if (response.success) {
        // Refresh the buses list
        const updatedBusesResponse = await busAPI.getAll(buildParams());
        setBuses(updatedBusesResponse.data);
        console.log('Bus updated');
        setShowEditModal(false);
        setSelectedBus(null);
      }
    } catch {
      console.error('Failed to update bus:', Error);
      console.error(Error instanceof Error ? Error.message : 'Failed to update bus. Please try again.');
    }
  };

  const handleDeleteBus = async (busId: number) => {
    // TODO: replace with confirm dialog
    try {
      const response = await busAPI.delete(busId);
      if (response.success) {
        // Refresh the buses list
        const updatedBusesResponse = await busAPI.getAll();
        setBuses(updatedBusesResponse.data);
        console.log('Bus deleted successfully!');
      }
    } catch {
      console.error('Failed to delete bus:', Error);
      console.error('Failed to delete bus. Please try again.');
    }
  };

  const getUniqueKey = (bus: BusType, index: number) => `${bus.id}-${bus.busNumber}-${index}`;

  const getBusStats = () => {
    if (buses.length === 0) {
      return { total: 0, active: 0, inactive: 0, totalCapacity: 0, avgSpeed: 0 };
    }
    const validBuses = buses.filter(bus => bus && bus.id && bus.status);
    const stats = {
      total: validBuses.length,
      active: validBuses.filter(b => b.status === 'Active').length,
      inactive: validBuses.filter(b => b.status === 'Inactive').length,
      totalCapacity: validBuses.reduce((sum, b) => sum + (b.capacity || 0), 0),
      avgSpeed: validBuses.length > 0 ? Math.round(validBuses.reduce((sum, b) => sum + (b.speed || 0), 0) / validBuses.length) : 0
    };
    return stats;
  };

  const busStats = getBusStats();

  const getDriverName = (driverId?: string) => {
    if (!driverId) return 'Not assigned';
    const driver = users.find((u: any) => u.id === driverId);
    return driver ? (driver as any).name : 'Unknown';
  };

  const getRouteName = (routeId?: string) => {
    if (!routeId) return 'Not assigned';
    // TODO: Implement route lookup when routes are available
    return 'Not assigned';
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <div className="text-2xl font-bold text-gray-600">{busStats.inactive}</div>
            <p className="text-xs text-gray-500">Inactive</p>
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
            <div className="text-2xl font-bold text-indigo-600">{busStats.avgSpeed} km/h</div>
            <p className="text-xs text-gray-500">Avg Speed</p>
          </CardContent>
        </Card>
      </div>

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
                { value: 'OutOfService', label: 'Out of Service' }
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

      <Card>
        <CardHeader>
          <CardTitle>Fleet ({filteredBuses.length})</CardTitle>
          <CardDescription>Manage bus assignments and status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Speed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBuses.map((bus, index) => (
                <TableRow key={getUniqueKey(bus, index)}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Bus {bus.busNumber}</p>
                        <p className="text-sm text-gray-500">ID: {bus.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        bus.status === 'Active' ? 'default' : 'secondary'
                      }
                    >
                      {bus.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{bus.capacity} seats</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{bus.speed} km/h</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBus(bus);
                          setShowViewModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBus(bus);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteBus(bus.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Bus"
        size="lg"
      >
        <form onSubmit={handleAddBus} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bus Number
              </label>
              <Input
                value={newBus.busNumber}
                onChange={(e) => setNewBus({ ...newBus, busNumber: e.target.value })}
                placeholder="Enter bus number"
                required
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
                min="1"
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

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Bus"
        size="lg"
      >
        {selectedBus && (
          <form onSubmit={handleEditBus} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bus Number
                </label>
                <Input
                  value={selectedBus.busNumber}
                  onChange={(e) => setSelectedBus({ ...selectedBus, busNumber: e.target.value })}
                  placeholder="Enter bus number"
                  required
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
                  min="1"
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

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Bus Details"
        size="md"
      >
        {selectedBus && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Bus className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Bus {selectedBus.busNumber}</h3>
                <p className="text-sm text-gray-500">ID: {selectedBus.id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>
                <Badge 
                  variant={
                    selectedBus.status === 'Active' ? 'default' : 'secondary'
                  }
                >
                  {selectedBus.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Capacity:</span>
                <p className="font-medium">{selectedBus.capacity} seats</p>
              </div>
              <div>
                <span className="text-gray-500">Speed:</span>
                <p className="font-medium">{selectedBus.speed} km/h</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


