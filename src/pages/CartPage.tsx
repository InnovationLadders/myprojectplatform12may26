import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  CreditCard, 
  Truck, 
  Package, 
  Shield, 
  AlertTriangle,
  Heart,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useStoreItems } from '../hooks/useStoreItems';
import { useTranslation } from 'react-i18next';
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD, VAT_RATE } from '../utils/constants';

export const CartPage: React.FC = () => {
  const { t } = useTranslation();
  const { 
    cart, 
    wishlist, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    toggleWishlist, 
    getTotalItems, 
    getTotalPrice 
  } = useCart();
  const { storeItems, loading, error } = useStoreItems();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Get cart items with full details
  const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
    const item = storeItems.find(item => item.id === itemId);
    return { item, quantity };
  }).filter(({ item }) => item !== undefined);

  const subtotal = getTotalPrice(storeItems);
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST; // Free shipping for orders over threshold
  const tax = subtotal * VAT_RATE; // 15% VAT
  const total = subtotal + shipping + tax - discount;

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    if (window.confirm(t('cart.confirmDelete'))) {
      updateQuantity(itemId, 0);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError(t('cart.couponRequired'));
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    // Simulate API call to validate coupon
    setTimeout(() => {
      if (couponCode.toUpperCase() === 'DISCOUNT20') {
        const discountAmount = subtotal * 0.2; // 20% discount
        setDiscount(discountAmount);
        setCouponSuccess(t('cart.couponSuccess'));
      } else {
        setCouponError(t('cart.invalidCoupon'));
      }
      setIsApplyingCoupon(false);
    }, 1000);
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
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white"
      >
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white bg-opacity-20 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold leading-tight">{t('cart.title')}</h1>
            <p className="opacity-90 text-sm md:text-base mt-0.5">{t('cart.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Back to Store */}
      <div className="flex items-center">
        <Link
          to="/store"
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span>{t('cart.backToStore')}</span>
        </Link>
      </div>

      {/* Cart Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">{t('cart.products')} ({getTotalItems()})</h2>
              {cartItems.length > 0 && (
                <button
                  onClick={() => clearCart()}
                  className="text-red-600 hover:text-red-800 transition-colors text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('cart.deleteAll')}
                </button>
              )}
            </div>

            {cartItems.length > 0 ? (
              <div className="space-y-4">
                {cartItems.map(({ item, quantity }) => item && (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 p-3 md:p-4 border border-gray-200 rounded-lg md:rounded-xl hover:shadow-md transition-all">
                    {/* Product Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 w-full sm:w-auto">
                      <h3 className="font-medium text-gray-800 mb-1 text-sm md:text-base">{item.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-gray-500 mb-2">
                        <span>{t('cart.category')}: {
                          item.category === 'electronics' ? t('store.categories.electronics') :
                          item.category === 'tools' ? t('store.categories.tools') :
                          item.category === 'materials' ? t('store.categories.materials') :
                          item.category === 'books' ? t('store.categories.books') :
                          item.category === 'software' ? t('store.categories.software') : item.category
                        }</span>
                        {item.inStock ? (
                          <span className="text-green-600">{t('cart.available')}</span>
                        ) : (
                          <span className="text-red-600">{t('cart.notAvailable')}</span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-10 text-center font-medium">{quantity}</span>
                          <button
                            onClick={() => addToCart(item.id)}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleWishlist(item.id)}
                            className={`p-2 rounded transition-colors ${
                              wishlist.includes(item.id)
                                ? 'text-red-600 hover:text-red-800'
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right w-full sm:w-auto sm:text-right">
                      <div className="text-base md:text-lg font-bold text-purple-600">{item.price} {t('store.currency')}</div>
                      <div className="text-xs md:text-sm text-gray-500">{t('cart.total')}: {(item.price * quantity).toFixed(2)} {t('store.currency')}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('cart.emptyCart')}</h3>
                <p className="text-gray-600 mb-4">{t('cart.noProductsAdded')}</p>
                <Link
                  to="/store"
                  className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-2 bg-purple-500 text-white rounded-lg md:rounded-xl hover:bg-purple-600 transition-colors inline-flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t('cart.shopNow')}
                </Link>
              </div>
            )}

            {/* Pagination (for future use) */}
            {cartItems.length > 10 && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2">{t('cart.page')} 1 {t('cart.of')} 2</span>
                  <button className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('cart.orderSummary')}</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('cart.subtotal')}</span>
                <span className="font-medium">{subtotal.toFixed(2)} {t('store.currency')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('cart.shipping')}</span>
                {shipping === 0 ? (
                  <span className="text-green-600">{t('cart.free')}</span>
                ) : (
                  <span className="font-medium">{shipping.toFixed(2)} {t('store.currency')}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('cart.vat')}</span>
                <span className="font-medium">{tax.toFixed(2)} {t('store.currency')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('cart.discount')}</span>
                  <span className="font-medium">-{discount.toFixed(2)} {t('store.currency')}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-800">{t('cart.total')}</span>
                  <span className="text-lg font-bold text-purple-600">{total.toFixed(2)} {t('store.currency')}</span>
                </div>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="mt-6">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                {t('cart.couponCode')}
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder={t('cart.enterCoupon')}
                  className="flex-1 px-3 md:px-4 py-2.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon}
                  className="px-4 md:px-6 py-2.5 md:py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base whitespace-nowrap"
                >
                  {isApplyingCoupon ? t('cart.applying') : t('cart.apply')}
                </button>
              </div>
              {couponError && (
                <p className="mt-2 text-xs md:text-sm text-red-600">{couponError}</p>
              )}
              {couponSuccess && (
                <p className="mt-2 text-xs md:text-sm text-green-600">{couponSuccess}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">{t('cart.tryCode')}</p>
            </div>

            {/* Checkout Button */}
            <Link
              to="/checkout"
              className={`w-full mt-6 px-4 md:px-6 py-3 md:py-3 bg-purple-600 text-white rounded-lg md:rounded-xl font-medium flex items-center justify-center gap-2 text-sm md:text-base ${
                cartItems.length === 0
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'hover:bg-purple-700 transition-colors'
              }`}
            >
              <CreditCard className="w-4 h-4 md:w-5 md:h-5" />
              {t('cart.proceedToPayment')}
            </Link>
          </div>

          {/* Shipping Info */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('cart.shippingInfo')}</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{t('cart.freeShipping')}</h4>
                  <p className="text-sm text-gray-600">{t('cart.freeShippingThreshold', { amount: FREE_SHIPPING_THRESHOLD })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{t('cart.fastDelivery')}</h4>
                  <p className="text-sm text-gray-600">{t('cart.deliveryTime')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{t('cart.qualityGuarantee')}</h4>
                  <p className="text-sm text-gray-600">{t('cart.returnPolicy')}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};