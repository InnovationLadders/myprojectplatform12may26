import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Star, 
  Heart,
  Plus,
  Minus,
  Eye,
  Package,
  Truck,
  Shield,
  CreditCard,
  AlertCircle,
  Edit,
  Trash2,
  Settings
} from 'lucide-react';
import { useStoreItems } from '../hooks/useStoreItems';
import { formatDate } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { StoreItemFormModal } from '../components/Store/StoreItemFormModal';
import { DeleteConfirmationModal } from '../components/Store/DeleteConfirmationModal';
import { StoreItemDetailsModal } from '../components/Store/StoreItemDetailsModal';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

export const Store: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const { 
    storeItems, 
    loading, 
    error, 
    incrementViews, 
    fetchStoreItems,
    createStoreItem,
    updateStoreItem,
    deleteStoreItem,
    deleteAllStoreItems
  } = useStoreItems();
  
  const {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    toggleWishlist,
    getTotalItems,
    getTotalPrice
  } = useCart();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Admin management state
  const [showItemFormModal, setShowItemFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  // Product details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<any>(null);

  // Set admin view if user is admin
  useEffect(() => {
    if (isAdmin) {
      setIsAdminView(true);
    }
  }, [isAdmin]);

  const categories = [
    { id: 'all', name: t('store.categories.all') },
    { id: 'electronics', name: t('store.categories.electronics') },
    { id: 'tools', name: t('store.categories.tools') },
    { id: 'materials', name: t('store.categories.materials') },
    { id: 'books', name: t('store.categories.books') },
    { id: 'software', name: t('store.categories.software') },
  ];

  const filteredItems = storeItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleViewItem = (itemId: string) => {
    incrementViews(itemId);
    const item = storeItems.find(item => item.id === itemId);
    if (item) {
      setSelectedProductForDetails(item);
      setShowDetailsModal(true);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowItemFormModal(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowItemFormModal(true);
  };

  const handleDeleteItem = (item: any) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteAllItems = () => {
    setShowDeleteAllModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    
    setIsDeleting(true);
    try {
      await deleteStoreItem(deletingItem.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  const confirmDeleteAllItems = async () => {
    setIsDeletingAll(true);
    try {
      await deleteAllStoreItems();
      setShowDeleteAllModal(false);
    } catch (error) {
      console.error('Error deleting all items:', error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSubmitItem = async (itemData: any) => {
    if (editingItem) {
      await updateStoreItem(editingItem.id, itemData);
    } else {
      await createStoreItem(itemData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('common.error')}</h2>
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
        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('store.title')}</h1>
              <p className="opacity-90">{t('store.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button 
                onClick={() => setIsAdminView(!isAdminView)}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-xl hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                {isAdminView ? 'وضع المستخدم' : 'وضع الإدارة'}
              </button>
            )}
            {!isAdminView && (
              <>
                <div className="relative">
                  <button className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-xl hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    {t('store.wishlist')} ({wishlist.length})
                  </button>
                </div>
                <div className="relative">
                  <Link 
                    to="/cart"
                    className="bg-white text-purple-600 px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {t('store.cart')} ({getTotalItems()})
                  </Link>
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </div>
              </>
            )}
            {isAdmin && isAdminView && (
              <div className="flex gap-2">
                <button 
                  onClick={handleAddItem}
                  className="bg-white text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  إضافة منتج جديد
                </button>
                <button 
                  onClick={handleDeleteAllItems}
                  className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  حذف جميع المنتجات
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{storeItems.length}</div>
            <div className="text-sm opacity-80">{t('store.stats.availableProducts')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <div className="text-sm opacity-80">{t('store.stats.categories')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">24/7</div>
            <div className="text-sm opacity-80">{t('store.stats.customerSupport')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{t('store.stats.freeShipping')}</div>
            <div className="text-sm opacity-80">{t('store.stats.shipping')}</div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('store.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">{t('store.filters.categories')}</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {t('store.showing')} {filteredItems.length} {t('store.of')} {storeItems.length} {t('store.product')}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{t('store.sortBy')}:</span>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option>{t('store.sortOptions.newest')}</option>
            <option>{t('store.sortOptions.priceLowToHigh')}</option>
            <option>{t('store.sortOptions.priceHighToLow')}</option>
            <option>{t('store.sortOptions.rating')}</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            {/* Product Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {item.discount && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-medium">
                  -{item.discount}%
                </div>
              )}
              <div className="absolute top-4 left-4">
                {isAdminView ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditItem(item)}
                      className="p-2 rounded-full bg-white bg-opacity-80 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-2 rounded-full bg-white bg-opacity-80 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleWishlist(item.id)}
                    className={`p-2 rounded-full transition-all ${
                      wishlist.includes(item.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white bg-opacity-80 text-gray-600 hover:bg-red-500 hover:text-white'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="absolute bottom-4 left-4">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  item.inStock ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {item.inStock ? t('store.inStock') : t('store.outOfStock')}
                </span>
              </div>
            </div>

            {/* Product Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{item.rating}</span>
                </div>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-600">({item.reviews} {t('store.reviews')})</span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                {item.name}
              </h3>
              
              <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              {/* Features */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {item.features.slice(0, 2).map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                      {feature}
                    </span>
                  ))}
                  {item.features.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                      +{item.features.length - 2} {t('store.more')}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-purple-600">{item.price} {t('store.currency')}</span>
                {item.originalPrice && (
                  <span className="text-lg text-gray-400 line-through">{item.originalPrice} {t('store.currency')}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {isAdminView ? (
                  <>
                    <button
                      onClick={() => handleEditItem(item)}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-xl hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      تعديل
                    </button>
                    <button 
                      onClick={() => handleDeleteItem(item)}
                      className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {cart[item.id] ? (
                      <div className="flex items-center gap-2 flex-1">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="flex-1 text-center font-medium">{cart[item.id]}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item.id)}
                        disabled={!item.inStock}
                        className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-xl hover:bg-purple-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {t('store.addToCart')}
                      </button>
                    )}
                    <button 
                      onClick={() => handleViewItem(item.id)}
                      className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('store.noProductsFound')}</h3>
          <p className="text-gray-600 mb-4">
            {storeItems.length === 0 
              ? t('store.noProductsInStore') 
              : t('store.tryChangingFilters')}
          </p>
          <div className="flex justify-center gap-4">
            {isAdmin && isAdminView && (
              <button
                onClick={handleAddItem}
                className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة منتج جديد
              </button>
            )}
            {storeItems.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                {t('common.resetFilters')}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Cart Summary - Only show in user view */}
      {!isAdminView && getTotalItems() > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl p-6 border border-gray-200 z-50"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t('store.cartSummary')}</h3>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>{t('store.numberOfProducts')}:</span>
              <span className="font-medium">{getTotalItems()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('store.total')}:</span>
              <span className="font-bold text-purple-600">{getTotalPrice(storeItems).toFixed(2)} {t('store.currency')}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/cart"
              className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-xl hover:bg-purple-600 transition-colors font-medium"
            >
              {t('store.checkout')}
            </Link>
            <Link 
              to="/cart"
              className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('store.viewCart')}
            </Link>
          </div>
        </motion.div>
      )}

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-50 rounded-2xl p-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{t('store.whyChooseUs')}</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Truck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('store.features.freeShipping')}</h3>
            <p className="text-gray-600 text-sm">{t('store.features.freeShippingDesc')}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('store.features.qualityGuarantee')}</h3>
            <p className="text-gray-600 text-sm">{t('store.features.qualityGuaranteeDesc')}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('store.features.securePayment')}</h3>
            <p className="text-gray-600 text-sm">{t('store.features.securePaymentDesc')}</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('store.features.easyReturns')}</h3>
            <p className="text-gray-600 text-sm">{t('store.features.easyReturnsDesc')}</p>
          </div>
        </div>
      </motion.div>

      {/* Store Item Form Modal */}
      <StoreItemFormModal
        isOpen={showItemFormModal}
        onClose={() => setShowItemFormModal(false)}
        onSubmit={handleSubmitItem}
        editingItem={editingItem}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteItem}
        itemName={deletingItem?.name || ''}
        isDeleting={isDeleting}
      />

      {/* Delete All Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteAllModal}
        onClose={() => setShowDeleteAllModal(false)}
        onConfirm={confirmDeleteAllItems}
        itemName="جميع المنتجات"
        isDeleting={isDeletingAll}
      />

      {/* Product Details Modal */}
      <StoreItemDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        item={selectedProductForDetails}
        onAddToCart={addToCart}
        onToggleWishlist={toggleWishlist}
        isInWishlist={selectedProductForDetails ? wishlist.includes(selectedProductForDetails.id) : false}
      />
    </div>
  );
};