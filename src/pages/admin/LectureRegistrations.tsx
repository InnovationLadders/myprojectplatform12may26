import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Eye, Trash2, User, Mail, Phone, Building, Calendar, Presentation, FileText, X, CircleCheck as CheckCircle, Circle as XCircle, TriangleAlert as AlertTriangle, CircleCheck, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getLectureRegistrations,
  updateLectureRegistration,
  deleteLectureRegistration,
  LectureRegistrationData,
} from '../../lib/firebase';
import { formatDate } from '../../utils/dateUtils';
import * as XLSX from 'xlsx';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: LectureRegistrationData | null;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, registration }) => {
  const { t } = useTranslation();
  if (!isOpen || !registration) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            {registration.fullName}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-400" />
            <span className="text-gray-800">{registration.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-gray-400" />
            <span className="text-gray-800">{registration.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-gray-400" />
            <span className="text-gray-800">{registration.affiliation}</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">{t('lectureRegistration.fields.role')}</h4>
            <span className="text-gray-800">{registration.role}</span>
          </div>
          {registration.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('lectureRegistration.fields.notes')}</h4>
              <p className="text-gray-800 whitespace-pre-line">{registration.notes}</p>
            </div>
          )}
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">{t('lectureRegistration.admin.status')}</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              registration.status === 'attended' ? 'bg-green-100 text-green-800' :
              registration.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {t(`lectureRegistration.admin.statuses.${registration.status}`)}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-500 mb-4">
            {t('lectureRegistration.admin.submittedAt')}: {formatDate(registration.createdAt.toString())}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              {t('common.close')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: string;
  icon: React.ReactNode;
  isProcessing: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmText, confirmColor, icon, isProcessing,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">{icon}{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="mb-6"><p className="text-gray-700">{message}</p></div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-6 py-3 ${confirmColor} text-white rounded-xl hover:opacity-90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('common.loading')}
              </>
            ) : (
              <>{icon}{confirmText}</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const LectureRegistrations: React.FC = () => {
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState<LectureRegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [viewReg, setViewReg] = useState<LectureRegistrationData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAttendModal, setShowAttendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => { fetchRegistrations(); }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLectureRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error('Error fetching lecture registrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const filtered = registrations.filter(r => {
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesSearch =
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      r.affiliation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: registrations.length,
    registered: registrations.filter(r => r.status === 'registered').length,
    attended: registrations.filter(r => r.status === 'attended').length,
    cancelled: registrations.filter(r => r.status === 'cancelled').length,
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleUpdateStatus = async (status: 'attended' | 'cancelled') => {
    if (!selectedId) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await updateLectureRegistration(selectedId, { status });
      await fetchRegistrations();
      if (status === 'attended') { setShowAttendModal(false); showSuccess(t('lectureRegistration.admin.attendSuccess')); }
      else { setShowCancelModal(false); showSuccess(t('lectureRegistration.admin.cancelSuccess')); }
    } catch (err) {
      console.error('Error updating status:', err);
      setActionError(t('lectureRegistration.admin.updateError'));
    } finally {
      setIsProcessing(false);
      setSelectedId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await deleteLectureRegistration(selectedId);
      await fetchRegistrations();
      setShowDeleteModal(false);
      showSuccess(t('lectureRegistration.admin.deleteSuccess'));
    } catch (err) {
      console.error('Error deleting:', err);
      setActionError(t('lectureRegistration.admin.deleteError'));
    } finally {
      setIsProcessing(false);
      setSelectedId(null);
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = filtered.map(r => ({
        [t('lectureRegistration.admin.table.name')]: r.fullName,
        [t('lectureRegistration.admin.table.email')]: r.email,
        [t('lectureRegistration.admin.table.phone')]: r.phone,
        [t('lectureRegistration.admin.table.affiliation')]: r.affiliation,
        [t('lectureRegistration.admin.table.role')]: r.role,
        [t('lectureRegistration.admin.table.notes')]: r.notes || '',
        [t('lectureRegistration.admin.table.status')]: t(`lectureRegistration.admin.statuses.${r.status}`),
        [t('lectureRegistration.admin.table.submittedAt')]: formatDate(r.createdAt.toString()),
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lecture Registrations');
      XLSX.writeFile(wb, 'lecture_registrations.xlsx');
      showSuccess(t('lectureRegistration.admin.exportSuccess'));
    } catch (err) {
      console.error('Export error:', err);
      setActionError(t('lectureRegistration.admin.exportError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('lectureRegistration.admin.title')}</h1>
            <p className="opacity-90">{t('lectureRegistration.lectureTitle')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-80">{t('lectureRegistration.admin.stats.total')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.registered}</div>
            <div className="text-sm opacity-80">{t('lectureRegistration.admin.stats.registered')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.attended}</div>
            <div className="text-sm opacity-80">{t('lectureRegistration.admin.stats.attended')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
            <div className="text-sm opacity-80">{t('lectureRegistration.admin.stats.cancelled')}</div>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
        >
          <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-800 mb-1">{t('common.success')}</h3>
            <p className="text-green-700">{successMessage}</p>
          </div>
        </motion.div>
      )}
      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800 mb-1">{t('common.error')}</h3>
            <p className="text-red-700">{actionError}</p>
          </div>
        </motion.div>
      )}

      {/* Search & Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('lectureRegistration.admin.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('lectureRegistration.admin.statuses.all')}</option>
            <option value="registered">{t('lectureRegistration.admin.statuses.registered')}</option>
            <option value="attended">{t('lectureRegistration.admin.statuses.attended')}</option>
            <option value="cancelled">{t('lectureRegistration.admin.statuses.cancelled')}</option>
          </select>
          <button
            onClick={exportToExcel}
            className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t('lectureRegistration.admin.export')}
          </button>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lectureRegistration.admin.table.name')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lectureRegistration.admin.table.email')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lectureRegistration.admin.table.phone')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lectureRegistration.admin.table.affiliation')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lectureRegistration.admin.table.role')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lectureRegistration.admin.table.status')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lectureRegistration.admin.table.submittedAt')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('lectureRegistration.admin.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">{r.fullName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.affiliation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      r.status === 'attended' ? 'bg-green-100 text-green-800' :
                      r.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t(`lectureRegistration.admin.statuses.${r.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(r.createdAt.toString())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setViewReg(r); setShowDetailModal(true); }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={t('lectureRegistration.admin.actions.view')}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {r.status !== 'attended' && (
                        <button
                          onClick={() => { setSelectedId(r.id!); setShowAttendModal(true); }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title={t('lectureRegistration.admin.actions.markAttended')}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {r.status !== 'cancelled' && (
                        <button
                          onClick={() => { setSelectedId(r.id!); setShowCancelModal(true); }}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          title={t('lectureRegistration.admin.actions.markCancelled')}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedId(r.id!); setShowDeleteModal(true); }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title={t('lectureRegistration.admin.actions.delete')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-2xl shadow-lg"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('lectureRegistration.admin.noRegistrations')}</h3>
          <p className="text-gray-600 mb-4">{t('lectureRegistration.admin.noRegistrationsDesc')}</p>
          {registrations.length > 0 && (
            <button
              onClick={() => { setSelectedStatus('all'); setSearchTerm(''); }}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              {t('common.resetFilters')}
            </button>
          )}
        </motion.div>
      )}

      {/* Modals */}
      <DetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} registration={viewReg} />
      <ConfirmModal
        isOpen={showAttendModal}
        onClose={() => setShowAttendModal(false)}
        onConfirm={() => handleUpdateStatus('attended')}
        title={t('lectureRegistration.admin.attendConfirm')}
        message={t('lectureRegistration.admin.attendConfirm')}
        confirmText={t('lectureRegistration.admin.actions.markAttended')}
        confirmColor="bg-green-500 hover:bg-green-600"
        icon={<CheckCircle className="w-5 h-5" />}
        isProcessing={isProcessing}
      />
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => handleUpdateStatus('cancelled')}
        title={t('lectureRegistration.admin.cancelConfirm')}
        message={t('lectureRegistration.admin.cancelConfirm')}
        confirmText={t('lectureRegistration.admin.actions.markCancelled')}
        confirmColor="bg-orange-500 hover:bg-orange-600"
        icon={<XCircle className="w-5 h-5" />}
        isProcessing={isProcessing}
      />
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={t('lectureRegistration.admin.deleteConfirm')}
        message={t('lectureRegistration.admin.deleteConfirm')}
        confirmText={t('lectureRegistration.admin.actions.delete')}
        confirmColor="bg-red-500 hover:bg-red-600"
        icon={<Trash2 className="w-5 h-5" />}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default LectureRegistrations;
