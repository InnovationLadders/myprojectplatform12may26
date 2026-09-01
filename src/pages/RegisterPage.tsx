import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Building, GraduationCap, BookOpen, Briefcase, DollarSign, Languages, Award, Phone, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, TrendingUp, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSchools, getSchoolBySubdomain } from '../lib/firebase';
import { getSubdomain } from '../utils/subdomain';
import { useSchoolBranding } from '../contexts/SchoolBrandingContext';
import { getSchoolDomainSettings, extractDomain, testEmailAgainstDomains } from '../utils/domainValidation';
import DomainValidationInfo from '../components/Common/DomainValidationInfo';
import { GRADES } from '../constants/grades';
import { useTranslation } from 'react-i18next';
import { GoogleLoginButton } from '../components/Auth/GoogleLoginButton';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { schoolId: subdomainSchoolId, schoolName: subdomainSchoolName, logoUrl } = useSchoolBranding();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'student' as 'student' | 'teacher' | 'school' | 'admin' | 'consultant' | 'investor',
    bio: '',
    school_id: '',
    grade: '',
    subject: '',
    schoolIdNumber: '',
    city: '',
    aboutYourself: '',
    gender: '' as 'male' | 'female' | '',
    specializations: [] as string[],
    experience_years: 0,
    hourly_rate: 0,
    languages: ['العربية'] as string[],
    otherSpecialization: '',
    company_name: '',
    investment_interests: '',
  });
  const [acceptedInvestorPledge, setAcceptedInvestorPledge] = useState(false);
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
      setDomainValidationMessage(`${t('register.emailDomainRequired')}: ${allowedDomains.join(', ')}`);
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
      setError(t('register.termsRequired'));
      return;
    }

    if (formData.role === 'investor' && !acceptedInvestorPledge) {
      setError(t('register.mustAgreeInvestorPledge'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.passwordsNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('register.passwordMinLength'));
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
        languages: formData.languages,
        company_name: formData.role === 'investor' ? formData.company_name : undefined,
        investment_interests: formData.role === 'investor' ? formData.investment_interests : undefined,
        agreed_to_investor_pledge: formData.role === 'investor' ? acceptedInvestorPledge : undefined,
      });
      // No need to navigate here - the ProtectedRoute in App.tsx will handle redirection
      // based on the user's status after registration
    } catch (err: any) {
      setError(t('register.accountCreationError'));
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
                src={logoUrl || "/mashrouilogo.png"}
                alt={subdomainSchoolName || "Mashroui"}
                className={`w-full h-full ${logoUrl ? 'object-cover' : 'object-contain'}`}
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('register.createAccountTitle')}</h1>
            <p className="text-gray-600">{t('register.joinPlatform')}</p>
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
                {t('register.accountType')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  <span className="font-medium">{t('register.roleStudent')}</span>
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
                  <span className="font-medium">{t('register.roleTeacher')}</span>
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
                  <span className="font-medium">{t('register.roleConsultant')}</span>
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
                  <span className="font-medium">{t('register.roleSchool')}</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors col-span-2 md:col-span-2 ${
                  formData.role === 'investor' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="investor"
                    checked={formData.role === 'investor'}
                    onChange={() => handleInputChange('role', 'investor')}
                    className="sr-only"
                  />
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">{t('register.roleInvestor')}</span>
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register.fullName')}
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={formData.role === 'school' ? t('register.schoolPlaceholder') : t('register.fullNamePlaceholder')}
                    required
                  />
                  {formData.role === 'school' && (
                    <p className="text-xs text-gray-500 mt-1">{t('register.nameExample')}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register.email')}
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
                    placeholder={t('register.emailPlaceholder')}
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
                    <span>✓ {t('register.emailAccepted')}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pr-12 pl-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('register.passwordPlaceholder')}
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
                  {t('register.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('register.confirmPasswordPlaceholder')}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.phone')}
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
                {t('register.city')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('register.cityPlaceholder')}
                />
              </div>
            </div>

            {/* About Yourself - Hidden for schools and investors */}
            {formData.role !== 'school' && formData.role !== 'investor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('register.aboutYourself')}
                </label>
                <textarea
                  value={formData.aboutYourself}
                  onChange={(e) => handleInputChange('aboutYourself', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={t('register.aboutYourselfPlaceholder')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('register.aboutYourselfHint')}</p>
              </div>
            )}

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.gender')}
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
                  <span className="font-medium">{t('register.male')}</span>
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
                  <span className="font-medium">{t('register.female')}</span>
                </label>
              </div>
            </div>

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('register.institutionProgram')}
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
                      <option value="">{t('register.selectInstitutionProgram')}</option>
                      {schoolsLoading && <option disabled>{t('register.schoolLoading')}</option>}
                      {!schoolsLoading && schools.length === 0 && (
                        <option disabled>{t('register.noSchoolsAvailable')}</option>
                      )}
                      {!schoolsLoading && schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                  {isSubdomainRegistration && (
                    <p className="mt-2 text-sm text-blue-600">
                      {t('register.registeringAt')} {subdomainSchoolName}
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
                    {t('register.gradeLevel')}
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      required
                    >
                      <option value="">{t('register.selectGradeLevel')}</option>
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
                  {t('register.schoolIdNumber')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.schoolIdNumber}
                    onChange={(e) => handleInputChange('schoolIdNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('register.schoolIdNumberPlaceholder')}
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
                    {t('register.institutionProgram')}
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
                      <option value="">{t('register.selectInstitutionProgram')}</option>
                      {schoolsLoading && <option disabled>{t('register.schoolLoading')}</option>}
                      {!schoolsLoading && schools.length === 0 && (
                        <option disabled>{t('register.noSchoolsAvailable')}</option>
                      )}
                      {!schoolsLoading && schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                  {isSubdomainRegistration && (
                    <p className="mt-2 text-sm text-blue-600">
                      {t('register.registeringAt')} {subdomainSchoolName}
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
                    {t('register.subject')}
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('register.subjectPlaceholder')}
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
                    {t('register.professionalBio')}
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('register.professionalBioPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('register.specializations')}
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
                        {t('register.otherSpecialization')}
                      </label>
                      <input
                        type="text"
                        value={formData.otherSpecialization}
                        onChange={(e) => handleInputChange('otherSpecialization', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('register.otherSpecializationPlaceholder')}
                        required={formData.specializations.includes('أخرى')}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('register.yearsOfExperience')}
                    </label>
                    <div className="relative">
                      <Award className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.experience_years}
                        onChange={(e) => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('register.yearsOfExperiencePlaceholder')}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('register.languages')}
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
                  {t('register.institutionInfo')}
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('register.institutionInfoPlaceholder')}
                />
              </div>
            )}

            {/* Investor-specific fields */}
            {formData.role === 'investor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('register.investorPledge.companyName')} <span className="text-gray-400 font-normal">({t('register.optional')})</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange('company_name', e.target.value)}
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder={t('register.investorPledge.companyNamePlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('register.investorPledge.investmentInterests')}
                  </label>
                  <div className="relative">
                    <TrendingUp className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={formData.investment_interests}
                      onChange={(e) => handleInputChange('investment_interests', e.target.value)}
                      rows={3}
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder={t('register.investorPledge.investmentInterestsPlaceholder')}
                    />
                  </div>
                </div>

                {/* Investor Pledge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                    <h3 className="font-bold text-emerald-800 text-base">{t('register.investorPledge.title')}</h3>
                  </div>
                  <div className="bg-white border border-emerald-200 rounded-lg p-4 mb-4 text-sm text-gray-700 leading-relaxed">
                    <p>
                      {t('register.investorPledge.text1')}
                    </p>
                    <p className="mt-2">
                      {t('register.investorPledge.text2')}
                    </p>
                    <p className="mt-2">
                      {t('register.investorPledge.text3')}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptInvestorPledge"
                      checked={acceptedInvestorPledge}
                      onChange={(e) => setAcceptedInvestorPledge(e.target.checked)}
                      className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="acceptInvestorPledge" className="text-sm text-gray-700 font-medium">
                      {t('register.investorPledge.checkbox')}
                    </label>
                  </div>
                </motion.div>
              </>
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
                {t('register.termsAgree')}{' '}
                <Link to="/terms-of-use" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                  {t('register.termsOfUse')}
                </Link>
                {' '}{t('register.and')}{' '}
                <Link to="/privacy-policy" target="_blank" className="text-blue-600 hover:text-blue-800 underline">
                  {t('register.privacyPolicy')}
                </Link>
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !acceptedTerms || (formData.role === 'investor' && !acceptedInvestorPledge)}
              className={`w-full text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r ${
                formData.role === 'investor' ? 'from-emerald-500 to-teal-600' : 'from-blue-500 to-blue-600'
              }`}
            >
              {loading ? t('register.creatingAccount') : t('register.createAccountButton')}
            </motion.button>
          </form>

          {/* Google Sign-In */}
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('auth.or')}</span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleLoginButton label={t('auth.registerWithGoogle') || 'التسجيل باستخدام Google'} />
          </div>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {t('register.haveAccount')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};