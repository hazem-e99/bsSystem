#!/usr/bin/env node

// Test script for global endpoints
const BASE_URL = 'http://busmanagementsystem.runasp.net/api';

const endpoints = [
  '/Authentication/registration-student',
  '/Authentication/login',
  '/Authentication/verification',
  '/Authentication/forgot-password',
  '/Authentication/reset-password'
];

async function testEndpoint(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });
    
    console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`❌ ${endpoint}: ${error.message}`);
  }
}

async function testAllEndpoints() {
  console.log('🧪 Testing Global Endpoints...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n✨ Endpoint testing completed!');
}

// Run tests
testAllEndpoints().catch(console.error);
