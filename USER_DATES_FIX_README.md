# إصلاح تواريخ المستخدمين - User Dates Fix

## المشكلة السابقة

كانت جميع المستخدمين في صفحة إدارة المستخدمين يظهرون بتاريخ انضمام "اليوم" وآخر نشاط "الآن"، حتى للمستخدمين الذين سجلوا منذ فترة طويلة.

### السبب
- في ملف `useUsers.ts`، عند عدم وجود `created_at` أو `last_active_at` في قاعدة البيانات، كان يتم استخدام `new Date().toISOString()` كقيمة افتراضية
- لم يكن يتم تسجيل `last_active_at` عند إنشاء المستخدمين من لوحة الإدارة
- لم يكن يتم تحديث `last_active_at` عند تسجيل الدخول
- **⚠️ مشكلة إضافية:** في `AuthContext.tsx` كان يتم استخدام `createdAt`, `updatedAt` بينما الكود يبحث عن `created_at`, `updated_at` (عدم تناسق في تسمية الحقول)

## الحلول المطبقة

### 1. تصحيح عرض التواريخ (src/hooks/useUsers.ts)

**السطر 274-275:** تم تغيير القيمة الافتراضية من `new Date().toISOString()` إلى `null`

```typescript
// قبل التعديل
joinedAt: userData.created_at ? new Date(userData.created_at.toDate()).toISOString() : new Date().toISOString(),
lastActive: userData.last_active_at ? new Date(userData.last_active_at.toDate()).toISOString() : new Date().toISOString(),

// بعد التعديل
joinedAt: userData.created_at ? new Date(userData.created_at.toDate()).toISOString() : null,
lastActive: userData.last_active_at ? new Date(userData.last_active_at.toDate()).toISOString() : null,
```

**واجهة User:** تم تحديث نوع البيانات للسماح بـ `null`

```typescript
joinedAt: string | null;
lastActive: string | null;
```

### 2. إضافة last_active_at عند إنشاء المستخدمين

**في useUsers.ts (دالة addUser - السطر 383):**

```typescript
const userProfile = {
  // ... باقي الحقول
  created_at: serverTimestamp(),
  updated_at: serverTimestamp(),
  last_active_at: serverTimestamp(), // ← تمت الإضافة
  // ... باقي الحقول
};
```

**في AuthContext.tsx (دالة register - السطر 410):**

```typescript
const baseUserData = {
  // ... باقي الحقول
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  last_active_at: serverTimestamp(), // ← تمت الإضافة
  // ... باقي الحقول
};
```

### 3. تحديث last_active_at عند تسجيل الدخول

**في AuthContext.tsx (دالة login - السطر 217-225):**

```typescript
// Update last_active_at on login
try {
  await setDoc(doc(db, 'users', firebaseUser.uid), {
    last_active_at: serverTimestamp()
  }, { merge: true });
  console.log("✅ Updated last_active_at on login");
} catch (updateError) {
  console.warn("Failed to update last_active_at:", updateError);
}
```

### 4. تحسين عرض التواريخ في دوال التنسيق

**في dateUtils.ts (دالة formatRelativeTime - السطر 138):**

```typescript
// قبل التعديل
if (!date) return '';

// بعد التعديل
if (!date) return 'غير متوفر';
```

الآن عندما لا يتوفر تاريخ، سيتم عرض "غير متوفر" بدلاً من سلسلة فارغة.

### 5. تحسين واجهة المستخدم

**في Users.tsx (السطر 767-772):**

تمت إضافة تنسيق خاص للتواريخ المفقودة:

```typescript
<div className={user.joinedAt ? '' : 'text-gray-400 italic'}>
  {formatDate(user.joinedAt)}
</div>
<div className={`text-xs ${user.lastActive ? 'text-gray-400' : 'text-gray-300 italic'}`}>
  آخر نشاط: {formatRelativeTime(user.lastActive)}
</div>
```

### 6. أداة إصلاح البيانات القديمة

تم إنشاء ملفين جديدين:

#### `src/utils/fixUserDates.ts`
يحتوي على دالتين:
- `fixUserDates()`: إصلاح جميع المستخدمين
- `fixSingleUserDates(userId)`: إصلاح مستخدم محدد

#### `src/pages/admin/FixUserDates.tsx`
صفحة إدارية لتشغيل أداة الإصلاح بواجهة مستخدم.

## كيفية إصلاح البيانات القديمة

### الطريقة 1: استخدام الصفحة الإدارية

1. أضف الصفحة إلى قائمة المسارات في `App.tsx`:

