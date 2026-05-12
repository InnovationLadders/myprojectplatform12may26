import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Search, Filter, Eye, RefreshCw, AlertTriangle, Building2, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getEntrepreneurshipSubmissions, getEntrepreneurshipSubmissionsBySchoolId, getUserInfoForSubmission, updateSubmissionStatus } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';

interface Submission {
  id: string;
  project_id: string;
  project_title: string;
  teacher_id: string;
  teacher_name: string;
  school_id: string;
  school_name: string;
  submitted_by_user_id: string;
  submitted_by_role: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string | null;
  updated_at: string | null;
  submitter_name?: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();

  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
      {t(`entrepreneurshipSubmissions.statuses.${status}`)}
    </span>
  );
};

const SubmittedByBadge: React.FC<{ role: string; name: string }> = ({ role, name }) => {
  const { t } = useTranslation();

  const colors = {
    teacher: 'bg-blue-100 text-blue-800',
    student: 'bg-purple-100 text-purple-800',
    school: 'bg-indigo-100 text-indigo-800',
    admin: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="flex flex-col gap-1">
      <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {t(`entrepreneurshipSubmissions.submittedByRole.${role}`)}
      </span>
      <span className="text-sm text-gray-600">{name}</span>
    </div>
  );
};

const UpdateStatusModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (status: 'pending' | 'approved' | 'rejected') => void;
  currentStatus: string;
  isUpdating: boolean;
}> = ({ isOpen, onClose, onUpdate, currentStatus, isUpdating }) => {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected'>(currentStatus as any);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t('entrepreneurshipSubmissions.updateStatusTitle')}
        </h2>

        <p className="text-gray-600 mb-6">
          {t('entrepreneurshipSubmissions.updateStatusMessage')}
        </p>

        <div className="space-y-3 mb-6">
          {(['pending', 'approved', 'rejected'] as const).map((status) => (
            <label key={status} className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="status"
                value={status}
                checked={selectedStatus === status}
                onChange={() => setSelectedStatus(status)}
                className="w-5 h-5"
              />
              <StatusBadge status={status} />
            </label>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onUpdate(selectedStatus)}
            disabled={isUpdating || selectedStatus === currentStatus}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isUpdating ? t('entrepreneurshipSubmissions.submitting') : t('entrepreneurshipSubmissions.actions.updateStatus')}
          </button>
        </div>
      </div>
    </div>
  );
};

