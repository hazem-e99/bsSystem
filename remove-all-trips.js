#!/usr/bin/env node

// 🗑️ DELETE ALL TRIPS - Clean up script
const BASE_URL = 'http://busmanagementsystem.runasp.net/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjgiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiaGF6ZW1lc3NhbTgxOTk5QGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6ImhhemVtZXNzYW04MTk5OUBnbWFpbC5jb20iLCJqdGkiOiJjMTc2ZDAwNy03NzNmLTRlZDAtYThjZC1hNWMyNTlhMWNlZTAiLCJpYXQiOjE3NTYzMDgxMzYsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzU4OTAwMTM2LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcxMjYifQ.N4s5Ldqz--KXZfFy4CbF0vx9vnQN3Phhmp3obzfB6r0';

console.log('🗑️  REMOVING ALL TRIPS FROM SYSTEM');
console.log('═'.repeat(50));

async function removeAllTrips() {
    try {
        console.log('🔍 Step 1: Fetching all existing trips...');
        
        // Get all trips
        const tripsResponse = await fetch(`${BASE_URL}/Trip`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        
        if (!tripsResponse.ok) {
            throw new Error(`Failed to fetch trips: ${tripsResponse.status}`);
        }
        
        const result = await tripsResponse.json();
        const trips = result.data || result || [];
        
        console.log(`📋 Found ${trips.length} trips in the system`);
        
        if (trips.length === 0) {
            console.log('✅ No trips to delete. System is already clean!');
            return;
        }
        
        // Display all trips
        console.log('\n📋 Current trips:');
        trips.forEach((trip, index) => {
            console.log(`   ${index + 1}. Trip ID: ${trip.id}, From: ${trip.startLocation || 'N/A'} → To: ${trip.endLocation || 'N/A'}, Date: ${trip.tripDate || 'N/A'}`);
        });
        
        console.log(`\n🗑️  Step 2: Deleting all ${trips.length} trips...`);
        
        let deletedCount = 0;
        let failedCount = 0;
        const failedTrips = [];
        
        for (const trip of trips) {
            console.log(`🔄 Deleting trip ${trip.id}...`);
            
            try {
                const deleteResponse = await fetch(`${BASE_URL}/Trip/${trip.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
                });
                
                const deleteResult = await deleteResponse.json();
                
                if (deleteResult.success) {
                    console.log(`   ✅ Deleted trip ${trip.id}`);
                    deletedCount++;
                } else {
                    console.log(`   ❌ Failed to delete trip ${trip.id}: ${deleteResult.message}`);
                    failedCount++;
                    failedTrips.push({ id: trip.id, error: deleteResult.message });
                }
                
            } catch (error) {
                console.log(`   💥 Error deleting trip ${trip.id}: ${error.message}`);
                failedCount++;
                failedTrips.push({ id: trip.id, error: error.message });
            }
            
            // Rate limiting to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log('\n📊 DELETION RESULTS:');
        console.log('═'.repeat(30));
        console.log(`✅ Successfully deleted: ${deletedCount}/${trips.length} trips`);
        console.log(`❌ Failed to delete: ${failedCount}/${trips.length} trips`);
        
        if (failedTrips.length > 0) {
            console.log('\n❌ Failed trips details:');
            failedTrips.forEach(trip => {
                console.log(`   Trip ${trip.id}: ${trip.error}`);
            });
        }
        
        if (deletedCount === trips.length) {
            console.log('\n🎉 SUCCESS! All trips have been removed from the system!');
            console.log('✅ The system is now clean and ready for new trips');
            
            // Verify by checking if any trips remain
            console.log('\n🔍 Verifying deletion...');
            const verifyResponse = await fetch(`${BASE_URL}/Trip`, {
                headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
            });
            
            const verifyResult = await verifyResponse.json();
            const remainingTrips = verifyResult.data || verifyResult || [];
            
            if (remainingTrips.length === 0) {
                console.log('✅ Verification successful: No trips remain in the system');
            } else {
                console.log(`⚠️  Warning: ${remainingTrips.length} trips still remain in the system`);
            }
            
        } else if (deletedCount > 0) {
            console.log(`\n✅ Partial success: Removed ${deletedCount} out of ${trips.length} trips`);
            console.log('💡 You may need to manually handle the failed trips');
        } else {
            console.log('\n❌ No trips were deleted. Check permissions or API status');
        }
        
    } catch (error) {
        console.error('💥 Error in main function:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('   1. Check if the API is accessible');
        console.log('   2. Verify your authentication token is valid');
        console.log('   3. Ensure you have delete permissions');
        console.log('   4. Check your internet connection');
    }
}

// Confirmation prompt simulation
console.log('⚠️  WARNING: This will permanently delete ALL trips from the system!');
console.log('📋 This action cannot be undone.');
console.log('🔄 Starting deletion process...');
console.log('');

// Run the deletion
removeAllTrips();
