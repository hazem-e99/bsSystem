#!/usr/bin/env node

// Test script for Trip endpoints (add, update, delete)
const BASE_URL = 'http://busmanagementsystem.runasp.net/api';


function to24Hour(timeStr) {
  if (!timeStr) return '';
  if (!timeStr.includes('AM') && !timeStr.includes('PM')) return timeStr; // already 24h
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes, seconds] = time.split(':');
  if (modifier === 'PM' && hours !== '12') hours = String(Number(hours) + 12);
  if (modifier === 'AM' && hours === '12') hours = '00';
  return [hours, minutes, seconds].join(':');
}

const testTrip = {
  busId: 2,
  driverId: 2,
  conductorId: 2,
  startLocation: 'Global Start',
  endLocation: 'Global End',
  tripDate: '2025-08-31',
  departureTimeOnly: to24Hour('09:00:00 AM'),
  arrivalTimeOnly: to24Hour('10:00:00 AM'),
  stopLocations: [
    { address: 'Global Stop 1', arrivalTimeOnly: to24Hour('09:20:00 AM'), departureTimeOnly: to24Hour('09:25:00 AM') },
    { address: 'Global Stop 2', arrivalTimeOnly: to24Hour('09:40:00 AM'), departureTimeOnly: to24Hour('09:45:00 AM') }
  ]
};


const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjgiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiaGF6ZW1lc3NhbTgxOTk5QGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6ImhhemVtZXNzYW04MTk5OUBnbWFpbC5jb20iLCJqdGkiOiJjMTc2ZDAwNy03NzNmLTRlZDAtYThjZC1hNWMyNTlhMWNlZTAiLCJpYXQiOjE3NTYzMDgxMzYsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzU4OTAwMTM2LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjcxMjYifQ.N4s5Ldqz--KXZfFy4CbF0vx9vnQN3Phhmp3obzfB6r0';

async function createTrip() {
  const url = `${BASE_URL}/Trip`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify({ dto: testTrip })
  });
  const data = await response.json().catch(() => ({}));
  console.log('Create Trip:', response.status, data);
  return data.id || (data.data && data.data.id);
}

async function updateTrip(id) {
  const url = `${BASE_URL}/Trip/${id}`;
  const update = { endLocation: 'Updated End', arrivalTimeOnly: '09:30' };
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`
    },
    body: JSON.stringify(update)
  });
  const data = await response.json().catch(() => ({}));
  console.log('Update Trip:', response.status, data);
}


async function getTrips() {
  const url = `${BASE_URL}/Trip`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  });
  const data = await response.json().catch(() => ({}));
  // يدعم { data: [...] } أو [...]
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

async function deleteTrip(id) {
  const url = `${BASE_URL}/Trip/${id}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  });
  const data = await response.json().catch(() => ({}));
  console.log('Delete Trip:', response.status, data);
}


async function run() {
  try {
    const trips = await getTrips();
    if (!trips.length) throw new Error('No trips found to delete.');
    const tripId = trips[0].id || trips[0].Id;
    if (!tripId) throw new Error('Trip id not found in first trip.');
    await deleteTrip(tripId);
  } catch (e) {
    console.error('Test failed:', e);
  }
}

run();
