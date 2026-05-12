import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Video,
  Phone,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useConsultations } from '../../hooks/useConsultations';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const ConsultantSchedule: React.FC = () => {
  const { user } = useAuth();
  const { consultations, loading, error } = useConsultations();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');

  // Filter consultations - only show scheduled ones for this consultant
  const scheduledConsultations = consultations.filter(c => 
    c.status === 'scheduled' && c.consultant_id === user?.id
  );

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'chat': return <MessageSquare className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
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

  // Generate days for the current week
  const generateWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const weekDays = generateWeekDays();

  // Get consultations for a specific day
  const getConsultationsForDay = (date: Date) => {
    return scheduledConsultations.filter(c => {
      if (!c.scheduledDate) return false;
      const consultationDate = new Date(c.scheduledDate);
      return (
        consultationDate.getDate() === date.getDate() &&
        consultationDate.getMonth() === date.getMonth() &&
        consultationDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">جدول المواعيد</h1>
            <p className="opacity-90">إدارة مواعيد الاستشارات الخاصة بك</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{scheduledConsultations.length}</div>
            <div className="text-sm opacity-80">استشارة مجدولة</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {scheduledConsultations.filter(c => {
                if (!c.scheduledDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const consultationDate = new Date(c.scheduledDate);
                consultationDate.setHours(0, 0, 0, 0);
                return consultationDate.getTime() === today.getTime();
              }).length}
            </div>
            <div className="text-sm opacity-80">اليوم</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {scheduledConsultations.filter(c => {
                if (!c.scheduledDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const consultationDate = new Date(c.scheduledDate);
                consultationDate.setHours(0, 0, 0, 0);
                return consultationDate.getTime() === tomorrow.getTime();
              }).length}
            </div>
            <div className="text-sm opacity-80">غداً</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {scheduledConsultations.filter(c => {
                if (!c.scheduledDate) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                const consultationDate = new Date(c.scheduledDate);
                consultationDate.setHours(0, 0, 0, 0);
                return consultationDate.getTime() > today.getTime() && consultationDate.getTime() <= nextWeek.getTime();
              }).length}
            </div>
            <div className="text-sm opacity-80">هذا الأسبوع</div>
          </div>
        </div>
      </motion.div>

      {/* Calendar Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              اليوم
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="text-lg font-bold text-gray-800">
            {formatDate(weekDays[0])} - {formatDate(weekDays[6])}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded-lg ${
                view === 'day' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
            >
              يوم
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-lg ${
                view === 'week' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
            >
              أسبوع
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-lg ${
                view === 'month' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors`}
            >
              شهر
            </button>
          </div>
        </div>

        {/* Week View */}
        {view === 'week' && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-4 min-w-[800px]">
              {/* Day Headers */}
              {weekDays.map((day, index) => (
                <div key={index} className="text-center">
                  <div className={`mb-2 font-medium ${
                    day.getDate() === new Date().getDate() &&
                    day.getMonth() === new Date().getMonth() &&
                    day.getFullYear() === new Date().getFullYear()
                      ? 'text-emerald-600'
                      : 'text-gray-800'
                  }`}>
                    {day.toLocaleDateString('ar-SA', { weekday: 'long' })}
                  </div>
                  <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                    day.getDate() === new Date().getDate() &&
                    day.getMonth() === new Date().getMonth() &&
                    day.getFullYear() === new Date().getFullYear()
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}

              {/* Consultations for each day */}
              {weekDays.map((day, index) => (
                <div key={`consultations-${index}`} className="mt-4 space-y-2">
                  {getConsultationsForDay(day).length > 0 ? (
                    getConsultationsForDay(day).map((consultation) => (
                      <div
                        key={consultation.id}
                        className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-emerald-800">
                            {consultation.scheduledDate && formatTime(consultation.scheduledDate)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            {getMethodIcon(consultation.method)}
                            {getMethodText(consultation.method)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-1 line-clamp-1">{consultation.topic}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2">{consultation.description}</p>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => window.open('https://meet.google.com/new', '_blank')}
                            className="px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            بدء الاستشارة
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center text-gray-500 text-sm">
                      لا توجد مواعيد
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {formatDate(currentDate)}
              </h3>
            </div>
            
            {getConsultationsForDay(currentDate).length > 0 ? (
              getConsultationsForDay(currentDate).map((consultation) => (
                <div
                  key={consultation.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{consultation.topic}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          مجدولة
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{consultation.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {consultation.scheduledDate && formatTime(consultation.scheduledDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          {getMethodIcon(consultation.method)}
                          {getMethodText(consultation.method)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {consultation.duration} دقيقة
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => window.open('https://meet.google.com/new', '_blank')}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      بدء الاستشارة
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">الطالب</p>
                      <p className="text-xs text-gray-600">معرف الطالب: {consultation.student_id}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد مواعيد لهذا اليوم</h3>
                <p className="text-gray-600">يمكنك قبول طلبات استشارة جديدة من صفحة طلبات الاستشارة</p>
              </div>
            )}
          </div>
        )}

        {/* Month View */}
        {view === 'month' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">عرض الشهر قيد التطوير</h3>
            <p className="text-gray-600">يرجى استخدام عرض اليوم أو الأسبوع في الوقت الحالي</p>
          </div>
        )}
      </motion.div>

      {/* Upcoming Consultations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6 text-emerald-600" />
          الاستشارات القادمة
        </h2>

        {scheduledConsultations.length > 0 ? (
          <div className="space-y-4">
            {scheduledConsultations
              .filter(c => {
                if (!c.scheduledDate) return false;
                const now = new Date();
                const consultationDate = new Date(c.scheduledDate);
                return consultationDate > now;
              })
              .sort((a, b) => {
                if (!a.scheduledDate || !b.scheduledDate) return 0;
                return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
              })
              .slice(0, 3)
              .map((consultation) => (
                <div
                  key={consultation.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{consultation.topic}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          مجدولة
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {consultation.scheduledDate && formatDate(consultation.scheduledDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {consultation.scheduledDate && formatTime(consultation.scheduledDate)}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => window.open('https://meet.google.com/new', '_blank')}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      بدء الاستشارة
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد استشارات قادمة</h3>
            <p className="text-gray-600">يمكنك قبول طلبات استشارة جديدة من صفحة طلبات الاستشارة</p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Link
            to="/consultation-requests"
            className="inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-800 transition-colors"
          >
            عرض طلبات الاستشارة
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>

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