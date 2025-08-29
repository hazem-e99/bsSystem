# Registration & Login System Updates

## Overview
تم تحديث نظام التسجيل وتسجيل الدخول ليتوافق مع المتطلبات الجديدة.

## التعديلات المطبقة

### 1. صفحة التسجيل (Registration)
- **متاحة للطلاب فقط**: تم إزالة خيارات الأدوار الأخرى
- **الحقول المطلوبة**:
  - First Name (الاسم الأول)
  - Last Name (الاسم الأخير)
  - Phone Number (رقم الهاتف)
  - National ID (الرقم القومي)
  - Email (البريد الإلكتروني)
  - Department (القسم الدراسي)
  - Academic Year (السنة الدراسية)
  - Password (كلمة المرور)
  - Confirm Password (تأكيد كلمة المرور)

### 2. صفحة تسجيل الدخول (Login)
- **تسجيل الدخول بالبريد الإلكتروني وكلمة المرور فقط**
- **تم إزالة third-party login** (Google, GitHub)
- **إضافة التحقق من كلمة المرور**

### 3. نظام المصادقة (Authentication)
- **تحديث useAuth hook** للتحقق من كلمة المرور
- **إزالة التحقق من subscription status** للطلاب
- **تبسيط middleware**

### 4. إدارة المستخدمين (Admin Dashboard)
- **تحديث نموذج إضافة المستخدم** مع الحقول الجديدة
- **الحقول الديناميكية** بناءً على نوع المستخدم:
  - **Driver**: firstName, lastName, email, password, licenseNumber, nationalId, phone
  - **Supervisor**: firstName, lastName, email, password, nationalId, phone
  - **Movement Manager**: firstName, lastName, email, password, nationalId, phone
  - **Admin**: firstName, lastName, nationalId, password, phone

### 5. أنواع البيانات (Types)
- **تحديث User interface** لإضافة الحقول الجديدة
- **إضافة password و nationalId** كحقول مطلوبة
- **تحديث Student interface** مع الحقول الأكاديمية

### 6. تكوين النماذج (Forms Configuration)
- **تحديث forms API** لإضافة الحقول الجديدة
- **الحقول المشتركة**: name, email, password, phone, nationalId
- **الحقول الخاصة بكل دور** محددة في forms config

## كيفية الاستخدام

### للطلاب (التسجيل)
1. انتقل إلى `/register`
2. املأ جميع الحقول المطلوبة
3. اختر القسم والسنة الدراسية
4. أدخل كلمة مرور قوية
5. اضغط "Create Account"

### للمدير (إضافة مستخدمين)
1. انتقل إلى Admin Dashboard > Users
2. اضغط "Add User"
3. اختر نوع المستخدم
4. املأ الحقول الأساسية
5. ستظهر الحقول الإضافية تلقائياً حسب نوع المستخدم

### تسجيل الدخول
1. انتقل إلى `/auth/login`
2. أدخل البريد الإلكتروني وكلمة المرور
3. سيتم توجيهك إلى Dashboard المناسب حسب دورك

## بيانات Admin الافتراضية
- **Email**: admin@admin.com
- **Password**: admin123
- **Role**: admin

## ملاحظات تقنية
- تم إزالة التحقق من subscription status للطلاب
- تم تبسيط middleware
- تم تحديث جميع الأنواع (types) لتدعم الحقول الجديدة
- تم إضافة التحقق من كلمة المرور في useAuth hook

## الأمان
- **في الإنتاج**: يجب استخدام hashing لكلمات المرور
- **التحقق من صحة البيانات**: تم إضافة validation أساسي
- **التحقق من تكرار البريد الإلكتروني**: موجود في API

## الاختبار
1. جرب إنشاء حساب طالب جديد
2. جرب تسجيل الدخول بالحساب الجديد
3. جرب إضافة مستخدم جديد من Admin Dashboard
4. تأكد من ظهور الحقول الصحيحة لكل نوع مستخدم
