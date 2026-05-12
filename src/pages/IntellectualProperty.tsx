import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Upload,
  Lightbulb,
  Cpu,
  Palette,
  BookOpen,
  Calendar,
  User
} from 'lucide-react';
import { useIntellectualProperty } from '../hooks/useIntellectualProperty';
import { formatDate } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { CreateIntellectualPropertyModal } from '../components/IntellectualProperty/CreateIntellectualPropertyModal';

export const IntellectualProperty: React.FC = () => {
  const { t } = useTranslation();
  const { intellectualProperties, loading, error, createIntellectualProperty } = useIntellectualProperty();
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const propertyTypes = [
    { id: 'all', name: t('intellectualProperty.types.all'), icon: BookOpen, color: 'from-gray-500 to-gray-600' },
    { id: 'invention', name: t('intellectualProperty.types.invention'), icon: Lightbulb, color: 'from-yellow-400 to-orange-500' },
    { id: 'design', name: t('intellectualProperty.types.design'), icon: Palette, color: 'from-pink-500 to-rose-600' },
    { id: 'software', name: t('intellectualProperty.types.software'), icon: Cpu, color: 'from-blue-500 to-purple-600' },
    { id: 'research', name: t('intellectualProperty.types.research'), icon: BookOpen, color: 'from-green-500 to-teal-600' },
  ];

  const statusTypes = [
    { id: 'all', name: t('intellectualProperty.statuses.all'), color: 'bg-gray-100 text-gray-800', icon: BookOpen },
    { id: 'pending', name: t('intellectualProperty.statuses.pending'), color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { id: 'approved', name: t('intellectualProperty.statuses.approved'), color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { id: 'rejected', name: t('intellectualProperty.statuses.rejected'), color: 'bg-red-100 text-red-800', icon: XCircle },
  ];

  const filteredProperties = intellectualProperties.filter(property => {
    const matchesType = selectedType === 'all' || property.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || property.status === selectedStatus;
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusInfo = (status: string) => {
    const statusInfo = statusTypes.find(s => s.id === status);
    return statusInfo || { name: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
  };

  const getTypeInfo = (type: string) => {
    const typeInfo = propertyTypes.find(t => t.id === type);
    return typeInfo || { name: type, icon: FileText, color: 'from-gray-400 to-gray-500' };
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
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
        className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('intellectualProperty.title')}</h1>
              <p className="opacity-90">{t('intellectualProperty.subtitle')}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('intellectualProperty.newRegistration')}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{intellectualProperties.length}</div>
            <div className="text-sm opacity-80">{t('intellectualProperty.stats.totalRequests')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{intellectualProperties.filter(p => p.status === 'approved').length}</div>
            <div className="text-sm opacity-80">{t('intellectualProperty.stats.approved')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{intellectualProperties.filter(p => p.status === 'pending').length}</div>
            <div className="text-sm opacity-80">{t('intellectualProperty.stats.underReview')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{propertyTypes.length - 1}</div>
            <div className="text-sm opacity-80">{t('intellectualProperty.stats.protectionTypes')}</div>
          </div>
        </div>
      </motion.div>

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
              placeholder={t('intellectualProperty.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Type Filters */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">{t('intellectualProperty.filters.propertyType')}</h3>
          <div className="flex flex-wrap gap-2">
            {propertyTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  selectedType === type.id
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.icon && <type.icon className="w-4 h-4" />}
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">{t('intellectualProperty.filters.requestStatus')}</h3>
          <div className="flex flex-wrap gap-2">
            {statusTypes.map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  selectedStatus === status.id
                    ? 'bg-indigo-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.icon && <status.icon className="w-4 h-4" />}
                {status.name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {t('intellectualProperty.showing')} {filteredProperties.length} {t('intellectualProperty.of')} {intellectualProperties.length} {t('intellectualProperty.request')}
        </p>
      </div>

      {/* Properties List */}
      <div className="space-y-4">
        {filteredProperties.map((property, index) => {
          const statusInfo = getStatusInfo(property.status);
          const typeInfo = getTypeInfo(property.type);
          
          return (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Type Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-r ${typeInfo.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <typeInfo.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{property.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.name}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 leading-relaxed">{property.description}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {property.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Student Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={property.student.avatar}
                        alt={property.student.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{property.student.name}</p>
                        <p className="text-sm text-gray-500">{property.student.school}</p>
                      </div>
                    </div>
                    
                    {/* Project Link */}
                    {property.project && (
                      <div className="text-sm text-gray-500 mb-3">
                        <span>{t('intellectualProperty.relatedProject')}: </span>
                        <span className="text-purple-600 hover:text-purple-800 cursor-pointer">
                          {property.project.title}
                        </span>
                      </div>
                    )}
                    
                    {/* Dates */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{t('intellectualProperty.submissionDate')}: {formatDate(property.submittedAt)}</span>
                      </div>
                      
                      {property.reviewedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>{t('intellectualProperty.reviewDate')}: {formatDate(property.reviewedAt)}</span>
                        </div>
                      )}
                      
                      {property.estimatedReviewDate && !property.reviewedAt && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{t('intellectualProperty.estimatedReview')}: {formatDate(property.estimatedReviewDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Certificate Number */}
                {property.certificateNumber && (
                  <div className="text-right">
                    <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium">
                      {t('intellectualProperty.certificateNumber')}: {property.certificateNumber}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">{t('intellectualProperty.attachedDocuments')}:</h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {property.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                      </div>
                      <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Reason */}
              {property.status === 'rejected' && property.rejectionReason && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {t('intellectualProperty.rejectionReason')}:
                  </h4>
                  <p className="text-red-700 text-sm">{property.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm">
                    <Eye className="w-4 h-4" />
                    {t('intellectualProperty.actions.viewDetails')}
                  </button>
                  
                  {property.status === 'approved' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm">
                      <Download className="w-4 h-4" />
                      {t('intellectualProperty.actions.downloadCertificate')}
                    </button>
                  )}
                  
                  {property.status === 'rejected' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                      <Upload className="w-4 h-4" />
                      {t('intellectualProperty.actions.resubmit')}
                    </button>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  {t('intellectualProperty.protectionType')}: {typeInfo.name}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProperties.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('intellectualProperty.noRequests')}</h3>
          <p className="text-gray-600 mb-4">{t('intellectualProperty.noRequestsFound')}</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('intellectualProperty.newRegistration')}
            </button>
            <button
              onClick={() => {
                setSelectedType('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('common.resetFilters')}
            </button>
          </div>
        </motion.div>
      )}

      {/* Create Intellectual Property Modal */}
      <CreateIntellectualPropertyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (ipData) => {
          try {
            await createIntellectualProperty(ipData);
            setShowCreateModal(false);
          } catch (error) {
            console.error('Error creating intellectual property:', error);
            throw error;
          }
        }}
      />

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">{t('intellectualProperty.importantInfo.title')}</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">{t('intellectualProperty.importantInfo.availableTypes')}:</h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                {t('intellectualProperty.importantInfo.inventions')}
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-500" />
                {t('intellectualProperty.importantInfo.software')}
              </li>
              <li className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-pink-500" />
                {t('intellectualProperty.importantInfo.designs')}
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-500" />
                {t('intellectualProperty.importantInfo.research')}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">{t('intellectualProperty.importantInfo.registrationSteps')}:</h4>
            <ol className="space-y-2 text-gray-600">
              <li>1. {t('intellectualProperty.importantInfo.step1')}</li>
              <li>2. {t('intellectualProperty.importantInfo.step2')}</li>
              <li>3. {t('intellectualProperty.importantInfo.step3')}</li>
              <li>4. {t('intellectualProperty.importantInfo.step4')}</li>
            </ol>
          </div>
        </div>
      </motion.div>
    </div>
  );
};