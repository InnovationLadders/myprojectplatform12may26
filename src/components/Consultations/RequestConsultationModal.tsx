import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  FolderOpen,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';

interface RequestConsultationModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const RequestConsultationModal: React.FC<RequestConsultationModalProps> = ({ onClose, onSubmit }) => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    type: 'technical',
    method: 'video',
    duration: 60,
    project_id: '',
    preferredDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultationTypes = [
    { id: 'technical', name: 'استشارة تقنية', description: 'استشارة في مجال التقنية والبرمجة' },
    { id: 'academic', name: 'استشارة أكاديمية', description: 'استشارة في المجالات الأكاديمية والتعليمية' },
    { id: 'career', name: 'استشارة مهنية', description: 'استشارة في التطوير المهني والوظيفي' },
    { id: 'project', name: 'استشارة مشروع', description: 'استشارة متعلقة بمشروع محدد' },
  ];

  const consultationMethods = [
    { id: 'video', name: 'مكالمة فيديو', icon: Video },
    { id: 'phone', name: 'مكالمة صوتية', icon: Phone },
    { id: 'chat', name: 'محادثة نصية', icon: MessageSquare },
  ];

  const consultationDurations = [
    { value: 30, label: '30 دقيقة' },
    { value: 60, label: 'ساعة واحدة' },
    { value: 90, label: 'ساعة ونصف' },
    { value: 120, label: 'ساعتان' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic || !formData.description) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting consultation request:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في إرسال طلب الاستشارة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get active projects for the current user
  const activeProjects = projects.filter(p => p.status === 'active');

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
            طلب استشارة جديدة
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عنوان الاستشارة *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="اشرح تفاصيل الاستشارة واحتياجاتك بوضوح"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الاستشارة *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {consultationTypes.map((type) => (
                <label key={type.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.type === type.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="type"
                    value={type.id}
                    checked={formData.type === type.id}
                    onChange={() => handleInputChange('type', type.id)}
                    className="sr-only"
                  />
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة الاستشارة *
              </label>
              <div className="space-y-2">
                {consultationMethods.map((method) => (
                  <label key={method.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    formData.method === method.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مدة الاستشارة *
              </label>
              <div className="space-y-2">
                {consultationDurations.map((duration) => (
                  <label key={duration.value} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    formData.duration === duration.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="duration"
                      value={duration.value}
                      checked={formData.duration === duration.value}
                      onChange={() => handleInputChange('duration', duration.value)}
                      className="sr-only"
                    />
                    <Clock className="w-5 h-5" />
                    <span>{duration.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المشروع المرتبط (اختياري)
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => handleInputChange('project_id', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">بدون مشروع</option>
                {activeProjects.map((project) => (
                  <option key={project.id} value={project.id}>{project.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ المفضل (اختياري)
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.preferredDate}
                  onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                <li>• سيتم مراجعة طلبك وتعيين معلم مناسب في أقرب وقت</li>
                <li>• سيتم إرسال رابط الاستشارة قبل الموعد بـ 15 دقيقة</li>
                <li>• يمكنك إلغاء الاستشارة قبل 24 ساعة من الموعد</li>
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
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  إرسال الطلب
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};