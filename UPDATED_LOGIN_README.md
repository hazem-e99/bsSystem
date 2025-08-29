# Updated Login System

## Overview
تم تحديث نظام تسجيل الدخول ليتطابق مع Schema الجديد من الباك إند.

## Schema الجديد

### LoginDTO (Request)
```typescript
interface LoginDTO {
  email: string;           // minLength: 5, maxLength: 100
  password: string;        // minLength: 1
  rememberMe?: boolean;    // optional
}
```

### LoginViewModel (Response)
```typescript
interface LoginViewModel {
  id: number;
  profileId: number;
  token: string | null;
  email: string | null;
  fullName: string | null;
  role: string | null;
  expiration: string;      // ISO date string
}
```

### LoginResponse (Full API Response)
```typescript
interface LoginResponse {
  data: LoginViewModel;
  count: number;
  message: string;
  success: boolean;
  timestamp: string;       // ISO date string
  errorCode: string;
  requestId: string;
}
```

## Validation Rules

### 1. **Email**
- **Required**: ✅
- **Min Length**: 5 characters
- **Max Length**: 100 characters
- **Format**: Valid email address

### 2. **Password**
- **Required**: ✅
- **Min Length**: 1 character
- **Format**: password

### 3. **Remember Me**
- **Required**: ❌ (optional)
- **Type**: boolean
- **Default**: false

## API Endpoint

```
POST /Authentication/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "data": {
    "id": 123,
    "profileId": 456,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "user@example.com",
    "fullName": "أحمد محمد",
    "role": "student",
    "expiration": "2025-08-24T12:40:22.268Z"
  },
  "count": 0,
  "message": "Login successful",
  "success": true,
  "timestamp": "2025-08-24T12:40:22.268Z",
  "errorCode": "None",
  "requestId": "req-123"
}
```

## Features

### 1. **Remember Me Functionality**
- Checkbox for "Remember me"
- Extends session duration to 30 days (vs 1 day)
- Stores user data in localStorage and cookies

### 2. **Enhanced Validation**
- Client-side validation before API call
- Email length validation (5-100 characters)
- Password length validation (min 1 character)
- Email format validation

### 3. **Improved User Experience**
- Clear error messages
- Loading states
- Form validation feedback
- Responsive design

## User Flow

### 1. **Login Process**
```
User enters credentials → Validation → API call → Success → Redirect to dashboard
```

### 2. **Session Management**
```
Login success → Store user data → Set cookie expiration → Navigate to dashboard
```

### 3. **Error Handling**
```
Validation error → Show error message → Stay on login page
API error → Show error message → Stay on login page
```

## Files Updated

### 1. **New Files Created**
- `src/types/auth.ts` - Authentication types
- `src/utils/validateLogin.ts` - Login validation utility

### 2. **Files Modified**
- `src/hooks/useAuth.ts` - Updated login function
- `src/types/user.ts` - Updated User interface
- `src/app/auth/login/page.tsx` - Added rememberMe checkbox
- `test-global-endpoints.js` - Updated test data

## Testing

### 1. **Test with Node.js**
```bash
node test-global-endpoints.js
```

### 2. **Test with cURL**
```bash
curl -X POST http://busmanagementsystem.runasp.net/api/Authentication/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "rememberMe": true
  }'
```

### 3. **Test in Browser**
1. Go to `/auth/login`
2. Enter valid credentials
3. Check "Remember me" if desired
4. Submit form
5. Check console for API response

## Security Features

### 1. **Input Validation**
- Client-side validation for UX
- Server-side validation for security
- Email format validation
- Length restrictions

### 2. **Session Management**
- Configurable session duration
- Secure cookie storage
- Token-based authentication

### 3. **Error Handling**
- Generic error messages (no sensitive info)
- Rate limiting support
- Secure redirects

## User Interface

### 1. **Login Form**
- Email input (with validation)
- Password input (with show/hide toggle)
- Remember me checkbox
- Submit button
- Error message display

### 2. **Validation Feedback**
- Real-time validation
- Clear error messages
- Form state management
- Loading indicators

### 3. **Responsive Design**
- Mobile-friendly layout
- Accessible form controls
- Modern UI components
- Consistent styling

## Integration

### 1. **useAuth Hook**
- Updated login function
- Support for rememberMe
- Enhanced error handling
- Session management

### 2. **User Types**
- Extended User interface
- Support for new fields
- Backward compatibility
- Type safety

### 3. **API Integration**
- Global endpoints support
- Schema validation
- Error handling
- Response parsing

## Notes

### 1. **Backward Compatibility**
- Existing user data preserved
- Default values for missing fields
- Graceful fallbacks

### 2. **Performance**
- Efficient validation
- Minimal API calls
- Optimized state management

### 3. **Accessibility**
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management
