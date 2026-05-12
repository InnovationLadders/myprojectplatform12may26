import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  School, 
  GraduationCap, 
  Info,
  X,
  FileText,
  Building
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSummerProgramRegistrations, updateSummerProgramRegistration, deleteSummerProgramRegistration } from '../../lib/firebase';
import { SummerProgramRegistrationData } from '../../types/summerProgram';
import { formatDate } from '../../utils/dateUtils';
import * as XLSX from 'xlsx';

interface RegistrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: SummerProgramRegistrationData | null;
}

const RegistrationDetailModal: React.FC<RegistrationDetailModalProps> = ({ isOpen, onClose, registration }) => {
  const { t } = useTranslation();
  
  if (!isOpen || !registration) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            {registration.fullName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('summerProgram.enrollmentForm.email')}</h4>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{registration.email}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('summerProgram.enrollmentForm.phone')}</h4>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{registration.phone}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('summerProgram.enrollmentForm.parentPhone')}</h4>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{registration.parentPhone}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('summerProgram.enrollmentForm.city')}</h4>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{registration.city}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('summerProgram.enrollmentForm.idNumber')}</h4>
              <span className="text-gray-800">{registration.idNumber}</span>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('summerProgram.enrollmentForm.school')}</h4>
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{registration.school}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('summerProgram.enrollmentForm.grade')}</h4>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{registration.grade}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('summerProgram.enrollmentForm.educationAdministration')}</h4>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{registration.educationAdministration}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">{t('summerProgram.admin.table.status')}</h4>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {registration.status === 'approved' ? t('summerProgram.admin.statuses.approved') :
                 registration.status === 'rejected' ? t('summerProgram.admin.statuses.rejected') :
                 t('summerProgram.admin.statuses.pending')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">{t('summerProgram.enrollmentForm.interests')}</h4>
            <div className="flex flex-wrap gap-2">
              {registration.interests.map((interest) => (
                <span key={interest} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">{t('summerProgram.enrollmentForm.howDidYouHear')}</h4>
            <p className="text-gray-800">{registration.howDidYouHear}</p>
          </div>
          
          {registration.hasParticipatedBefore && registration.previousProjects && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">{t('summerProgram.enrollmentForm.previousProjects')}</h4>
              <p className="text-gray-800 whitespace-pre-line">{registration.previousProjects}</p>
            </div>
          )}
          
          {registration.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">{t('summerProgram.enrollmentForm.notes')}</h4>
              <p className="text-gray-800 whitespace-pre-line">{registration.notes}</p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {t('summerProgram.admin.table.submittedAt')}: {formatDate(registration.createdAt.toString())}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface ConfirmationModalProps {
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

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmColor,
  icon,
  isProcessing
}) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">{message}</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
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
              <>
                {icon}
                {confirmText}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SummerProgramRegistrations: React.FC = () => {
  const { t } = useTranslation();
  const [registrations, setRegistrations] = useState<SummerProgramRegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedEducationAdmin, setSelectedEducationAdmin] = useState('all');
  
  // Modal states
  const [viewRegistration, setViewRegistration] = useState<SummerProgramRegistrationData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch registrations on component mount
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getSummerProgramRegistrations();
      setRegistrations(data as SummerProgramRegistrationData[]);
    } catch (err) {
      console.error('Error fetching summer program registrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  // Get unique cities, grades, and education administrations for filters
  const cities = ['all', ...new Set(registrations.map(r => r.city))];
  const grades = ['all', ...new Set(registrations.map(r => r.grade))];
  const educationAdmins = ['all', ...new Set(registrations.map(r => r.educationAdministration))];

  // Filter registrations
  const filteredRegistrations = registrations.filter(registration => {
    const matchesStatus = selectedStatus === 'all' || registration.status === selectedStatus;
    const matchesCity = selectedCity === 'all' || registration.city === selectedCity;
    const matchesGrade = selectedGrade === 'all' || registration.grade === selectedGrade;
    const matchesEducationAdmin = selectedEducationAdmin === 'all' || registration.educationAdministration === selectedEducationAdmin;
    const matchesSearch = 
      registration.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.phone.includes(searchTerm) ||
      registration.school.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCity && matchesGrade && matchesEducationAdmin && matchesSearch;
  });

  // Stats
  const stats = {
    total: registrations.length,
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length
  };

  // Handle view registration
  const handleViewRegistration = (registration: SummerProgramRegistrationData) => {
    setViewRegistration(registration);
    setShowDetailModal(true);
  };

  // Handle approve registration
  const handleApproveRegistration = async () => {
    if (!selectedRegistrationId) return;
    
    setIsProcessing(true);
    setActionError(null);
    
    try {
      await updateSummerProgramRegistration(selectedRegistrationId, { status: 'approved' });
      await fetchRegistrations();
      setShowApproveModal(false);
      setSuccessMessage(t('summerProgram.admin.approveSuccess'));
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error approving registration:', err);
      setActionError(t('summerProgram.admin.approveError'));
    } finally {
      setIsProcessing(false);
      setSelectedRegistrationId(null);
    }
  };

  // Handle reject registration
  const handleRejectRegistration = async () => {
    if (!selectedRegistrationId) return;
    
    setIsProcessing(true);
    setActionError(null);
    
    try {
      await updateSummerProgramRegistration(selectedRegistrationId, { status: 'rejected' });
      await fetchRegistrations();
      setShowRejectModal(false);
      setSuccessMessage(t('summerProgram.admin.rejectSuccess'));
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error rejecting registration:', err);
      setActionError(t('summerProgram.admin.rejectError'));
    } finally {
      setIsProcessing(false);
      setSelectedRegistrationId(null);
    }
  };

  // Handle delete registration
  const handleDeleteRegistration = async () => {
    if (!selectedRegistrationId) return;
    
    setIsProcessing(true);
    setActionError(null);
    
    try {
      await deleteSummerProgramRegistration(selectedRegistrationId);
      await fetchRegistrations();
      setShowDeleteModal(false);
      setSuccessMessage(t('summerProgram.admin.deleteSuccess'));
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting registration:', err);
      setActionError(t('summerProgram.admin.deleteError'));
    } finally {
      setIsProcessing(false);
      setSelectedRegistrationId(null);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredRegistrations.map(registration => ({
        [t('summerProgram.admin.table.name')]: registration.fullName,
        [t('summerProgram.admin.table.email')]: registration.email,
        [t('summerProgram.admin.table.phone')]: registration.phone,
        [t('summerProgram.enrollmentForm.parentPhone')]: registration.parentPhone,
        [t('summerProgram.admin.table.city')]: registration.city,
        [t('summerProgram.enrollmentForm.idNumber')]: registration.idNumber,
        [t('summerProgram.enrollmentForm.school')]: registration.school,
        [t('summerProgram.admin.table.grade')]: registration.grade,
        [t('summerProgram.admin.table.educationAdministration')]: registration.educationAdministration,
        [t('summerProgram.enrollmentForm.hasParticipatedBefore')]: registration.hasParticipatedBefore ? 
          t('summerProgram.enrollmentForm.yes') : t('summerProgram.enrollmentForm.no'),
        [t('summerProgram.enrollmentForm.previousProjects')]: registration.previousProjects || '',
        [t('summerProgram.enrollmentForm.interests')]: registration.interests.join(', '),
        [t('summerProgram.enrollmentForm.howDidYouHear')]: registration.howDidYouHear,
        [t('summerProgram.enrollmentForm.notes')]: registration.notes || '',
        [t('summerProgram.admin.table.status')]: registration.status === 'approved' ? 
          t('summerProgram.admin.statuses.approved') : 
          registration.status === 'rejected' ? 
          t('summerProgram.admin.statuses.rejected') : 
          t('summerProgram.admin.statuses.pending'),
        [t('summerProgram.admin.table.submittedAt')]: formatDate(registration.createdAt.toString())
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

      // Generate Excel file
      XLSX.writeFile(workbook, 'summer_program_registrations.xlsx');
      
      setSuccessMessage(t('summerProgram.admin.exportSuccess'));
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setActionError(t('summerProgram.admin.exportError'));
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
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('summerProgram.admin.title')}</h1>
            <p className="opacity-90">{t('summerProgram.admin.subtitle')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm opacity-80">{t('summerProgram.admin.stats.totalRegistrations')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-sm opacity-80">{t('summerProgram.admin.stats.pendingReview')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <div className="text-sm opacity-80">{t('summerProgram.admin.stats.approved')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.rejected}</div>
            <div className="text-sm opacity-80">{t('summerProgram.admin.stats.rejected')}</div>
          </div>
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
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
          transition={{ duration: 0.3 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800 mb-1">{t('common.error')}</h3>
            <p className="text-red-700">{actionError}</p>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('summerProgram.admin.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={exportToExcel}
            className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            {t('summerProgram.admin.actions.export')}
          </button>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('summerProgram.admin.filters.status')}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('summerProgram.admin.statuses.all')}</option>
              <option value="pending">{t('summerProgram.admin.statuses.pending')}</option>
              <option value="approved">{t('summerProgram.admin.statuses.approved')}</option>
              <option value="rejected">{t('summerProgram.admin.statuses.rejected')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('summerProgram.admin.filters.city')}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('common.all')}</option>
              {cities.filter(city => city !== 'all').map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('summerProgram.admin.filters.grade')}
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('common.all')}</option>
              {grades.filter(grade => grade !== 'all').map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('summerProgram.admin.filters.educationAdministration')}
            </label>
            <select
              value={selectedEducationAdmin}
              onChange={(e) => setSelectedEducationAdmin(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('common.all')}</option>
              {educationAdmins.filter(admin => admin !== 'all').map(admin => (
                <option key={admin} value={admin}>{admin}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Registrations Table */}
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
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summerProgram.admin.table.name')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summerProgram.admin.table.email')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summerProgram.admin.table.phone')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summerProgram.admin.table.city')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summerProgram.admin.table.grade')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summerProgram.admin.table.educationAdministration')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summerProgram.admin.table.status')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summerProgram.admin.table.submittedAt')}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('summerProgram.admin.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.map((registration) => (
                <tr key={registration.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">{registration.fullName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{registration.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{registration.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{registration.city}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{registration.grade}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{registration.educationAdministration}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                      registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {registration.status === 'approved' ? t('summerProgram.admin.statuses.approved') :
                       registration.status === 'rejected' ? t('summerProgram.admin.statuses.rejected') :
                       t('summerProgram.admin.statuses.pending')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(registration.createdAt.toString())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewRegistration(registration)}
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                        title={t('summerProgram.admin.actions.view')}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      {registration.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRegistrationId(registration.id);
                              setShowApproveModal(true);
                            }}
                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title={t('summerProgram.admin.actions.approve')}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedRegistrationId(registration.id);
                              setShowRejectModal(true);
                            }}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                            title={t('summerProgram.admin.actions.reject')}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedRegistrationId(registration.id);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title={t('summerProgram.admin.actions.delete')}
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
      {filteredRegistrations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12 bg-white rounded-2xl shadow-lg"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('summerProgram.admin.noRegistrations')}</h3>
          <p className="text-gray-600 mb-4">
            {registrations.length === 0 
              ? t('summerProgram.admin.noRegistrations') 
              : t('summerProgram.admin.noRegistrationsMatch')}
          </p>
          {registrations.length > 0 && (
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSelectedCity('all');
                setSelectedGrade('all');
                setSelectedEducationAdmin('all');
                setSearchTerm('');
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              {t('common.resetFilters')}
            </button>
          )}
        </motion.div>
      )}

      {/* Registration Detail Modal */}
      <RegistrationDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        registration={viewRegistration}
      />

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        onConfirm={handleApproveRegistration}
        title={t('summerProgram.admin.approveConfirmation')}
        message={t('summerProgram.admin.approveConfirmation')}
        confirmText={t('summerProgram.admin.actions.approve')}
        confirmColor="bg-green-500 hover:bg-green-600"
        icon={<CheckCircle className="w-5 h-5" />}
        isProcessing={isProcessing}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleRejectRegistration}
        title={t('summerProgram.admin.rejectConfirmation')}
        message={t('summerProgram.admin.rejectConfirmation')}
        confirmText={t('summerProgram.admin.actions.reject')}
        confirmColor="bg-red-500 hover:bg-red-600"
        icon={<XCircle className="w-5 h-5" />}
        isProcessing={isProcessing}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteRegistration}
        title={t('summerProgram.admin.deleteConfirmation')}
        message={t('summerProgram.admin.deleteConfirmation')}
        confirmText={t('summerProgram.admin.actions.delete')}
        confirmColor="bg-red-500 hover:bg-red-600"
        icon={<Trash2 className="w-5 h-5" />}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default SummerProgramRegistrations;