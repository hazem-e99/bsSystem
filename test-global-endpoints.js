#!/usr/bin/env node

// Test script for global endpoints
const BASE_URL = 'http://busmanagementsystem.runasp.net/api';

const testData = {
  registration: {
    firstName: 'Test',
    lastName: 'User',
    nationalId: '19370037866089',
    email: 'test@example.com',
    phoneNumber: '01012345678', // Valid format: 01[0-2,5]XXXXXXXX
    department: 'Medicine',
    yearOfStudy: 'PreparatoryYear',
    password: 'password123',
    confirmPassword: 'password123'
  },
  verification: {
    email: 'test@example.com',
    verificationCode: '123456'
  },
  login: {
    email: 'test@example.com',
    password: 'password123',
    rememberMe: true
  },
  forgotPassword: {
    email: 'test@example.com'
  },
  resetPassword: {
    token: 'test-token',
    email: 'test@example.com',
    password: 'newpassword123'
  }
};

async function testEndpoint(name, endpoint, data) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`🔗 URL: ${url}`);
  console.log(`📤 Data:`, data);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    console.log(`📥 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log(`✅ Response:`, responseData);
    } else {
      const errorData = await response.text();
      console.log(`❌ Error:`, errorData);
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
}

async function testAllEndpoints() {
  console.log('🚀 Testing Global Endpoints...\n');
  
  await testEndpoint('Student Registration', '/Authentication/registration-student', testData.registration);
  await testEndpoint('Email Verification', '/Authentication/verification', testData.verification);
  await testEndpoint('User Login', '/Authentication/login', testData.login);
  await testEndpoint('Forgot Password', '/Authentication/forgot-password', testData.forgotPassword);
  await testEndpoint('Reset Password', '/Authentication/reset-password', testData.resetPassword);
  
  console.log('\n✨ Endpoint testing completed!');
}

// Run tests
testAllEndpoints().catch(console.error);
