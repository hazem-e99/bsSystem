/**
 * Test script to verify student registration functionality
 * Run this with: node test-student-registration.js
 */

const API_BASE_URL = 'http://busmanagementsystem.runasp.net/api';

// Test data that matches the StudentRegistrationDTO schema
const testStudentData = {
  firstName: "Ahmed",
  lastName: "Hassan",
  nationalId: "12345678901234",
  email: "ahmed.hassan@university.edu",
  phoneNumber: "01123456789",
  studentAcademicNumber: "STU2024001",
  department: "ComputerScience",
  yearOfStudy: "FirstYear",
  password: "SecurePass123",
  confirmPassword: "SecurePass123"
};

async function testStudentRegistration() {
  console.log('🧪 Testing Student Registration API...');
  console.log('📤 Sending registration data:', JSON.stringify(testStudentData, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/Authentication/registration-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testStudentData)
    });
    
    console.log('📥 Response status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('📥 Parsed response:', JSON.stringify(responseData, null, 2));
      
      if (responseData.success) {
        console.log('✅ Student registration test PASSED');
        console.log('📄 Message:', responseData.message);
      } else {
        console.log('❌ Student registration test FAILED');
        console.log('📄 Error:', responseData.message);
      }
    } catch (parseError) {
      console.log('⚠️ Response is not JSON:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function testStudentDataEndpoints() {
  console.log('\n🧪 Testing Student Data API endpoints...');
  
  try {
    // Test GET /api/Users/students-data
    console.log('📡 Testing GET /api/Users/students-data');
    const studentsResponse = await fetch(`${API_BASE_URL}/Users/students-data`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('📥 Students endpoint status:', studentsResponse.status);
    
    if (studentsResponse.ok) {
      const studentsData = await studentsResponse.json();
      console.log('✅ Students data endpoint working');
      console.log('📊 Response structure:', {
        hasData: !!studentsData.data,
        dataType: Array.isArray(studentsData.data) ? 'array' : typeof studentsData.data,
        dataLength: Array.isArray(studentsData.data) ? studentsData.data.length : 'N/A',
        success: studentsData.success,
        message: studentsData.message
      });
    } else {
      console.log('❌ Students data endpoint failed');
    }
    
    // Test GET /api/Users/by-role/Student
    console.log('\n📡 Testing GET /api/Users/by-role/Student');
    const roleResponse = await fetch(`${API_BASE_URL}/Users/by-role/Student`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('📥 Role endpoint status:', roleResponse.status);
    
    if (roleResponse.ok) {
      const roleData = await roleResponse.json();
      console.log('✅ Role-based endpoint working');
      console.log('📊 Response structure:', {
        hasData: !!roleData.data,
        dataType: Array.isArray(roleData.data) ? 'array' : typeof roleData.data,
        dataLength: Array.isArray(roleData.data) ? roleData.data.length : 'N/A',
        success: roleData.success,
        message: roleData.message
      });
    } else {
      console.log('❌ Role-based endpoint failed');
    }
    
  } catch (error) {
    console.error('❌ Student data endpoints test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting API Tests for Student Registration Refactor\n');
  
  await testStudentRegistration();
  await testStudentDataEndpoints();
  
  console.log('\n✨ Tests completed!');
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testStudentRegistration, testStudentDataEndpoints, runAllTests };
}

// Auto-run if called directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests();
}
