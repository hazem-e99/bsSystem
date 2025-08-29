# Global Endpoints Integration

## Overview
تم تحديث النظام لاستخدام Global Endpoints بدلاً من Local Endpoints المحلية.

**⚠️ تم تحديث Schema التسجيل ليتطابق مع StudentRegistrationDTO الرسمي!**

## Global Endpoints المستخدمة

### Authentication Endpoints
- **Student Registration**: `http://busmanagementsystem.runasp.net/api/Authentication/registration-student`
- **Email Verification**: `http://busmanagementsystem.runasp.net/api/Authentication/verification`
- **User Login**: `http://busmanagementsystem.runasp.net/api/Authentication/login`
- **Forgot Password**: `http://busmanagementsystem.runasp.net/api/Authentication/forgot-password`
- **Reset Password**: `http://busmanagementsystem.runasp.net/api/Authentication/reset-password`

## Flow الجديد

### 1. **Registration** → **Verification** → **Login**
- المستخدم يسجل → يتحقق من البريد → يسجل الدخول

## كيفية العمل

### 1. التبديل بين Global و Local Endpoints
يمكنك التحكم في نوع Endpoints المستخدمة عن طريق تعديل ملف `src/lib/constants.ts`:

```typescript
// في ملف src/lib/constants.ts
export const API_CONSTANTS = {
  // غيّر هذا إلى true لاستخدام Global Endpoints
  // أو false لاستخدام Local Endpoints
  USE_GLOBAL_ENDPOINTS: true,
  
  // باقي الإعدادات...
};
```

### 2. التبديل السريع
```typescript
// لاستخدام Global Endpoints
USE_GLOBAL_ENDPOINTS: true

// لاستخدام Local Endpoints  
USE_GLOBAL_ENDPOINTS: false
```

### 3. إعادة تشغيل التطبيق
بعد تغيير الإعداد، أعد تشغيل التطبيق:
```bash
npm run dev
```

## الملفات المحدثة

### 1. ملفات التكوين
- `src/lib/env.ts` - إعدادات البيئة
- `src/lib/config.ts` - تكوين API
- `src/lib/api.ts` - دوال API المحدثة

### 2. ملفات Schema المحدث
- `src/utils/validateStudentRegistration.ts` - Validation utility محدث
- `UPDATED_SCHEMA_README.md` - توثيق Schema الكامل

### 2. ملفات المصادقة
- `src/hooks/useAuth.ts` - Hook المصادقة المحدث
- `src/app/register/page.tsx` - صفحة التسجيل
- `src/app/auth/login/page.tsx` - صفحة تسجيل الدخول
- `src/app/auth/forgot-password/page.tsx` - صفحة نسيت كلمة المرور
- `src/app/auth/reset-password/page.tsx` - صفحة إعادة تعيين كلمة المرور

## كيفية الاستخدام

### 1. تسجيل الطلاب
```typescript
import { authAPI } from '@/lib/api';

const userData = {
  firstName: 'أحمد',
  lastName: 'محمد',
  nationalId: '19370037866089',
  email: 'ahmed@example.com',
  phoneNumber: '01012345678', // Valid format: 01[0-2,5]XXXXXXXX
  department: 'Medicine',
  yearOfStudy: 'PreparatoryYear',
  password: 'password123',
  confirmPassword: 'password123'
};

const result = await authAPI.registerStudent(userData);
```

### 2. التحقق من البريد الإلكتروني
```typescript
import { authAPI } from '@/lib/api';

const verificationData = {
  email: 'ahmed@example.com',
  verificationCode: '123456'
};

const result = await authAPI.verifyEmail(verificationData);
```

### 3. تسجيل الدخول
```typescript
import { authAPI } from '@/lib/api';

const credentials = {
  email: 'ahmed@example.com',
  password: 'password123'
};

const result = await authAPI.login(credentials);
```

### 3. طلب إعادة تعيين كلمة المرور
```typescript
import { authAPI } from '@/lib/api';

const result = await authAPI.forgotPassword({ email: 'ahmed@example.com' });
```

