import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Star, 
  Edit, 
  Save, 
  Upload, 
  Languages, 
  DollarSign, 
  Clock, 
  Calendar, 
  MessageCircle, 
  Award, 
  FileText 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const ConsultantProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    specializations: user?.specializations || [],
    experience: user?.experience || '',
    hourlyRate: user?.hourlyRate || 0,
    languages: user?.languages || []
  });
  const [isSaving, setIsSaving] = useState(false);

  const specializations = [
    'الاستشارات الهندسية',
    'الاستشارات القانونية',
    'الاستشارات الإدارية',
    'الاستشارات التقنية',
    'الاستشارات المالية',
    'الاستشارات التسويقية',
    'الاستشارات الطبية',
    'الاستشارات التعليمية',
    'الاستشارات البيئية',
    'الاستشارات الأمنية'
  ];

  const languages = [
    'العربية',
    'الإنجليزية',
    'الفرنسية',
    'الإسبانية',
    'الألمانية',
    'الصينية',
    'اليابانية',
    'الروسية',
    'الهندية',
    'البرتغالية'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecializationToggle = (specialization: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Here you would update the user profile in your database
    // For now, we'll just simulate a delay
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={user?.avatar || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150"}
              alt={user?.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white text-emerald-600 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Upload className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{user?.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span>{user?.role === 'consultant' ? 'مستشار' : user?.role}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{user?.rating || 5.0} ({user?.reviewsCount || 0} تقييم)</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Profile Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <User className="w-6 h-6 text-emerald-600" />
                المعلومات الشخصية
              </h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    تعديل
                  </>
                )}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نبذة مهنية
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="اكتب نبذة مختصرة عن خبرتك المهنية..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="05xxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التخصصات
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {specializations.map((spec) => (
                      <label key={spec} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.specializations.includes(spec) 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={() => handleSpecializationToggle(spec)}
                          className="sr-only"
                        />
                        <span className="text-sm">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللغات
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map((lang) => (
                      <label key={lang} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.languages.includes(lang) 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(lang)}
                          onChange={() => handleLanguageToggle(lang)}
                          className="sr-only"
                        />
                        <span className="text-sm">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      سنوات الخبرة
                    </label>
                    <input
                      type="text"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="مثال: 5 سنوات"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      السعر بالساعة (ريال سعودي)
                    </label>
                    <input
                      type="number"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="200"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        حفظ التغييرات
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">البريد الإلكتروني</h3>
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-800">{user?.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">رقم الهاتف</h3>
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-800">{user?.phone || 'غير محدد'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">نبذة مهنية</h3>
                  <p className="text-gray-800 leading-relaxed">
                    {user?.bio || 'لا توجد نبذة مهنية. قم بتعديل ملفك الشخصي لإضافة نبذة عن خبرتك المهنية.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">التخصصات</h3>
                  <div className="flex flex-wrap gap-2">
                    {user?.specializations && user.specializations.length > 0 ? (
                      user.specializations.map((spec, index) => (
                        <span key={index} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">لم يتم تحديد تخصصات</span>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">سنوات الخبرة</h3>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-800">{user?.experience || 'غير محدد'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">السعر بالساعة</h3>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-800">{user?.hourlyRate || 0} ر.س</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">اللغات</h3>
                    <div className="flex items-center gap-2">
                      <Languages className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-800">
                        {user?.languages && user.languages.length > 0
                          ? user.languages.join('، ')
                          : 'غير محدد'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              الإحصائيات
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">التقييم</span>
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= (user?.rating || 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <span className="font-medium">{user?.rating || 5.0}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">عدد التقييمات</span>
                <span className="font-medium">{user?.reviewsCount || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الاستشارات المكتملة</span>
                <span className="font-medium">0</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">معدل الاستجابة</span>
                <span className="font-medium">100%</span>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              أوقات الدوام
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الأحد</span>
                <span className="font-medium">9:00 ص - 5:00 م</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الإثنين</span>
                <span className="font-medium">9:00 ص - 5:00 م</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الثلاثاء</span>
                <span className="font-medium">9:00 ص - 5:00 م</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الأربعاء</span>
                <span className="font-medium">9:00 ص - 5:00 م</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الخميس</span>
                <span className="font-medium">9:00 ص - 5:00 م</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الجمعة</span>
                <span className="text-gray-400">مغلق</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">السبت</span>
                <span className="text-gray-400">مغلق</span>
              </div>
            </div>
            
            <button className="w-full mt-4 px-4 py-2 border border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors">
              تعديل أوقات الدوام
            </button>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">روابط سريعة</h2>
            
            <div className="space-y-2">
              <a href="/consultant-dashboard" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">لوحة التحكم</span>
              </a>
              
              <a href="/consultation-requests" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">طلبات الاستشارة</span>
              </a>
              
              <a href="/consultant-schedule" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">جدول المواعيد</span>
              </a>
              
              <a href="/reviews" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <Star className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">التقييمات</span>
              </a>
              
              <a href="/settings" className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">الإعدادات</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};