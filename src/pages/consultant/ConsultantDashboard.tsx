import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Star,
  TrendingUp,
  MessageCircle,
  Filter,
  Search,
  ArrowLeft
} from 'lucide-react';
import { useConsultations } from '../../hooks/useConsultations';
import { formatDate } from '../../utils/dateUtils';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ConsultantDashboard: React.FC = () => {
  const { user } = useAuth();
  const { consultations, loading, error, acceptConsultation } = useConsultations();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  // Filter consultations
  const pendingConsultations = consultations.filter(c => 
    c.status === 'pending' && c.mentor_id === null
  );

  const myConsultations = consultations.filter(c => 
    c.mentor_id === user?.id
  );

  const filteredConsultations = myConsultations.filter(consultation => {
    const matchesStatus = selectedStatus === 'all' || consultation.status === selectedStatus;
    const matchesSearch = consultation.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'scheduled': return 'مجدولة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغية';
      default: return status;
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
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">لوحة تحكم المستشار</h1>
            <p className="opacity-90">مرحباً {user?.name}، إدارة الاستشارات والمواعيد</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{myConsultations.length}</div>
            <div className="text-sm opacity-80">إجمالي الاستشارات</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{myConsultations.filter(c => c.status === 'scheduled').length}</div>
            <div className="text-sm opacity-80">مجدولة</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{myConsultations.filter(c => c.status === 'completed').length}</div>
            <div className="text-sm opacity-80">مكتملة</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{pendingConsultations.length}</div>
            <div className="text-sm opacity-80">طلبات جديدة</div>
          </div>
        </div>
      </motion.div>

      {/* New Consultation Requests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-emerald-600" />
          طلبات الاستشارة الجديدة
        </h2>

        {pendingConsultations.length > 0 ? (
          <div className="space-y-4">
            {pendingConsultations.map((consultation) => (
              <motion.div
                key={consultation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{consultation.topic}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                        {getStatusText(consultation.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{consultation.description}</p>
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
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAccepting ? 'جاري القبول...' : 'قبول الطلب'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد طلبات جديدة</h3>
            <p className="text-gray-600">ستظهر هنا طلبات الاستشارة الجديدة التي يمكنك قبولها</p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link
            to="/consultation-requests"
            className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-800 transition-colors"
          >
            عرض جميع الطلبات
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* My Consultations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            استشاراتي
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في الاستشارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pr-12 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="scheduled">مجدولة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغية</option>
            </select>
          </div>
        </div>

        {filteredConsultations.length > 0 ? (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <motion.div
                key={consultation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{consultation.topic}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                        {getStatusText(consultation.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{consultation.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        {getMethodIcon(consultation.method)}
                        {getMethodText(consultation.method)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {consultation.duration} دقيقة
                      </span>
                      {consultation.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          موعد الاستشارة: {formatDate(consultation.scheduledDate)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {consultation.status === 'scheduled' && (
                      <button
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        onClick={() => window.open('https://meet.google.com/new', '_blank')}
                      >
                        بدء الاستشارة
                      </button>
                    )}
                    <button
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
                
                {consultation.status === 'completed' && consultation.rating && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-sm text-gray-600">التقييم:</span>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= consultation.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    {consultation.feedback && (
                      <span className="text-sm text-gray-600 mr-2">"{consultation.feedback}"</span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد استشارات</h3>
            <p className="text-gray-600">لم يتم العثور على استشارات تطابق معايير البحث</p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link
            to="/consultant-schedule"
            className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-800 transition-colors"
          >
            عرض جدول المواعيد
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">التقييمات</h3>
              <p className="text-gray-600">متوسط تقييم استشاراتك</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-6 h-6 ${star <= 4.5 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="text-2xl font-bold text-gray-800">4.5</span>
          </div>
          
          <p className="text-sm text-gray-600">من {myConsultations.filter(c => c.rating).length} تقييم</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">العملاء</h3>
              <p className="text-gray-600">عدد العملاء الذين قدمت لهم استشارات</p>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {new Set(myConsultations.map(c => c.student_id)).size}
          </div>
          
          <p className="text-sm text-gray-600">عميل فريد</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">الإيرادات</h3>
              <p className="text-gray-600">إجمالي الإيرادات من الاستشارات</p>
            </div>
          </div>
          
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {myConsultations
              .filter(c => c.status === 'completed')
              .reduce((total, c) => total + (c.duration / 60) * (user?.hourly_rate || 150), 0)
              .toFixed(0)} ر.س
          </div>
          
          <p className="text-sm text-gray-600">من {myConsultations.filter(c => c.status === 'completed').length} استشارة مكتملة</p>
        </div>
      </motion.div>
    </div>
  );
};

// Import missing components
import { Video, Phone, MessageSquare } from 'lucide-react';