### 4. إعادة تعيين كلمة المرور
```typescript
import { authAPI } from '@/lib/api';

const result = await authAPI.resetPassword({
  token: 'reset-token-here',
  email: 'ahmed@example.com',
  password: 'newpassword123'
});
```

## بنية البيانات المتوقعة

### 1. استجابة تسجيل الطالب
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

### 2. استجابة التحقق من البريد
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

### 3. استجابة تسجيل الدخول
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "firstName": "أحمد",
    "lastName": "محمد",
    "email": "ahmed@example.com",
    "role": "student"
  }
}
```

### 3. استجابة طلب إعادة تعيين كلمة المرور
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### 4. استجابة إعادة تعيين كلمة المرور
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## معالجة الأخطاء

### 1. أخطاء المصادقة
```typescript
try {
  const result = await authAPI.login(credentials);
  // معالجة النجاح
} catch (error) {
  // معالجة الخطأ
  console.error('Authentication error:', error);
}
```

### 2. أخطاء الشبكة
```typescript
try {
  const result = await authAPI.registerStudent(userData);
} catch (error) {
  if (error.message.includes('Failed to fetch')) {
    // خطأ في الاتصال بالشبكة
  } else {
    // خطأ آخر
  }
}
```

## الاختبار

### 1. اختبار Global Endpoints
```bash
# تشغيل التطبيق مع Global Endpoints
npm run dev
```

### 2. اختبار Local Endpoints
```bash
# تغيير USE_GLOBAL_ENDPOINTS إلى false في constants.ts
# ثم إعادة تشغيل التطبيق
npm run dev
```

### 3. اختبار API مباشرة
```bash
# اختبار Global Endpoints
node test-global-endpoints.js

# أو اختبار يدوي
curl -X POST http://busmanagementsystem.runasp.net/api/Authentication/registration-student \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "أحمد",
    "lastName": "محمد",
    "nationalId": "19370037866089",
    "email": "test@example.com",
    "phoneNumber": "01012345678",
    "department": "Medicine",
    "yearOfStudy": "PreparatoryYear",
    "password": "password123",
    "confirmPassword": "password123"
  }'

curl -X POST http://busmanagementsystem.runasp.net/api/Authentication/verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "verificationCode": "123456"
  }'

curl -X POST http://busmanagementsystem.runasp.net/api/Authentication/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 4. مراقبة Console
افتح Developer Tools في المتصفح وانتقل إلى Console لرؤية:
- 🔗 Endpoints المستخدمة
- 🌐 URLs الكاملة
- 📤 البيانات المرسلة
- 📥 استجابات API

## ملاحظات مهمة

### 1. الأمان
- تأكد من استخدام HTTPS في الإنتاج
- لا تقم بتخزين كلمات المرور كنص عادي
- استخدم JWT tokens للمصادقة

### 2. الأداء
- Global Endpoints قد تكون أبطأ من Local Endpoints
- استخدم caching عند الحاجة
- راقب أوقات الاستجابة

### 3. الصيانة
- تأكد من أن Global Endpoints تعمل بشكل صحيح
- راقب logs للأخطاء
- احتفظ بنسخة احتياطية من Local Endpoints للطوارئ

## استكشاف الأخطاء

### 1. مشاكل الاتصال
- تحقق من صحة URL
- تحقق من إعدادات الشبكة
- تحقق من CORS settings

### 2. مشاكل المصادقة
- تحقق من صحة البيانات المرسلة
- تحقق من استجابة API
- تحقق من logs

### 3. مشاكل البيئة
- تحقق من قيمة NODE_ENV
- تحقق من ملفات التكوين
- أعد تشغيل الخادم بعد التغييرات

### 4. مشاكل Schema
- تحقق من صحة أرقام الهاتف (01[0-2,5]XXXXXXXX)
- تحقق من الرقم القومي (14 رقم بالضبط)
- تحقق من طول الأسماء (2-20 حرف)
- راجع `UPDATED_SCHEMA_README.md` للتفاصيل الكاملة
