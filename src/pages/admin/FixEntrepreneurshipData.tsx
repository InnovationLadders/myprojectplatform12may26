import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, AlertTriangle, CheckCircle, RefreshCw, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface DiagnosticResult {
  totalSubmissions: number;
  submissionsWithMissingSchoolId: number;
  submissionsWithValidSchoolId: number;
  submissionsWithMissingTeacherId: number;
  submissionsWithMissingNames: number;
  fixedSubmissions: number;
  errors: string[];
  details: any[];
}

const FixEntrepreneurshipData: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [fixing, setFixing] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    setDiagnosticResult(null);

    try {
      console.log('🔍 Starting diagnostic for entrepreneurship submissions...');

      const submissionsSnapshot = await getDocs(collection(db, 'entrepreneurship_submissions'));
      const totalSubmissions = submissionsSnapshot.size;

      console.log(`📊 Total submissions found: ${totalSubmissions}`);

      const details: any[] = [];
      let submissionsWithMissingSchoolId = 0;
      let submissionsWithValidSchoolId = 0;
      let submissionsWithMissingTeacherId = 0;
      let submissionsWithMissingNames = 0;

      for (const submissionDoc of submissionsSnapshot.docs) {
        const submission = submissionDoc.data();
        const submissionId = submissionDoc.id;

        console.log(`\n📄 Checking submission: ${submissionId}`);
        console.log(`   Project: ${submission.project_title}`);
        console.log(`   School ID: ${submission.school_id || 'MISSING'}`);
        console.log(`   School Name: ${submission.school_name || 'MISSING'}`);
        console.log(`   Teacher ID: ${submission.teacher_id || 'MISSING'}`);
        console.log(`   Teacher Name: ${submission.teacher_name || 'MISSING'}`);
        console.log(`   Project ID: ${submission.project_id}`);

        // Check for missing data
        const hasSchoolId = submission.school_id && submission.school_id !== '';
        const hasSchoolName = submission.school_name && submission.school_name !== '';
        const hasTeacherId = submission.teacher_id && submission.teacher_id !== '';
        const hasTeacherName = submission.teacher_name && submission.teacher_name !== '';

        if (!hasSchoolId) submissionsWithMissingSchoolId++;
        if (!hasTeacherId) submissionsWithMissingTeacherId++;
        if (!hasSchoolName || !hasTeacherName) submissionsWithMissingNames++;

        // If any data is missing, try to fix it
        if (!hasSchoolId || !hasSchoolName || !hasTeacherId || !hasTeacherName) {
          // Try to fetch the project to get the correct data
          try {
            const projectDoc = await getDoc(doc(db, 'projects', submission.project_id));

            if (projectDoc.exists()) {
              const projectData = projectDoc.data();
              console.log(`   ✅ Found project data`);
              console.log(`   Project school_id: ${projectData.school_id || 'MISSING'}`);
              console.log(`   Project teacher_id: ${projectData.teacher_id || 'MISSING'}`);

              details.push({
                submissionId,
                projectId: submission.project_id,
                projectTitle: submission.project_title,
                currentSchoolId: submission.school_id || 'MISSING',
                currentSchoolName: submission.school_name || 'MISSING',
                currentTeacherId: submission.teacher_id || 'MISSING',
                currentTeacherName: submission.teacher_name || 'MISSING',
                projectSchoolId: projectData.school_id || 'MISSING',
                projectTeacherId: projectData.teacher_id || 'MISSING',
                status: submission.status,
                canFix: !!projectData.school_id || !!projectData.teacher_id,
                missingFields: [
                  !hasSchoolId && 'school_id',
                  !hasSchoolName && 'school_name',
                  !hasTeacherId && 'teacher_id',
                  !hasTeacherName && 'teacher_name'
                ].filter(Boolean)
              });
            } else {
              console.warn(`   ⚠️ Project not found: ${submission.project_id}`);
              details.push({
                submissionId,
                projectId: submission.project_id,
                projectTitle: submission.project_title,
                currentSchoolId: submission.school_id || 'MISSING',
                currentSchoolName: submission.school_name || 'MISSING',
                currentTeacherId: submission.teacher_id || 'MISSING',
                currentTeacherName: submission.teacher_name || 'MISSING',
                projectSchoolId: 'PROJECT_NOT_FOUND',
                projectTeacherId: 'PROJECT_NOT_FOUND',
                status: submission.status,
                canFix: false
              });
            }
          } catch (error) {
            console.error(`   ❌ Error fetching project: ${error}`);
            details.push({
              submissionId,
              projectId: submission.project_id,
              projectTitle: submission.project_title,
              currentSchoolId: submission.school_id || 'MISSING',
              currentSchoolName: submission.school_name || 'MISSING',
              currentTeacherId: submission.teacher_id || 'MISSING',
              currentTeacherName: submission.teacher_name || 'MISSING',
              projectSchoolId: 'ERROR_FETCHING',
              projectTeacherId: 'ERROR_FETCHING',
              status: submission.status,
              canFix: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        } else {
          submissionsWithValidSchoolId++;
          console.log(`   ✅ All data is valid`);
        }
      }

      const result: DiagnosticResult = {
        totalSubmissions,
        submissionsWithMissingSchoolId,
        submissionsWithValidSchoolId,
        submissionsWithMissingTeacherId,
        submissionsWithMissingNames,
        fixedSubmissions: 0,
        errors: [],
        details
      };

      console.log('\n📊 Diagnostic Results:');
      console.log(`   Total: ${result.totalSubmissions}`);
      console.log(`   With complete data: ${result.submissionsWithValidSchoolId}`);
      console.log(`   With missing school_id: ${result.submissionsWithMissingSchoolId}`);
      console.log(`   With missing teacher_id: ${result.submissionsWithMissingTeacherId}`);
      console.log(`   With missing names: ${result.submissionsWithMissingNames}`);
      console.log(`   Can be fixed: ${details.filter(d => d.canFix).length}`);

      setDiagnosticResult(result);
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      alert('فشل تشخيص البيانات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  const fixData = async () => {
    if (!diagnosticResult || diagnosticResult.submissionsWithMissingSchoolId === 0) {
      alert('لا توجد بيانات تحتاج إلى إصلاح');
      return;
    }

    const fixableSubmissions = diagnosticResult.details.filter(d => d.canFix);

    if (fixableSubmissions.length === 0) {
      alert('لا توجد مشاريع يمكن إصلاحها تلقائياً');
      return;
    }

    const confirmFix = window.confirm(
      `هل أنت متأكد من رغبتك في إصلاح ${fixableSubmissions.length} مشروع؟\n\n` +
      'سيتم تحديث school_id في المشاريع المقدمة لريادة الأعمال من بيانات المشاريع الأصلية.'
    );

    if (!confirmFix) return;

    setFixing(true);

    try {
      console.log(`🔧 Starting to fix ${fixableSubmissions.length} submissions...`);

      let fixedCount = 0;
      const errors: string[] = [];

      for (const detail of fixableSubmissions) {
        try {
          console.log(`\n🔧 Fixing submission: ${detail.submissionId}`);
          console.log(`   Project: ${detail.projectTitle}`);
          console.log(`   Current school_id: ${detail.currentSchoolId}`);
          console.log(`   New school_id: ${detail.projectSchoolId}`);

          // Fetch the project to get school_name as well
          const projectDoc = await getDoc(doc(db, 'projects', detail.projectId));
          if (!projectDoc.exists()) {
            throw new Error('Project not found');
          }

          const projectData = projectDoc.data();

          // Prepare update data
          const updateData: any = {
            fixed_at: new Date(),
            fixed_note: 'Auto-fixed by admin tool - Complete data restoration'
          };

          // Fetch school name if school_id exists
          if (projectData.school_id) {
            try {
              const schoolDoc = await getDoc(doc(db, 'users', projectData.school_id));
              if (schoolDoc.exists() && schoolDoc.data().role === 'school') {
                updateData.school_id = projectData.school_id;
                updateData.school_name = schoolDoc.data().name || 'مؤسسة تعليمية غير معروفة';
              }
            } catch (error) {
              console.error(`   ⚠️ Error fetching school name: ${error}`);
            }
          }

          // Fetch teacher name if teacher_id exists
          if (projectData.teacher_id) {
            try {
              const teacherDoc = await getDoc(doc(db, 'users', projectData.teacher_id));
              if (teacherDoc.exists() && teacherDoc.data().role === 'teacher') {
                updateData.teacher_id = projectData.teacher_id;
                updateData.teacher_name = teacherDoc.data().name || 'معلم غير معروف';
              }
            } catch (error) {
              console.error(`   ⚠️ Error fetching teacher name: ${error}`);
            }
          }

          // Update the submission with all available data
          await updateDoc(doc(db, 'entrepreneurship_submissions', detail.submissionId), updateData);

          console.log(`   ✅ Successfully fixed submission with:`, Object.keys(updateData));

          console.log(`   ✅ Successfully fixed submission`);
          fixedCount++;
        } catch (error) {
          const errorMsg = `Failed to fix ${detail.projectTitle}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`   ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      console.log(`\n✅ Fix completed: ${fixedCount}/${fixableSubmissions.length} submissions fixed`);

      if (errors.length > 0) {
        console.error('❌ Errors during fix:', errors);
      }

      // Update diagnostic result
      setDiagnosticResult(prev => prev ? {
        ...prev,
        fixedSubmissions: fixedCount,
        errors
      } : null);

      alert(`تم إصلاح ${fixedCount} من ${fixableSubmissions.length} مشروع بنجاح!`);

      // Re-run diagnostic to see updated results
      await runDiagnostic();
    } catch (error) {
      console.error('❌ Fix failed:', error);
      alert('فشل إصلاح البيانات: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <h1 className="text-3xl font-bold">إصلاح بيانات ريادة الأعمال</h1>
            <p className="text-white/90">أداة تشخيص وإصلاح مشاكل school_id في مشاريع ريادة الأعمال</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={runDiagnostic}
            disabled={loading || fixing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                جاري التشخيص...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                تشخيص البيانات
              </>
            )}
          </button>

          {diagnosticResult && diagnosticResult.submissionsWithMissingSchoolId > 0 && (
            <button
              onClick={fixData}
              disabled={loading || fixing}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {fixing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  جاري الإصلاح...
                </>
              ) : (
                <>
                  <Wrench className="w-5 h-5" />
                  إصلاح البيانات
                </>
              )}
            </button>
          )}
        </div>

        {/* Warning Message */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">تحذير: أداة متقدمة</p>
              <p>هذه الأداة تقوم بتعديل البيانات في قاعدة البيانات مباشرة. يرجى استخدامها بحذر.</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Diagnostic Results */}
      {diagnosticResult && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="text-sm text-gray-600 mb-1">إجمالي المشاريع</div>
              <div className="text-3xl font-bold text-gray-900">{diagnosticResult.totalSubmissions}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="text-sm text-gray-600 mb-1">بيانات كاملة</div>
              <div className="text-3xl font-bold text-green-600">{diagnosticResult.submissionsWithValidSchoolId}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="text-sm text-gray-600 mb-1">معرفات مؤسسات فارغة</div>
              <div className="text-3xl font-bold text-red-600">{diagnosticResult.submissionsWithMissingSchoolId}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="text-sm text-gray-600 mb-1">معرفات معلمين فارغة</div>
              <div className="text-3xl font-bold text-orange-600">{diagnosticResult.submissionsWithMissingTeacherId}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="text-sm text-gray-600 mb-1">أسماء فارغة</div>
              <div className="text-3xl font-bold text-yellow-600">{diagnosticResult.submissionsWithMissingNames}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="text-sm text-gray-600 mb-1">يمكن إصلاحها</div>
              <div className="text-3xl font-bold text-purple-600">{diagnosticResult.details.filter(d => d.canFix).length}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-xl shadow-md p-6"
            >
              <div className="text-sm text-gray-600 mb-1">تم إصلاحها</div>
              <div className="text-3xl font-bold text-blue-600">{diagnosticResult.fixedSubmissions}</div>
            </motion.div>
          </div>

          {/* Details Table */}
          {diagnosticResult.details.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">تفاصيل المشاريع التي تحتاج إصلاح</h2>
                <p className="text-sm text-gray-600 mt-1">
                  عرض جميع المشاريع التي تحتوي على بيانات ناقصة أو فارغة
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">عنوان المشروع</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحقول الناقصة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المؤسسة الحالية</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المعلم الحالي</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">يمكن الإصلاح</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {diagnosticResult.details.map((detail, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {detail.projectTitle}
                          <div className="text-xs text-gray-500 mt-1">ID: {detail.projectId.substring(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {detail.missingFields && detail.missingFields.map((field: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                {field}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="space-y-1">
                            <div className={`${detail.currentSchoolName === 'MISSING' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {detail.currentSchoolName}
                            </div>
                            {detail.currentSchoolId && detail.currentSchoolId !== 'MISSING' && (
                              <div className="text-xs text-gray-500">ID: {detail.currentSchoolId.substring(0, 8)}...</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="space-y-1">
                            <div className={`${detail.currentTeacherName === 'MISSING' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {detail.currentTeacherName}
                            </div>
                            {detail.currentTeacherId && detail.currentTeacherId !== 'MISSING' && (
                              <div className="text-xs text-gray-500">ID: {detail.currentTeacherId.substring(0, 8)}...</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            detail.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            detail.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {detail.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {detail.canFix ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Errors */}
          {diagnosticResult.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-red-50 border border-red-200 rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">أخطاء أثناء الإصلاح</h3>
              </div>
              <ul className="list-disc list-inside space-y-2 text-sm text-red-800">
                {diagnosticResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default FixEntrepreneurshipData;
