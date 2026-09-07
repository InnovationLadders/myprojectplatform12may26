import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Search, Filter, Eye, RefreshCw, Building2, User, Lightbulb, Palette, Cpu, BookOpen, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import {
  getIntellectualPropertySubmissions,
  getIntellectualPropertySubmissionsBySchoolId,
  getUserInfoForSubmission,
  updateIntellectualPropertySubmissionStatus
} from '../lib/firebase';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';

interface IPSubmission {
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
  reviewed_at?: string | null;
  title: string;
  description: string;
  type: string;
  documents: Array<{ name: string; size: string }>;
  tags: string[];
  certificate_number?: string;
  rejection_reason?: string;
  submitter_name?: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();

  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {t(`ipSubmissions.statuses.${status}`)}
    </span>
  );
};

const IPTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const { t } = useTranslation();

  const icons: Record<string, React.FC<{ className?: string }>> = {
    invention: Lightbulb,
    design: Palette,
    software: Cpu,
    research: BookOpen
  };

  const Icon = icons[type] || FileText;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
      <Icon className="w-3.5 h-3.5" />
      {t(`intellectualProperty.types.${type}`, type)}
    </span>
  );
};

const UpdateStatusModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (status: 'pending' | 'approved' | 'rejected', certificateNumber?: string, rejectionReason?: string) => void;
  currentStatus: string;
  isUpdating: boolean;
}> = ({ isOpen, onClose, onUpdate, currentStatus, isUpdating }) => {
  const { t } = useTranslation();
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected'>(currentStatus as any);
  const [certificateNumber, setCertificateNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  React.useEffect(() => {
    setSelectedStatus(currentStatus as any);
    setCertificateNumber('');
    setRejectionReason('');
  }, [currentStatus, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t('ipSubmissions.updateStatusTitle')}
        </h2>

        <p className="text-gray-600 mb-6">
          {t('ipSubmissions.updateStatusMessage')}
        </p>

        <div className="space-y-3 mb-4">
          {(['pending', 'approved', 'rejected'] as const).map((status) => (
            <label key={status} className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="ip-status"
                value={status}
                checked={selectedStatus === status}
                onChange={() => setSelectedStatus(status)}
                className="w-5 h-5"
              />
              <StatusBadge status={status} />
            </label>
          ))}
        </div>

        {selectedStatus === 'approved' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('ipSubmissions.certificateNumber')}
            </label>
            <input
              type="text"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('ipSubmissions.certificateNumberPlaceholder')}
            />
          </div>
        )}

        {selectedStatus === 'rejected' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('ipSubmissions.rejectionReason')}
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={t('ipSubmissions.rejectionReasonPlaceholder')}
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onUpdate(selectedStatus, certificateNumber || undefined, rejectionReason || undefined)}
            disabled={isUpdating || selectedStatus === currentStatus}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isUpdating ? t('ipSubmissions.submitting') : t('ipSubmissions.actions.updateStatus')}
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailsModal: React.FC<{
  submission: IPSubmission | null;
  onClose: () => void;
}> = ({ submission, onClose }) => {
  const { t } = useTranslation();
  if (!submission) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">{t('ipSubmissions.detailsTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <span className="text-sm text-gray-500">{t('ipSubmissions.table.projectName')}</span>
            <p className="font-medium text-gray-900">{submission.project_title}</p>
          </div>

          <div>
            <span className="text-sm text-gray-500">{t('ipSubmissions.table.ipTitle')}</span>
            <p className="font-medium text-gray-900">{submission.title}</p>
          </div>

          <div>
            <span className="text-sm text-gray-500 block mb-1">{t('ipSubmissions.table.type')}</span>
            <IPTypeBadge type={submission.type} />
          </div>

          <div>
            <span className="text-sm text-gray-500">{t('ipSubmissions.descriptionLabel')}</span>
            <p className="text-gray-700 mt-1">{submission.description || '-'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">{t('ipSubmissions.table.school')}</span>
              <p className="font-medium text-gray-900">{submission.school_name || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">{t('ipSubmissions.table.teacher')}</span>
              <p className="font-medium text-gray-900">{submission.teacher_name || '-'}</p>
            </div>
          </div>

          {submission.documents && submission.documents.length > 0 && (
            <div>
              <span className="text-sm text-gray-500 block mb-2">{t('ipSubmissions.documents')}</span>
              <div className="flex flex-wrap gap-2">
                {submission.documents.map((doc, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg text-sm">
                    <FileText className="w-4 h-4" />
                    {doc.name}
                    <span className="text-xs text-purple-500">({doc.size})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {submission.tags && submission.tags.length > 0 && (
            <div>
              <span className="text-sm text-gray-500 block mb-2">{t('ipSubmissions.tags')}</span>
              <div className="flex flex-wrap gap-2">
                {submission.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {submission.certificate_number && (
            <div>
              <span className="text-sm text-gray-500">{t('ipSubmissions.certificateNumber')}</span>
              <p className="font-medium text-green-700">{submission.certificate_number}</p>
            </div>
          )}

          {submission.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <span className="text-sm text-red-600 font-medium">{t('ipSubmissions.rejectionReason')}</span>
              <p className="text-red-700 mt-1">{submission.rejection_reason}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">{t('ipSubmissions.table.status')}</span>
            <StatusBadge status={submission.status} />
          </div>
        </div>
      </div>
    </div>
  );
};

const IntellectualPropertySubmissions: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<IPSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<IPSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<IPSubmission | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isSchool = user?.role === 'school';

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, statusFilter, typeFilter, schoolFilter]);

  const loadSubmissions = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let data: any[] = [];

      if (isAdmin) {
        data = await getIntellectualPropertySubmissions();
      } else if (isSchool && user.id) {
        data = await getIntellectualPropertySubmissionsBySchoolId(user.id);
      }

      const submissionsWithNames = await Promise.all(
        data.map(async (sub) => {
          const submitterInfo = await getUserInfoForSubmission(sub.submitted_by_user_id);
          return { ...sub, submitter_name: submitterInfo?.name || 'Unknown' };
        })
      );

      setSubmissions(submissionsWithNames);
    } catch (error) {
      console.error('Error loading IP submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.project_title?.toLowerCase().includes(q) ||
          s.title?.toLowerCase().includes(q) ||
          s.teacher_name?.toLowerCase().includes(q) ||
          s.school_name?.toLowerCase().includes(q) ||
          s.submitter_name?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((s) => s.type === typeFilter);
    }

    if (schoolFilter !== 'all') {
      filtered = filtered.filter((s) => s.school_id === schoolFilter);
    }

    setFilteredSubmissions(filtered);
  };

  const uniqueSchools = Array.from(new Set(submissions.filter(s => s.school_id && s.school_name).map(s => JSON.stringify({ id: s.school_id, name: s.school_name })))).map(s => JSON.parse(s));

  const handleUpdateStatus = async (newStatus: 'pending' | 'approved' | 'rejected', certificateNumber?: string, rejectionReason?: string) => {
    if (!selectedSubmission) return;

    setIsUpdating(true);
    try {
      await updateIntellectualPropertySubmissionStatus(selectedSubmission.id, newStatus, { certificateNumber, rejectionReason });
      alert(t('ipSubmissions.updateStatusSuccess'));
      setShowUpdateModal(false);
      loadSubmissions();
    } catch (error) {
      console.error('Error updating IP status:', error);
      alert(t('ipSubmissions.updateStatusError'));
    } finally {
      setIsUpdating(false);
    }
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    uniqueSchools: new Set(submissions.filter(s => s.school_id).map(s => s.school_id)).size
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('ipSubmissions.title')}</h1>
            <p className="text-white/90">{t('ipSubmissions.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">{t('ipSubmissions.stats.total')}</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">{t('ipSubmissions.stats.pending')}</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">{t('ipSubmissions.stats.approved')}</div>
          <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-600 mb-1">{t('ipSubmissions.stats.rejected')}</div>
          <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('ipSubmissions.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={loadSubmissions}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('common.refresh', { defaultValue: 'Refresh' })}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="all">{t('ipSubmissions.filters.allStatuses')}</option>
                <option value="pending">{t('ipSubmissions.statuses.pending')}</option>
                <option value="approved">{t('ipSubmissions.statuses.approved')}</option>
                <option value="rejected">{t('ipSubmissions.statuses.rejected')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Shield className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="all">{t('ipSubmissions.filters.allTypes')}</option>
                <option value="invention">{t('intellectualProperty.types.invention')}</option>
                <option value="design">{t('intellectualProperty.types.design')}</option>
                <option value="software">{t('intellectualProperty.types.software')}</option>
                <option value="research">{t('intellectualProperty.types.research')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="text-gray-400 w-5 h-5 flex-shrink-0" />
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="all">{t('ipSubmissions.filters.allSchools')}</option>
                {uniqueSchools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('ipSubmissions.noSubmissions')}</h3>
            <p className="text-gray-600">{t('ipSubmissions.noSubmissionsMessage')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('ipSubmissions.table.projectName')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('ipSubmissions.table.ipTitle')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('ipSubmissions.table.type')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>{t('ipSubmissions.table.school')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-2">
                      <User className="w-4 h-4" />
                      <span>{t('ipSubmissions.table.teacher')}</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('ipSubmissions.table.submittedAt')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('ipSubmissions.table.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('ipSubmissions.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{submission.project_title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{submission.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <IPTypeBadge type={submission.type} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{submission.school_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{submission.teacher_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {submission.submitted_at ? formatDate(submission.submitted_at) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowDetailsModal(true);
                          }}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          {t('ipSubmissions.actions.view')}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowUpdateModal(true);
                            }}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            {t('ipSubmissions.actions.changeStatus')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredSubmissions.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
            {t('ipSubmissions.showing')} {filteredSubmissions.length} {t('ipSubmissions.of')} {submissions.length} {t('ipSubmissions.submission')}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <UpdateStatusModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onUpdate={handleUpdateStatus}
        currentStatus={selectedSubmission?.status || 'pending'}
        isUpdating={isUpdating}
      />

      <DetailsModal
        submission={showDetailsModal ? selectedSubmission : null}
        onClose={() => setShowDetailsModal(false)}
      />
    </div>
  );
};

export default IntellectualPropertySubmissions;
