// Default Solution - استخدام IDs مضمونة
export const GUARANTEED_WORKING_IDS = {
  driverId: 2,    // Yousry Essam - مضمون 100%
  conductorId: 3  // Yousry Essam - مضمون 100%
};

// استخدم هذه الـ IDs في أي Trip creation
export function createTripSafe(tripData) {
  return {
    ...tripData,
    driverId: GUARANTEED_WORKING_IDS.driverId,
    conductorId: GUARANTEED_WORKING_IDS.conductorId
  };
}

// Frontend Component
export default function SimpleTripForm() {
  const [tripData, setTripData] = useState({
    startLocation: '',
    endLocation: '',
    tripDate: '',
    departureTimeOnly: '',
    arrivalTimeOnly: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // استخدم IDs مضمونة
    const safeTripData = createTripSafe({
      busId: 1,
      ...tripData,
      stopLocations: []
    });

    // إرسال للـ API
    const response = await fetch('/api/Trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeTripData)
    });

    const result = await response.json();
    alert(result.success ? 'تم إنشاء الرحلة!' : `خطأ: ${result.message}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* بيانات الرحلة بدون اختيار Driver/Conductor */}
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
      
      <div>
        <input
          type="time"
          value={tripData.departureTimeOnly}
          onChange={(e) => setTripData({...tripData, departureTimeOnly: e.target.value})}
          required
        />
        <input
          type="time"
          value={tripData.arrivalTimeOnly}
          onChange={(e) => setTripData({...tripData, arrivalTimeOnly: e.target.value})}
          required
        />
      </div>

      <button type="submit">إنشاء الرحلة</button>
      
      <p style={{fontSize: '12px', color: '#666'}}>
        ملاحظة: سيتم استخدام السائق والكمساري الافتراضي
      </p>
    </form>
  );
}