import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Building, GraduationCap, BookOpen, Briefcase, DollarSign, Languages, Award, Phone, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSchools, getSchoolBySubdomain } from '../lib/firebase';
import { getSubdomain } from '../utils/subdomain';
import { useSchoolBranding } from '../contexts/SchoolBrandingContext';
import { getSchoolDomainSettings, extractDomain, testEmailAgainstDomains } from '../utils/domainValidation';
import DomainValidationInfo from '../components/Common/DomainValidationInfo';
import { GRADES } from '../constants/grades';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { schoolId: subdomainSchoolId, schoolName: subdomainSchoolName, logoUrl } = useSchoolBranding();
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
    city: '', // New field for user's city
    aboutYourself: '', // Areas of skills, specialties, and hobbies
    gender: '' as 'male' | 'female' | '', // User's gender
    specializations: [] as string[], // Keep this if it's used elsewhere
    experience_years: 0,
    hourly_rate: 0,
    languages: ['العربية'] as string[],
    otherSpecialization: '' // New field for custom specialization
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [isSubdomainRegistration, setIsSubdomainRegistration] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Domain validation states
  const [domainValidationEnabled, setDomainValidationEnabled] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [emailDomainValid, setEmailDomainValid] = useState<boolean | null>(null);
  const [domainValidationMessage, setDomainValidationMessage] = useState('');

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

  // Check for subdomain and fetch schools when component mounts
  useEffect(() => {
    const fetchSchoolsData = async () => {
      try {
        setSchoolsLoading(true);
        setError('');

        // Check if we're on a subdomain
        if (subdomainSchoolId && subdomainSchoolName) {
          console.log('Registration via subdomain:', subdomainSchoolName);
          setIsSubdomainRegistration(true);
          // Set only the subdomain school
          setSchools([{ id: subdomainSchoolId, name: subdomainSchoolName }]);
          // Pre-select the school
          setFormData(prev => ({ ...prev, school_id: subdomainSchoolId }));
        } else {
          // Fetch all schools
          const fetchedSchools = await getSchools();
          console.log('Fetched schools:', fetchedSchools);

          if (fetchedSchools && fetchedSchools.length > 0) {
            setSchools(fetchedSchools);
          } else {
            console.warn('No schools found or empty schools array returned');
            setSchools([]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching schools:', err);
        console.error('Error details:', err.message);
        setSchools([]);
      } finally {
        setSchoolsLoading(false);
      }
    };

    fetchSchoolsData();
  }, [subdomainSchoolId, subdomainSchoolName]);

  // Load domain validation settings when school is selected
  useEffect(() => {
    const loadDomainSettings = async () => {
      if (!formData.school_id || (formData.role !== 'student' && formData.role !== 'teacher')) {
        setDomainValidationEnabled(false);
        setAllowedDomains([]);
        setEmailDomainValid(null);
        setDomainValidationMessage('');
        return;
      }

      try {
        const settings = await getSchoolDomainSettings(formData.school_id);
        setDomainValidationEnabled(settings.enabled);
        setAllowedDomains(settings.allowedDomains);

        // Validate email if already entered
        if (formData.email && settings.enabled && settings.allowedDomains.length > 0) {
          const isValid = testEmailAgainstDomains(formData.email, settings.allowedDomains);
          setEmailDomainValid(isValid);
        }
      } catch (error) {
        console.error('Error loading domain settings:', error);
      }
    };

    loadDomainSettings();
  }, [formData.school_id, formData.role]);

  // Validate email domain when email changes
  useEffect(() => {
    if (!formData.email || !domainValidationEnabled || allowedDomains.length === 0) {
      setEmailDomainValid(null);
      setDomainValidationMessage('');
      return;
    }

    const isValid = testEmailAgainstDomains(formData.email, allowedDomains);
    setEmailDomainValid(isValid);

    if (!isValid && formData.email.includes('@')) {
      setDomainValidationMessage(`البريد الإلكتروني يجب أن ينتهي بأحد النطاقات التالية: ${allowedDomains.join('، ')}`);
    } else {
      setDomainValidationMessage('');
    }
  }, [formData.email, domainValidationEnabled, allowedDomains]); 

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

    if (!acceptedTerms) {
      setError('يجب الموافقة على شروط الاستخدام وسياسة الخصوصية');
      return;
    }

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
        city: formData.city,
        aboutYourself: formData.aboutYourself,
        gender: formData.gender || undefined,
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
              className="w-48 h-48 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden"
            >
              <img
                src={logoUrl || "/mashroui-logo.png"}
                alt={subdomainSchoolName || "مشروعي"}
                className={`w-full h-full ${logoUrl ? 'object-cover' : 'object-contain'}`}
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
            {/* Role Selection - Moved to the top */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الحساب
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <span className="font-medium">معلم\مشرف</span>
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
                  <span className="font-medium">مؤسسة تعليمية</span>
                </label>
              </div>
            </div>

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
                    placeholder={formData.role === 'school' ? 'ادخل اسم المؤسسة التعليمية' : 'أدخل اسمك الكامل'}
                    required
                  />
                  {formData.role === 'school' && (
                    <p className="text-xs text-gray-500 mt-1">مثال: مؤسسة تعليمية ابن النفيس | جامعة الملك سعود | Example: Ibn Alnafees School | King Saud University</p>
                  )}
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
                    className={`w-full pr-12 py-3 border rounded-xl focus:ring-2 focus:border-transparent ${
                      emailDomainValid === false
                        ? 'border-red-500 pl-12 focus:ring-red-500'
                        : emailDomainValid === true
                        ? 'border-green-500 pl-12 focus:ring-green-500'
                        : 'border-gray-300 pl-4 focus:ring-blue-500'
                    }`}
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                  />
                  {emailDomainValid === true && (
                    <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                  {emailDomainValid === false && (
                    <XCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>
                {domainValidationMessage && emailDomainValid === false && (
                  <p className="mt-2 text-sm text-red-600 flex items-start gap-1">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{domainValidationMessage}</span>
                  </p>
                )}
                {emailDomainValid === true && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>✓ البريد الإلكتروني مقبول</span>
                  </p>
                )}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المدينة
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل المدينة"
                />
              </div>
            </div>

            {/* About Yourself - Hidden for schools */}
            {formData.role !== 'school' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  أخبرنا عنك: مجالات المهارات والتخصص والهوايات التي تجيدها
                </label>
                <textarea
                  value={formData.aboutYourself}
                  onChange={(e) => handleInputChange('aboutYourself', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="مثال: البرمجة، التصميم، الروبوتات، الرسم، الرياضة..."
                />
                <p className="text-xs text-gray-500 mt-1">Tell us about yourself: Areas of skills, specialties, and hobbies</p>
              </div>
            )}

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الجنس
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                  formData.gender === 'male' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={() => handleInputChange('gender', 'male')}
                    className="sr-only"
                  />
                  <User className="w-5 h-5" />
                  <span className="font-medium">ذكر</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                  formData.gender === 'female' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={() => handleInputChange('gender', 'female')}
                    className="sr-only"
                  />
                  <User className="w-5 h-5" />
                  <span className="font-medium">أنثى</span>
                </label>
              </div>
            </div>

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المؤسسة تعليمية، ، البرنامج
                  </label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.school_id}
                      onChange={(e) => handleInputChange('school_id', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isSubdomainRegistration}
                    >
                      <option value="">اختر المؤسسة تعليمية، ، البرنامج</option>
                      {schoolsLoading && <option disabled>جاري تحميل المؤسسات التعليمية...</option>}
                      {!schoolsLoading && schools.length === 0 && (
                        <option disabled>لا توجد مؤسسات تعليمية متاحة</option>
                      )}
                      {!schoolsLoading && schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                  {isSubdomainRegistration && (
                    <p className="mt-2 text-sm text-blue-600">
                      التسجيل في: {subdomainSchoolName}
                    </p>
                  )}
                </div>

                {/* Domain Validation Info */}
                {domainValidationEnabled && allowedDomains.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <DomainValidationInfo
                      allowedDomains={allowedDomains}
                      variant="info"
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المرحلة/المستوى الدراسي *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      required
                    >
                      <option value="">اختر المرحلة/المستوى</option>
                      {GRADES.map((grade) => (
                        <option key={grade.value} value={grade.value}>
                          {grade.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* School ID Number field (conditional for student and teacher) */}
            {(formData.role === 'student' || formData.role === 'teacher') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم التعريف الخاص بك   (ID, رقمك الوظيفي, رقم العضوية )
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.schoolIdNumber}
                    onChange={(e) => handleInputChange('schoolIdNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل رقم التعريف الخاص بك  "
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
                    المؤسسة تعليمية، ، البرنامج
                  </label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.school_id}
                      onChange={(e) => handleInputChange('school_id', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isSubdomainRegistration}
                    >
                      <option value="">اختر المؤسسة تعليمية، ، البرنامج</option>
                      {schoolsLoading && <option disabled>جاري تحميل المؤسسات التعليمية...</option>}
                      {!schoolsLoading && schools.length === 0 && (
                        <option disabled>لا توجد مؤسسات تعليمية متاحة</option>
                      )}
                      {!schoolsLoading && schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                  {isSubdomainRegistration && (
                    <p className="mt-2 text-sm text-blue-600">
                      التسجيل في: {subdomainSchoolName}
                    </p>
                  )}
                </div>

                {/* Domain Validation Info */}
                {domainValidationEnabled && allowedDomains.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <DomainValidationInfo
                      allowedDomains={allowedDomains}
                      variant="info"
                    />
                  </motion.div>
                )}

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
                      placeholder="مثال: الرياضيات، العلوم، الهندسة المدنية ، اللغة العربية"
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
                  معلومات المؤسسة التعليمية
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اكتب نبذة مختصرة عن المؤسسة التعليمية..."
                />
              </div>
            )}

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                أوافق على{' '}
                <Link to="/terms-of-use" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                  شروط الاستخدام
                </Link>
                {' '}و{' '}
                <Link to="/privacy-policy" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                  سياسة الخصوصية
                </Link>
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !acceptedTerms}
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