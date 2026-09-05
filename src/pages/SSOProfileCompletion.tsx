import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap, Phone, MapPin, BookOpen, User, Building, Briefcase,
  TrendingUp, Award, Languages, FileText, CircleAlert as AlertCircle,
  Loader as Loader2, CircleCheck as CheckCircle,
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { GRADES } from '../constants/grades';
import { getSchools } from '../lib/firebase';
import { useSchoolBranding } from '../contexts/SchoolBrandingContext';

const SPECIALIZATIONS = [
  'الذكاء الاصطناعي', 'تعلم الآلة', 'الروبوتات', 'تطوير التطبيقات',
  'تطوير الويب', 'قواعد البيانات', 'الأمن السيبراني', 'الشبكات',
  'التصميم الجرافيكي', 'تجربة المستخدم', 'التسويق الرقمي', 'ريادة الأعمال',
  'إدارة المشاريع', 'العلوم', 'الرياضيات', 'الفيزياء', 'الكيمياء',
  'الأحياء', 'الهندسة الميكانيكية', 'الهندسة الكهربائية', 'الهندسة المدنية',
  'الطب العام', 'طب الأطفال', 'الجراحة العامة', 'أخرى',
];

const AVAILABLE_LANGUAGES = [
  'العربية', 'الإنجليزية', 'الفرنسية', 'الإسبانية', 'الألمانية',
  'الصينية', 'اليابانية', 'الروسية', 'الهندية', 'البرتغالية',
];

