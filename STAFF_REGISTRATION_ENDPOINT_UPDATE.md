# Staff Registration Endpoint Update

## Overview
This document summarizes the changes made to replace local user creation endpoints with the production staff registration endpoint for creating admin, driver, and staff users.

## New Production Endpoint

**Endpoint**: `POST http://busmanagementsystem.runasp.net/api/Authentication/registration-staff`

**Request Body**:
```json
{
  "firstName": "string",
  "lastName": "string", 
  "nationalId": "string",
  "email": "string",
  "phoneNumber": "string",
  "role": "Admin" | "Driver" | "Staff"
}
```

**Response Schema**:
```json
{
  "data": true,
  "count": number,
  "message": string,
  "success": boolean,
  "timestamp": string,
  "errorCode": "None",
  "requestId": "string"
}
```

## Changes Made

### 1. Constants (`src/lib/constants.ts`)
- Added `REGISTRATION_STAFF: '/Authentication/registration-staff'` to global endpoints
- Added `STAFF_REGISTRATION_SCHEMA` with the required fields

### 2. Types (`src/types/auth.ts`)
- Added `StaffRegistrationDTO` interface for staff registration
- Added `StaffRegistrationResponse` interface for API response

### 3. API (`src/lib/api.ts`)
- Added `registerStaff` function to `authAPI` object
- Function calls the new production endpoint with proper data mapping
- **Fixed API endpoint routing**: Updated all local API functions to use relative paths (`./api/...`) to prevent conflicts with global endpoint configuration

### 4. Admin Users Page (`src/app/dashboard/admin/users/page.tsx`)
- Updated form fields from `name` to `firstName` and `lastName`
- Updated `phone` field to `phoneNumber`
- Removed `password` field (not required for staff registration)
- Updated form submission to use `authAPI.registerStaff`
- Added role mapping: `admin` → `Admin`, `driver` → `Driver`, `supervisor`/`movement-manager` → `Staff`
- Updated response handling to check for `success: true`
- Updated form reset to use new field names

## API Endpoint Strategy

### Global Endpoints (Production)
- **Authentication**: Staff registration, student registration, login, verification, etc.
- ~~**Bus Management**: Bus CRUD operations~~ *(Changed to local endpoints to avoid authentication issues)*

### Local Endpoints (Development/Display)
- **User Management**: Fetching, editing, deleting users (for display purposes)
- **Bus Management**: Bus CRUD operations (local endpoints)
- **Other Data**: Routes, trips, payments, notifications, etc.

### Key Fix
The system now properly separates global and local endpoints:
- **Global endpoints** use `apiConfig.buildUrl()` for production APIs (authentication only)
- **Local endpoints** use relative paths (`./api/...`) to work with both configurations
- **Bus API** was moved to local endpoints to avoid 401 Unauthorized errors from global API

## Form Structure Changes

### Before (Local Endpoint)
- Full Name (single field)
- Email
- Password
- Role
- Phone
- National ID
- Status

### After (Production Endpoint)
- First Name
- Last Name
- Email
- National ID
- Phone Number
- Role (Admin/Driver/Supervisor/Movement Manager)
- Status

## Role Mapping

| Form Role | API Role |
|-----------|----------|
| admin | Admin |
| driver | Driver |
| supervisor | Staff |
| movement-manager | Staff |

## Response Handling

The form now properly handles the production API response:
- Checks for `response.success === true`
- Shows appropriate success/error messages
- Creates local user object for display purposes

## Benefits

1. **Production Ready**: Uses the actual production API endpoint
2. **Consistent Schema**: Matches the exact API requirements
3. **Proper Validation**: API handles validation on the server side
4. **Error Handling**: Proper error messages from production API
5. **Scalability**: No more local database dependencies for user creation
6. **Hybrid Approach**: Combines production endpoints for critical operations with local endpoints for data display

## Testing

To test the new endpoint:
1. Go to Admin Dashboard > Users
2. Click "Add User"
3. Fill in the form with valid data
4. Submit and verify the API call goes to the production endpoint
5. Check that the response is properly handled

## Notes

- Student registration remains unchanged (uses existing endpoint)
- Only staff user creation (admin, driver, supervisor, movement manager) uses the new endpoint
- Local user editing and viewing functionality remains unchanged
- The form now properly separates first and last names as required by the API
- **API endpoint conflicts have been resolved** - the system now properly handles both global and local endpoints
- **Authentication issue resolved**: Bus API was moved to local endpoints to avoid 401 Unauthorized errors from global API
- **Current strategy**: Use global endpoints only for authentication operations that don't require tokens, use local endpoints for all data operations
