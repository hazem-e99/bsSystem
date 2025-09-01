// TripForm.tsx - محدث بـ Mapping System
import React, { useState } from 'react';
import { useTripMapping } from './src/hooks/useTripMapping';

export default function TripForm() {
  const {
    availableDrivers,
    availableConductors,
    selectedDriverId,
    selectedConductorId,
    setSelectedDriverId,
    setSelectedConductorId,
    createTripWithMapping
  } = useTripMapping();
  
  const [tripData, setTripData] = useState({
    busId: 1,
    startLocation: '',
    endLocation: '',
    tripDate: '',
    departureTimeOnly: '',
    arrivalTimeOnly: '',
    stopLocations: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDriverId || !selectedConductorId) {
      alert('يرجى اختيار السائق والكمساري');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // استخدم الـ mapping system
      const response = await createTripWithMapping(tripData);
      const result = await response.json();
      
      if (result.success) {
        alert('تم إنشاء الرحلة بنجاح!');
        // reset form
      } else {
        alert(`خطأ: ${result.message}`);
      }
      
    } catch (error) {
      alert(`خطأ في الشبكة: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Driver Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          السائق:
        </label>
        <select
          value={selectedDriverId || ''}
          onChange={(e) => setSelectedDriverId(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
          required
        >
          <option value="">اختر السائق</option>
          {availableDrivers.map(driver => (
            <option key={driver.id} value={driver.id}>
              {driver.name} (#{driver.id})
            </option>
          ))}
        </select>
      </div>
      
      {/* Conductor Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          الكمساري:
        </label>
        <select
          value={selectedConductorId || ''}
          onChange={(e) => setSelectedConductorId(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
          required
        >
          <option value="">اختر الكمساري</option>
          {availableConductors.map(conductor => (
            <option key={conductor.id} value={conductor.id}>
              {conductor.name} (#{conductor.id})
            </option>
          ))}
        </select>
      </div>
      
      {/* باقي الـ form fields */}
      <div>
        <label className="block text-sm font-medium mb-2">نقطة البداية:</label>
        <input
          type="text"
          value={tripData.startLocation}
          onChange={(e) => setTripData({...tripData, startLocation: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">نقطة النهاية:</label>
        <input
          type="text"
          value={tripData.endLocation}
          onChange={(e) => setTripData({...tripData, endLocation: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">تاريخ الرحلة:</label>
        <input
          type="date"
          value={tripData.tripDate}
          onChange={(e) => setTripData({...tripData, tripDate: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">وقت المغادرة:</label>
          <input
            type="time"
            value={tripData.departureTimeOnly}
            onChange={(e) => setTripData({...tripData, departureTimeOnly: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">وقت الوصول:</label>
          <input
            type="time"
            value={tripData.arrivalTimeOnly}
            onChange={(e) => setTripData({...tripData, arrivalTimeOnly: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الرحلة'}
      </button>
      
      {/* ملاحظة للمطورين */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-sm text-gray-600">
        <strong>ملاحظة للمطورين:</strong> هذا النموذج يستخدم نظام mapping للتغلب على قيود الـ Backend.
        المستخدم يرى جميع الخيارات لكن النظام يرسل IDs شغالة فقط.
      </div>
    </form>
  );
}