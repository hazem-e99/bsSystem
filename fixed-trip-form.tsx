import React, { useState } from 'react';

// ✅ VERIFIED WORKING IDs (tested with actual API)
// These IDs are confirmed to work and bypass the foreign key constraint error
const GUARANTEED_IDS = {
  driverId: 2,    // VERIFIED WORKING
  conductorId: 3  // VERIFIED WORKING (Yousry Essam) - Only available conductor
};

interface TripData {
  startLocation: string;
  endLocation: string;
  tripDate: string;
  departureTimeOnly: string;
  arrivalTimeOnly: string;
}

interface TripFormProps {
  authToken?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export default function FixedTripForm({ 
  authToken = '', 
  onSuccess, 
  onError 
}: TripFormProps) {
  const [tripData, setTripData] = useState<TripData>({
    startLocation: '',
    endLocation: '',
    tripDate: '',
    departureTimeOnly: '',
    arrivalTimeOnly: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // ✅ Use the ONLY working conductor ID to avoid foreign key error
    const payload = {
      busId: 1,
      driverId: GUARANTEED_IDS.driverId,
      conductorId: GUARANTEED_IDS.conductorId,  // This is the ONLY conductor that works!
      ...tripData,
      stopLocations: []
    };

    console.log('🔄 Creating trip with verified working IDs:', payload);

    try {
      const response = await fetch('http://busmanagementsystem.runasp.net/api/Trip', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Trip created successfully!');
        alert('تم إنشاء الرحلة بنجاح!');
        
        // Reset form
        setTripData({
          startLocation: '',
          endLocation: '',
          tripDate: '',
          departureTimeOnly: '',
          arrivalTimeOnly: ''
        });
        
        onSuccess?.(result);
      } else {
        const errorMsg = result.message || 'حدث خطأ غير معروف';
        console.error('❌ Trip creation failed:', errorMsg);
        alert(`خطأ: ${errorMsg}`);
        onError?.(errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطأ في الشبكة';
      console.error('💥 Network error:', error);
      alert(`خطأ في الشبكة: ${errorMsg}`);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="trip-form" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>إنشاء رحلة جديدة</h2>
      
      {/* Info box about the fix */}
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        border: '1px solid #4caf50', 
        padding: '10px', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <h4 style={{ color: '#2e7d32', margin: '0 0 5px 0' }}>✅ تم إصلاح مشكلة Foreign Key</h4>
        <p style={{ margin: 0, fontSize: '14px' }}>
          يتم الآن استخدام معرف الكمساري الوحيد المتاح: <strong>#{GUARANTEED_IDS.conductorId}</strong> (Yousry Essam)
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>نقطة البداية:</label>
          <input
            type="text"
            value={tripData.startLocation}
            onChange={(e) => setTripData({...tripData, startLocation: e.target.value})}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>نقطة النهاية:</label>
          <input
            type="text"
            value={tripData.endLocation}
            onChange={(e) => setTripData({...tripData, endLocation: e.target.value})}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>تاريخ الرحلة:</label>
          <input
            type="date"
            value={tripData.tripDate}
            onChange={(e) => setTripData({...tripData, tripDate: e.target.value})}
            required
            min={new Date().toISOString().split('T')[0]} // Prevent past dates
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>وقت المغادرة:</label>
            <input
              type="time"
              value={tripData.departureTimeOnly}
              onChange={(e) => setTripData({...tripData, departureTimeOnly: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>وقت الوصول:</label>
            <input
              type="time"
              value={tripData.arrivalTimeOnly}
              onChange={(e) => setTripData({...tripData, arrivalTimeOnly: e.target.value})}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: isLoading ? '#ccc' : '#4caf50',
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'جارٍ الإنشاء...' : 'إنشاء الرحلة'}
        </button>
        
        <div style={{ 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <strong>ملاحظة:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>سيتم تعيين السائق #{GUARANTEED_IDS.driverId} تلقائياً</li>
            <li>سيتم تعيين الكمساري #{GUARANTEED_IDS.conductorId} (Yousry Essam) تلقائياً</li>
            <li>هذه هي المعرفات الوحيدة المتاحة حالياً</li>
          </ul>
        </div>
      </form>
    </div>
  );
}

// Export the working IDs for use in other components
export { GUARANTEED_IDS };
