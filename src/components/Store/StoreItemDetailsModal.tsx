import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Star, 
  Heart,
  ShoppingCart,
  Tag,
  Package,
  Truck,
  Shield,
  DollarSign,
  Share2,
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react';
import { StoreItem } from '../../hooks/useStoreItems';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface StoreItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StoreItem | null;
  onAddToCart: (itemId: string) => void;
  onToggleWishlist: (itemId: string) => void;
  isInWishlist: boolean;
}

export const StoreItemDetailsModal: React.FC<StoreItemDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
  onAddToCart,
  onToggleWishlist,
  isInWishlist
}) => {
  const { t } = useTranslation();

  if (!isOpen || !item) return null;

  const handleShare = async () => {
    const shareData = {
      title: item.name,
      text: item.description,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // If Web Share API fails (permission denied, user cancellation, etc.),
        // fall back to copying the URL to clipboard
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('تم نسخ رابط المنتج إلى الحافظة');
        } catch (clipboardErr) {
          console.error('Error copying to clipboard:', clipboardErr);
          alert('حدث خطأ في المشاركة');
        }
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('تم نسخ رابط المنتج إلى الحافظة');
      } catch (clipboardErr) {
        console.error('Error copying to clipboard:', clipboardErr);
        alert('حدث خطأ في المشاركة');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="relative">
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Product Image */}
            <div className="h-full bg-gray-100 flex items-center justify-center p-8">
              <img 
                src={item.image} 
                alt={item.name}
                className="max-w-full max-h-[400px] object-contain"
              />
            </div>

            {/* Product Details */}
            <div className="p-8">
              {/* Category and Rating */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {item.category === 'electronics' ? t('store.categories.electronics') :
                   item.category === 'tools' ? t('store.categories.tools') :
                   item.category === 'materials' ? t('store.categories.materials') :
                   item.category === 'books' ? t('store.categories.books') :
                   item.category === 'software' ? t('store.categories.software') : item.category}
                </span>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-medium">{item.rating}</span>
                  <span className="text-gray-500">({item.reviews} {t('store.reviews')})</span>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{item.name}</h2>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-purple-600">{item.price} {t('store.currency')}</span>
                {item.originalPrice && (
                  <span className="text-xl text-gray-400 line-through">{item.originalPrice} {t('store.currency')}</span>
                )}
                {item.discount && (
                  <span className="px-2 py-1 bg-red-500 text-white rounded-lg text-sm font-medium">
                    -{item.discount}%
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">الوصف</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">المميزات</h3>
                <ul className="space-y-2">
                  {item.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-2">الكلمات المفتاحية</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {item.inStock ? t('store.inStock') : t('store.outOfStock')}
                </span>
                {item.inStock && (
                  <span className="text-sm text-gray-600">
                    ({item.stockQuantity} قطعة متوفرة)
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => onAddToCart(item.id)}
                  disabled={!item.inStock}
                  className="flex-1 bg-purple-500 text-white py-3 px-4 rounded-xl hover:bg-purple-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {t('store.addToCart')}
                </button>
                <button
                  onClick={() => onToggleWishlist(item.id)}
                  className={`p-3 rounded-xl transition-colors ${
                    isInWishlist
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Go to Cart Button */}
              <Link
                to="/cart"
                className="w-full py-3 px-4 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors font-medium flex items-center justify-center gap-2 mb-6"
              >
                <ShoppingCart className="w-5 h-5" />
                الذهاب إلى سلة التسوق
              </Link>

              {/* Additional Info */}
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">شحن مجاني</h4>
                    <p className="text-sm text-gray-600">للطلبات فوق 200 ريال</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">ضمان الجودة</h4>
                    <p className="text-sm text-gray-600">ضمان استرجاع لمدة 30 يوم</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">توصيل سريع</h4>
                    <p className="text-sm text-gray-600">خلال 2-5 أيام عمل</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};