# دليل نظام التحقق من نطاق البريد الإلكتروني
# Email Domain Validation System Guide

## نظرة عامة | Overview

تم إضافة نظام اختياري للتحقق من نطاق البريد الإلكتروني يسمح للمؤسسات التعليمية بتقييد عملية التسجيل للطلاب والمعلمين بحيث يُقبل فقط من يملك بريداً إلكترونياً رسمياً تابعاً للمؤسسة.

An optional email domain validation system has been added that allows educational institutions to restrict student and teacher registration to only accept official institutional email addresses.

---

## الميزات الرئيسية | Key Features

### ✅ ميزة اختيارية تماماً | Fully Optional Feature
- معطلة افتراضياً لجميع المؤسسات
- لا تؤثر على المؤسسات الموجودة
- يمكن تفعيلها/تعطيلها في أي وقت

- Disabled by default for all institutions
- Does not affect existing institutions
- Can be enabled/disabled at any time

### 🔐 أمان متعدد المستويات | Multi-Level Security
- تحقق في الواجهة الأمامية (تجربة مستخدم فورية)
- تحقق في الجهة الخلفية (AuthContext) قبل إنشاء الحساب
- منع التجاوز من قبل المستخدمين المحترفين

- Frontend validation (instant user experience)
- Backend validation (AuthContext) before account creation
- Prevents bypass by advanced users

### 🌐 دعم نطاقات متعددة | Multiple Domains Support
- إضافة أكثر من نطاق بريد إلكتروني لنفس المؤسسة
- دعم صيغ متعددة: `@domain.edu` أو `domain.edu`
- مقارنة غير حساسة لحالة الأحرف

- Add multiple email domains for the same institution
- Multiple format support: `@domain.edu` or `domain.edu`
- Case-insensitive comparison

### 📱 تجربة مستخدم محسّنة | Enhanced User Experience
- تنبيهات واضحة عند اختيار المؤسسة
- تحقق فوري أثناء كتابة البريد الإلكتروني
- رسائل خطأ مخصصة (اختيارية)
- أمثلة توضيحية

- Clear alerts when selecting institution
- Real-time validation while typing email
- Custom error messages (optional)
- Illustrative examples

---

## كيفية الاستخدام | How to Use

### للمسؤولين | For Administrators

#### 1. الوصول إلى الإعدادات | Access Settings
```
لوحة التحكم → إدارة المؤسسات التعليمية → تخصيص المؤسسات التعليمية
Admin Dashboard → School Management → School Customization
```

#### 2. اختيار المؤسسة | Select Institution
- اختر المؤسسة التعليمية من القائمة الجانبية
- Select the educational institution from the sidebar

#### 3. تفعيل التحقق من النطاق | Enable Domain Validation
- قم بتفعيل المفتاح "تفعيل التحقق من نطاق البريد الإلكتروني"
- Toggle "Enable email domain validation"

#### 4. إضافة النطاقات المسموح بها | Add Allowed Domains
```
مثال | Example:
@university.edu
@school.edu.sa
university.edu
```

- يمكنك إدخال النطاق بأي صيغة (مع أو بدون @)
- You can enter the domain in any format (with or without @)

#### 5. رسالة خطأ مخصصة (اختياري) | Custom Error Message (Optional)
- أضف رسالة خاصة بالعربية
- Add custom message in Arabic
- أضف رسالة خاصة بالإنجليزية
- Add custom message in English

#### 6. اختبار البريد الإلكتروني | Test Email
- استخدم قسم الاختبار للتحقق من صحة الإعدادات
- Use the test section to verify settings
- أدخل بريد إلكتروني وشاهد النتيجة فوراً
- Enter an email and see the result instantly

#### 7. حفظ الإعدادات | Save Settings
- اضغط على "حفظ الإعدادات"
- Click "Save Settings"

---

## سيناريوهات الاستخدام | Use Cases

### السيناريو 1: مؤسسة بدون قيود | No Restrictions
**الإعداد | Setup:**
- ترك الميزة معطلة (الوضع الافتراضي)
- Leave feature disabled (default)

**النتيجة | Result:**
- قبول جميع عناوين البريد الإلكتروني (Gmail, Outlook, إلخ)
- Accept all email addresses (Gmail, Outlook, etc.)

---

### السيناريو 2: جامعة بنطاق واحد | University with Single Domain
**الإعداد | Setup:**
```
تفعيل التحقق: ✓
Enable validation: ✓

النطاقات المسموح بها:
Allowed domains:
- @university.edu
```

**النتيجة | Result:**
- ✅ `student@university.edu` → مقبول | Accepted
- ❌ `student@gmail.com` → مرفوض | Rejected

---

### السيناريو 3: مؤسسة تعليمية بنطاقات متعددة | Educational Institution with Multiple Domains
**الإعداد | Setup:**
```
تفعيل التحقق: ✓
Enable validation: ✓

النطاقات المسموح بها:
Allowed domains:
- @school.edu
- @school.edu.sa
- @school-academy.com
```

**النتيجة | Result:**
- ✅ `student@school.edu` → مقبول | Accepted
- ✅ `teacher@school.edu.sa` → مقبول | Accepted
- ✅ `admin@school-academy.com` → مقبول | Accepted
- ❌ `user@gmail.com` → مرفوض | Rejected

---

