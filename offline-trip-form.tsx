// Frontend-Only Trip Management
import React, { useState } from 'react';

// محاكاة النظام محلياً
const LOCAL_TRIP_STORAGE = 'busSystem_trips';

function getStoredTrips() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_TRIP_STORAGE) || '[]');
  } catch {
    return [];
  }
}

function saveTrip(trip) {
  const trips = getStoredTrips();
  const newTrip = {
    ...trip,
    id: Date.now(),
    createdAt: new Date().toISOString(),
    status: 'Pending' // في انتظار مزامنة مع Backend
  };
  trips.push(newTrip);
  localStorage.setItem(LOCAL_TRIP_STORAGE, JSON.stringify(trips));
  return newTrip;
}

export default function OfflineTripForm() {
  const [tripData, setTripData] = useState({
    driverId: '',
    conductorId: '',
    startLocation: '',
    endLocation: '',
    tripDate: '',
    departureTime: '',
    arrivalTime: ''
  });
  
  const [savedTrips, setSavedTrips] = useState(getStoredTrips());

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // حفظ محلي فوري
    const newTrip = saveTrip({
      busId: 1,
      driverId: parseInt(tripData.driverId) || 2,
      conductorId: parseInt(tripData.conductorId) || 3,
      startLocation: tripData.startLocation,
      endLocation: tripData.endLocation,
      tripDate: tripData.tripDate,
      departureTimeOnly: tripData.departureTime,
      arrivalTimeOnly: tripData.arrivalTime,
      stopLocations: []
    });
    
    setSavedTrips([...savedTrips, newTrip]);
    
    alert('✅ تم حفظ الرحلة محلياً! سيتم المزامنة مع الخادم لاحقاً');
    
    // محاولة إرسال للـ Backend في الخلفية
    syncWithBackend(newTrip);
    
    // reset form
    setTripData({
      driverId: '',
      conductorId: '',
      startLocation: '',
      endLocation: '',
      tripDate: '',
      departureTime: '',
      arrivalTime: ''
    });
  };

  const syncWithBackend = async (trip) => {
    // محاولة مزامنة مع Backend
    try {
      const response = await fetch('/api/Trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip)
      });
      
      if (response.ok) {
        console.log('✅ Trip synced with backend');
        // update local status
        const trips = getStoredTrips();
        const updatedTrips = trips.map(t => 
          t.id === trip.id ? { ...t, status: 'Synced' } : t
        );
        localStorage.setItem(LOCAL_TRIP_STORAGE, JSON.stringify(updatedTrips));
      }
    } catch {
      console.log('❌ Backend sync failed - keeping local copy');
    }
  };

  return (
    <div>
      <h2>إنشاء رحلة - نظام محلي</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="نقطة البداية"
          value={tripData.startLocation}
          onChange={(e) => setTripData({...tripData, startLocation: e.target.value})}
          required
        />
        
        <input
          type="text"
          placeholder="نقطة النهاية"
          value={tripData.endLocation}
          onChange={(e) => setTripData({...tripData, endLocation: e.target.value})}
          required
        />
        
        <input
          type="date"
          value={tripData.tripDate}
          onChange={(e) => setTripData({...tripData, tripDate: e.target.value})}
          required
        />
        
        <input
          type="time"
          placeholder="وقت المغادرة"
          value={tripData.departureTime}
          onChange={(e) => setTripData({...tripData, departureTime: e.target.value})}
          required
        />
        
        <input
          type="time"
          placeholder="وقت الوصول"
          value={tripData.arrivalTime}
          onChange={(e) => setTripData({...tripData, arrivalTime: e.target.value})}
          required
        />

        <button type="submit">حفظ الرحلة</button>
      </form>
      
      <div>
        <h3>الرحلات المحفوظة ({savedTrips.length})</h3>
        {savedTrips.map(trip => (
          <div key={trip.id} style={{border: '1px solid #ccc', padding: '10px', margin: '5px'}}>
            <strong>{trip.startLocation} → {trip.endLocation}</strong>
            <br />
            {trip.tripDate} | {trip.departureTimeOnly} - {trip.arrivalTimeOnly}
            <br />
            <small>Status: {trip.status}</small>
          </div>
        ))}
      </div>
    </div>
  );
}