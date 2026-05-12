import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Building, GraduationCap, BookOpen, Briefcase, DollarSign, Languages, Award, Phone, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSchools } from '../lib/firebase';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student' as 'student' | 'teacher' | 'school' | 'admin' | 'consultant',
    bio: '',
    school_id: '',
    grade: '',
    subject: '',
    schoolIdNumber: '', // New field for school ID number
    specializations: [] as string[], // Keep this if it's used elsewhere
    experience_years: 0,
    hourly_rate: 150,
    languages: ['العربية'] as string[],
    otherSpecialization: '' // New field for custom specialization
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  // Available specializations for consultants
  const specializations = [
    'الذكاء الاصطناعي',
    'تعلم الآلة',
    'الروبوتات',
    'تطوير التطبيقات',
    'تطوير الويب',
    'قواعد البيانات',
    'الأمن السيبراني',
    'الشبكات',
    'التصميم الجرافيكي',
    'تجربة المستخدم',
    'التسويق الرقمي',
    'ريادة الأعمال',
    'إدارة المشاريع',
    'العلوم',
    'الرياضيات',
    'الفيزياء',
    'الكيمياء',
    'الأحياء',
    'الهندسة الميكانيكية',
    'الهندسة الكهربائية',
    'الهندسة المدنية',
    'الطب العام',
    'طب الأطفال',
    'الجراحة العامة',
    'أخرى'
  ];

  // Available languages
  const availableLanguages = [
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

  // Fetch schools when component mounts
  useEffect(() => { 
    const fetchSchoolsData = async () => { 
      try { 
        setSchoolsLoading(true); 
        setError(''); 
        const fetchedSchools = await getSchools(); 
        console.log('Fetched schools:', fetchedSchools);
        
        if (fetchedSchools && fetchedSchools.length > 0) {
          setSchools(fetchedSchools);
        } else {
          console.warn('No schools found or empty schools array returned');
          // Keep schools array empty but don't show an error
          setSchools([]);
        }
      } catch (err: any) { 
        console.error('Error fetching schools:', err); 
        // Don't show the error to the user, just log it
        console.error('Error details:', err.message);
        setSchools([]);
      } finally { 
        setSchoolsLoading(false); 
      } 
    }; 
 
    fetchSchoolsData(); 
  }, []); 

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    if (formData.password.length < 6) {
      setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      // Prepare specializations array including custom specialization if provided
      let finalSpecializations = [...formData.specializations];
      
      // If "أخرى" is selected and custom specialization is provided, add it
      if (formData.specializations.includes('أخرى') && formData.otherSpecialization.trim()) {
        finalSpecializations = finalSpecializations.filter(s => s !== 'أخرى');
        finalSpecializations.push(formData.otherSpecialization.trim());
      }

      await register(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        phone: formData.phone,
        bio: formData.bio,
        school_id: formData.school_id,
        grade: formData.grade,
        subject: formData.subject,
        specializations: finalSpecializations,
        experience_years: formData.experience_years,
        languages: formData.languages
      });
      // No need to navigate here - the ProtectedRoute in App.tsx will handle redirection
      // based on the user's status after registration
    } catch (err: any) {
      setError('حدث خطأ في إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-32 h-32 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden"
            >
              <img 
                src="/mashroui-logo.png" 
                alt="مشروعي" 
                className="w-full h-full object-contain"
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">إنشاء حساب جديد</h1>
            <p className="text-gray-600">انضم إلى منصة مشروعي</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل اسمك الكامل"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pr-12 pl-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل كلمة المرور"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تأكيد كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أعد إدخال كلمة المرور"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الحساب
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                  formData.role === 'student' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === 'student'}
                    onChange={() => handleInputChange('role', 'student')}
                    className="sr-only"
                  />
                  <GraduationCap className="w-5 h-5" />
                  <span className="font-medium">طالب</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                  formData.role === 'teacher' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === 'teacher'}
                    onChange={() => handleInputChange('role', 'teacher')}
                    className="sr-only"
                  />
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">معلم</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                  formData.role === 'consultant' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="consultant"
                    checked={formData.role === 'consultant'}
                    onChange={() => handleInputChange('role', 'consultant')}
                    className="sr-only"
                  />
                  <Briefcase className="w-5 h-5" />
                  <span className="font-medium">مستشار</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                  formData.role === 'school' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="school"
                    checked={formData.role === 'school'}
                    onChange={() => handleInputChange('role', 'school')}
                    className="sr-only"
                  />
                  <Building className="w-5 h-5" />
                  <span className="font-medium">مدرسة</span>
                </label>
              </div>
            </div>

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المدرسة
                  </label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.school_id}
                      onChange={(e) => handleInputChange('school_id', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">اختر المدرسة</option>
                      {schoolsLoading && <option disabled>جاري تحميل المدارس...</option>}
                      {!schoolsLoading && schools.length === 0 && (
                        <option disabled>لا توجد مدارس متاحة</option>
                      )}
                      {!schoolsLoading && schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الصف الدراسي
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="مثال: الصف الثالث الثانوي"
                    />
                  </div>
                </div>
              </>
            )}

            {/* School ID Number field (conditional for student and teacher) */}
            {(formData.role === 'student' || formData.role === 'teacher') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم التعريف الخاص بك في مدرستك (ID, رقمك المدرسي, رقم البطاقة المدرسية)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.schoolIdNumber}
                    onChange={(e) => handleInputChange('schoolIdNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل رقم التعريف الخاص بك في مدرستك"
                //    required // Make it required
                  />
                </div>
              </div>
            )}

            {/* Teacher-specific fields */}
            {formData.role === 'teacher' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المدرسة
                  </label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.school_id}
                      onChange={(e) => handleInputChange('school_id', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">اختر المدرسة</option>
                      {schoolsLoading && <option disabled>جاري تحميل المدارس...</option>}
                      {!schoolsLoading && schools.length === 0 && (
                        <option disabled>لا توجد مدارس متاحة</option>
                      )}
                      {!schoolsLoading && schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التخصص
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="مثال: الرياضيات، العلوم، اللغة العربية"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Consultant-specific fields */}
            {formData.role === 'consultant' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نبذة مهنية
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="اكتب نبذة مختصرة عن خبرتك المهنية..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    التخصصات
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {specializations.map((specialization) => (
                      <label key={specialization} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.specializations.includes(specialization) 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(specialization)}
                          onChange={() => handleSpecializationToggle(specialization)}
                          className="sr-only"
                        />
                        <span className="text-sm">{specialization}</span>
                      </label>
                    ))}
                  </div>
                  
                  {/* Custom specialization input - only show if "أخرى" is selected */}
                  {formData.specializations.includes('أخرى') && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        حدد التخصص الآخر
                      </label>
                      <input
                        type="text"
                        value={formData.otherSpecialization}
                        onChange={(e) => handleInputChange('otherSpecialization', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="اكتب تخصصك..."
                        required={formData.specializations.includes('أخرى')}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      سنوات الخبرة
                    </label>
                    <div className="relative">
                      <Award className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.experience_years}
                        onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="عدد سنوات الخبرة"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللغات
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {availableLanguages.map((language) => (
                      <label key={language} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.languages.includes(language) 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(language)}
                          onChange={() => handleLanguageToggle(language)}
                          className="sr-only"
                        />
                        <span className="text-sm">{language}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* School-specific fields */}
            {formData.role === 'school' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  معلومات المدرسة
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اكتب نبذة مختصرة عن المدرسة..."
                />
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
            </motion.button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              لديك حساب بالفعل؟ تسجيل الدخول
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};