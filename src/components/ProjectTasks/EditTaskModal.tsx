import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle,
  Calendar,
  Clock,
  AlertTriangle,
  Flag,
  User
} from 'lucide-react';
import { updateProjectTask } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface EditTaskModalProps {
  task: {
    id: string;
    title: string;
    description: string;
    assigned_to: string | null;
    status: string;
    priority: string;
    due_date: string | null;
  };
  projectId: string;
  students: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  projectId,
  students,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    assigned_to: task.assigned_to || '',
    status: task.status,
    priority: task.priority,
    due_date: task.due_date ? task.due_date.split('T')[0] : ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.due_date) {
      setError('يرجى إدخال عنوان المهمة وتاريخ الاستحقاق');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Updating task with data:', {
        title: formData.title,
        description: formData.description,
        assigned_to: formData.assigned_to || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date,
      });

      await updateProjectTask(task.id, {
        title: formData.title,
        description: formData.description,
        assigned_to: formData.assigned_to || null,
        status: formData.status,
        priority: formData.priority,
        progress: formData.status === 'completed' ? 100 : (formData.status === 'in_progress' ? 50 : 0),
        due_date: formData.due_date,
      });

      console.log('Task updated successfully');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث المهمة');
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
            <CheckCircle className="w-6 h-6 text-blue-600" />
            تعديل المهمة
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
              عنوان المهمة *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="أدخل عنوان المهمة"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف المهمة
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="اكتب وصفاً تفصيلياً للمهمة"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تعيين إلى
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">غير معين</option>
                {students.map((student) => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.student?.name || 'طالب غير معروف'} {student.role === 'leader' ? '(قائد الفريق)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تاريخ الاستحقاق *
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.status === 'pending' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="pending"
                    checked={formData.status === 'pending'}
                    onChange={() => handleInputChange('status', 'pending')}
                    className="sr-only"
                  />
                  <Clock className="w-5 h-5" />
                  <span>في الانتظار</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.status === 'in_progress' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="in_progress"
                    checked={formData.status === 'in_progress'}
                    onChange={() => handleInputChange('status', 'in_progress')}
                    className="sr-only"
                  />
                  <Clock className="w-5 h-5" />
                  <span>قيد التنفيذ</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.status === 'completed' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="completed"
                    checked={formData.status === 'completed'}
                    onChange={() => handleInputChange('status', 'completed')}
                    className="sr-only"
                  />
                  <CheckCircle className="w-5 h-5" />
                  <span>مكتمل</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الأولوية
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.priority === 'low' ? 'bg-green-50 border-green-500 text-green-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="priority"
                    value="low"
                    checked={formData.priority === 'low'}
                    onChange={() => handleInputChange('priority', 'low')}
                    className="sr-only"
                  />
                  <Flag className="w-5 h-5" />
                  <span>منخفضة</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.priority === 'medium' ? 'bg-yellow-50 border-yellow-500 text-yellow-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="priority"
                    value="medium"
                    checked={formData.priority === 'medium'}
                    onChange={() => handleInputChange('priority', 'medium')}
                    className="sr-only"
                  />
                  <Flag className="w-5 h-5" />
                  <span>متوسطة</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.priority === 'high' ? 'bg-red-50 border-red-500 text-red-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="priority"
                    value="high"
                    checked={formData.priority === 'high'}
                    onChange={() => handleInputChange('priority', 'high')}
                    className="sr-only"
                  />
                  <Flag className="w-5 h-5" />
                  <span>عالية</span>
                </label>
              </div>
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
                  جاري التحديث...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  تحديث المهمة
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