export const SSOProfileCompletion: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { schoolId: subdomainSchoolId, schoolName: subdomainSchoolName } = useSchoolBranding();

  const isGoogleUser = user?.sso_provider === 'google';
  const isKfupmUser = user?.sso_provider === 'kfupm';
  const hasExistingRole = (isGoogleUser || isKfupmUser) ? !!user?.role : false;
  const isStudent = hasExistingRole && user?.role === 'student';
  const isTeacher = hasExistingRole && user?.role === 'teacher';

  const [formData, setFormData] = useState({
    role: (hasExistingRole ? user?.role : '') as string,
    phone: '',
    city: '',
    grade: '',
    schoolIdNumber: user?.sso_upn || '',
    gender: '' as 'male' | 'female' | '',
    subject: '',
    bio: '',
    school_id: user?.school_id || '',
    specializations: [] as string[],
    otherSpecialization: '',
    experience_years: 0,
    hourly_rate: 0,
    languages: ['العربية'] as string[],
    company_name: '',
    investment_interests: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedInvestorPledge, setAcceptedInvestorPledge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [isSubdomainRegistration, setIsSubdomainRegistration] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      if (!isGoogleUser && !isKfupmUser) {
        setSchoolsLoading(false);
        return;
      }
      try {
        setSchoolsLoading(true);
        if (subdomainSchoolId && subdomainSchoolName) {
          setIsSubdomainRegistration(true);
          setSchools([{ id: subdomainSchoolId, name: subdomainSchoolName }]);
          setFormData(prev => ({ ...prev, school_id: subdomainSchoolId }));
        } else {
          const fetchedSchools = await getSchools();
          setSchools(fetchedSchools || []);
        }
      } catch (err) {
        console.error('Error fetching schools:', err);
        setSchools([]);
      } finally {
        setSchoolsLoading(false);
      }
    };
    fetchSchools();
  }, [isGoogleUser, subdomainSchoolId, subdomainSchoolName]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecializationToggle = (sp: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(sp)
        ? prev.specializations.filter(s => s !== sp)
        : [...prev.specializations, sp],
    }));
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasExistingRole && !formData.role) {
      setError('الرجاء اختيار نوع الحساب');
      return;
    }
    if (!formData.gender) {
      setError('الرجاء تحديد الجنس');
      return;
    }
    if (!acceptedTerms) {
      setError('يجب الموافقة على الشروط والأحكام للمتابعة');
      return;
    }

    const selectedRole = !hasExistingRole ? formData.role : user?.role;

    if (selectedRole === 'student' && !formData.grade) {
      setError('المرحلة/المستوى الدراسي');
      return;
    }
    if ((selectedRole === 'student' || selectedRole === 'teacher') && !formData.school_id) {
      setError('الرجاء اختيار المؤسسة التعليمية');
      return;
    }
    if (selectedRole === 'investor' && !acceptedInvestorPledge) {
      setError('يجب الموافقة على تعهد المستثمر للمتابعة');
      return;
    }

    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setError('انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.');
        return;
      }

      const updateData: Record<string, any> = {
        phone: formData.phone || null,
        city: formData.city || null,
        gender: formData.gender || null,
        profile_incomplete: false,
        updated_at: new Date(),
      };

      if (isGoogleUser) {
        updateData.role = selectedRole;
      }

      // Role-specific fields
      if (selectedRole === 'student') {
        updateData.grade = formData.grade;
        updateData.school_id = formData.school_id;
      }
      if (selectedRole === 'teacher') {
        updateData.subject = formData.subject || null;
        updateData.school_id = formData.school_id;
      }
      if (selectedRole === 'school') {
        updateData.school_id = firebaseUser.uid;
        updateData.bio = formData.bio || null;
      }
      if (selectedRole === 'consultant') {
        updateData.bio = formData.bio || null;
        let finalSpecs = [...formData.specializations];
        if (formData.specializations.includes('أخرى') && formData.otherSpecialization.trim()) {
          finalSpecs = finalSpecs.filter(s => s !== 'أخرى');
          finalSpecs.push(formData.otherSpecialization.trim());
        }
        updateData.specializations = finalSpecs;
        updateData.experience_years = formData.experience_years || 0;
        updateData.hourly_rate = formData.hourly_rate || 0;
        updateData.rating = 5.0;
        updateData.reviews_count = 0;
        updateData.languages = formData.languages;
      }
      if (selectedRole === 'investor') {
        updateData.company_name = formData.company_name || null;
        updateData.investment_interests = formData.investment_interests || null;
        updateData.agreed_to_investor_pledge = acceptedInvestorPledge;
      }
      if (formData.schoolIdNumber) {
        updateData.schoolIdNumber = formData.schoolIdNumber;
      }

      // Determine the correct status after profile completion
      let newStatus = 'active';
      if (selectedRole === 'school' || selectedRole === 'consultant' || selectedRole === 'teacher') {
        newStatus = 'pending';
      } else if (selectedRole === 'student' && formData.school_id) {
        // Could check require_student_approval, but default to active for Google users
        newStatus = 'active';
      }
      updateData.status = newStatus;

      await updateDoc(doc(db, 'users', firebaseUser.uid), updateData);
      await refreshUser();

      if (newStatus === 'pending') {
        navigate('/pending-activation', { replace: true });
      } else {
        navigate(selectedRole === 'investor' ? '/gallery' : '/projects', { replace: true });
      }
    } catch (err: any) {
      console.error('[SSOProfileCompletion] Error updating profile:', err);
      setError('حدث خطأ أثناء حفظ البيانات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = isGoogleUser ? formData.role : user?.role;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center mx-auto mb-4"
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">استكمال البيانات</h1>
            <p className="text-gray-600 text-sm">
              {user?.sso_provider === 'google'
                ? 'تم تسجيل دخولك بنجاح عبر حساب جوجل. الرجاء استكمال بياناتك للمتابعة.'
                : user?.sso_provider === 'kfupm'
                ? 'تم تسجيل دخولك بنجاح عبر حساب جامعة الملك فهد. الرجاء استكمال بياناتك للمتابعة.'
                : 'تم تسجيل دخولك بنجاح. الرجاء استكمال بياناتك للمتابعة.'}
            </p>
          </div>

          {/* Read-only SSO info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              {user?.avatar && (
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection — only for SSO users who don't have a role yet */}
            {!hasExistingRole && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الحساب
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'student', label: 'طالب', icon: GraduationCap },
                    { value: 'teacher', label: 'مشرف', icon: BookOpen },
                    { value: 'consultant', label: 'مستشار', icon: Briefcase },
                    { value: 'school', label: 'مؤسسة تعليمية', icon: Building },
                    { value: 'investor', label: 'مستثمر', icon: TrendingUp },
                  ].map(({ value, label, icon: Icon }) => (
                    <label
                      key={value}
                      className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                        value === 'investor' ? 'col-span-2 md:col-span-1' : ''
                      } ${
                        formData.role === value
                          ? value === 'investor'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={formData.role === value}
                        onChange={() => handleInputChange('role', value)}
                        className="sr-only"
                      />
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الجنس</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.gender === 'male' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={() => handleInputChange('gender', 'male')} className="sr-only" />
                  <span className="font-medium">ذكر</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.gender === 'female' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={() => handleInputChange('gender', 'female')} className="sr-only" />
                  <span className="font-medium">أنثى</span>
                </label>
              </div>
            </div>

            {/* Student-specific fields */}
            {selectedRole === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المؤسسة التعليمية</label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.school_id}
                      onChange={e => handleInputChange('school_id', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isSubdomainRegistration}
                    >
                      <option value="">اختر المؤسسة التعليمية</option>
                      {schoolsLoading && <option disabled>جاري التحميل...</option>}
                      {!schoolsLoading && schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {isSubdomainRegistration && (
                    <p className="mt-2 text-sm text-blue-600">التسجيل في: {subdomainSchoolName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المرحلة/المستوى الدراسي</label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.grade}
                      onChange={e => handleInputChange('grade', e.target.value)}
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      required
                    >
                      <option value="">اخترالمستوى/ الصف</option>
                      {GRADES.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Teacher-specific fields */}
            {selectedRole === 'teacher' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المؤسسة التعليمية</label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.school_id}
                      onChange={e => handleInputChange('school_id', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isSubdomainRegistration}
                    >
                      <option value="">اختر المؤسسة التعليمية</option>
                      {schoolsLoading && <option disabled>جاري التحميل...</option>}
                      {!schoolsLoading && schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المادة الدراسية</label>
                  <div className="relative">
                    <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={e => handleInputChange('subject', e.target.value)}
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="مثال: الرياضيات"
                    />
                  </div>
                </div>
              </>
            )}

            {/* School ID Number — for student and teacher */}
            {(selectedRole === 'student' || selectedRole === 'teacher') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedRole === 'student' ? 'الرقم الجامعي / الرقم الأكاديمي' : 'الرقم الوظيفي'}
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.schoolIdNumber}
                    onChange={e => handleInputChange('schoolIdNumber', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={selectedRole === 'student' ? 'الرقم الجامعي' : 'الرقم الوظيفي'}
                  />
                </div>
              </div>
            )}

            {/* Consultant-specific fields */}
            {selectedRole === 'consultant' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نبذة مهنية</label>
                  <textarea
                    value={formData.bio}
                    onChange={e => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="اكتب نبذة مختصرة عن خبرتك المهنية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">التخصصات</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SPECIALIZATIONS.map(sp => (
                      <label key={sp} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.specializations.includes(sp) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <input type="checkbox" checked={formData.specializations.includes(sp)} onChange={() => handleSpecializationToggle(sp)} className="sr-only" />
                        <span className="text-sm">{sp}</span>
                      </label>
                    ))}
                  </div>
                  {formData.specializations.includes('أخرى') && (
                    <div className="mt-4">
                      <input
                        type="text"
                        value={formData.otherSpecialization}
                        onChange={e => handleInputChange('otherSpecialization', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="اكتب تخصصك الآخر"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">سنوات الخبرة</label>
                    <div className="relative">
                      <Award className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.experience_years}
                        onChange={e => handleInputChange('experience_years', parseInt(e.target.value) || 0)}
                        className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">السعر بالساعة</label>
                    <input
                      type="number"
                      value={formData.hourly_rate}
                      onChange={e => handleInputChange('hourly_rate', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اللغات</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {AVAILABLE_LANGUAGES.map(lang => (
                      <label key={lang} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.languages.includes(lang) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                      }`}>
                        <input type="checkbox" checked={formData.languages.includes(lang)} onChange={() => handleLanguageToggle(lang)} className="sr-only" />
                        <span className="text-sm">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* School-specific fields */}
            {selectedRole === 'school' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">معلومات المؤسسة</label>
                <textarea
                  value={formData.bio}
                  onChange={e => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اكتب نبذة عن المؤسسة التعليمية"
                />
              </div>
            )}

            {/* Investor-specific fields */}
            {selectedRole === 'investor' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم الشركة <span className="text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={e => handleInputChange('company_name', e.target.value)}
                      className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="اسم الشركة أو الجهة المستثمرة"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اهتمامات الاستثمار</label>
                  <textarea
                    value={formData.investment_interests}
                    onChange={e => handleInputChange('investment_interests', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="اكتب مجالات استثمارك"
                  />
                </div>

                <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                    <h3 className="font-bold text-emerald-800 text-base">تعهد المستثمر</h3>
                  </div>
                  <div className="bg-white border border-emerald-200 rounded-lg p-4 mb-4 text-sm text-gray-700 leading-relaxed">
                    <p>أتعهد بأنني سأستخدم المنصة لأغراض استثمارية مشروعة وأن أحترم حقوق الملكية الفكرية للمشاريع.</p>
                    <p className="mt-2">سأحافظ على سرية المعلومات ولن أستخدمها لأي أغراض ضارة بالمشاريع أو أصحابها.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptInvestorPledge"
                      checked={acceptedInvestorPledge}
                      onChange={e => setAcceptedInvestorPledge(e.target.checked)}
                      className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="acceptInvestorPledge" className="text-sm text-gray-700 font-medium">
                      أوافق على تعهد المستثمر
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => handleInputChange('city', e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: الظهران"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                أوافق على{' '}
                <a href="/terms-of-use" target="_blank" className="text-blue-600 hover:text-blue-800 underline">شروط الاستخدام</a>
                {' '}و{' '}
                <a href="/privacy-policy" target="_blank" className="text-blue-600 hover:text-blue-800 underline">سياسة الخصوصية</a>
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r ${
                selectedRole === 'investor' ? 'from-emerald-500 to-teal-600' : 'from-blue-500 to-blue-600'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ ومتابعة'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
