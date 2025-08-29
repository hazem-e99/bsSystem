#!/usr/bin/env node

// 🗑️ ADVANCED DELETE ALL TRIPS - Handles Foreign Key Constraints Properly
const BASE_URL = 'http://busmanagementsystem.runasp.net/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjgiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiaGF6ZW1lc3NhbTgxOTk5QGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6ImhhemVtZXNzYW04MTk5OUBnbWFpbC5jb20iLCJqdGkiOiJjMTc2ZDAwNy03NzNmLTRlZDAtYThjZC1hNWMyNTlhMWNlZTAiLCJpYXQiOjE3NTYzMDgxMzYsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzU4OTAwMTM2LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcxMjYifQ.N4s5Ldqz--KXZfFy4CbF0vx9vnQN3Phhmp3obzfB6r0';

console.log('🗑️  ADVANCED DELETE ALL TRIPS - HANDLING FOREIGN KEY CONSTRAINTS');
console.log('═'.repeat(60));

async function deleteAllTripsAdvanced() {
    try {
        console.log('🔍 Step 1: Fetching all remaining trips...');
        
        const tripsResponse = await fetch(`${BASE_URL}/Trip`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        
        if (!tripsResponse.ok) {
            throw new Error(`Failed to fetch trips: ${tripsResponse.status}`);
        }
        
        const result = await tripsResponse.json();
        const trips = result.data || result || [];
        
        console.log(`📋 Found ${trips.length} remaining trips in the system`);
        
        if (trips.length === 0) {
            console.log('✅ No trips to delete. System is already clean!');
            return;
        }
        
        // Show remaining trips
        console.log('\n📋 Remaining trips:');
        trips.forEach((trip, index) => {
            const stopCount = trip.stopLocations ? trip.stopLocations.length : 0;
            console.log(`   ${index + 1}. Trip ID: ${trip.id}, From: ${trip.startLocation || 'N/A'} → To: ${trip.endLocation || 'N/A'}, Stops: ${stopCount}`);
        });
        
        console.log(`\n🔧 Step 2: Advanced deletion process...`);
        console.log('💡 Strategy: Handle trips with stop locations properly');
        
        let deletedCount = 0;
        let failedCount = 0;
        const finalFailedTrips = [];
        
        for (const trip of trips) {
            console.log(`\n🔄 Processing trip ${trip.id}...`);
            
            // Check if trip has stop locations
            const hasStopLocations = trip.stopLocations && trip.stopLocations.length > 0;
            
            if (hasStopLocations) {
                console.log(`   🚏 Trip ${trip.id} has ${trip.stopLocations.length} stop location(s)`);
                console.log(`   💡 This trip likely has FK constraints - trying special approach`);
            }
            
            // Try to delete the trip
            try {
                console.log(`   🗑️  Attempting to delete trip ${trip.id}...`);
                
                const deleteResponse = await fetch(`${BASE_URL}/Trip/${trip.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
                });
                
                const deleteResult = await deleteResponse.json();
                
                if (deleteResult.success) {
                    console.log(`   ✅ Successfully deleted trip ${trip.id}`);
                    deletedCount++;
                } else {
                    console.log(`   ❌ Failed to delete trip ${trip.id}: ${deleteResult.message}`);
                    
                    // Check if it's a foreign key constraint error
                    if (deleteResult.message && deleteResult.message.includes('FK_StopLocations_Trips_TripId')) {
                        console.log(`   🔧 Attempting FK constraint workaround...`);
                        
                        // Try updating the trip to remove stop locations first
                        const updateResult = await tryRemoveStopLocations(trip.id);
                        if (updateResult) {
                            // Try deleting again after removing stop locations
                            const retryResult = await retryDeleteTrip(trip.id);
                            if (retryResult) {
                                console.log(`   ✅ Successfully deleted trip ${trip.id} after FK workaround`);
                                deletedCount++;
                            } else {
                                failedCount++;
                                finalFailedTrips.push({ 
                                    id: trip.id, 
                                    error: 'FK constraint - workaround failed',
                                    hasStops: hasStopLocations
                                });
                            }
                        } else {
                            failedCount++;
                            finalFailedTrips.push({ 
                                id: trip.id, 
                                error: 'FK constraint - cannot remove stops',
                                hasStops: hasStopLocations
                            });
                        }
                    } else {
                        failedCount++;
                        finalFailedTrips.push({ 
                            id: trip.id, 
                            error: deleteResult.message,
                            hasStops: hasStopLocations
                        });
                    }
                }
                
            } catch (error) {
                console.log(`   💥 Network error deleting trip ${trip.id}: ${error.message}`);
                failedCount++;
                finalFailedTrips.push({ 
                    id: trip.id, 
                    error: error.message,
                    hasStops: hasStopLocations
                });
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n📊 FINAL DELETION RESULTS:');
        console.log('═'.repeat(40));
        console.log(`✅ Successfully deleted: ${deletedCount}/${trips.length} trips`);
        console.log(`❌ Failed to delete: ${failedCount}/${trips.length} trips`);
        
        if (finalFailedTrips.length > 0) {
            console.log('\n❌ Trips that could not be deleted:');
            finalFailedTrips.forEach(trip => {
                const stopInfo = trip.hasStops ? ' (has stop locations)' : ' (no stops)';
                console.log(`   Trip ${trip.id}${stopInfo}: ${trip.error}`);
            });
            
            console.log('\n🔧 MANUAL CLEANUP REQUIRED:');
            console.log('These trips have database constraints that prevent deletion.');
            console.log('Options to resolve:');
            console.log('1. Contact backend team to fix foreign key constraints');
            console.log('2. Use database admin tools to manually clean up');
            console.log('3. Check if there are bookings or other related data');
            
            // Create a simple SQL script suggestion
            console.log('\n📋 Suggested SQL cleanup (for database admin):');
            const tripIds = finalFailedTrips.map(t => t.id).join(', ');
            console.log(`-- Delete stop locations first`);
            console.log(`DELETE FROM StopLocations WHERE TripId IN (${tripIds});`);
            console.log(`-- Then delete the trips`);
            console.log(`DELETE FROM Trips WHERE Id IN (${tripIds});`);
        }
        
        // Final verification
        console.log('\n🔍 Final verification...');
        const verifyResponse = await fetch(`${BASE_URL}/Trip`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        
        const verifyResult = await verifyResponse.json();
        const remainingTrips = verifyResult.data || verifyResult || [];
        
        console.log(`📊 Trips remaining in system: ${remainingTrips.length}`);
        
        if (remainingTrips.length === 0) {
            console.log('🎉 SUCCESS! All trips have been completely removed from the system!');
            console.log('✅ The system is now clean and ready for new trips');
        } else if (remainingTrips.length < trips.length) {
            console.log(`✅ Partial success: Reduced from ${trips.length} to ${remainingTrips.length} trips`);
            console.log('💡 Some trips remain due to database constraints');
        } else {
            console.log('⚠️  No additional trips were deleted in this run');
        }
        
    } catch (error) {
        console.error('💥 Error in main function:', error.message);
    }
}

async function tryRemoveStopLocations(tripId) {
    try {
        console.log(`     🔄 Attempting to remove stop locations from trip ${tripId}...`);
        
        // Try to update the trip with empty stop locations
        const updateResponse = await fetch(`${BASE_URL}/Trip/${tripId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({
                stopLocations: []
            })
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
            console.log(`     ✅ Removed stop locations from trip ${tripId}`);
            return true;
        } else {
            console.log(`     ❌ Failed to remove stop locations: ${updateResult.message}`);
            return false;
        }
        
    } catch (error) {
        console.log(`     💥 Error removing stop locations: ${error.message}`);
        return false;
    }
}

async function retryDeleteTrip(tripId) {
    try {
        console.log(`     🔄 Retry deleting trip ${tripId}...`);
        
        const deleteResponse = await fetch(`${BASE_URL}/Trip/${tripId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        
        const deleteResult = await deleteResponse.json();
        
        if (deleteResult.success) {
            console.log(`     ✅ Retry successful for trip ${tripId}`);
            return true;
        } else {
            console.log(`     ❌ Retry failed for trip ${tripId}: ${deleteResult.message}`);
            return false;
        }
        
    } catch (error) {
        console.log(`     💥 Retry error for trip ${tripId}: ${error.message}`);
        return false;
    }
}

console.log('⚠️  This will attempt to delete ALL remaining trips, handling foreign key constraints');
console.log('🔄 Starting advanced deletion process...');
console.log('');

deleteAllTripsAdvanced();