### السيناريو 4: رسالة خطأ مخصصة | Custom Error Message
**الإعداد | Setup:**
```
تفعيل التحقق: ✓
Enable validation: ✓

النطاقات المسموح بها:
Allowed domains:
- @ksu.edu.sa

رسالة مخصصة (عربي):
Custom message (Arabic):
"يرجى استخدام البريد الإلكتروني الجامعي الخاص بجامعة الملك سعود (@ksu.edu.sa)"

رسالة مخصصة (إنجليزي):
Custom message (English):
"Please use your King Saud University email (@ksu.edu.sa)"
```

**النتيجة | Result:**
- عند إدخال بريد غير صحيح، يظهر الرسالة المخصصة
- When entering incorrect email, custom message appears

---

## البنية التقنية | Technical Architecture

### الملفات المضافة | Added Files

#### 1. `src/utils/domainValidation.ts`
دوال مساعدة للتحقق من النطاق:
Helper functions for domain validation:
- `extractDomain()` - استخراج النطاق من البريد الإلكتروني
- `normalizeDomain()` - تطبيع صيغة النطاق
- `isValidDomainFormat()` - التحقق من صحة صيغة النطاق
- `getSchoolDomainSettings()` - جلب إعدادات النطاق للمؤسسة
- `validateEmailDomain()` - التحقق من البريد مقابل النطاقات المسموح بها
- `testEmailAgainstDomains()` - اختبار بريد إلكتروني

#### 2. `src/components/Common/DomainValidationInfo.tsx`
مكون مرئي لعرض معلومات التحقق من النطاق
Visual component to display domain validation information

### التعديلات على الملفات الموجودة | Modified Existing Files

#### 1. `src/pages/admin/ManageSchoolCustomization.tsx`
- إضافة قسم "التحقق من البريد الإلكتروني (اختياري)"
- واجهة إدارة النطاقات المسموح بها
- اختبار البريد الإلكتروني
- حفظ الإعدادات في Firestore

- Added "Email Domain Validation (Optional)" section
- Allowed domains management interface
- Email testing
- Settings saved to Firestore

#### 2. `src/pages/RegisterPage.tsx`
- جلب إعدادات النطاق عند اختيار المؤسسة
- عرض تنبيه معلومات النطاقات المقبولة
- تحقق فوري من البريد أثناء الكتابة
- مؤشرات بصرية (✓ أخضر / ✗ أحمر)

- Fetch domain settings when selecting institution
- Display accepted domains info alert
- Real-time email validation while typing
- Visual indicators (✓ green / ✗ red)

#### 3. `src/contexts/AuthContext.tsx`
- تحقق من النطاق قبل إنشاء حساب Firebase Auth
- رمي خطأ إذا فشل التحقق
- تسجيل تفصيلي في console

- Validate domain before creating Firebase Auth account
- Throw error if validation fails
- Detailed console logging

### حقول قاعدة البيانات الجديدة | New Database Fields

تمت إضافة الحقول التالية إلى مستندات المؤسسات التعليمية في Firebase Firestore:

The following fields were added to school documents in Firebase Firestore:

```typescript
interface School {
  // ... existing fields
  domain_validation_enabled?: boolean;        // تفعيل/تعطيل التحقق
  allowed_domains?: string[];                 // النطاقات المسموح بها
  domain_validation_message_ar?: string;      // رسالة خطأ مخصصة بالعربية
  domain_validation_message_en?: string;      // رسالة خطأ مخصصة بالإنجليزية
}
```

**القيم الافتراضية | Default Values:**
- `domain_validation_enabled`: `false`
- `allowed_domains`: `[]`

---

## الأسئلة الشائعة | FAQ

### س: هل تؤثر الميزة على المستخدمين الحاليين؟
A: لا، الميزة تطبق فقط على التسجيلات الجديدة بعد تفعيلها.

### Q: Does the feature affect existing users?
A: No, the feature only applies to new registrations after activation.

---

### س: ماذا يحدث إذا فعلت الميزة بدون إضافة نطاقات؟
A: سيظهر تحذير في لوحة التحكم، وسيتم قبول جميع البريد الإلكتروني حتى تضيف نطاقاً واحداً على الأقل.

### Q: What happens if I enable the feature without adding domains?
A: A warning will appear in the admin panel, and all emails will be accepted until you add at least one domain.

---

### س: هل يمكن تعطيل الميزة بعد تفعيلها؟
A: نعم، يمكنك تعطيلها في أي وقت دون فقدان النطاقات المحفوظة.

### Q: Can the feature be disabled after activation?
A: Yes, you can disable it at any time without losing saved domains.

---

### س: هل النطاقات المحفوظة حساسة لحالة الأحرف؟
A: لا، المقارنة غير حساسة لحالة الأحرف (case-insensitive).

### Q: Are saved domains case-sensitive?
A: No, comparison is case-insensitive.

---

### س: هل يمكن استخدام نطاقات فرعية؟
A: نعم، يمكنك إضافة `@cs.university.edu` كنطاق منفصل.

### Q: Can I use subdomains?
A: Yes, you can add `@cs.university.edu` as a separate domain.

---

### س: هل الميزة تعمل للمؤسسات بدون subdomain؟
A: نعم، الميزة مستقلة تماماً عن نظام subdomain ويمكن استخدامها لأي مؤسسة.

### Q: Does the feature work for institutions without subdomain?
A: Yes, the feature is completely independent of the subdomain system and can be used for any institution.

---

## الدعم والمساعدة | Support

للمساعدة الإضافية أو الإبلاغ عن مشاكل، يرجى التواصل مع فريق الدعم الفني.

For additional help or to report issues, please contact the technical support team.

---

**تاريخ الإنشاء | Created:** 2026-04-06
**الإصدار | Version:** 1.0.0