const EntrepreneurshipSubmissions: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [dataQualityFilter, setDataQualityFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isSchool = user?.role === 'school';

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, statusFilter, schoolFilter, teacherFilter, dataQualityFilter]);

  const loadSubmissions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log('🔍 [Entrepreneurship] Loading submissions for user:', {
        userId: user.id,
        userRole: user.role,
        userName: user.name,
        isAdmin,
        isSchool
      });

      let data: any[] = [];

      if (isAdmin) {
        console.log('👑 [Entrepreneurship] Fetching ALL submissions for admin');
        data = await getEntrepreneurshipSubmissions();
        console.log('✅ [Entrepreneurship] Admin fetched submissions:', data.length);
      } else if (isSchool && user.id) {
        console.log('🏫 [Entrepreneurship] Fetching submissions for school ID:', user.id);
        data = await getEntrepreneurshipSubmissionsBySchoolId(user.id);
        console.log('✅ [Entrepreneurship] School fetched submissions:', data.length);

        // Log detailed information about each submission
        if (data.length > 0) {
          console.log('📊 [Entrepreneurship] Submissions details:', data.map(sub => ({
            id: sub.id,
            project_title: sub.project_title,
            school_id: sub.school_id,
            school_name: sub.school_name,
            status: sub.status
          })));
        } else {
          console.warn('⚠️ [Entrepreneurship] No submissions found for school. Checking query parameters:', {
            schoolId: user.id,
            expectedField: 'school_id'
          });
        }
      }

      const submissionsWithNames = await Promise.all(
        data.map(async (sub) => {
          const submitterInfo = await getUserInfoForSubmission(sub.submitted_by_user_id);
          return {
            ...sub,
            submitter_name: submitterInfo?.name || 'Unknown'
          };
        })
      );

      console.log('✅ [Entrepreneurship] Final submissions count:', submissionsWithNames.length);
      setSubmissions(submissionsWithNames);
    } catch (error) {
      console.error('❌ [Entrepreneurship] Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.project_title.toLowerCase().includes(query) ||
          sub.teacher_name.toLowerCase().includes(query) ||
          sub.school_name.toLowerCase().includes(query) ||
          sub.submitter_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    // School filter
    if (schoolFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.school_id === schoolFilter);
    }

    // Teacher filter
    if (teacherFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.teacher_id === teacherFilter);
    }

    // Data quality filter
    if (dataQualityFilter === 'missing') {
      filtered = filtered.filter((sub) => !sub.school_name || !sub.teacher_name || !sub.school_id || !sub.teacher_id);
    } else if (dataQualityFilter === 'complete') {
      filtered = filtered.filter((sub) => sub.school_name && sub.teacher_name && sub.school_id && sub.teacher_id);
    }

    setFilteredSubmissions(filtered);
  };

  // Get unique schools and teachers for filter dropdowns
  const uniqueSchools = Array.from(new Set(submissions.filter(s => s.school_id && s.school_name).map(s => JSON.stringify({ id: s.school_id, name: s.school_name })))).map(s => JSON.parse(s));
  const uniqueTeachers = Array.from(new Set(submissions.filter(s => s.teacher_id && s.teacher_name).map(s => JSON.stringify({ id: s.teacher_id, name: s.teacher_name })))).map(s => JSON.parse(s));

  const handleUpdateStatus = async (newStatus: 'pending' | 'approved' | 'rejected') => {
    if (!selectedSubmission) return;

    setIsUpdating(true);
    try {
      await updateSubmissionStatus(selectedSubmission.id, newStatus);
      alert(t('entrepreneurshipSubmissions.updateStatusSuccess'));
      setShowUpdateModal(false);
      loadSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('entrepreneurshipSubmissions.updateStatusError'));
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate statistics including missing data
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    missingData: submissions.filter((s) => !s.school_name || !s.teacher_name || !s.school_id || !s.teacher_id).length,
    uniqueSchools: new Set(submissions.filter(s => s.school_id).map(s => s.school_id)).size,
    uniqueTeachers: new Set(submissions.filter(s => s.teacher_id).map(s => s.teacher_id)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Briefcase className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('entrepreneurshipSubmissions.title')}</h1>
            <p className="text-white/90">{t('entrepreneurshipSubmissions.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="text-sm text-gray-600 mb-1">{t('entrepreneurshipSubmissions.stats.totalSubmissions')}</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="text-sm text-gray-600 mb-1">{t('entrepreneurshipSubmissions.stats.underReview')}</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="text-sm text-gray-600 mb-1">{t('entrepreneurshipSubmissions.stats.approved')}</div>
          <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="text-sm text-gray-600 mb-1">{t('entrepreneurshipSubmissions.stats.rejected')}</div>
          <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
        </motion.div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-blue-600" />
            <div className="text-sm text-gray-600">المؤسسات التعليمية</div>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.uniqueSchools}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-green-600" />
            <div className="text-sm text-gray-600">المعلمون المشرفون</div>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.uniqueTeachers}</div>
        </motion.div>

        {stats.missingData > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-red-50 border-2 border-red-200 rounded-xl shadow-md p-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <div className="text-sm text-red-600 font-medium">مشاريع بها بيانات ناقصة</div>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.missingData}</div>
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl shadow-md p-6"
      >
        <div className="space-y-4">
          {/* First row: Search and Refresh */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('entrepreneurshipSubmissions.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={loadSubmissions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.refresh', { defaultValue: 'Refresh' })}
            </button>
          </div>

          {/* Second row: All filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">{t('entrepreneurshipSubmissions.filters.allStatuses')}</option>
                <option value="pending">{t('entrepreneurshipSubmissions.statuses.pending')}</option>
                <option value="approved">{t('entrepreneurshipSubmissions.statuses.approved')}</option>
                <option value="rejected">{t('entrepreneurshipSubmissions.statuses.rejected')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">كل المؤسسات</option>
                {uniqueSchools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <User className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">كل المعلمين</option>
                {uniqueTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <AlertTriangle className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <select
                value={dataQualityFilter}
                onChange={(e) => setDataQualityFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">كل المشاريع</option>
                <option value="complete">بيانات كاملة</option>
                <option value="missing">بيانات ناقصة</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-md overflow-hidden"
      >
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('entrepreneurshipSubmissions.noSubmissions')}
            </h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? t('entrepreneurshipSubmissions.noSubmissionsMatch')
                : t('entrepreneurshipSubmissions.noSubmissionsYet')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('entrepreneurshipSubmissions.table.projectName')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>المؤسسة التعليمية</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-2">
                      <User className="w-4 h-4" />
                      <span>{t('entrepreneurshipSubmissions.table.teacherName')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('entrepreneurshipSubmissions.table.submittedBy')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('entrepreneurshipSubmissions.table.submittedAt')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('entrepreneurshipSubmissions.table.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('entrepreneurshipSubmissions.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => {
                  const hasSchoolData = submission.school_name && submission.school_id;
                  const hasTeacherData = submission.teacher_name && submission.teacher_id;

                  return (
                    <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{submission.project_title}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: {submission.project_id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          {!hasSchoolData && (
                            <div className="group relative">
                              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-xs rounded py-1 px-2 right-0 top-6 whitespace-nowrap">
                                بيانات المؤسسة ناقصة
                              </div>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">
                              {submission.school_name || (
                                <span className="text-red-600 font-medium">غير محدد</span>
                              )}
                            </div>
                            {submission.school_id && (
                              <div className="text-xs text-gray-400 mt-1">ID: {submission.school_id.substring(0, 8)}...</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2">
                          {!hasTeacherData && (
                            <div className="group relative">
                              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-xs rounded py-1 px-2 right-0 top-6 whitespace-nowrap">
                                بيانات المعلم ناقصة
                              </div>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">
                              {submission.teacher_name || (
                                <span className="text-red-600 font-medium">غير محدد</span>
                              )}
                            </div>
                            {submission.teacher_id && (
                              <div className="text-xs text-gray-400 mt-1">ID: {submission.teacher_id.substring(0, 8)}...</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SubmittedByBadge role={submission.submitted_by_role} name={submission.submitter_name || ''} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.submitted_at ? formatDate(submission.submitted_at) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={submission.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/projects/${submission.project_id}`}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            {t('entrepreneurshipSubmissions.actions.viewProject')}
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setShowUpdateModal(true);
                              }}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                              {t('entrepreneurshipSubmissions.actions.changeStatus')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredSubmissions.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            {t('entrepreneurshipSubmissions.showing')} {filteredSubmissions.length} {t('entrepreneurshipSubmissions.of')} {submissions.length} {t('entrepreneurshipSubmissions.submission')}
          </div>
        )}
      </motion.div>

      {/* Update Status Modal */}
      <UpdateStatusModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onUpdate={handleUpdateStatus}
        currentStatus={selectedSubmission?.status || 'pending'}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default EntrepreneurshipSubmissions;
