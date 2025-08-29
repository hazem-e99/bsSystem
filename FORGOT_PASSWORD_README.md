# Forgot Password System

## Overview
تم إنشاء نظام كامل لإعادة تعيين كلمة المرور يتضمن:

1. **صفحة نسيت كلمة المرور** (`/auth/forgot-password`)
2. **صفحة إعادة تعيين كلمة المرور** (`/auth/reset-password`)
3. **API endpoints** للتعامل مع طلبات إعادة تعيين كلمة المرور

## الملفات المنشأة

### 1. صفحات الواجهة
- `src/app/auth/forgot-password/page.tsx` - صفحة طلب إعادة تعيين كلمة المرور
- `src/app/auth/reset-password/page.tsx` - صفحة إدخال كلمة المرور الجديدة

### 2. API Endpoints
- `src/app/api/auth/forgot-password/route.ts` - إرسال رابط إعادة تعيين كلمة المرور
- `src/app/api/auth/reset-password/route.ts` - تحديث كلمة المرور

### 3. الروابط
- تم إضافة رابط "نسيت كلمة المرور" في صفحة تسجيل الدخول

## كيفية العمل

### 1. طلب إعادة تعيين كلمة المرور
1. المستخدم يذهب إلى `/auth/forgot-password`
2. يدخل بريده الإلكتروني
3. النظام يتحقق من وجود الحساب
4. يتم إنشاء token صالح لمدة 24 ساعة
5. يتم حفظ Token في قاعدة البيانات
6. يتم إرسال رسالة نجاح (في الإنتاج سيتم إرسال email)

### 2. إعادة تعيين كلمة المرور
1. المستخدم يفتح الرابط المرسل إليه
2. يدخل كلمة المرور الجديدة
3. النظام يتحقق من صحة Token
4. يتم تحديث كلمة المرور في قاعدة البيانات
5. يتم حذف Token المستخدم
6. يتم عرض رسالة نجاح

## الميزات

### ✅ الأمان
- Tokens صالحة لمدة 24 ساعة فقط
- لا يتم الكشف عن وجود أو عدم وجود الحساب
- Tokens يتم حذفها بعد الاستخدام
- التحقق من صحة كلمة المرور (8 أحرف على الأقل)

### ✅ تجربة المستخدم
- واجهة بسيطة وواضحة
- رسائل خطأ واضحة
- رسائل نجاح
- إمكانية العودة لصفحة تسجيل الدخول

### ✅ التطوير
- في بيئة التطوير، يتم عرض رابط إعادة التعيين في Console
- رسائل واضحة في Console للتطوير
- معالجة الأخطاء بشكل شامل

## الاستخدام في الإنتاج

### 1. إرسال Email
في الإنتاج، يجب تعديل `forgot-password` API لإرسال email بدلاً من إرجاع الرابط:

```typescript
// في production، استخدم خدمة email مثل SendGrid أو AWS SES
const emailContent = `
  Hello ${user.name},
  
  You requested a password reset. Click the link below to reset your password:
  ${resetLink}
  
  This link will expire in 24 hours.
  
  If you didn't request this, please ignore this email.
`;

// إرسال Email
await sendEmail(user.email, 'Password Reset Request', emailContent);
```

### 2. إزالة Console.log
```typescript
// إزالة هذا السطر في الإنتاج
console.log('Password reset link:', resetLink);
```

### 3. إزالة resetLink من Response
```typescript
// في الإنتاج، لا ترجع الرابط
return NextResponse.json({
  message: 'If an account with that email exists, we have sent a password reset link.'
  // remove resetLink
});
```

## اختبار النظام

### 1. اختبار صفحة نسيت كلمة المرور
1. اذهب إلى `/auth/forgot-password`
2. أدخل بريد إلكتروني موجود في قاعدة البيانات
3. تحقق من رسالة النجاح
4. تحقق من Console للحصول على رابط إعادة التعيين

### 2. اختبار إعادة تعيين كلمة المرور
1. انسخ الرابط من Console
2. افتح الرابط
3. أدخل كلمة مرور جديدة
4. تحقق من رسالة النجاح
5. جرب تسجيل الدخول بكلمة المرور الجديدة

## ملاحظات مهمة

- النظام يعمل مع قاعدة البيانات الحالية (`db.json`)
- يتم إنشاء جدول `passwordResets` تلقائياً
- Tokens بسيطة للتطوير، في الإنتاج استخدم JWT أو crypto
- النظام آمن ولا يكشف معلومات الحسابات
