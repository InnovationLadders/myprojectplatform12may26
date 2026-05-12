import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  School, 
  GraduationCap, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Info, 
  Send,
  MapPin,
  Hash,
  MessageSquare,
  Building
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { addSummerProgramRegistration } from '../lib/firebase';

export const SummerProgramEnrollment: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    parentPhone: '',
    city: '',
    idNumber: '',
    school: '',
    grade: '',
    educationAdministration: '',
    hasParticipatedBefore: false,
    previousProjects: '',
    interests: [] as string[],
    howDidYouHear: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const interests = [...prev.interests];
      if (interests.includes(interest)) {
        return { ...prev, interests: interests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...interests, interest] };
      }
    });
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.parentPhone || 
        !formData.city || !formData.idNumber || !formData.school || !formData.grade || 
        !formData.educationAdministration || !formData.howDidYouHear || formData.interests.length === 0) {
      setError(t('summerProgram.enrollmentForm.requiredField'));
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('summerProgram.enrollmentForm.invalidEmail'));
      return false;
    }

    // Phone validation
    const phoneRegex = /^\d{9,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, '')) || 
        !phoneRegex.test(formData.parentPhone.replace(/\D/g, ''))) {
      setError(t('summerProgram.enrollmentForm.invalidPhone'));
      return false;
    }

    // ID validation - simple check for now
    if (formData.idNumber.length < 5) {
      setError(t('summerProgram.enrollmentForm.invalidIdNumber'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await addSummerProgramRegistration(formData);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        parentPhone: '',
        city: '',
        idNumber: '',
        school: '',
        grade: '',
        educationAdministration: '',
        hasParticipatedBefore: false,
        previousProjects: '',
        interests: [],
        howDidYouHear: '',
        notes: ''
      });
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Error submitting summer program registration:', err);
      setError(t('summerProgram.enrollmentForm.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block mb-6">
            <img 
              src="/mashroui-logo.png" 
              alt={t('appName')} 
              className="h-32 w-auto"
            />
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t('summerProgram.title')}</h1>
          <p className="text-lg text-gray-600">{t('summerProgram.subtitle')}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {success ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('summerProgram.enrollmentForm.successMessage')}</h2>
              <p className="text-gray-600 mb-8">
                سيتم التواصل معك قريباً بخصوص البرنامج الصيفي. يمكنك العودة إلى الصفحة الرئيسية أو تسجيل الدخول إلى حسابك.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/"
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  العودة للصفحة الرئيسية
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  تسجيل الدخول
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{t('summerProgram.enrollmentForm.title')}</h2>
                  <p className="text-gray-600">{t('summerProgram.enrollmentForm.subtitle')}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => i18n.changeLanguage('ar')}
                    className={`px-3 py-1 rounded-lg ${i18n.language === 'ar' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  >
                    العربية
                  </button>
                  <button 
                    onClick={() => i18n.changeLanguage('en')}
                    className={`px-3 py-1 rounded-lg ${i18n.language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  >
                    English
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {i18n.language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.fullName')} *
                      </label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('summerProgram.enrollmentForm.fullNamePlaceholder')}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.email')} *
                      </label>
                      <div className="relative">
                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('summerProgram.enrollmentForm.emailPlaceholder')}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.phone')} *
                      </label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('summerProgram.enrollmentForm.phonePlaceholder')}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.parentPhone')} *
                      </label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.parentPhone}
                          onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('summerProgram.enrollmentForm.parentPhonePlaceholder')}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.city')} *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">{t('summerProgram.enrollmentForm.cityPlaceholder')}</option>
                          {t('summerProgram.cities', { returnObjects: true }).map((city: string) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.idNumber')} *
                      </label>
                      <div className="relative">
                        <Hash className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.idNumber}
                          onChange={(e) => handleInputChange('idNumber', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('summerProgram.enrollmentForm.idNumberPlaceholder')}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Educational Information */}
                <div className="bg-green-50 rounded-xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <School className="w-5 h-5" />
                    {i18n.language === 'ar' ? 'المعلومات التعليمية' : 'Educational Information'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.school')} *
                      </label>
                      <div className="relative">
                        <School className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.school}
                          onChange={(e) => handleInputChange('school', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('summerProgram.enrollmentForm.schoolPlaceholder')}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.grade')} *
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.grade}
                          onChange={(e) => handleInputChange('grade', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">{t('summerProgram.enrollmentForm.gradePlaceholder')}</option>
                          {t('summerProgram.grades', { returnObjects: true }).map((grade: string) => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.educationAdministration')} *
                      </label>
                      <div className="relative">
                        <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.educationAdministration}
                          onChange={(e) => handleInputChange('educationAdministration', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">{t('summerProgram.enrollmentForm.educationAdministrationPlaceholder')}</option>
                          {t('summerProgram.educationAdministrations', { returnObjects: true }).map((admin: string) => (
                            <option key={admin} value={admin}>{admin}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.hasParticipatedBefore')} *
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={formData.hasParticipatedBefore === true}
                            onChange={() => handleInputChange('hasParticipatedBefore', true)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>{t('summerProgram.enrollmentForm.yes')}</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={formData.hasParticipatedBefore === false}
                            onChange={() => handleInputChange('hasParticipatedBefore', false)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span>{t('summerProgram.enrollmentForm.no')}</span>
                        </label>
                      </div>
                    </div>

                    {formData.hasParticipatedBefore && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('summerProgram.enrollmentForm.previousProjects')} *
                        </label>
                        <textarea
                          value={formData.previousProjects}
                          onChange={(e) => handleInputChange('previousProjects', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('summerProgram.enrollmentForm.previousProjectsPlaceholder')}
                          required={formData.hasParticipatedBefore}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Interests and Preferences */}
                <div className="bg-purple-50 rounded-xl p-4 mb-6">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {i18n.language === 'ar' ? 'الاهتمامات والتفضيلات' : 'Interests and Preferences'}
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.interests')} *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {t('summerProgram.interests', { returnObjects: true }).map((interest: string) => (
                          <label key={interest} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.interests.includes(interest) 
                              ? 'bg-purple-100 border-purple-500 text-purple-700' 
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}>
                            <input
                              type="checkbox"
                              checked={formData.interests.includes(interest)}
                              onChange={() => handleInterestToggle(interest)}
                              className="sr-only"
                            />
                            <span className="text-sm">{interest}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.howDidYouHear')} *
                      </label>
                      <div className="relative">
                        <Info className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.howDidYouHear}
                          onChange={(e) => handleInputChange('howDidYouHear', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">{t('summerProgram.enrollmentForm.howDidYouHearPlaceholder')}</option>
                          {t('summerProgram.hearAboutUs', { returnObjects: true }).map((source: string) => (
                            <option key={source} value={source}>{source}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('summerProgram.enrollmentForm.notes')}
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                        <textarea
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('summerProgram.enrollmentForm.notesPlaceholder')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Information */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">{i18n.language === 'ar' ? 'معلومات مهمة' : 'Important Information'}</h4>
                      <ul className="space-y-1 text-yellow-700 text-sm">
                        <li>• {i18n.language === 'ar' ? 'سيتم مراجعة طلبك والرد عليك في أقرب وقت ممكن.' : 'Your application will be reviewed and we will respond as soon as possible.'}</li>
                        <li>• {i18n.language === 'ar' ? 'يرجى التأكد من صحة جميع المعلومات المقدمة.' : 'Please ensure all provided information is accurate.'}</li>
                        <li>• {i18n.language === 'ar' ? 'سيتم التواصل معك عبر البريد الإلكتروني أو الهاتف المقدم.' : 'You will be contacted via the provided email or phone number.'}</li>
                        <li>• {i18n.language === 'ar' ? 'البرنامج مخصص للطلاب في المرحلة المتوسطة والثانوية.' : 'The program is designed for middle and high school students.'}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {t('summerProgram.enrollmentForm.submitting')}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t('summerProgram.enrollmentForm.submit')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>© 2025 {t('appName')} - {t('appTagline')}</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              {i18n.language === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
            </Link>
            <Link to="/login" className="hover:text-blue-600 transition-colors">
              {i18n.language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Link>
            <Link to="/register" className="hover:text-blue-600 transition-colors">
              {i18n.language === 'ar' ? 'إنشاء حساب' : 'Register'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummerProgramEnrollment;