import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Save,
  Plus,
  Trash2,
  Lightbulb,
  Palette,
  Cpu,
  BookOpen,
  FileText,
  Tag,
  AlertTriangle,
  CheckCircle,
  Upload,
  FolderOpen
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IntellectualProperty } from '../../hooks/useIntellectualProperty';
import { useProjects } from '../../hooks/useProjects';

interface CreateIntellectualPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ipData: Partial<IntellectualProperty>) => Promise<void>;
}

export const CreateIntellectualPropertyModal: React.FC<CreateIntellectualPropertyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const { projects } = useProjects();
  const [formData, setFormData] = useState<Partial<IntellectualProperty>>({
    title: '',
    description: '',
    type: 'invention',
    documents: [],
    tags: [],
    project: null
  });
  const [tagInput, setTagInput] = useState('');
  const [documentNameInput, setDocumentNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        type: 'invention',
        documents: [],
        tags: [],
        project: null
      });
      setTagInput('');
      setDocumentNameInput('');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  const propertyTypes = [
    { id: 'invention', name: t('intellectualProperty.types.invention'), icon: Lightbulb, color: 'from-yellow-400 to-orange-500' },
    { id: 'design', name: t('intellectualProperty.types.design'), icon: Palette, color: 'from-pink-500 to-rose-600' },
    { id: 'software', name: t('intellectualProperty.types.software'), icon: Cpu, color: 'from-blue-500 to-purple-600' },
    { id: 'research', name: t('intellectualProperty.types.research'), icon: BookOpen, color: 'from-green-500 to-teal-600' },
  ];

  // Get active projects for the current user
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'completed');

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTag = () => {
    if (!tagInput.trim()) return;

    setFormData((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()],
    }));
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index),
    }));
  };

  const addDocument = () => {
    if (!documentNameInput.trim()) return;

    // For now, we're just adding a name and a dummy size.
    // Real implementation would involve file input and Firebase Storage upload.
    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), { name: documentNameInput.trim(), size: '1.2 MB' }],
    }));
    setDocumentNameInput('');
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents?.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.description || !formData.type) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await onSubmit(formData);
      setSuccess('تم إرسال طلب الملكية الفكرية بنجاح');

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting intellectual property:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في إرسال طلب الملكية الفكرية');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-purple-600" />
            {t('intellectualProperty.newRegistration')}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان الملكية الفكرية *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="أدخل عنوان الاختراع أو التصميم أو البحث"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف تفصيلي *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="اكتب وصفاً تفصيلياً للملكية الفكرية، كيف تعمل، وما هي فوائدها"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الملكية الفكرية *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {propertyTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                      formData.type === type.id
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.id}
                      checked={formData.type === type.id}
                      onChange={() => handleInputChange('type', type.id)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-12 bg-gradient-to-r ${type.color} rounded-xl flex items-center justify-center`}>
                      <type.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-medium text-sm text-center">{type.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المشروع المرتبط (اختياري)
              </label>
              <div className="relative">
                <FolderOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.project?.id || ''}
                  onChange={(e) => {
                    const selectedProject = activeProjects.find(p => p.id === e.target.value);
                    handleInputChange('project', selectedProject ? { id: selectedProject.id, title: selectedProject.title } : null);
                  }}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">اختر مشروع (اختياري)</option>
                  {activeProjects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المستندات المرفقة
            </label>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <Upload className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">المستندات المطلوبة</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• وصف تفصيلي للاختراع أو التصميم</li>
                    <li>• رسومات أو صور توضيحية</li>
                    <li>• شهادات أو أوراق ثبوتية (إن وجدت)</li>
                    <li>• أي مستندات داعمة أخرى</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {formData.documents?.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-lg"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{doc.name}</span>
                  <span className="text-xs text-purple-600">({doc.size})</span>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-purple-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FileText className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={documentNameInput}
                  onChange={(e) => setDocumentNameInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDocument())}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="اسم المستند (مثال: وصف الاختراع.pdf)"
                />
              </div>
              <button
                type="button"
                onClick={addDocument}
                className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ملاحظة: في النسخة الحالية، يتم إدخال أسماء المستندات فقط. سيتم إضافة ميزة رفع الملفات لاحقاً.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الكلمات المفتاحية
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags?.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-purple-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="أضف كلمة مفتاحية (مثال: ذكي، مبتكر، بيئي)"
                />
              </div>
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                إضافة
              </button>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">معلومات مهمة</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• سيتم مراجعة طلبك من قبل خبراء الملكية الفكرية</li>
                  <li>• قد تستغرق عملية المراجعة من 7 إلى 14 يوم عمل</li>
                  <li>• ستتلقى إشعاراً عبر البريد الإلكتروني عند اكتمال المراجعة</li>
                  <li>• تأكد من دقة جميع المعلومات المقدمة</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
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