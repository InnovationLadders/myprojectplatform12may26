import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  ArrowRight, 
  ShoppingCart, 
  CheckCircle, 
  Truck, 
  Shield, 
  AlertTriangle,
  MapPin,
  User,
  Mail,
  Phone,
  Home,
  Building,
  Globe,
  ChevronDown,
  ChevronUp,
  Lock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useStoreItems } from '../hooks/useStoreItems';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD, VAT_RATE } from '../utils/constants';

export const CheckoutPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, clearCart, getTotalItems, getTotalPrice } = useCart();
  const { storeItems, loading, error } = useStoreItems();
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Saudi Arabia',
    notes: '',
    saveInfo: true,
    paymentMethod: 'credit-card',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    agreeToTerms: false
  });
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [showShippingSection, setShowShippingSection] = useState(true);
  const [showPaymentSection, setShowPaymentSection] = useState(true);
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  
  // Get cart items with full details
  const cartItems = Object.entries(cart).map(([itemId, quantity]) => {
    const item = storeItems.find(item => item.id === itemId);
    return { item, quantity };
  }).filter(({ item }) => item !== undefined);

  // Calculate order totals
  const subtotal = getTotalPrice(storeItems);
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST; // Free shipping for orders over threshold
  const tax = subtotal * VAT_RATE; // 15% VAT
  const total = subtotal + shipping + tax;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      setFormError('يرجى ملء جميع الحقول المطلوبة');
      return false;
    }
    
    if (!formData.agreeToTerms) {
      setFormError('يجب الموافقة على الشروط والأحكام للمتابعة');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    
    // Validate phone format (simple validation)
    const phoneRegex = /^\d{9,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setFormError('يرجى إدخال رقم هاتف صحيح');
      return false;
    }
    
    // Validate payment details if credit card is selected
    if (formData.paymentMethod === 'credit-card') {
      if (!formData.cardNumber || !formData.cardName || !formData.cardExpiry || !formData.cardCvv) {
        setFormError('يرجى إدخال جميع تفاصيل بطاقة الائتمان');
        return false;
      }
      
      // Basic card number validation (16 digits)
      const cardNumberRegex = /^\d{16}$/;
      if (!cardNumberRegex.test(formData.cardNumber.replace(/\D/g, ''))) {
        setFormError('يرجى إدخال رقم بطاقة صحيح (16 رقم)');
        return false;
      }
      
      // Basic expiry date validation (MM/YY format)
      const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      if (!expiryRegex.test(formData.cardExpiry)) {
        setFormError('يرجى إدخال تاريخ انتهاء صلاحية صحيح (MM/YY)');
        return false;
      }
      
      // Basic CVV validation (3-4 digits)
      const cvvRegex = /^\d{3,4}$/;
      if (!cvvRegex.test(formData.cardCvv)) {
        setFormError('يرجى إدخال رمز CVV صحيح (3-4 أرقام)');
        return false;
      }
    }
    
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call to process order
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate random order number
      const randomOrderNumber = Math.floor(100000 + Math.random() * 900000).toString();
      setOrderNumber(randomOrderNumber);
      
      // Clear cart and show success
      clearCart();
      setOrderComplete(true);
    } catch (error) {
      console.error('Error processing order:', error);
      setFormError('حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
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

  // If cart is empty and order is not complete, redirect to cart page
  if (cartItems.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">سلة التسوق فارغة</h2>
          <p className="text-gray-600 mb-4">يرجى إضافة منتجات إلى سلة التسوق قبل المتابعة للدفع</p>
          <Link
            to="/store"
            className="px-6 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors inline-flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            تسوق الآن
          </Link>
        </div>
      </div>
    );
  }

  // Order complete view
  if (orderComplete) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">تم إتمام الطلب بنجاح</h1>
              <p className="opacity-90">شكراً لك على الطلب!</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 text-center"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">تم استلام طلبك</h2>
          <p className="text-gray-600 mb-6">
            لقد تم استلام طلبك بنجاح وسيتم معالجته في أقرب وقت ممكن.
            <br />سيتم إرسال تأكيد الطلب إلى بريدك الإلكتروني.
          </p>
          
          <div className="bg-gray-50 rounded-xl p-6 mb-6 inline-block">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">رقم الطلب: #{orderNumber}</h3>
            <p className="text-gray-600">يرجى الاحتفاظ بهذا الرقم للرجوع إليه في المستقبل</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/store"
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              العودة إلى المتجر
            </Link>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              الذهاب إلى الصفحة الرئيسية
            </button>
          </div>
        </motion.div>
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">إتمام الطلب</h1>
            <p className="opacity-90">أدخل بيانات الشحن والدفع</p>
          </div>
        </div>
      </motion.div>

      {/* Back to Cart */}
      <div className="flex items-center">
        <Link
          to="/cart"
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة إلى سلة التسوق</span>
        </Link>
      </div>

      {/* Checkout Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Shipping and Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Message */}
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2"
              >
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>{formError}</div>
              </motion.div>
            )}

            {/* Shipping Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div 
                className="p-6 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                onClick={() => setShowShippingSection(!showShippingSection)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">معلومات الشحن</h2>
                </div>
                {showShippingSection ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {showShippingSection && (
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل *
                      </label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="أدخل الاسم الكامل"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        البريد الإلكتروني *
                      </label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="أدخل البريد الإلكتروني"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف *
                      </label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="أدخل رقم الهاتف"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        المدينة *
                      </label>
                      <div className="relative">
                        <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="أدخل المدينة"
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        العنوان *
                      </label>
                      <div className="relative">
                        <Home className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="أدخل العنوان بالتفصيل"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الرمز البريدي
                      </label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="أدخل الرمز البريدي"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الدولة
                      </label>
                      <div className="relative">
                        <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="Saudi Arabia">المملكة العربية السعودية</option>
                          <option value="United Arab Emirates">الإمارات العربية المتحدة</option>
                          <option value="Kuwait">الكويت</option>
                          <option value="Bahrain">البحرين</option>
                          <option value="Oman">عمان</option>
                          <option value="Qatar">قطر</option>
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ملاحظات إضافية
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="أي ملاحظات خاصة بالطلب أو الشحن"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.saveInfo}
                        onChange={(e) => handleInputChange('saveInfo', e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="mr-2 text-sm text-gray-700">حفظ هذه المعلومات للطلبات القادمة</span>
                    </label>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Payment Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div 
                className="p-6 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                onClick={() => setShowPaymentSection(!showPaymentSection)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">طريقة الدفع</h2>
                </div>
                {showPaymentSection ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {showPaymentSection && (
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="credit-card"
                        checked={formData.paymentMethod === 'credit-card'}
                        onChange={() => handleInputChange('paymentMethod', 'credit-card')}
                        className="text-purple-600"
                      />
                      <div className="mr-3">
                        <p className="font-medium text-gray-800">بطاقة ائتمان</p>
                        <p className="text-sm text-gray-600">Visa, Mastercard, American Express</p>
                      </div>
                      <div className="mr-auto flex gap-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/1200px-American_Express_logo_%282018%29.svg.png" alt="American Express" className="h-6" />
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mada"
                        checked={formData.paymentMethod === 'mada'}
                        onChange={() => handleInputChange('paymentMethod', 'mada')}
                        className="text-purple-600"
                      />
                      <div className="mr-3">
                        <p className="font-medium text-gray-800">مدى</p>
                        <p className="text-sm text-gray-600">الدفع ببطاقة مدى</p>
                      </div>
                      <div className="mr-auto">
                        <img src="https://upload.wikimedia.org/wikipedia/ar/b/b0/Mada_Logo.png" alt="Mada" className="h-6" />
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="apple-pay"
                        checked={formData.paymentMethod === 'apple-pay'}
                        onChange={() => handleInputChange('paymentMethod', 'apple-pay')}
                        className="text-purple-600"
                      />
                      <div className="mr-3">
                        <p className="font-medium text-gray-800">Apple Pay</p>
                        <p className="text-sm text-gray-600">الدفع باستخدام Apple Pay</p>
                      </div>
                      <div className="mr-auto">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/2560px-Apple_Pay_logo.svg.png" alt="Apple Pay" className="h-6" />
                      </div>
                    </label>

                    <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash-on-delivery"
                        checked={formData.paymentMethod === 'cash-on-delivery'}
                        onChange={() => handleInputChange('paymentMethod', 'cash-on-delivery')}
                        className="text-purple-600"
                      />
                      <div className="mr-3">
                        <p className="font-medium text-gray-800">الدفع عند الاستلام</p>
                        <p className="text-sm text-gray-600">ادفع نقداً عند استلام الطلب</p>
                      </div>
                    </label>
                  </div>

                  {/* Credit Card Details */}
                  {formData.paymentMethod === 'credit-card' && (
                    <div className="space-y-4 border-t border-gray-200 pt-4">
                      <h3 className="font-medium text-gray-800 mb-2">تفاصيل البطاقة</h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          رقم البطاقة *
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.cardNumber}
                            onChange={(e) => handleInputChange('cardNumber', formatCardNumber(e.target.value))}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="XXXX XXXX XXXX XXXX"
                            maxLength={19}
                            required={formData.paymentMethod === 'credit-card'}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          الاسم على البطاقة *
                        </label>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={formData.cardName}
                            onChange={(e) => handleInputChange('cardName', e.target.value)}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="الاسم كما يظهر على البطاقة"
                            required={formData.paymentMethod === 'credit-card'}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            تاريخ الانتهاء *
                          </label>
                          <input
                            type="text"
                            value={formData.cardExpiry}
                            onChange={(e) => handleInputChange('cardExpiry', formatExpiryDate(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="MM/YY"
                            maxLength={5}
                            required={formData.paymentMethod === 'credit-card'}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            رمز الأمان (CVV) *
                          </label>
                          <div className="relative">
                            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={formData.cardCvv}
                              onChange={(e) => handleInputChange('cardCvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="XXX"
                              maxLength={4}
                              required={formData.paymentMethod === 'credit-card'}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Lock className="w-4 h-4 text-green-600" />
                      <span>جميع المعاملات مشفرة وآمنة. بياناتك محمية.</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Terms and Conditions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  required
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                  أوافق على <a href="#" className="text-purple-600 hover:underline">الشروط والأحكام</a> و <a href="#" className="text-purple-600 hover:underline">سياسة الخصوصية</a>
                </label>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div 
                className="p-6 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                onClick={() => setShowOrderSummary(!showOrderSummary)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">ملخص الطلب</h2>
                </div>
                {showOrderSummary ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {showOrderSummary && (
                <div className="p-6">
                  {/* Cart Items Summary */}
                  <div className="space-y-4 mb-6">
                    {cartItems.map(({ item, quantity }) => item && (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 text-sm">{item.name}</h4>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">الكمية: {quantity}</span>
                            <span className="font-medium text-purple-600">{(item.price * quantity).toFixed(2)} {t('store.currency')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">المجموع الفرعي</span>
                      <span className="font-medium">{subtotal.toFixed(2)} {t('store.currency')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الشحن</span>
                      {shipping === 0 ? (
                        <span className="text-green-600">مجاني</span>
                      ) : (
                        <span className="font-medium">{shipping.toFixed(2)} {t('store.currency')}</span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ضريبة القيمة المضافة (15%)</span>
                      <span className="font-medium">{tax.toFixed(2)} {t('store.currency')}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-2">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-gray-800">الإجمالي</span>
                        <span className="text-lg font-bold text-purple-600">{total.toFixed(2)} {t('store.currency')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Place Order Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري معالجة الطلب...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    إتمام الطلب
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>دفع آمن</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  <span>شحن سريع</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>ضمان الجودة</span>
                </div>
              </div>
            </motion.div>

            {/* Need Help */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-medium text-gray-800 mb-2">بحاجة إلى مساعدة؟</h3>
              <p className="text-sm text-gray-600 mb-4">
                إذا كان لديك أي أسئلة أو استفسارات حول طلبك، يرجى التواصل مع فريق خدمة العملاء.
              </p>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                  اتصل بنا
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                  الأسئلة الشائعة
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
};