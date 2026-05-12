# دليل استعادة بيانات المستخدمين

## المشكلة التي تم حلها

كان هناك مشكلة في وظيفة تسجيل الدخول حيث كان يتم استخدام `setDoc` مع `merge: true` لتحديث حقل `last_active_at`. في بعض الحالات النادرة، قد يؤدي هذا إلى فقدان بيانات المستخدم الأخرى.

## الإصلاحات التي تم تطبيقها

### 1. إصلاح وظيفة تسجيل الدخول (AuthContext.tsx)

**التغيير:**
- تم استبدال `setDoc` بـ `updateDoc` في وظيفة `login`
- `updateDoc` يُحدث فقط الحقول المحددة ولا يلمس البيانات الأخرى

**قبل:**
```typescript
await setDoc(doc(db, 'users', firebaseUser.uid), {
  last_active_at: serverTimestamp()
}, { merge: true });
```

**بعد:**
```typescript
await updateDoc(doc(db, 'users', firebaseUser.uid), {
  last_active_at: serverTimestamp()
});
```

### 2. تحسين logging في onAuthStateChanged

تم إضافة logging مفصل لتتبع جميع البيانات المقروءة من Firestore:
- عدد الحقول في المستند
- جميع أسماء الحقول
- التحقق من أن المستند يحتوي على بيانات

### 3. إنشاء utility function (updateLastActive.ts)

تم إنشاء وظيفة مخصصة لتحديث `last_active_at`:
- تستخدم `updateDoc` فقط
- معالجة أخطاء صامتة (لا توقف تجربة المستخدم)
- logging مفصل

### 4. إنشاء أدوات استعادة البيانات

#### A. recoverUserData.ts
Script للبحث عن المستخدمين الذين لديهم بيانات مفقودة:
- `scanUsersForIssues()` - فحص جميع المستخدمين
- `recoverUserData()` - استعادة بيانات مستخدم واحد
- `bulkRecoverUsers()` - استعادة جماعية

#### B. صفحة Data Recovery (/admin/data-recovery)
واجهة مستخدم للأدمن لإدارة استعادة البيانات:
- فحص تلقائي للمستخدمين
- عرض المستخدمين الذين لديهم مشاكل
- استعادة بيانات فردية
- تصدير تقرير CSV

## كيفية استخدام أدوات الاستعادة

### للمدير (Admin):

1. **الوصول إلى صفحة Data Recovery:**
   - سجل الدخول كمدير
   - افتح لوحة تحكم المدير
   - انقر على "استعادة بيانات المستخدمين"
   - أو اذهب مباشرة إلى: `/admin/data-recovery`

2. **فحص المستخدمين:**
   - انقر على زر "فحص المستخدمين"
   - انتظر حتى يكتمل الفحص
   - سيتم عرض ملخص بالمستخدمين الذين لديهم مشاكل

3. **استعادة بيانات مستخدم:**
   - في قائمة المستخدمين المتأثرين، انقر على "استعادة البيانات"
   - املأ البيانات المطلوبة (الدور، الاسم، البريد)
   - انقر على "حفظ"

4. **تصدير التقرير:**
   - انقر على زر "تصدير التقرير"
   - سيتم تحميل ملف CSV بجميع التفاصيل

### للمطورين:

#### استخدام السكريبتات مباشرة:

```typescript
import { scanUsersForIssues, recoverUserData } from './utils/recoverUserData';

// فحص جميع المستخدمين
const report = await scanUsersForIssues();
console.log('Users with issues:', report.usersWithMissingRole);

// استعادة بيانات مستخدم محدد
const success = await recoverUserData('USER_ID', {
  role: 'student',
  email: 'user@example.com',
  name: 'اسم المستخدم',
  status: 'active'
});
```

## المستخدمون المتأثرون حالياً

بناءً على الصور المُرسلة، يوجد مستخدم واحد متأثر:

- **UID:** `KDrYYgVs17a1wZriAfv47ILMnA13`
- **Role:** admin
- **Email:** admin1myprojectplatform@gmail.com
- **الحالة:** تم التحقق من وجود البيانات في Firestore

## الوقاية من المشاكل المستقبلية

### 1. استخدام updateDoc دائماً للتحديثات الجزئية
```typescript
// ✅ صحيح
await updateDoc(userRef, { field: value });

// ❌ خطأ (قد يحذف بيانات أخرى)
await setDoc(userRef, { field: value }, { merge: true });
```

### 2. التحقق من البيانات قبل الحفظ
```typescript
if (!userData || Object.keys(userData).length === 0) {
  console.error('Empty user data!');
  return;
}
```

### 3. Logging مفصل
تم إضافة logging شامل في `AuthContext.tsx` لتتبع أي مشاكل مستقبلية.

### 4. فحص دوري
يُنصح بفحص بيانات المستخدمين بشكل دوري باستخدام صفحة Data Recovery.

## Firebase Security Rules

تأكد من أن Firebase Security Rules تسمح بقراءة وكتابة البيانات بشكل صحيح:

```javascript
// للمستخدم نفسه
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// للأدمن
match /users/{userId} {
  allow read, write: if request.auth != null &&
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## الاختبار

بعد تطبيق الإصلاحات:

1. سجل الدخول كمستخدم عادي
2. راقب console للتأكد من ظهور logging المُحسّن
3. تحقق من أن جميع البيانات موجودة
4. سجل الخروج ثم الدخول مرة أخرى
5. تأكد من عدم فقدان أي بيانات

## الدعم

إذا واجهت أي مشاكل:
1. افتح console وابحث عن أي أخطاء
2. استخدم صفحة Data Recovery لفحص المستخدمين
3. راجع logging المفصل في AuthContext

## الملفات المُضافة/المُعدّلة

### ملفات جديدة:
- `src/utils/updateLastActive.ts` - وظيفة utility لتحديث last_active_at
- `src/utils/recoverUserData.ts` - أدوات استعادة البيانات
- `src/pages/admin/DataRecovery.tsx` - صفحة واجهة المستخدم
- `DATA_RECOVERY_GUIDE.md` - هذا الملف

### ملفات مُعدّلة:
- `src/contexts/AuthContext.tsx` - إصلاح login و onAuthStateChanged
- `src/App.tsx` - إضافة route للصفحة الجديدة
- `src/pages/admin/AdminDashboard.tsx` - إضافة رابط لصفحة Data Recovery

## ملاحظات مهمة

1. **جميع الإصلاحات غير متدخلة (non-breaking)** - لن تؤثر على المستخدمين الحاليين
2. **الأداء محسّن** - جميع العمليات تستخدم أفضل الممارسات
3. **الأمان مُحافظ عليه** - جميع العمليات تتطلب صلاحيات admin
4. **Logging شامل** - سهولة تتبع أي مشاكل مستقبلية

## خطوات المتابعة الموصى بها

1. ✅ فحص المستخدم المتأثر حالياً باستخدام Data Recovery
2. ✅ التأكد من استعادة جميع البيانات
3. ✅ مراقبة console logs للأسبوع القادم
4. ✅ إجراء فحص دوري شهري للمستخدمين

---

**تاريخ الإنشاء:** 2025-11-22
**النسخة:** 1.0
**الحالة:** مُطبّق ✅
