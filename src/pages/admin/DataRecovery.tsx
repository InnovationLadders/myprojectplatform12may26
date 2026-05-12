import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react';
import { scanUsersForIssues, recoverUserData } from '../../utils/recoverUserData';

interface UserIssue {
  uid: string;
  email: string;
  name: string;
  issue: string;
  recovered: boolean;
}

interface RecoveryReport {
  totalUsers: number;
  usersWithMissingRole: number;
  usersRecovered: number;
  usersFailed: number;
  details: UserIssue[];
}

const DataRecovery: React.FC = () => {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<RecoveryReport | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [recoveryForm, setRecoveryForm] = useState({
    role: 'student' as 'student' | 'teacher' | 'school' | 'admin' | 'consultant',
    email: '',
    name: '',
    status: 'active'
  });
  const [recovering, setRecovering] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    try {
      const scanReport = await scanUsersForIssues();
      setReport(scanReport);
    } catch (error) {
      console.error('Scan failed:', error);
      alert('فشل فحص المستخدمين. يرجى المحاولة مرة أخرى.');
    } finally {
      setScanning(false);
    }
  };

  const handleRecoverUser = async (uid: string) => {
    if (!confirm('هل أنت متأكد من استعادة بيانات هذا المستخدم؟')) {
      return;
    }

    setRecovering(true);
    try {
      const success = await recoverUserData(uid, recoveryForm);

      if (success) {
        alert('✅ تم استعادة بيانات المستخدم بنجاح');
        // Refresh the scan
        handleScan();
        setSelectedUser(null);
      } else {
        alert('❌ فشل في استعادة بيانات المستخدم');
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      alert('حدث خطأ أثناء استعادة البيانات');
    } finally {
      setRecovering(false);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const csv = [
      ['UID', 'Email', 'Name', 'Issue', 'Recovered'],
      ...report.details.map(d => [
        d.uid,
        d.email,
        d.name,
        d.issue,
        d.recovered ? 'Yes' : 'No'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-recovery-report-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            🔧 استعادة بيانات المستخدمين
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'جاري الفحص...' : 'فحص المستخدمين'}
            </button>
            {report && (
              <button
                onClick={exportReport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-5 h-5" />
                تصدير التقرير
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 mb-1">إجمالي المستخدمين</div>
              <div className="text-2xl font-bold text-blue-700">{report.totalUsers}</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-600 mb-1">مستخدمين بمشاكل</div>
              <div className="text-2xl font-bold text-yellow-700">{report.usersWithMissingRole}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-600 mb-1">تم استعادتهم</div>
              <div className="text-2xl font-bold text-green-700">{report.usersRecovered}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-600 mb-1">فشل الاستعادة</div>
              <div className="text-2xl font-bold text-red-700">{report.usersFailed}</div>
            </div>
          </div>
        )}

        {/* Issues List */}
        {report && report.details.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">
                  تم العثور على {report.details.length} مستخدم بحاجة إلى مراجعة
                </h3>
                <p className="text-sm text-yellow-700">
                  يرجى مراجعة المستخدمين التاليين وتحديث بياناتهم
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {report.details.map((user) => (
                <div
                  key={user.uid}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {user.recovered ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-semibold text-gray-800">
                          {user.name}
                        </span>
                        {user.recovered && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            تم الاستعادة
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>البريد:</strong> {user.email}</div>
                        <div><strong>UID:</strong> <code className="bg-gray-100 px-2 py-1 rounded text-xs">{user.uid}</code></div>
                        <div><strong>المشكلة:</strong> <span className="text-red-600">{user.issue}</span></div>
                      </div>
                    </div>

                    {!user.recovered && (
                      <div>
                        {selectedUser === user.uid ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-64">
                            <h4 className="font-semibold mb-3">تحديث البيانات</h4>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-sm font-medium mb-1">الدور</label>
                                <select
                                  value={recoveryForm.role}
                                  onChange={(e) => setRecoveryForm({ ...recoveryForm, role: e.target.value as any })}
                                  className="w-full px-3 py-2 border rounded-lg"
                                >
                                  <option value="student">طالب</option>
                                  <option value="teacher">معلم</option>
                                  <option value="school">المؤسسة التعليمية</option>
                                  <option value="admin">مدير</option>
                                  <option value="consultant">مستشار</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">الاسم</label>
                                <input
                                  type="text"
                                  value={recoveryForm.name}
                                  onChange={(e) => setRecoveryForm({ ...recoveryForm, name: e.target.value })}
                                  placeholder={user.name}
                                  className="w-full px-3 py-2 border rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">البريد</label>
                                <input
                                  type="email"
                                  value={recoveryForm.email}
                                  onChange={(e) => setRecoveryForm({ ...recoveryForm, email: e.target.value })}
                                  placeholder={user.email}
                                  className="w-full px-3 py-2 border rounded-lg"
                                />
                              </div>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleRecoverUser(user.uid)}
                                  disabled={recovering}
                                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm"
                                >
                                  {recovering ? '...' : 'حفظ'}
                                </button>
                                <button
                                  onClick={() => setSelectedUser(null)}
                                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedUser(user.uid);
                              setRecoveryForm({
                                role: 'student',
                                email: user.email !== 'N/A' && user.email !== 'MISSING' ? user.email : '',
                                name: user.name !== 'N/A' && user.name !== 'MISSING' ? user.name : '',
                                status: 'active'
                              });
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            استعادة البيانات
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Issues Found */}
        {report && report.details.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              لا توجد مشاكل!
            </h3>
            <p className="text-green-700">
              جميع المستخدمين لديهم بيانات صحيحة وكاملة
            </p>
          </div>
        )}

        {/* Initial State */}
        {!report && !scanning && (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              ابدأ بفحص المستخدمين
            </h3>
            <p className="text-gray-600 mb-4">
              انقر على زر "فحص المستخدمين" للبحث عن أي مشاكل في بيانات المستخدمين
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataRecovery;
