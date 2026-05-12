import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, RefreshCw, Eye, FileCheck } from 'lucide-react';
import { migrateGalleryProjectsToPublic, verifyGalleryProjectsMigration } from '../../utils/migrateGalleryProjectsToPublic';

export const MigrateGalleryProjects: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    if (!confirm('هل أنت متأكد من تشغيل عملية الترحيل؟ ستقوم هذه العملية بإضافة حقل is_public لجميع مشاريع المعرض الموجودة.')) {
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const migrationResult = await migrateGalleryProjectsToPublic();
      setResult(migrationResult);
    } catch (err) {
      console.error('Error running migration:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsRunning(false);
    }
  };

  const runVerification = async () => {
    setIsVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      const verifyResult = await verifyGalleryProjectsMigration();
      setVerificationResult(verifyResult);
    } catch (err) {
      console.error('Error verifying migration:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في التحقق');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">ترحيل مشاريع المعرض</h1>
            <p className="opacity-90">إضافة حقل is_public لجميع مشاريع المعرض الموجودة</p>
          </div>
        </div>

        <div className="bg-white bg-opacity-10 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">تحذير مهم:</p>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                <li>هذه العملية تقوم بإضافة حقل is_public لجميع مشاريع المعرض الموجودة</li>
                <li>المشاريع الموجودة حالياً ستكون عامة (is_public = true) للتوافق مع السلوك السابق</li>
                <li>المشاريع الجديدة ستكون خاصة بشكل افتراضي (is_public = false)</li>
                <li>يُنصح بتشغيل هذه العملية مرة واحدة فقط</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Migration Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">إجراءات الترحيل</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Run Migration */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">تشغيل الترحيل</h3>
                <p className="text-sm text-gray-600">إضافة حقل is_public للمشاريع</p>
              </div>
            </div>
            <button
              onClick={runMigration}
              disabled={isRunning}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري التشغيل...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  تشغيل الترحيل
                </>
              )}
            </button>
          </div>

          {/* Verify Migration */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">التحقق من النتائج</h3>
                <p className="text-sm text-gray-600">التأكد من نجاح الترحيل</p>
              </div>
            </div>
            <button
              onClick={runVerification}
              disabled={isVerifying}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري التحقق...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  التحقق من النتائج
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-1">حدث خطأ</h3>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Migration Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">نتائج الترحيل</h2>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-green-800 font-medium">{result.message}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">المشاريع المحدثة</p>
              <p className="text-2xl font-bold text-gray-800">{result.updated}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">إجمالي المشاريع</p>
              <p className="text-2xl font-bold text-gray-800">{result.total}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Verification Result */}
      {verificationResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <FileCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">نتائج التحقق</h2>
          </div>

          <div className={`border rounded-xl p-4 mb-4 ${
            verificationResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`font-medium ${
              verificationResult.success ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {verificationResult.success
                ? '✓ جميع المشاريع تحتوي على حقل is_public'
                : '⚠ بعض المشاريع تحتاج إلى ترحيل'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-1">إجمالي المشاريع</p>
              <p className="text-2xl font-bold text-gray-800">{verificationResult.total}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-600 mb-1">مشاريع عامة</p>
              <p className="text-2xl font-bold text-green-800">{verificationResult.publicProjects}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <p className="text-sm text-orange-600 mb-1">مشاريع خاصة</p>
              <p className="text-2xl font-bold text-orange-800">{verificationResult.privateProjects}</p>
            </div>
          </div>

          {verificationResult.withoutIsPublic > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm">
                يوجد {verificationResult.withoutIsPublic} مشروع بدون حقل is_public. يُنصح بتشغيل عملية الترحيل.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">معلومات حول نظام الرؤية الجديد</h2>

        <div className="space-y-4 text-gray-700">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1">المشاريع الجديدة</h3>
              <p className="text-sm text-gray-600">
                عند إضافة مشروع جديد، سيكون خاصاً بشكل افتراضي (is_public = false). يمكن للمؤسسة التعليمية اختيار عرضه للعامة.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1">المشاريع الموجودة</h3>
              <p className="text-sm text-gray-600">
                المشاريع الموجودة حالياً ستصبح عامة (is_public = true) بعد الترحيل، للحفاظ على السلوك السابق.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium mb-1">صلاحيات العرض</h3>
              <p className="text-sm text-gray-600">
                المؤسسات التعليمية ترى جميع مشاريعها (العامة والخاصة). الزوار يرون فقط المشاريع العامة.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