```typescript
import FixUserDates from './pages/admin/FixUserDates';

// في routes
<Route path="/admin/fix-user-dates" element={<FixUserDates />} />
```

2. انتقل إلى `/admin/fix-user-dates`
3. اضغط على زر "بدء إصلاح التواريخ"
4. انتظر حتى تكتمل العملية
5. راجع التقرير المعروض

### الطريقة 2: استخدام Console

في أي مكان في التطبيق، يمكنك استيراد وتشغيل الدالة:

```typescript
import { fixUserDates } from './utils/fixUserDates';

// في console
fixUserDates().then(result => console.log(result));
```

## ما يحدث عند إصلاح البيانات

1. **للمستخدمين بدون created_at:**
   - يتم تعيينه إلى `2024-01-01` (تاريخ افتراضي للسجلات التاريخية)

2. **للمستخدمين بدون last_active_at:**
   - يتم تعيينه إلى نفس قيمة `created_at`

3. **المستخدمون الذين لديهم التواريخ:**
   - يتم تخطيهم (لا يتأثرون)

## النتائج المتوقعة

بعد تطبيق هذه الإصلاحات:

### للمستخدمين الجدد:
- ✅ يتم تسجيل `created_at` تلقائياً عند التسجيل
- ✅ يتم تسجيل `last_active_at` تلقائياً عند التسجيل
- ✅ يتم تحديث `last_active_at` عند كل تسجيل دخول

### للمستخدمين القدامى (بعد تشغيل أداة الإصلاح):
- ✅ سيكون لديهم `created_at` (2024-01-01 كتاريخ افتراضي)
- ✅ سيكون لديهم `last_active_at` (نفس `created_at`)
- ✅ سيتم تحديث `last_active_at` عند تسجيل دخولهم التالي

### في واجهة إدارة المستخدمين:
- ✅ التواريخ الحقيقية تظهر للمستخدمين الذين لديهم بيانات
- ✅ "غير متوفر" يظهر للمستخدمين بدون بيانات (قبل تشغيل الإصلاح)
- ✅ لا مزيد من "اليوم" و"الآن" لجميع المستخدمين

## الملفات المعدلة

1. `src/hooks/useUsers.ts` - تصحيح القيم الافتراضية وإضافة last_active_at
2. `src/contexts/AuthContext.tsx` - **تصحيح تسمية الحقول من `createdAt/updatedAt` إلى `created_at/updated_at`** وتحديث last_active_at عند التسجيل والدخول
3. `src/utils/dateUtils.ts` - تحسين formatRelativeTime
4. `src/pages/Users.tsx` - تحسين عرض التواريخ المفقودة

## الملفات الجديدة

1. `src/utils/fixUserDates.ts` - أداة إصلاح البيانات
2. `src/pages/admin/FixUserDates.tsx` - واجهة إدارية للإصلاح
3. `USER_DATES_FIX_README.md` - هذا الملف

## ملاحظات مهمة

- ⚠️ أداة الإصلاح يُفضل تشغيلها **مرة واحدة فقط**
- ⚠️ المستخدمون القدامى سيحصلون على تاريخ افتراضي (2024-01-01) وليس التاريخ الحقيقي
- ✅ جميع المستخدمين الجدد سيحصلون على تواريخ دقيقة تلقائياً (تم تصحيح تسمية الحقول)
- ✅ يتم تحديث آخر نشاط تلقائياً عند كل تسجيل دخول
- 🔧 **تم حل مشكلة عدم ظهور التواريخ للمستخدمين الجدد بتصحيح تسمية الحقول في Firebase**

## الاختبار

للتحقق من أن الإصلاح يعمل:

1. **اختبار المستخدمين الجدد:**
   - سجل مستخدم جديد
   - تحقق من أن لديه تاريخ انضمام صحيح
   - سجل خروج ثم دخول
   - تحقق من تحديث آخر نشاط

2. **اختبار المستخدمين القدامى:**
   - شغل أداة الإصلاح
   - افتح صفحة إدارة المستخدمين
   - تحقق من أن التواريخ محددة
   - سجل دخول بحساب قديم
   - تحقق من تحديث آخر نشاط

## الدعم

إذا واجهت أي مشاكل:

1. تحقق من console.log للحصول على تفاصيل الأخطاء
2. تأكد من أن Firebase معدّ بشكل صحيح
3. تحقق من أذونات قاعدة البيانات
4. راجع Firestore rules للتأكد من السماح بالتحديثات

---

**تاريخ الإصلاح:** 2025-01-19
**الإصدار:** 1.0.0
