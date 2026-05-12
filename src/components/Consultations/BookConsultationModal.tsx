import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Info,
  Star
} from 'lucide-react';
import { Consultant } from '../../hooks/useConsultations';
import { useTranslation } from 'react-i18next';

interface BookConsultationModalProps {
  consultant: Consultant;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const BookConsultationModal: React.FC<BookConsultationModalProps> = ({ 
  consultant, 
  onClose, 
  onSubmit 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    type: 'technical',
    method: 'video',
    duration: 60,
    scheduledDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultationTypes = [
    { id: 'technical', name: 'استشارة تقنية' },
    { id: 'academic', name: 'استشارة أكاديمية' },
    { id: 'career', name: 'استشارة مهنية' },
    { id: 'project', name: 'استشارة مشروع' },
  ];

  const consultationMethods = [
    { id: 'video', name: 'مكالمة فيديو', icon: Video },
    { id: 'phone', name: 'مكالمة صوتية', icon: Phone },
    { id: 'chat', name: 'محادثة نصية', icon: MessageSquare },
  ];

  const consultationDurations = [
    { value: 30, label: '30 دقيقة', price: consultant.hourlyRate / 2 },
    { value: 60, label: 'ساعة واحدة', price: consultant.hourlyRate },
    { value: 90, label: 'ساعة ونصف', price: consultant.hourlyRate * 1.5 },
    { value: 120, label: 'ساعتان', price: consultant.hourlyRate * 2 },
  ];

  // Generate available time slots for the next 7 days
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Add morning slot
      const morningSlot = new Date(date);
      morningSlot.setHours(10, 0, 0, 0);
      slots.push(morningSlot);
      
      // Add afternoon slot
      const afternoonSlot = new Date(date);
      afternoonSlot.setHours(14, 0, 0, 0);
      slots.push(afternoonSlot);
      
      // Add evening slot
      const eveningSlot = new Date(date);
      eveningSlot.setHours(18, 0, 0, 0);
      slots.push(eveningSlot);
    }
    
    return slots;
  };

  const availableTimeSlots = generateTimeSlots();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic || !formData.description || !formData.scheduledDate) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit({
        ...formData,
        mentor_id: consultant.id,
        status: 'scheduled'
      });
    } catch (err) {
      console.error('Error booking consultation:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في حجز الاستشارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total price
  const selectedDuration = consultationDurations.find(d => d.value === formData.duration);
  const totalPrice = selectedDuration ? selectedDuration.price : consultant.hourlyRate;

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
            <Calendar className="w-6 h-6 text-indigo-600" />
            حجز استشارة مع {consultant.name}
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

        <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl mb-6">
          <img
            src={consultant.avatar}
            alt={consultant.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h4 className="font-semibold text-gray-800">{consultant.name}</h4>
            <p className="text-gray-600">{consultant.title}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm">{consultant.rating} ({consultant.reviews} تقييم)</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عنوان الاستشارة *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="أدخل عنوان الاستشارة"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف الاستشارة *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="اشرح تفاصيل الاستشارة واحتياجاتك بوضوح"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الاستشارة *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {consultationTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة الاستشارة *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {consultationMethods.map((method) => (
                  <label key={method.id} className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                    formData.method === method.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="method"
                      value={method.id}
                      checked={formData.method === method.id}
                      onChange={() => handleInputChange('method', method.id)}
                      className="sr-only"
                    />
                    <method.icon className="w-5 h-5" />
                    <span>{method.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مدة الاستشارة *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {consultationDurations.map((duration) => (
                <label key={duration.value} className={`flex flex-col items-center p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.duration === duration.value ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="duration"
                    value={duration.value}
                    checked={formData.duration === duration.value}
                    onChange={() => handleInputChange('duration', duration.value)}
                    className="sr-only"
                  />
                  <Clock className="w-5 h-5 mb-1" />
                  <span>{duration.label}</span>
                  <span className="text-xs mt-1">{duration.price} ر.س</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختر موعد الاستشارة *
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2">
              {availableTimeSlots.map((slot, index) => (
                <label key={index} className={`flex flex-col items-center p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.scheduledDate === slot.toISOString() ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="scheduledDate"
                    value={slot.toISOString()}
                    checked={formData.scheduledDate === slot.toISOString()}
                    onChange={() => handleInputChange('scheduledDate', slot.toISOString())}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="font-medium">
                      {slot.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-sm">
                      {slot.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-gray-800 mb-3">ملخص الحجز</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">سعر الاستشارة ({selectedDuration?.label})</span>
                <span>{totalPrice} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ضريبة القيمة المضافة (15%)</span>
                <span>{(totalPrice * 0.15).toFixed(2)} ر.س</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>المجموع</span>
                  <span>{(totalPrice * 1.15).toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <div className="text-blue-500 mt-1">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">معلومات مهمة</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• سيتم إرسال رابط الاستشارة قبل الموعد بـ 15 دقيقة</li>
                <li>• يمكنك إلغاء الاستشارة قبل 24 ساعة من الموعد</li>
                <li>• سيتم خصم المبلغ عند تأكيد الحجز</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الحجز...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  تأكيد الحجز
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};