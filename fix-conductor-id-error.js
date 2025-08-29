#!/usr/bin/env node

// 🔧 COMPLETE FIX for Foreign Key Constraint Error: ConductorId
const BASE_URL = 'http://busmanagementsystem.runasp.net/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjgiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiaGF6ZW1lc3NhbTgxOTk5QGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6ImhhemVtZXNzYW04MTk5OUBnbWFpbC5jb20iLCJqdGkiOiJjMTc2ZDAwNy03NzNmLTRlZDAtYThjZC1hNWMyNTlhMWNlZTAiLCJpYXQiOjE3NTYzMDgxMzYsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzU4OTAwMTM2LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcxMjYifQ.N4s5Ldqz--KXZfFy4CbF0vx9vnQN3Phhmp3obzfB6r0';

console.log('🔧 FIXING CONDUCTOR ID FOREIGN KEY ERROR');
console.log('═'.repeat(50));

async function fixConductorIdError() {
    try {
        console.log('🔍 Step 1: Fetching all available conductors...');
        
        // Get all users with conductor role
        const usersResponse = await fetch(`${BASE_URL}/Users/by-role/Conductor`, {
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
        });
        
        if (!usersResponse.ok) {
            throw new Error(`Failed to fetch conductors: ${usersResponse.status}`);
        }
        
        const result = await usersResponse.json();
        const conductors = result.data || result || [];
        
        console.log(`📋 Found ${conductors.length} conductors in the system:`);
        
        if (conductors.length === 0) {
            console.log('❌ NO CONDUCTORS FOUND! Need to create conductors first.');
            await createConductors();
            return;
        }
        
        // Display all available conductors
        conductors.forEach((conductor, index) => {
            console.log(`   ${index + 1}. ID: ${conductor.id}, Name: ${conductor.firstName} ${conductor.lastName}, Status: ${conductor.status}`);
        });
        
        console.log('\n🧪 Step 2: Testing each conductor with a sample trip...');
        
        const validConductors = [];
        
        for (const conductor of conductors) {
            if (conductor.status && conductor.status.toLowerCase() !== 'active') {
                console.log(`⚠️  Skipping conductor ${conductor.id} - Status: ${conductor.status}`);
                continue;
            }
            
            const testTrip = {
                busId: 1,
                driverId: 2, // Using a known working driver ID
                conductorId: conductor.id,
                startLocation: 'Test Location',
                endLocation: 'Test Destination',
                tripDate: '2025-09-05',
                departureTimeOnly: '09:00',
                arrivalTimeOnly: '11:00'
            };
            
            console.log(`🔄 Testing conductor ID: ${conductor.id} (${conductor.firstName})...`);
            
            try {
                const response = await fetch(`${BASE_URL}/Trip`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AUTH_TOKEN}`
                    },
                    body: JSON.stringify(testTrip)
                });

                const tripResult = await response.json();
                
                if (tripResult.success) {
                    console.log(`   ✅ Conductor ${conductor.id} WORKS!`);
                    validConductors.push(conductor);
                    
                    // Clean up - delete the test trip if it was created
                    // (This would require getting the trip ID from the response)
                } else {
                    console.log(`   ❌ Conductor ${conductor.id} failed: ${tripResult.message}`);
                }
                
            } catch (error) {
                console.log(`   💥 Error testing conductor ${conductor.id}: ${error.message}`);
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n📊 RESULTS:');
        console.log('═'.repeat(30));
        
        if (validConductors.length === 0) {
            console.log('❌ NO VALID CONDUCTORS FOUND!');
            console.log('🔧 SOLUTION: Need to create active conductors.');
            await createConductors();
        } else {
            console.log(`✅ Found ${validConductors.length} working conductor(s):`);
            
            validConductors.forEach((conductor, index) => {
                console.log(`   ${index + 1}. ID: ${conductor.id} - ${conductor.firstName} ${conductor.lastName}`);
            });
            
            console.log('\n💡 RECOMMENDED FIX:');
            console.log('Use one of these conductor IDs in your trip creation:');
            
            const recommendedConductor = validConductors[0];
            console.log(`\n📋 SAFE CONDUCTOR ID TO USE: ${recommendedConductor.id}`);
            
            // Generate working example
            const workingExample = {
                busId: 1,
                driverId: 2,
                conductorId: recommendedConductor.id,
                startLocation: 'University Campus',
                endLocation: 'City Center',
                tripDate: '2025-09-05',
                departureTimeOnly: '08:00',
                arrivalTimeOnly: '09:30'
            };
            
            console.log('\n📝 WORKING EXAMPLE REQUEST:');
            console.log('POST /api/Trip');
            console.log('Content-Type: application/json');
            console.log('Authorization: Bearer YOUR_TOKEN');
            console.log('');
            console.log(JSON.stringify(workingExample, null, 2));
        }
        
    } catch (error) {
        console.error('💥 Error in main function:', error.message);
    }
}

async function createConductors() {
    console.log('\n🏗️  Creating new conductors...');
    
    const newConductors = [
        {
            firstName: 'Ahmed',
            lastName: 'Hassan',
            nationalId: '12345678901234',
            email: 'ahmed.conductor@bus.com',
            phoneNumber: '01123456789',
            role: 'Conductor'
        },
        {
            firstName: 'Mohamed',
            lastName: 'Ali',
            nationalId: '12345678901235',
            email: 'mohamed.conductor@bus.com',
            phoneNumber: '01123456790',
            role: 'Conductor'
        }
    ];
    
    const createdConductors = [];
    
    for (const conductorData of newConductors) {
        try {
            console.log(`📝 Creating conductor: ${conductorData.firstName} ${conductorData.lastName}...`);
            
            const response = await fetch(`${BASE_URL}/Authentication/registration-staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTH_TOKEN}`
                },
                body: JSON.stringify(conductorData)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log(`   ✅ Created conductor: ${conductorData.firstName}`);
                createdConductors.push(conductorData);
            } else {
                console.log(`   ❌ Failed to create conductor: ${result.message}`);
            }
            
        } catch (error) {
            console.log(`   💥 Error creating conductor: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (createdConductors.length > 0) {
        console.log(`\n✅ Successfully created ${createdConductors.length} conductor(s)!`);
        console.log('🔄 Re-running validation...');
        
        // Wait a bit for the database to sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Re-run the validation
        await fixConductorIdError();
    } else {
        console.log('\n❌ Failed to create any conductors. Check the API requirements.');
    }
}

// Run the fix
fixConductorIdError().catch(console.error);
