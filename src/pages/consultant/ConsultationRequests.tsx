import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useConsultations } from '../../hooks/useConsultations';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const ConsultationRequests: React.FC = () => {
  const { user } = useAuth();
  const { consultations, loading, error, acceptConsultation } = useConsultations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isAccepting, setIsAccepting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter consultations - only show pending ones without a consultant
  const pendingConsultations = consultations.filter(c => 
    c.status === 'pending' && c.mentor_id === null
  );

  const filteredConsultations = pendingConsultations.filter(consultation => {
    const matchesType = selectedType === 'all' || consultation.type === selectedType;
    const matchesSearch = consultation.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);
  const paginatedConsultations = filteredConsultations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAcceptConsultation = async (id: string) => {
    try {
      setIsAccepting(true);
      await acceptConsultation(id);
    } catch (error) {
      console.error('Error accepting consultation:', error);
    } finally {
      setIsAccepting(false);
    }
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
      case 'video': return 'مكالمة فيديو';
      case 'phone': return 'مكالمة صوتية';
      case 'chat': return 'محادثة نصية';
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">حدث خطأ</h2>
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
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">طلبات الاستشارة</h1>
            <p className="opacity-90">اختر الطلبات التي ترغب في قبولها</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{pendingConsultations.length}</div>
            <div className="text-sm opacity-80">طلب استشارة متاح</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{pendingConsultations.filter(c => c.type === 'technical').length}</div>
            <div className="text-sm opacity-80">استشارة تقنية</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{pendingConsultations.filter(c => c.type === 'academic').length}</div>
            <div className="text-sm opacity-80">استشارة أكاديمية</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{pendingConsultations.filter(c => c.type === 'project').length}</div>
            <div className="text-sm opacity-80">استشارة مشروع</div>
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
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في طلبات الاستشارة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="all">جميع الأنواع</option>
            <option value="technical">استشارة تقنية</option>
            <option value="academic">استشارة أكاديمية</option>
            <option value="career">استشارة مهنية</option>
            <option value="project">استشارة مشروع</option>
          </select>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          عرض {filteredConsultations.length} من أصل {pendingConsultations.length} طلب استشارة
        </p>
      </div>

      {/* Consultations List */}
      <div className="space-y-4">
        {paginatedConsultations.length > 0 ? (
          paginatedConsultations.map((consultation) => (
            <motion.div
              key={consultation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{consultation.topic}</h3>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      في الانتظار
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{consultation.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {getMethodIcon(consultation.method)}
                      {getMethodText(consultation.method)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {consultation.duration} دقيقة
                    </span>
                    {consultation.preferredDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        التاريخ المفضل: {formatDate(consultation.preferredDate)}
                      </span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleAcceptConsultation(consultation.id)}
                  disabled={isAccepting}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isAccepting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      جاري القبول...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      قبول الطلب
                    </>
                  )}
                </button>
              </div>
              
              {/* Student Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">الطالب</p>
                  <p className="text-xs text-gray-600">معرف الطالب: {consultation.student_id}</p>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد طلبات استشارة</h3>
            <p className="text-gray-600 mb-4">لم يتم العثور على طلبات استشارة تطابق معايير البحث</p>
            <button
              onClick={() => {
                setSelectedType('all');
                setSearchTerm('');
              }}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg ${
                    currentPage === page
                      ? 'bg-emerald-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Back to Dashboard */}
      <div className="text-center mt-6">
        <Link
          to="/consultant-dashboard"
          className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-800 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          العودة إلى لوحة التحكم
        </Link>
      </div>
    </div>
  );
};

// Import missing components
import { Video, Phone, MessageSquare } from 'lucide-react';