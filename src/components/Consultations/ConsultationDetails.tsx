import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  MessageCircle, 
  Calendar, 
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
  User
} from 'lucide-react';
import { Consultation } from '../../hooks/useConsultations';
import { formatDate } from '../../utils/dateUtils';

interface ConsultationDetailsProps {
  consultation: Consultation;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => void;
}

export const ConsultationDetails: React.FC<ConsultationDetailsProps> = ({ 
  consultation, 
  onClose, 
  onUpdate 
}) => {
  const [rating, setRating] = useState<number>(consultation.rating || 0);
  const [feedback, setFeedback] = useState<string>(consultation.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'phone': return <Phone className="w-5 h-5" />;
      case 'chat': return <MessageSquare className="w-5 h-5" />;
      default: return <MessageCircle className="w-5 h-5" />;
    }
  };

  const getMethodText = (method: string) => {
    switch (method) {
      case 'video': return 'مكالمة فيديو';
      case 'phone': return 'مكالمة صوتية';
      case 'chat': return 'محادثة نصية';
      case 'screen_share': return 'مشاركة الشاشة';
      default: return method;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'scheduled': return <Calendar className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      setError('يرجى اختيار تقييم');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onUpdate(consultation.id, {
        rating,
        feedback,
        status: 'completed'
      });
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في إرسال التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConsultation = async () => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الاستشارة؟')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onUpdate(consultation.id, {
        status: 'cancelled'
      });
    } catch (err) {
      console.error('Error cancelling consultation:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في إلغاء الاستشارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            تفاصيل الاستشارة
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Consultation Header */}
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-800">{consultation.mentor_name || "معلم غير معين"}</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                {getStatusText(consultation.status)}
              </span>
            </div>
            <p className="text-gray-600 text-sm">معلم</p>
          </div>
        </div>

        {/* Consultation Details */}
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              موضوع الاستشارة
            </h4>
            <div className="bg-gray-50 rounded-xl p-4">
              <h5 className="font-semibold text-gray-800 mb-2">{consultation.topic}</h5>
              <p className="text-gray-700">{consultation.description}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">تفاصيل الاستشارة</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  {getMethodIcon(consultation.method)}
                  <span>طريقة الاستشارة: {getMethodText(consultation.method)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5" />
                  <span>المدة: {consultation.duration} دقيقة</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-5 h-5" />
                  <span>تاريخ الإنشاء: {formatDate(consultation.createdAt)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">معلومات الموعد</h4>
              <div className="space-y-3">
                {consultation.scheduledDate ? (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span>موعد الاستشارة: {formatDate(consultation.scheduledDate, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      calendar: 'gregory'
                    })}</span>
                  </div>
                ) : consultation.preferredDate ? (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                    <span>الموعد المفضل: {formatDate(consultation.preferredDate, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      calendar: 'gregory'
                    })}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>لم يتم تحديد موعد بعد</span>
                  </div>
                )}

                {consultation.status === 'scheduled' && (
                  <div className="mt-2">
                    <a 
                      href="https://meet.google.com/new" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      انضمام للاستشارة
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rating Section */}
          {consultation.status === 'completed' && consultation.rating ? (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">تقييمك للاستشارة</h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-6 h-6 ${star <= consultation.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                  <span className="text-gray-700 mr-2">{consultation.rating}/5</span>
                </div>
                {consultation.feedback && (
                  <p className="text-gray-700">{consultation.feedback}</p>
                )}
              </div>
            </div>
          ) : (consultation.status === 'completed' && !showRatingForm) ? (
            <div className="text-center py-4">
              <button
                onClick={() => setShowRatingForm(true)}
                className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors"
              >
                تقييم الاستشارة
              </button>
            </div>
          ) : showRatingForm && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">تقييم الاستشارة</h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="اكتب تعليقك حول الاستشارة..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={handleSubmitRating}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <div>
              {(consultation.status === 'pending' || consultation.status === 'scheduled') && (
                <button
                  type="button"
                  onClick={handleCancelConsultation}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'جاري الإلغاء...' : 'إلغاء الاستشارة'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Import missing components
import { Video, Phone, MessageSquare, Star } from 'lucide-react';