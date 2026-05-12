import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle, CheckCircle, RefreshCw, Database } from 'lucide-react';
import { fixUserDates } from '../../utils/fixUserDates';

const FixUserDates: React.FC = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFixDates = async () => {
    if (!confirm('هل أنت متأكد من أنك تريد إصلاح تواريخ جميع المستخدمين؟\n\nهذه العملية ستقوم بتحديث السجلات التي لا تحتوي على تواريخ انضمام أو آخر نشاط.')) {
      return;
    }

    setIsFixing(true);
    setError(null);
    setResult(null);

    try {
      const fixResult = await fixUserDates();
      setResult(fixResult);

      if (fixResult.success) {
        console.log('✅ تم إصلاح التواريخ بنجاح');
      } else {
        setError(fixResult.error || 'حدث خطأ غير معروف');
      }
    } catch (err) {
      console.error('❌ خطأ في إصلاح التواريخ:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير معروف');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">إصلاح تواريخ المستخدمين</h1>
            <p className="opacity-90">
              تحديث تواريخ الانضمام وآخر نشاط للمستخدمين الحاليين
            </p>
          </div>
        </div>
      </motion.div>

      {/* Warning Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">تحذير مهم</h3>
            <ul className="space-y-2 text-yellow-800">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>هذه الأداة مصممة لإصلاح السجلات القديمة التي لا تحتوي على تواريخ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>سيتم تعيين تاريخ افتراضي (2024-01-01) للمستخدمين الذين لا يملكون تاريخ انضمام</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>المستخدمون الذين لديهم تواريخ محددة بالفعل لن يتأثروا</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 mt-1">•</span>
                <span>هذه العملية يُفضل تشغيلها مرة واحدة فقط</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-start gap-4 mb-6">
          <Database className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">ماذا ستفعل هذه الأداة؟</h3>
            <div className="space-y-2 text-gray-600">
              <p>1. البحث عن جميع المستخدمين في قاعدة البيانات</p>
              <p>2. فحص كل مستخدم للتحقق من وجود حقول created_at و last_active_at</p>
              <p>3. للمستخدمين الذين يفتقدون هذه الحقول:</p>
              <ul className="mr-6 space-y-1">
                <li>• تعيين created_at إلى 2024-01-01 (تاريخ افتراضي)</li>
                <li>• تعيين last_active_at إلى نفس قيمة created_at</li>
              </ul>
              <p>4. تخطي المستخدمين الذين لديهم التواريخ بالفعل</p>
              <p>5. عرض تقرير مفصل بالنتائج</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-4 border-t border-gray-200">
          <button
            onClick={handleFixDates}
            disabled={isFixing}
            className={`
              px-8 py-4 rounded-xl font-semibold text-white text-lg
              flex items-center gap-3 transition-all duration-200
              ${isFixing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:scale-105'
              }
            `}
          >
            {isFixing ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                جاري الإصلاح...
              </>
            ) : (
              <>
                <Calendar className="w-6 h-6" />
                بدء إصلاح التواريخ
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">حدث خطأ</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success Result */}
      {result && result.success && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border-2 border-green-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-4">تم إصلاح التواريخ بنجاح!</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">{result.fixed}</div>
                  <div className="text-sm text-gray-600">تم إصلاحهم</div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{result.skipped}</div>
                  <div className="text-sm text-gray-600">تم تخطيهم (لديهم تواريخ)</div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-red-200">
                  <div className="text-3xl font-bold text-red-600 mb-1">{result.errors}</div>
                  <div className="text-sm text-gray-600">أخطاء</div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-white rounded-xl border border-green-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">ملاحظة:</span> يمكنك الآن الذهاب إلى صفحة إدارة المستخدمين
                  لرؤية التواريخ المحدثة. المستخدمون الجدد سيحصلون تلقائياً على تواريخ دقيقة.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Additional Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-blue-900 mb-3">معلومات إضافية</h3>
        <div className="space-y-2 text-blue-800 text-sm">
          <p>
            <strong>للمستخدمين الجدد:</strong> سيتم تسجيل تاريخ الانضمام وآخر نشاط تلقائياً عند إنشاء الحساب.
          </p>
          <p>
            <strong>تحديث آخر نشاط:</strong> يتم تحديث حقل آخر نشاط تلقائياً عند كل تسجيل دخول.
          </p>
          <p>
            <strong>للمستخدمين القدامى:</strong> إذا لم يتم العثور على تاريخ في Firebase Auth، سيتم استخدام 2024-01-01 كتاريخ افتراضي.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default FixUserDates;
