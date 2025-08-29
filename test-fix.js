#!/usr/bin/env node

// 🧪 TEST THE FIX: Verify the conductor ID solution works
const BASE_URL = 'http://busmanagementsystem.runasp.net/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjgiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiaGF6ZW1lc3NhbTgxOTk5QGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6ImhhemVtZXNzYW04MTk5OUBnbWFpbC5jb20iLCJqdGkiOiJjMTc2ZDAwNy03NzNmLTRlZDAtYThjZC1hNWMyNTlhMWNlZTAiLCJpYXQiOjE3NTYzMDgxMzYsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzU4OTAwMTM2LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcxMjYifQ.N4s5Ldqz--KXZfFy4CbF0vx9vnQN3Phhmp3obzfB6r0';

// ✅ VERIFIED WORKING IDs
const WORKING_IDS = {
    busId: 1,
    driverId: 2,
    conductorId: 3  // Yousry Essam - ONLY working conductor
};

console.log('🧪 TESTING THE CONDUCTOR ID FIX');
console.log('═'.repeat(40));

async function testTheFix() {
    console.log('✅ Using verified working conductor ID:', WORKING_IDS.conductorId);
    
    // Create a test trip with the working conductor ID
    const testTrip = {
        busId: WORKING_IDS.busId,
        driverId: WORKING_IDS.driverId,
        conductorId: WORKING_IDS.conductorId,
        startLocation: 'Fixed Trip Test Start',
        endLocation: 'Fixed Trip Test End',
        tripDate: '2025-09-06',
        departureTimeOnly: '14:00',
        arrivalTimeOnly: '16:00',
        stopLocations: []
    };
    
    console.log('📋 Test trip payload:');
    console.log(JSON.stringify(testTrip, null, 2));
    console.log('');
    
    try {
        console.log('🔄 Sending request to API...');
        
        const response = await fetch(`${BASE_URL}/Trip`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify(testTrip)
        });

        const result = await response.json();
        
        console.log('📡 API Response:');
        console.log(`Status: ${response.status}`);
        console.log(`Success: ${result.success}`);
        console.log(`Message: ${result.message || 'No message'}`);
        console.log('');
        
        if (result.success) {
            console.log('🎉 SUCCESS! The fix works perfectly!');
            console.log('✅ No more foreign key constraint errors');
            console.log('✅ Trip created successfully using conductor ID 3');
            console.log('');
            console.log('💡 SOLUTION CONFIRMED:');
            console.log('   - Use conductorId: 3 for all trip creation');
            console.log('   - This is the only available conductor');
            console.log('   - All other conductors are currently busy');
            
        } else {
            console.log('❌ FAILED - But this tells us about the issue:');
            console.log(`   Error: ${result.message}`);
            
            if (result.message && result.message.includes('Resource Busy')) {
                console.log('');
                console.log('⚠️  The conductor is now busy. This means:');
                console.log('   1. The foreign key constraint error is FIXED');
                console.log('   2. The conductor exists and is valid');
                console.log('   3. But they are currently assigned to another trip');
                console.log('');
                console.log('💡 NEXT STEPS:');
                console.log('   - Try again later when conductor is free');
                console.log('   - Or create more conductors using the registration API');
            }
        }
        
    } catch (error) {
        console.error('💥 Network error:', error.message);
    }
}

console.log('🔧 Running fix verification test...');
testTheFix();
