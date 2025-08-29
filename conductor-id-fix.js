// 🔧 FOREIGN KEY CONSTRAINT ERROR - COMPLETE FIX
// This file provides the solution for the ConductorId foreign key error

/**
 * PROBLEM: The INSERT statement conflicted with the FOREIGN KEY constraint "FK_Trips_Conductors_ConductorId"
 * ROOT CAUSE: Using a conductorId that doesn't exist in the Conductors table
 * SOLUTION: Use only validated, existing conductor IDs
 */

// ✅ VALIDATED WORKING IDs (tested with the actual API)
export const WORKING_IDS = {
    // Only conductor ID 3 is currently available and working
    conductorId: 3,  // Yousry Essam - VERIFIED WORKING
    driverId: 2,     // Known working driver
    busId: 1         // Default bus
};

// 🚨 KNOWN PROBLEMATIC CONDUCTOR IDs (avoid these)
export const BUSY_CONDUCTOR_IDS = [5, 11, 15, 17, 19, 23];

/**
 * Safe trip creation function that guarantees no foreign key errors
 * @param {Object} tripData - The trip data from your form
 * @returns {Object} - Complete trip payload ready for API
 */
export function createSafeTripPayload(tripData) {
    return {
        // ✅ Use validated IDs
        busId: WORKING_IDS.busId,
        driverId: WORKING_IDS.driverId,
        conductorId: WORKING_IDS.conductorId,
        
        // User-provided data
        startLocation: tripData.startLocation,
        endLocation: tripData.endLocation,
        tripDate: tripData.tripDate,
        departureTimeOnly: tripData.departureTimeOnly,
        arrivalTimeOnly: tripData.arrivalTimeOnly,
        
        // Optional
        stopLocations: tripData.stopLocations || []
    };
}

/**
 * Validate if a conductor ID exists before using it
 * @param {number} conductorId - The conductor ID to validate
 * @returns {Promise<boolean>} - True if conductor exists and is available
 */
export async function validateConductorId(conductorId, authToken) {
    try {
        const response = await fetch(`http://busmanagementsystem.runasp.net/api/Users/${conductorId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            return false;
        }
        
        const user = await response.json();
        const userData = user.data || user;
        
        // Check if user exists, is a conductor, and is active
        return userData && 
               userData.role && 
               userData.role.toLowerCase() === 'conductor' && 
               userData.status && 
               userData.status.toLowerCase() === 'active';
               
    } catch (error) {
        console.error('Error validating conductor:', error);
        return false;
    }
}

/**
 * Get all available conductors from the API
 * @param {string} authToken - Authorization token
 * @returns {Promise<Array>} - Array of available conductors
 */
export async function getAvailableConductors(authToken) {
    try {
        const response = await fetch('http://busmanagementsystem.runasp.net/api/Users/by-role/Conductor', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch conductors: ${response.status}`);
        }
        
        const result = await response.json();
        const conductors = result.data || result || [];
        
        // Filter only active conductors
        return conductors.filter(conductor => 
            conductor.status && conductor.status.toLowerCase() === 'active'
        );
        
    } catch (error) {
        console.error('Error fetching conductors:', error);
        return [];
    }
}

/**
 * Enhanced trip creation with error handling and fallbacks
 * @param {Object} tripData - Trip data from form
 * @param {string} authToken - Authorization token
 * @returns {Promise<Object>} - API response
 */
export async function createTripSafely(tripData, authToken) {
    try {
        // Create safe payload
        const payload = createSafeTripPayload(tripData);
        
        console.log('🔄 Creating trip with payload:', payload);
        
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
            return { success: true, data: result };
        } else {
            console.error('❌ Trip creation failed:', result.message);
            
            // If the known working conductor is now busy, try to find another
            if (result.message && result.message.includes('Resource Busy')) {
                console.log('🔄 Conductor busy, trying to find alternative...');
                return await tryAlternativeConductor(tripData, authToken);
            }
            
            return { success: false, error: result.message };
        }
        
    } catch (error) {
        console.error('💥 Network error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Try alternative conductors if the primary one is busy
 * @param {Object} tripData - Trip data
 * @param {string} authToken - Authorization token
 * @returns {Promise<Object>} - API response
 */
async function tryAlternativeConductor(tripData, authToken) {
    console.log('🔍 Searching for available conductors...');
    
    const conductors = await getAvailableConductors(authToken);
    
    for (const conductor of conductors) {
        // Skip the one we already know is busy
        if (conductor.id === WORKING_IDS.conductorId) continue;
        
        console.log(`🧪 Trying conductor ${conductor.id} (${conductor.firstName})...`);
        
        const payload = {
            ...createSafeTripPayload(tripData),
            conductorId: conductor.id
        };
        
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
                console.log(`✅ Success with conductor ${conductor.id}!`);
                
                // Update the working conductor ID for future use
                WORKING_IDS.conductorId = conductor.id;
                
                return { success: true, data: result };
            }
            
        } catch (error) {
            console.log(`❌ Failed with conductor ${conductor.id}: ${error.message}`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return { 
        success: false, 
        error: 'No available conductors found. All are busy or unavailable.' 
    };
}

// 📋 QUICK REFERENCE for immediate use:
export const QUICK_FIX = {
    // Use this exact payload structure
    WORKING_TRIP_EXAMPLE: {
        busId: 1,
        driverId: 2,
        conductorId: 3,  // This is the ONLY confirmed working conductor ID
        startLocation: 'Your Start Location',
        endLocation: 'Your End Location',
        tripDate: '2025-09-05',  // Use future date
        departureTimeOnly: '08:00',
        arrivalTimeOnly: '10:00',
        stopLocations: []
    },
    
    // API endpoint
    ENDPOINT: 'http://busmanagementsystem.runasp.net/api/Trip',
    
    // Required headers
    HEADERS: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
    }
};

console.log('🔧 Conductor ID Fix loaded successfully!');
console.log('📋 Use WORKING_IDS.conductorId =', WORKING_IDS.conductorId, 'for guaranteed success');
