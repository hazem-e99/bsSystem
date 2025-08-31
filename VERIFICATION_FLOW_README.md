# Email Verification Flow

## Overview
تم إضافة نظام verification للبريد الإلكتروني بعد التسجيل. المستخدم يجب أن يتحقق من بريده الإلكتروني قبل أن يتمكن من تسجيل الدخول.

## Flow الجديد

### 1. **Registration (التسجيل)**
```
User fills registration form → API call to /Authentication/registration-student → Redirect to /auth/verification?email=user@example.com
```

### 2. **Verification (التحقق)**
```
User enters verification code → API call to /Authentication/verification → Success → Redirect to /auth/login
```

### 3. **Login (تسجيل الدخول)**
```
User can now login with verified email
```

## API Endpoints

### 1. **Student Registration**
```
POST /Authentication/registration-student
```

**Request Body:**
```json
{
  "firstName": "أحمد",
  "lastName": "محمد",
  "nationalId": "19370037866089",
  "email": "ahmed@example.com",
  "phoneNumber": "01012345678",
  "studentAcademicNumber": "ST2024001",
  "department": "Medicine",
  "yearOfStudy": "PreparatoryYear",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "data": true,
  "count": 0,
  "message": "Student registered successfully",
  "success": true,
  "timestamp": "2025-08-24T12:28:14.030Z",
  "errorCode": "None",
  "requestId": "string"
}
```

### 2. **Email Verification**
```
POST /Authentication/verification
```

**Request Body:**
```json
{
  "email": "ahmed@example.com",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "data": true,
  "count": 0,
  "message": "Email verified successfully",
  "success": true,
  "timestamp": "2025-08-24T12:28:14.030Z",
  "errorCode": "None",
  "requestId": "string"
}
```

## Schema Definitions

### StudentRegistrationDTO
```typescript
interface StudentRegistrationDTO {
  firstName: string;           // minLength: 2, maxLength: 20
  lastName: string;            // minLength: 2, maxLength: 20
  nationalId: string;          // pattern: ^\d{14}$
  email: string;               // format: email, minLength: 1
  phoneNumber: string;         // format: tel, minLength: 1, pattern: ^01[0-2,5]{1}[0-9]{8}$
  studentAcademicNumber: string; // minLength: 1
  department: StudentDepartment; // enum values
  yearOfStudy: AcademicYear;   // enum values
  password: string;            // format: password, minLength: 1
  confirmPassword: string;     // format: password, minLength: 1
}
```

### VerificationDTO
```typescript
interface VerificationDTO {
  email: string;               // format: email, minLength: 1
  verificationCode: string;    // minLength: 1
}
```

## Pages Created

### 1. **Registration Page** (`/register`)
- ✅ Form validation
- ✅ Redirect to verification after success
- ✅ Error handling

### 2. **Verification Page** (`/auth/verification`)
- ✅ Email verification form
- ✅ Verification code input
- ✅ Success/error states
- ✅ Redirect to login after verification
- ✅ Resend code functionality
- ✅ Back to login option

### 3. **Login Page** (`/auth/login`)
- ✅ Existing functionality
- ✅ Only verified users can login

## Validation

### 1. **Registration Validation**
- ✅ First/Last name: 2-20 characters
- ✅ National ID: 14 digits
- ✅ Email: valid format
- ✅ Phone: 01[0-2,5]XXXXXXXX
- ✅ Password confirmation matching

### 2. **Verification Validation**
- ✅ Email: valid format
- ✅ Verification code: required, min 1 character

## Testing

### 1. **Test Complete Flow**
```bash
# 1. Test registration
curl -X POST http://busmanagementsystem.runasp.net/api/Authentication/registration-student \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "nationalId": "19370037866089",
    "email": "ahmed@example.com",
    "phoneNumber": "01012345678",
    "department": "Medicine",
    "yearOfStudy": "PreparatoryYear",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# 2. Test verification
curl -X POST http://busmanagementsystem.runasp.net/api/Authentication/verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "verificationCode": "123456"
  }'

# 3. Test login
curl -X POST http://busmanagementsystem.runasp.net/api/Authentication/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ahmed@example.com",
    "password": "password123"
  }'
```

### 2. **Test with Node.js**
```bash
node test-global-endpoints.js
```

### 3. **Test in Browser**
1. Go to `/register`
2. Fill form and submit
3. You'll be redirected to `/auth/verification?email=your@email.com`
4. Enter verification code
5. After verification, you'll be redirected to `/auth/login`

## Error Handling

### 1. **Registration Errors**
- Validation errors (displayed in form)
- API errors (displayed in toast)
- Network errors (displayed in toast)

### 2. **Verification Errors**
- Invalid verification code
- Email not found
- Network errors
- API errors

### 3. **Success States**
- Registration success → Redirect to verification
- Verification success → Redirect to login
- Login success → Redirect to dashboard

## Security Features

### 1. **Email Verification Required**
- Users cannot login without verifying email
- Verification code sent to registered email only

### 2. **Validation on Both Sides**
- Client-side validation for UX
- Server-side validation for security

### 3. **Secure Redirects**
- Email passed via URL params (encoded)
- Verification page validates email presence

## User Experience

### 1. **Clear Flow**
- Registration → Verification → Login → Dashboard

### 2. **Helpful Messages**
- Success messages with next steps
- Error messages with suggestions
- Loading states during API calls

### 3. **Navigation Options**
- Back to login from verification
- Resend verification code
- Clear error messages

## Files Updated

### 1. **New Files Created**
- `src/app/auth/verification/page.tsx` - Verification page
- `src/utils/validateVerification.ts` - Verification validation

### 2. **Files Modified**
- `src/app/register/page.tsx` - Updated redirect to verification
- `test-global-endpoints.js` - Added verification testing
- `GLOBAL_ENDPOINTS_README.md` - Updated with verification flow

## Notes

### 1. **Verification Code**
- Typically 6 digits
- Sent via email after registration
- Expires after some time (handled by backend)

### 2. **Email Requirements**
- Must be valid email format
- Should be accessible to user
- Used for verification and login

### 3. **Flow Control**
- Users cannot skip verification
- Verification required before login
- Clear error messages guide users
