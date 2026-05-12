import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  Tag, 
  Plus, 
  Trash2, 
  ShoppingCart,
  Image as ImageIcon,
  DollarSign,
  Package,
  Layers,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { StoreItem } from '../../hooks/useStoreItems';

interface StoreItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Partial<StoreItem>) => Promise<void>;
  editingItem: StoreItem | null;
}

export const StoreItemFormModal: React.FC<StoreItemFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  editingItem
}) => {
  const [formData, setFormData] = useState<Partial<StoreItem>>({
    name: '',
    description: '',
    price: 0,
    originalPrice: undefined,
    category: 'electronics',
    features: [''],
    tags: [],
    image: '',
    rating: 5.0,
    inStock: true,
    stockQuantity: 1,
    discount: undefined,
    featured: false
  });
  const [tagInput, setTagInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form with editing item data if available
  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        // Ensure arrays are properly initialized
        features: editingItem.features?.length ? editingItem.features : [''],
        tags: editingItem.tags || []
      });
    } else {
      // Reset form for new item
      setFormData({
        name: '',
        description: '',
        price: 0,
        originalPrice: undefined,
        category: 'electronics',
        features: [''],
        tags: [],
        image: '',
        rating: 5.0,
        inStock: true,
        stockQuantity: 1,
        discount: undefined,
        featured: false
      });
    }
    setTagInput('');
    setFeatureInput('');
    setError(null);
    setSuccess(null);
  }, [editingItem, isOpen]);

  const categories = [
    { id: 'electronics', name: 'الإلكترونيات' },
    { id: 'tools', name: 'الأدوات' },
    { id: 'materials', name: 'المواد' },
    { id: 'books', name: 'الكتب' },
    { id: 'software', name: 'البرمجيات' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.map((feature, i) => i === index ? value : feature) || []
    }));
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()]
      }));
      setFeatureInput('');
    } else {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), '']
      }));
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
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
      tags: prev.tags?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.image) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // Filter out empty features
    const cleanedData = {
      ...formData,
      features: formData.features?.filter(feature => feature.trim()) || []
    };
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      await onSubmit(cleanedData);
      setSuccess(editingItem ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting store item:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في حفظ المنتج');
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
            <ShoppingCart className="w-6 h-6 text-purple-600" />
            {editingItem ? 'تعديل منتج' : 'إضافة منتج جديد'}
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
                اسم المنتج *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="أدخل اسم المنتج"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف المنتج *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="اكتب وصفاً تفصيلياً للمنتج"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الفئة *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط الصورة *
              </label>
              <div className="relative">
                <ImageIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="أدخل رابط صورة المنتج"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السعر *
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="أدخل سعر المنتج"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السعر الأصلي (اختياري)
              </label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.originalPrice || ''}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="أدخل السعر الأصلي قبل الخصم"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نسبة الخصم (اختياري)
              </label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                <input
                  type="number"
                  value={formData.discount || ''}
                  onChange={(e) => handleInputChange('discount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="أدخل نسبة الخصم"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التقييم
              </label>
              <div className="relative">
                <Star className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.rating}
                  onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 5)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="أدخل تقييم المنتج"
                  min="1"
                  max="5"
                  step="0.1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الكمية المتوفرة
              </label>
              <div className="relative">
                <Package className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="أدخل الكمية المتوفرة"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                checked={formData.inStock}
                onChange={(e) => handleInputChange('inStock', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="inStock" className="mr-2 block text-sm text-gray-900">
                متوفر في المخزون
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => handleInputChange('featured', e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="featured" className="mr-2 block text-sm text-gray-900">
                منتج مميز
              </label>
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مميزات المنتج
            </label>
            <div className="space-y-3">
              {formData.features?.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={`الميزة ${index + 1}`}
                  />
                  {formData.features && formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="أدخل ميزة جديدة"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الكلمات المفتاحية
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags?.map((tag, index) => (
                <div key={index} className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
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
                  placeholder="أضف كلمة مفتاحية"
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
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingItem ? 'حفظ التغييرات' : 'إضافة المنتج'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};