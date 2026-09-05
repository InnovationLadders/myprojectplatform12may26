import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, Building, GraduationCap,
  CircleCheck as CheckCircle, TriangleAlert as AlertTriangle,
  Send, Calendar, MapPin, Info, MessageSquare, Presentation,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { addLectureRegistration } from '../lib/firebase';

export const LectureRegistration: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    affiliation: '',
    role: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.affiliation || !formData.role) {
      setError(t('lectureRegistration.errors.required'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('lectureRegistration.errors.invalidEmail'));
      return false;
    }
    const phoneRegex = /^\d{9,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      setError(t('lectureRegistration.errors.invalidPhone'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await addLectureRegistration({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        affiliation: formData.affiliation,
        role: formData.role,
        notes: formData.notes,
      });
      setSuccess(true);
      setFormData({ fullName: '', email: '', phone: '', affiliation: '', role: '', notes: '' });
      window.scrollTo(0, 0);
    } catch (err: any) {
      if (err?.message === 'DUPLICATE_EMAIL') {
        setError(t('lectureRegistration.errors.duplicateEmail'));
      } else {
        setError(t('lectureRegistration.errors.general'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAnother = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block mb-6">
            <img
              src="/mashrouilogo.png"
              alt={t('appName')}
              className="h-28 w-auto mx-auto"
            />
          </Link>
        </div>

        {/* Lecture Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Presentation className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {t('lectureRegistration.lectureTitle')}
              </h1>
              <p className="text-lg opacity-90 mt-1">
                {t('lectureRegistration.lectureSubtitle')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white border-opacity-20">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 opacity-80" />
              <span className="text-sm font-medium">
                {t('lectureRegistration.lectureDate')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 opacity-80" />
              <span className="text-sm font-medium">
                {t('lectureRegistration.lectureDay')}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {success ? (
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {t('lectureRegistration.successTitle')}
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {t('lectureRegistration.successMessage')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRegisterAnother}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {t('lectureRegistration.registerAnother')}
                </button>
                <Link
                  to="/"
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {t('lectureRegistration.backHome')}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {t('lectureRegistration.formTitle')}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {t('lectureRegistration.formSubtitle')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => i18n.changeLanguage('ar')}
                    className={`px-3 py-1 rounded-lg text-sm ${i18n.language === 'ar' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`px-3 py-1 rounded-lg text-sm ${i18n.language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    English
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2"
                >
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>{error}</div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lectureRegistration.fields.fullName')} *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t('lectureRegistration.placeholders.fullName')}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lectureRegistration.fields.email')} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t('lectureRegistration.placeholders.email')}
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lectureRegistration.fields.phone')} *
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t('lectureRegistration.placeholders.phone')}
                      required
                    />
                  </div>
                </div>

                {/* Affiliation (School/Organization) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lectureRegistration.fields.affiliation')} *
                  </label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.affiliation}
                      onChange={(e) => handleInputChange('affiliation', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t('lectureRegistration.placeholders.affiliation')}
                      required
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lectureRegistration.fields.role')} *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                      required
                    >
                      <option value="">{t('lectureRegistration.placeholders.role')}</option>
                      {t('lectureRegistration.roles', { returnObjects: true }).map((role: string) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('lectureRegistration.fields.notes')}
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder={t('lectureRegistration.placeholders.notes')}
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">
                        {t('lectureRegistration.infoTitle')}
                      </h4>
                      <ul className="space-y-1 text-blue-700 text-sm">
                        <li>{t('lectureRegistration.infoPoints.point1')}</li>
                        <li>{t('lectureRegistration.infoPoints.point2')}</li>
                        <li>{t('lectureRegistration.infoPoints.point3')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t('lectureRegistration.submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t('lectureRegistration.submit')}
                    </>
                  )}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>&copy; 2026 {t('appName')}</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              {isRTL ? 'الصفحة الرئيسية' : 'Home'}
            </Link>
            <Link to="/login" className="hover:text-blue-600 transition-colors">
              {isRTL ? 'تسجيل الدخول' : 'Login'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LectureRegistration;
