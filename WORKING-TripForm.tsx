// WORKING TRIP FORM - Updated with successful combinations
import React, { useState, useEffect } from 'react';

// ✅ Confirmed working combinations from testing
const WORKING_COMBINATIONS = [
  {
    "driverId": 2,
    "conductorId": 3,
    "busId": 1
  },
  {
    "driverId": 4,
    "conductorId": 3,
    "busId": 1
  },
  {
    "driverId": 2,
    "conductorId": 5,
    "busId": 1
  },
  {
    "driverId": 4,
    "conductorId": 5,
    "busId": 1
  },
  {
    "driverId": 2,
    "conductorId": 3,
    "busId": 2
  }
];

// ✅ Successful trip template
const TRIP_TEMPLATE = {
    tripDate: '2025-02-01', // Future date
    departureTimeOnly: '08:00',
    arrivalTimeOnly: '12:00',
    startLocation: '',
    endLocation: ''
};

export default function WorkingTripForm() {
    const [tripData, setTripData] = useState({
        ...TRIP_TEMPLATE,
        driverId: 2,
        conductorId: 3,
        busId: 1,
        startLocation: '',
        endLocation: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const response = await fetch('/api/Trip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_TOKEN_HERE'
                },
                body: JSON.stringify({
                    busId: Number(tripData.busId),
                    driverId: Number(tripData.driverId),
                    conductorId: Number(tripData.conductorId),
                    startLocation: tripData.startLocation,
                    endLocation: tripData.endLocation,
                    tripDate: tripData.tripDate,
                    departureTimeOnly: tripData.departureTimeOnly,
                    arrivalTimeOnly: tripData.arrivalTimeOnly
                })
            });

            const result = await response.json();
            setSubmitResult(result);

            if (result.success) {
                // Reset form on success
                setTripData({
                    ...TRIP_TEMPLATE,
                    driverId: tripData.driverId,
                    conductorId: tripData.conductorId,
                    busId: tripData.busId,
                    startLocation: '',
                    endLocation: ''
                });
            }

        } catch (error) {
            setSubmitResult({
                success: false,
                message: 'Network error: ' + error.message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>✅ إنشاء رحلة - تم التأكد من عمل هذه الطريقة</h2>
            
            <div style={{ backgroundColor: '#e8f5e8', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
                <h3>🎯 التوليفات المؤكدة العمل:</h3>
                <ul>
                    {WORKING_COMBINATIONS.map((combo, i) => (
                        <li key={i}>
                            Driver {combo.driverId} + Conductor {combo.conductorId} + Bus {combo.busId}
                        </li>
                    ))}
                </ul>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>السائق (Driver):</label>
                    <select 
                        value={tripData.driverId}
                        onChange={(e) => setTripData({...tripData, driverId: Number(e.target.value)})}
                        required
                    >
                        {WORKING_COMBINATIONS.map((combo, i) => (
                            <option key={i} value={combo.driverId}>
                                Driver {combo.driverId} ✅
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>الكمساري (Conductor):</label>
                    <select 
                        value={tripData.conductorId}
                        onChange={(e) => setTripData({...tripData, conductorId: Number(e.target.value)})}
                        required
                    >
                        {WORKING_COMBINATIONS.map((combo, i) => (
                            <option key={i} value={combo.conductorId}>
                                Conductor {combo.conductorId} ✅
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>الأتوبيس (Bus):</label>
                    <select 
                        value={tripData.busId}
                        onChange={(e) => setTripData({...tripData, busId: Number(e.target.value)})}
                        required
                    >
                        {WORKING_COMBINATIONS.map((combo, i) => (
                            <option key={i} value={combo.busId}>
                                Bus {combo.busId} ✅
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>نقطة البداية:</label>
                    <input
                        type="text"
                        value={tripData.startLocation}
                        onChange={(e) => setTripData({...tripData, startLocation: e.target.value})}
                        required
                        placeholder="مثال: القاهرة"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>نقطة النهاية:</label>
                    <input
                        type="text"
                        value={tripData.endLocation}
                        onChange={(e) => setTripData({...tripData, endLocation: e.target.value})}
                        required
                        placeholder="مثال: الإسكندرية"
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>تاريخ الرحلة:</label>
                    <input
                        type="date"
                        value={tripData.tripDate}
                        onChange={(e) => setTripData({...tripData, tripDate: e.target.value})}
                        required
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>وقت المغادرة:</label>
                    <input
                        type="time"
                        value={tripData.departureTimeOnly}
                        onChange={(e) => setTripData({...tripData, departureTimeOnly: e.target.value})}
                        required
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>وقت الوصول:</label>
                    <input
                        type="time"
                        value={tripData.arrivalTimeOnly}
                        onChange={(e) => setTripData({...tripData, arrivalTimeOnly: e.target.value})}
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{
                        padding: '15px 30px',
                        backgroundColor: isSubmitting ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                    }}
                >
                    {isSubmitting ? 'جاري الإنشاء...' : '✅ إنشاء الرحلة'}
                </button>
            </form>

            {submitResult && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    borderRadius: '5px',
                    backgroundColor: submitResult.success ? '#d4edda' : '#f8d7da',
                    color: submitResult.success ? '#155724' : '#721c24',
                    border: `1px solid ${submitResult.success ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    <strong>
                        {submitResult.success ? '✅ نجح إنشاء الرحلة!' : '❌ فشل إنشاء الرحلة'}
                    </strong>
                    <br />
                    {submitResult.message}
                </div>
            )}
        </div>
    );
}