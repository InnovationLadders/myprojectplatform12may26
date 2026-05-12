import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  Video, 
  Tag, 
  Clock, 
  User, 
  BookOpen, 
  BarChart, 
  Image as ImageIcon,
  Link as LinkIcon,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { LearningResource } from '../../hooks/useLearningResources';

interface VideoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videoData: Partial<LearningResource>) => Promise<void>;
  editingVideo: LearningResource | null;
}

export const VideoFormModal: React.FC<VideoFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  editingVideo
}) => {
  const [formData, setFormData] = useState<Partial<LearningResource>>({
    title: '',
    description: '',
    type: 'video',
    category: '',
    author: '',
    duration: '',
    difficulty: 'beginner',
    thumbnail: '',
    contentUrl: '',
    videoUrl: '',
    watchUrl: '',
    embedUrl: '',
    tags: [],
    featured: false
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form with editing video data if available
  useEffect(() => {
    if (editingVideo) {
      setFormData({
        ...editingVideo,
        // Ensure arrays are properly initialized
        tags: editingVideo.tags?.length ? editingVideo.tags : [],
      });
    } else {
      // Reset form for new video
      setFormData({
        title: '',
        description: '',
        type: 'video',
        category: '',
        author: '',
        duration: '',
        difficulty: 'beginner',
        thumbnail: '',
        contentUrl: '',
        videoUrl: '',
        watchUrl: '',
        embedUrl: '',
        tags: [],
        featured: false
      });
    }
    setTagInput('');
    setError(null);
    setSuccess(null);
  }, [editingVideo, isOpen]);

  const categories = [
    { id: 'project-management', name: 'إدارة المشاريع' },
    { id: 'programming', name: 'البرمجة' },
    { id: 'design', name: 'التصميم' },
    { id: 'entrepreneurship', name: 'ريادة الأعمال' },
    { id: 'stem', name: 'ستيم' },
    { id: 'soft-skills', name: 'المهارات الناعمة' },
    { id: 'education', name: 'التعليم' },
    { id: 'intellectual-property', name: 'الملكية الفكرية' }
  ];

  const difficulties = [
    { id: 'beginner', name: 'مبتدئ' },
    { id: 'intermediate', name: 'متوسط' },
    { id: 'advanced', name: 'متقدم' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // If videoUrl is changed, try to derive watchUrl and embedUrl
    if (field === 'videoUrl' && value) {
      try {
        // Check if it's a YouTube URL
        if (value.includes('youtube.com') || value.includes('youtu.be')) {
          // If it's an embed URL
          if (value.includes('embed')) {
            const videoId = value.split('/').pop();
            if (videoId) {
              setFormData(prev => ({
                ...prev,
                watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
                embedUrl: value
              }));
            }
          } 
          // If it's a watch URL
          else if (value.includes('watch')) {
            const url = new URL(value);
            const videoId = url.searchParams.get('v');
            if (videoId) {
              setFormData(prev => ({
                ...prev,
                watchUrl: value,
                embedUrl: `https://www.youtube.com/embed/${videoId}`
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error parsing video URL:', err);
      }
    }
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tagInput.trim()]
    }));
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.category || !formData.author) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // Ensure we have both watch and embed URLs for videos
    if (formData.videoUrl && (!formData.watchUrl || !formData.embedUrl)) {
      try {
        // Try to derive missing URLs
        if (formData.videoUrl.includes('youtube.com') || formData.videoUrl.includes('youtu.be')) {
          if (formData.videoUrl.includes('embed') && !formData.watchUrl) {
            const videoId = formData.videoUrl.split('/').pop();
            if (videoId) {
              formData.watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
            }
          } else if (formData.videoUrl.includes('watch') && !formData.embedUrl) {
            const url = new URL(formData.videoUrl);
            const videoId = url.searchParams.get('v');
            if (videoId) {
              formData.embedUrl = `https://www.youtube.com/embed/${videoId}`;
            }
          }
        }
      } catch (err) {
        console.error('Error deriving video URLs:', err);
      }
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      await onSubmit(formData);
      setSuccess('تم حفظ الفيديو بنجاح');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting video:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في حفظ الفيديو');
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
            <Video className="w-6 h-6 text-emerald-600" />
            {editingVideo ? 'تعديل فيديو تعليمي' : 'إضافة فيديو تعليمي جديد'}
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
                عنوان الفيديو *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="أدخل عنوان الفيديو"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف الفيديو *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="اكتب وصفاً شاملاً للفيديو ومحتواه"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة *
              </label>
              <div className="relative">
                <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">اختر الفئة</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المؤلف *
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="اسم المؤلف أو المقدم"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المدة
              </label>
              <div className="relative">
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="مثال: 15 دقيقة"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مستوى الصعوبة
              </label>
              <div className="relative">
                <BarChart className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.difficulty || 'beginner'}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {difficulties.map(difficulty => (
                    <option key={difficulty.id} value={difficulty.id}>{difficulty.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الصورة المصغرة
              </label>
              <div className="relative">
                <ImageIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.thumbnail || ''}
                  onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="أدخل رابط الصورة المصغرة"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الفيديو *
              </label>
              <div className="relative">
                <LinkIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.videoUrl || ''}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="أدخل رابط الفيديو (مثال: https://www.youtube.com/watch?v=...)"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">يمكنك إدخال رابط المشاهدة العادي أو رابط التضمين</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الكلمات المفتاحية
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags?.map((tag, index) => (
                  <div key={index} className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-emerald-200"
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
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="أضف كلمة مفتاحية"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  إضافة
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured || false}
                onChange={(e) => handleInputChange('featured', e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                عرض كفيديو مميز
              </label>
            </div>
          </div>

          {/* Submit Button */}
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
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingVideo ? 'حفظ التغييرات' : 'إضافة الفيديو'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};