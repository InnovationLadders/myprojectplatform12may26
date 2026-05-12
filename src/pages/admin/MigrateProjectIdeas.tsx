import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Play, CheckCircle, AlertTriangle, RefreshCw, FileSearch } from 'lucide-react';
import { migrateProjectIdeasToMultiLang, checkMigrationStatus } from '../../utils/migrateProjectIdeasToMultiLang';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const MigrateProjectIdeas: React.FC = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);

  // Only admins can access this page
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleRunMigration = async () => {
    if (!confirm('هل أنت متأكد من تشغيل سكريبت الترحيل؟\n\nسيتم تحويل جميع أفكار المشاريع إلى صيغة متعددة اللغات.')) {
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const migrationResult = await migrateProjectIdeasToMultiLang();
      setResult(migrationResult);

      // Refresh status after migration
      const newStatus = await checkMigrationStatus();
      setStatus(newStatus);
    } catch (error) {
      console.error('Migration error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setStatus(null);

    try {
      const statusResult = await checkMigrationStatus();
      setStatus(statusResult);
    } catch (error) {
      console.error('Status check error:', error);
      setStatus({
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع'
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">
            ترحيل أفكار المشاريع إلى نظام متعدد اللغات
          </h1>
        </div>
        <p className="text-gray-600">
          تحويل البيانات الحالية لدعم اللغتين العربية والإنجليزية
        </p>
      </motion.div>

      {/* Warning Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-yellow-800 mb-2">تحذير هام</h3>
            <ul className="text-yellow-700 space-y-1 text-sm">
              <li>• يجب تشغيل هذا السكريبت مرة واحدة فقط</li>
              <li>• سيتم تحويل جميع البيانات الحالية إلى صيغة متعددة اللغات</li>
              <li>• المحتوى العربي الحالي سيوضع في حقل "ar"</li>
              <li>• سيتم إنشاء حقول فارغة للغة الإنجليزية "en"</li>
              <li>• تأكد من عمل نسخة احتياطية قبل التشغيل</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleCheckStatus}
          disabled={isChecking || isRunning}
          className="flex items-center justify-center gap-3 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isChecking ? (
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          ) : (
            <FileSearch className="w-6 h-6 text-blue-600" />
          )}
          <div className="text-right">
            <h3 className="font-bold text-blue-800">فحص الحالة</h3>
            <p className="text-sm text-blue-600">التحقق من حالة الترحيل</p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleRunMigration}
          disabled={isRunning || isChecking}
          className="flex items-center justify-center gap-3 p-6 bg-green-50 border-2 border-green-200 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <RefreshCw className="w-6 h-6 text-green-600 animate-spin" />
          ) : (
            <Play className="w-6 h-6 text-green-600" />
          )}
          <div className="text-right">
            <h3 className="font-bold text-green-800">تشغيل الترحيل</h3>
            <p className="text-sm text-green-600">بدء عملية تحويل البيانات</p>
          </div>
        </motion.button>
      </div>

      {/* Status Display */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-blue-600" />
            حالة الترحيل
          </h3>

          {status.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{status.error}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">إجمالي الأفكار</p>
                <p className="text-3xl font-bold text-gray-800">{status.total}</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1">تم الترحيل</p>
                <p className="text-3xl font-bold text-green-700">
                  {status.migrated}
                  <span className="text-sm font-normal mr-1">
                    ({status.total > 0 ? ((status.migrated / status.total) * 100).toFixed(1) : 0}%)
                  </span>
                </p>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-600 mb-1">لم يتم الترحيل</p>
                <p className="text-3xl font-bold text-yellow-700">
                  {status.notMigrated}
                  <span className="text-sm font-normal mr-1">
                    ({status.total > 0 ? ((status.notMigrated / status.total) * 100).toFixed(1) : 0}%)
                  </span>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Migration Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
            نتيجة الترحيل
          </h3>

          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 font-medium">حدث خطأ:</p>
              <p className="text-red-600 mt-2">{result.error}</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 mb-1">الإجمالي</p>
                  <p className="text-3xl font-bold text-blue-800">{result.total}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 mb-1">تم الترحيل</p>
                  <p className="text-3xl font-bold text-green-700">{result.migrated}</p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 mb-1">تم تجاهله</p>
                  <p className="text-3xl font-bold text-yellow-700">{result.skipped}</p>
                </div>

                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-600 mb-1">أخطاء</p>
                  <p className="text-3xl font-bold text-red-700">{result.errors}</p>
                </div>
              </div>

              {result.errorDetails && result.errorDetails.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-medium mb-3">تفاصيل الأخطاء:</p>
                  <ul className="space-y-2">
                    {result.errorDetails.map((detail: any, index: number) => (
                      <li key={index} className="text-sm text-red-600">
                        <span className="font-medium">{detail.id}:</span> {detail.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-green-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    تم الترحيل بنجاح!
                  </p>
                  <p className="text-green-600 text-sm mt-2">
                    يمكنك الآن البدء في إضافة الترجمات الإنجليزية لأفكار المشاريع
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8"
      >
        <h3 className="font-bold text-blue-800 mb-3">ماذا بعد الترحيل؟</h3>
        <ul className="text-blue-700 space-y-2 text-sm">
          <li>1. التحقق من نجاح عملية الترحيل باستخدام زر "فحص الحالة"</li>
          <li>2. الانتقال إلى صفحة إدارة أفكار المشاريع</li>
          <li>3. إضافة الترجمات الإنجليزية للأفكار المهمة</li>
          <li>4. اختبار تبديل اللغة في واجهة المستخدم</li>
          <li>5. يمكن للمستخدمين الآن مشاهدة المحتوى بلغتهم المفضلة</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default MigrateProjectIdeas;
