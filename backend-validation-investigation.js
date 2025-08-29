#!/usr/bin/env node

// 🔍 DEEP INVESTIGATION: Why backend accepts specific drivers/conductors only
const BASE_URL = 'http://busmanagementsystem.runasp.net/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjgiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiaGF6ZW1lc3NhbTgxOTk5QGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6ImhhemVtZXNzYW04MTk5OUBnbWFpbC5jb20iLCJqdGkiOiJjMTc2ZDAwNy03NzNmLTRlZDAtYThjZC1hNWMyNTlhMWNlZTAiLCJpYXQiOjE3NTYzMDgxMzYsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzU4OTAwMTM2LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcxMjYifQ.N4s5Ldqz--KXZfFy4CbF0vx9vnQN3Phhmp3obzfB6r0';

console.log('🔍 BACKEND VALIDATION INVESTIGATION');
console.log('لماذا يقبل الـ Backend سائقين/كمساريين معينين فقط؟');
console.log('═'.repeat(60));

async function investigateBackendValidation() {
    console.log('📡 جلب بيانات كاملة للتحليل...');
    
    // جلب كل المستخدمين
    const usersResponse = await fetch(`${BASE_URL}/Users`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    let users = [];
    if (usersResponse.ok) {
        users = await usersResponse.json();
        if (!Array.isArray(users)) users = users.data || [];
    }
    
    // تصنيف المستخدمين
    const allDrivers = users.filter(u => (u.role || '').toLowerCase() === 'driver');
    const allConductors = users.filter(u => ['conductor', 'supervisor'].includes((u.role || '').toLowerCase()));
    
    console.log(`👥 إجمالي السائقين: ${allDrivers.length}`);
    console.log(`👥 إجمالي الكمساريين: ${allConductors.length}`);
    console.log('');
    
    // اختبار كل سائق مع كل كمساري
    console.log('🧪 اختبار شامل لكل التوليفات:');
    console.log('');
    
    const workingCombos = [];
    const failedCombos = [];
    
    // اختبار عينة من التوليفات (لتجنب الإفراط في الطلبات)
    const testDrivers = allDrivers.slice(0, 6); // أول 6 سائقين
    const testConductors = allConductors.slice(0, 4); // أول 4 كمساريين
    
    console.log(`📋 سيتم اختبار ${testDrivers.length} سائقين × ${testConductors.length} كمساريين = ${testDrivers.length * testConductors.length} توليفة`);
    console.log('');
    
    let testCount = 0;
    
    for (const driver of testDrivers) {
        for (const conductor of testConductors) {
            testCount++;
            console.log(`${testCount}. Driver ${driver.id} (${driver.firstName}) + Conductor ${conductor.id} (${conductor.firstName})`);
            
            const testTrip = {
                busId: 1,
                driverId: driver.id,
                conductorId: conductor.id,
                startLocation: `Test ${testCount}`,
                endLocation: `End ${testCount}`,
                tripDate: '2025-09-03',
                departureTimeOnly: `${8 + (testCount % 10)}:00`,
                arrivalTimeOnly: `${10 + (testCount % 10)}:00`
            };
            
            try {
                const response = await fetch(`${BASE_URL}/Trip`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AUTH_TOKEN}`
                    },
                    body: JSON.stringify(testTrip)
                });

                const result = await response.json();
                
                if (result.success) {
                    console.log(`   ✅ SUCCESS!`);
                    workingCombos.push({
                        driverId: driver.id,
                        driverName: driver.firstName,
                        driverStatus: driver.status,
                        driverRole: driver.role,
                        conductorId: conductor.id,
                        conductorName: conductor.firstName,
                        conductorStatus: conductor.status,
                        conductorRole: conductor.role
                    });
                } else {
                    console.log(`   ❌ FAILED: ${result.message}`);
                    failedCombos.push({
                        driverId: driver.id,
                        driverName: driver.firstName,
                        driverStatus: driver.status,
                        driverRole: driver.role,
                        conductorId: conductor.id,
                        conductorName: conductor.firstName,
                        conductorStatus: conductor.status,
                        conductorRole: conductor.role,
                        error: result.message
                    });
                }
                
            } catch (error) {
                console.log(`   💥 ERROR: ${error.message}`);
                failedCombos.push({
                    driverId: driver.id,
                    driverName: driver.firstName,
                    driverStatus: driver.status,
                    driverRole: driver.role,
                    conductorId: conductor.id,
                    conductorName: conductor.firstName,
                    conductorStatus: conductor.status,
                    conductorRole: conductor.role,
                    error: error.message
                });
            }
            
            // تجنب إغراق الخادم
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }
    
    // تحليل النتائج
    console.log('\n📊 تحليل النتائج:');
    console.log('═'.repeat(40));
    
    console.log(`✅ نجح: ${workingCombos.length}/${testCount}`);
    console.log(`❌ فشل: ${failedCombos.length}/${testCount}`);
    
    if (workingCombos.length > 0) {
        console.log('\n✅ التوليفات الناجحة:');
        workingCombos.forEach((combo, i) => {
            console.log(`   ${i + 1}. Driver ${combo.driverId} (${combo.driverName}) + Conductor ${combo.conductorId} (${combo.conductorName})`);
            console.log(`      Driver Status: ${combo.driverStatus}, Conductor Status: ${combo.conductorStatus}`);
        });
    }
    
    if (failedCombos.length > 0) {
        console.log('\n❌ التوليفات الفاشلة وأسبابها:');
        
        // تجميع الأخطاء حسب النوع
        const errorGroups = {};
        failedCombos.forEach(combo => {
            const error = combo.error;
            if (!errorGroups[error]) {
                errorGroups[error] = [];
            }
            errorGroups[error].push(combo);
        });
        
        Object.entries(errorGroups).forEach(([error, combos]) => {
            console.log(`\n   📋 "${error}" (${combos.length} مرة):`);
            combos.slice(0, 3).forEach(combo => { // عرض أول 3 أمثلة فقط
                console.log(`      - Driver ${combo.driverId} (${combo.driverName}, ${combo.driverStatus}) + Conductor ${combo.conductorId} (${combo.conductorName}, ${combo.conductorStatus})`);
            });
            if (combos.length > 3) {
                console.log(`      ... و ${combos.length - 3} أمثلة أخرى`);
            }
        });
    }
    
    // تحليل الأنماط
    console.log('\n🔍 تحليل الأنماط:');
    
    if (workingCombos.length > 0) {
        // تحليل السائقين الناجحين
        const workingDriverIds = [...new Set(workingCombos.map(c => c.driverId))];
        const workingConductorIds = [...new Set(workingCombos.map(c => c.conductorId))];
        
        console.log(`📈 السائقون الذين يعملون: ${workingDriverIds.join(', ')}`);
        console.log(`📈 الكمساريون الذين يعملون: ${workingConductorIds.join(', ')}`);
        
        // فحص الخصائص المشتركة
        const workingDrivers = workingCombos.map(c => ({ id: c.driverId, status: c.driverStatus, role: c.driverRole }));
        const workingConductors = workingCombos.map(c => ({ id: c.conductorId, status: c.conductorStatus, role: c.conductorRole }));
        
        const uniqueWorkingDrivers = workingDrivers.filter((driver, index, self) => 
            index === self.findIndex(d => d.id === driver.id)
        );
        
        const uniqueWorkingConductors = workingConductors.filter((conductor, index, self) => 
            index === self.findIndex(c => c.id === conductor.id)
        );
        
        console.log('\n🔍 خصائص السائقين الناجحين:');
        uniqueWorkingDrivers.forEach(driver => {
            console.log(`   Driver ${driver.id}: Status=${driver.status}, Role=${driver.role}`);
        });
        
        console.log('\n🔍 خصائص الكمساريين الناجحين:');
        uniqueWorkingConductors.forEach(conductor => {
            console.log(`   Conductor ${conductor.id}: Status=${conductor.status}, Role=${conductor.role}`);
        });
    }
    
    // الاستنتاجات
    console.log('\n🎯 الاستنتاجات والتوصيات:');
    
    if (failedCombos.length === 0) {
        console.log('✅ كل التوليفات تعمل! المشكلة قد تكون مؤقتة أو في حالات خاصة');
    } else {
        console.log('📋 أسباب محتملة للرفض:');
        console.log('   1. بعض المستخدمين قد يكونوا غير مفعلين في النظام الداخلي');
        console.log('   2. قيود برمجية في الـ Backend (business rules)');
        console.log('   3. مشاكل في قاعدة البيانات أو الفهرسة');
        console.log('   4. قيود زمنية أو تضارب في الجدولة');
        
        if (workingCombos.length > 0) {
            console.log('\n💡 التوصية: استخدم التوليفات الناجحة كـ fallback في الـ UI');
        }
    }
}

investigateBackendValidation().catch(console.error);
