import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Play, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Circle as XCircle, RefreshCw, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  diagnoseSchoolIdMismatch,
  autoFixProjectSchoolIds,
  fixProjectSchoolId,
  fixProjectTeacherId,
  ProjectDiagnosis,
  DiagnosisResult
} from '../../utils/diagnoseSchoolIdMismatch';

const AdminFixTools: React.FC = () => {
  const { t } = useTranslation();
  const [isRunningDiagnosis, setIsRunningDiagnosis] = useState(false);
  const [isRunningAutoFix, setIsRunningAutoFix] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [autoFixResult, setAutoFixResult] = useState<{ fixed: number; failed: number; errors: string[] } | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectDiagnosis | null>(null);

  const runDiagnosis = async () => {
    setIsRunningDiagnosis(true);
    setDiagnosisResult(null);
    setAutoFixResult(null);
    try {
      const result = await diagnoseSchoolIdMismatch();
      setDiagnosisResult(result);
    } catch (error) {
      console.error('Error running diagnosis:', error);
      alert('حدث خطأ أثناء تشخيص المشاكل');
    } finally {
      setIsRunningDiagnosis(false);
    }
  };

  const runAutoFix = async () => {
    if (!window.confirm('هل أنت متأكد من تشغيل الإصلاح التلقائي؟ سيتم تحديث school_id للمشاريع تلقائياً.')) {
      return;
    }

    setIsRunningAutoFix(true);
    setAutoFixResult(null);
    try {
      const result = await autoFixProjectSchoolIds();
      setAutoFixResult(result);
      await runDiagnosis();
    } catch (error) {
      console.error('Error running auto fix:', error);
      alert('حدث خطأ أثناء الإصلاح التلقائي');
    } finally {
      setIsRunningAutoFix(false);
    }
  };

  const handleManualFix = async (projectId: string, schoolId: string) => {
    if (!window.confirm('هل أنت متأكد من تحديث school_id لهذا المشروع؟')) {
      return;
    }

    try {
      await fixProjectSchoolId(projectId, schoolId);
      alert('تم تحديث school_id بنجاح');
      await runDiagnosis();
    } catch (error) {
      console.error('Error fixing project:', error);
      alert('حدث خطأ أثناء التحديث');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'none':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'none':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'critical':
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">أدوات الإصلاح والصيانة</h1>
            <p className="text-white/90">تشخيص وإصلاح مشاكل البيانات في النظام</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">تشخيص مشاكل school_id</h2>
          </div>
          <p className="text-gray-600 mb-4">
            تحليل جميع المشاريع للتحقق من صحة معرفات المؤسسات التعليمية والمعلمين
          </p>
          <button
            onClick={runDiagnosis}
            disabled={isRunningDiagnosis}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRunningDiagnosis ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>جاري التشخيص...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>تشغيل التشخيص</span>
              </>
            )}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <RefreshCw className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">الإصلاح التلقائي</h2>
          </div>
          <p className="text-gray-600 mb-4">
            إصلاح تلقائي لمشاكل school_id بناءً على معلومات المعلم المسؤول
          </p>
          <button
            onClick={runAutoFix}
            disabled={isRunningAutoFix || !diagnosisResult}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isRunningAutoFix ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>جاري الإصلاح...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                <span>تشغيل الإصلاح التلقائي</span>
              </>
            )}
          </button>
          {!diagnosisResult && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              قم بتشغيل التشخيص أولاً
            </p>
          )}
        </motion.div>
      </div>

      {autoFixResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">نتائج الإصلاح التلقائي</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700 font-medium">تم الإصلاح</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{autoFixResult.fixed}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700 font-medium">فشل الإصلاح</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{autoFixResult.failed}</div>
            </div>
          </div>
          {autoFixResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-bold text-red-900 mb-2">الأخطاء:</h4>
              <ul className="space-y-1 text-sm text-red-800">
                {autoFixResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {diagnosisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">نتائج التشخيص</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">إجمالي المشاريع</div>
                <div className="text-2xl font-bold text-gray-900">{diagnosisResult.totalProjects}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">سليمة</div>
                <div className="text-2xl font-bold text-green-600">{diagnosisResult.healthyProjects}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm text-yellow-700 mb-1">تحذيرات</div>
                <div className="text-2xl font-bold text-yellow-600">{diagnosisResult.projectsWithWarnings}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm text-red-700 mb-1">حرجة</div>
                <div className="text-2xl font-bold text-red-600">{diagnosisResult.projectsWithCriticalIssues}</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المشروع</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المعلم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المؤسسة التعليمية</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المشاكل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {diagnosisResult.projects
                  .sort((a, b) => {
                    const severityOrder = { critical: 0, warning: 1, none: 2 };
                    return severityOrder[a.severity] - severityOrder[b.severity];
                  })
                  .map((project) => (
                    <tr key={project.projectId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(project.severity)}`}>
                          {getSeverityIcon(project.severity)}
                          <span>
                            {project.severity === 'none' && 'سليم'}
                            {project.severity === 'warning' && 'تحذير'}
                            {project.severity === 'critical' && 'حرج'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{project.projectTitle}</div>
                        <div className="text-xs text-gray-500">{project.projectId.substring(0, 12)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {project.teacherExists ? (
                            <>
                              <div>{project.teacherName}</div>
                              <div className="text-xs text-gray-500">{project.teacherSchoolId?.substring(0, 12)}...</div>
                            </>
                          ) : (
                            <span className="text-red-600">غير موجود</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {project.schoolExists ? (
                            <>
                              <div>{project.schoolName}</div>
                              <div className="text-xs text-gray-500">{project.projectSchoolId?.substring(0, 12)}...</div>
                            </>
                          ) : (
                            <span className="text-red-600">غير موجود</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {project.issues.length > 0 ? (
                            <ul className="space-y-1">
                              {project.issues.map((issue, index) => (
                                <li key={index} className="text-xs">• {issue}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-green-600">لا توجد مشاكل</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.severity === 'critical' && project.teacherExists && project.teacherSchoolId && (
                          <button
                            onClick={() => handleManualFix(project.projectId, project.teacherSchoolId)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            إصلاح يدوي
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminFixTools;
