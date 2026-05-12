import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Calendar, 
  Clock, 
  User, 
  Star,
  Video,
  Phone,
  MessageSquare,
  Plus,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Info
} from 'lucide-react';
import { useConsultations } from '../hooks/useConsultations';
import { formatDate } from '../utils/dateUtils';
import { RequestConsultationModal } from '../components/Consultations/RequestConsultationModal';
import { ConsultationDetails } from '../components/Consultations/ConsultationDetails';
import { BookConsultationModal } from '../components/Consultations/BookConsultationModal';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Consultations: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('my-consultations');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  
  const { 
    consultations, 
    consultants,
    loading, 
    error, 
    fetchConsultations, 
    fetchConsultants,
    createConsultation,
    updateConsultation 
  } = useConsultations();

  // Debug i18n initialization
  useEffect(() => {
    console.log('i18n initialization status:', {
      language: i18n.language,
      isInitialized: i18n.isInitialized,
      availableLanguages: i18n.languages
    });
  }, [i18n.language, i18n.isInitialized]);

  useEffect(() => {
    fetchConsultants();
  }, []);

  const consultationTypes = [
    { id: 'all', name: t('consultations.types.all') },
    { id: 'technical', name: t('consultations.types.technical') },
    { id: 'academic', name: t('consultations.types.academic') },
    { id: 'career', name: t('consultations.types.career') },
    { id: 'project', name: t('consultations.types.project') },
  ];

  const consultationStatuses = [
    { id: 'all', name: t('consultations.statuses.all'), color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { id: 'pending', name: t('consultations.statuses.pending'), color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { id: 'scheduled', name: t('consultations.statuses.scheduled'), color: 'bg-blue-100 text-blue-800', icon: Calendar },
    { id: 'completed', name: t('consultations.statuses.completed'), color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { id: 'cancelled', name: t('consultations.statuses.cancelled'), color: 'bg-red-100 text-red-800', icon: XCircle },
  ];

  const filteredConsultations = consultations.filter(consultation => {
    const matchesType = selectedType === 'all' || consultation.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || consultation.status === selectedStatus;
    const matchesSearch = consultation.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesStatus && matchesSearch;
  });

  const getStatusInfo = (status: string) => {
    const statusInfo = consultationStatuses.find(s => s.id === status);
    return statusInfo || { name: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'video': return t('consultations.methods.video');
      case 'phone': return t('consultations.methods.phone');
      case 'chat': return t('consultations.methods.chat');
      case 'screen_share': return t('consultations.methods.screenShare');
      default: return method;
    }
  };

  const handleRequestConsultation = async (data: any) => {
    try {
      await createConsultation(data);
      setShowRequestModal(false);
      setShowBookModal(false);
      fetchConsultations();
    } catch (error) {
      console.error('Error creating consultation:', error);
    }
  };

  const handleUpdateConsultation = async (id: string, updates: any) => {
    try {
      await updateConsultation(id, updates);
      setSelectedConsultation(null);
      fetchConsultations();
    } catch (error) {
      console.error('Error updating consultation:', error);
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
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('consultations.title')}</h1>
              <p className="opacity-90">{t('consultations.subtitle')}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowRequestModal(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('consultations.requestConsultation')}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{consultations.length}</div>
            <div className="text-sm opacity-80">{t('consultations.stats.total')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{consultations.filter(c => c.status === 'scheduled').length}</div>
            <div className="text-sm opacity-80">{t('consultations.stats.scheduled')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{consultations.filter(c => c.status === 'completed').length}</div>
            <div className="text-sm opacity-80">{t('consultations.stats.completed')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{consultations.filter(c => c.status === 'pending').length}</div>
            <div className="text-sm opacity-80">{t('consultations.stats.pending')}</div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('my-consultations')}
              className={`px-4 py-4 font-medium text-sm border-b-2 ${
                activeTab === 'my-consultations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('consultations.tabs.myConsultations')}
            </button>
            <button
              onClick={() => setActiveTab('search-consultants')}
              className={`px-4 py-4 font-medium text-sm border-b-2 ${
                activeTab === 'search-consultants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t('consultations.tabs.searchConsultants')}
            </button>
          </nav>
        </div>

        {/* My Consultations Tab */}
        {activeTab === 'my-consultations' && (
          <div className="p-6">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('consultations.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {consultationTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {consultationStatuses.map(status => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </select>
            </div>

            {/* Consultations List */}
            <div className="space-y-4">
              {filteredConsultations.map((consultation, index) => {
                const statusInfo = getStatusInfo(consultation.status);
                
                return (
                  <motion.div
                    key={consultation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{consultation.topic}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.name}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{consultation.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{t('consultations.consultant')}: {consultation.mentor_name || t('consultations.unassigned')}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {getMethodIcon(consultation.method)}
                            {getMethodText(consultation.method)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {consultation.duration} {t('consultations.minutes')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {consultation.status === 'scheduled' && consultation.scheduledDate && (
                          <div className="text-sm">
                            <div className="font-medium text-gray-800">{t('consultations.appointmentTime')}</div>
                            <div className="text-gray-600">{formatDate(consultation.scheduledDate, { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              calendar: 'gregory'
                            })}</div>
                          </div>
                        )}
                        {consultation.status === 'completed' && consultation.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{consultation.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {consultation.status === 'completed' && consultation.feedback && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <h4 className="font-medium text-gray-800 mb-2">{t('consultations.yourFeedback')}:</h4>
                        <p className="text-gray-700 text-sm">{consultation.feedback}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        {t('consultations.created')}: {formatDate(consultation.createdAt)}
                      </div>
                      <div className="flex gap-2">
                        {consultation.status === 'scheduled' && (
                          <>
                            <button 
                              onClick={() => window.open(`https://meet.google.com/new`, '_blank')}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-2"
                            >
                              <Video className="w-4 h-4" />
                              {t('consultations.joinConsultation')}
                            </button>
                            <button 
                              onClick={() => setSelectedConsultation(consultation.id)}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                              {t('consultations.reschedule')}
                            </button>
                          </>
                        )}
                        {consultation.status === 'pending' && (
                          <button 
                            onClick={() => setSelectedConsultation(consultation.id)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            {t('consultations.editRequest')}
                          </button>
                        )}
                        {consultation.status === 'completed' && !consultation.rating && (
                          <button 
                            onClick={() => setSelectedConsultation(consultation.id)}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                          >
                            {t('consultations.rateConsultation')}
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedConsultation(consultation.id)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          {t('consultations.viewDetails')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredConsultations.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('consultations.noConsultations')}</h3>
                <p className="text-gray-600 mb-4">{t('consultations.startByRequesting')}</p>
                <button 
                  onClick={() => setShowRequestModal(true)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  {t('consultations.requestNewConsultation')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search Consultants Tab */}
        {activeTab === 'search-consultants' && (
          <div className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('consultations.searchConsultantPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Debug translation keys - only in development mode */}
            {import.meta.env.DEV && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium">Debug Translation Keys:</h4>
                <pre className="text-xs overflow-auto">
                  specialties: {t('search.specialties')}<br/>
                  price: {t('search.price')}<br/>
                  pricePerHour: {t('search.pricePerHour')}<br/>
                  bookConsultation: {t('search.bookConsultation')}
                </pre>
              </div>
            )}

            {/* Wait for i18n to be ready before rendering consultants */}
            {i18n.isInitialized ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {consultants.map((consultant, index) => (
                  <motion.div
                    key={consultant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="text-center mb-4">
                      <img
                        src={consultant.avatar}
                        alt={consultant.name}
                        className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
                      />
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{consultant.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{consultant.title}</p>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{consultant.rating}</span>
                        <span className="text-gray-500 text-sm">({consultant.reviews} {t('search.reviews')})</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">{t('search.specialties')}:</h4>
                        <div className="flex flex-wrap gap-1">
                          {(consultant.specialties || []).slice(0, 3).map((specialty, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg">
                              {specialty}
                            </span>
                          ))}
                          {(consultant.specialties || []).length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                              +{(consultant.specialties || []).length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('search.price')}:</span>
                        <span className="font-medium text-blue-600">{consultant.hourlyRate} {t('search.pricePerHour')}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedConsultant(consultant.id);
                        setShowBookModal(true);
                      }}
                      className="w-full bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600 transition-colors font-medium"
                    >
                      {t('search.bookConsultation')}
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {consultants.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('consultations.noConsultants')}</h3>
                <p className="text-gray-600 mb-4">{t('consultations.noConsultantsAvailable')}</p>
                <Link
                  to="/search"
                  className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  {t('consultations.advancedSearch')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Request Consultation Modal */}
      {showRequestModal && (
        <RequestConsultationModal
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleRequestConsultation}
        />
      )}

      {/* Consultation Details Modal */}
      {selectedConsultation && (
        <ConsultationDetails
          consultation={consultations.find(c => c.id === selectedConsultation)!}
          onClose={() => setSelectedConsultation(null)}
          onUpdate={handleUpdateConsultation}
        />
      )}

      {/* Book Consultation Modal */}
      {showBookModal && selectedConsultant && (
        <BookConsultationModal
          consultant={consultants.find(c => c.id === selectedConsultant)!}
          onClose={() => {
            setSelectedConsultant(null);
            setShowBookModal(false);
          }}
          onSubmit={handleRequestConsultation}
        />
      )}

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Info className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">{t('consultations.howToUse.title')}</h3>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-sm text-indigo-600">1</span>
              {t('consultations.howToUse.step1.title')}
            </h4>
            <p className="text-gray-600 text-sm">{t('consultations.howToUse.step1.description')}</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-sm text-indigo-600">2</span>
              {t('consultations.howToUse.step2.title')}
            </h4>
            <p className="text-gray-600 text-sm">{t('consultations.howToUse.step2.description')}</p>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-sm text-indigo-600">3</span>
              {t('consultations.howToUse.step3.title')}
            </h4>
            <p className="text-gray-600 text-sm">{t('consultations.howToUse.step3.description')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};