import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Building2, BadgeCheck, MessageSquare, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Loader as Loader2, Send, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { addLectureRegistration } from '../../lib/firebase';

const EMPTY_FORM = { fullName: '', email: '', phone: '', affiliation: '', role: '', notes: '' };
const EMAIL_PATTERN = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

type FormValues = typeof EMPTY_FORM;

export const LectureRegistrationForm: React.FC = () => {
  const { t } = useTranslation();
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const rolesValue = t('lectureRegistration.roles', { returnObjects: true });
  const roles = Array.isArray(rolesValue) ? (rolesValue as string[]) : [];

  const update = (field: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues(prev => ({ ...prev, [field]: e.target.value }));
      if (error) setError('');
    };

  const validate = (): string => {
    const { fullName, email, phone, affiliation, role } = values;
    if (!fullName.trim() || !email.trim() || !phone.trim() || !affiliation.trim() || !role) {
      return t('lectureRegistration.errors.required');
    }
    if (!EMAIL_PATTERN.test(email.trim())) return t('lectureRegistration.errors.invalidEmail');
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) return t('lectureRegistration.errors.invalidPhone');
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      await addLectureRegistration({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        affiliation: values.affiliation.trim(),
        role: values.role,
        notes: values.notes.trim(),
        registrationType: 'lecture',
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'DUPLICATE_EMAIL'
          ? t('lectureRegistration.errors.duplicateEmail')
          : t('lectureRegistration.errors.general')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setValues(EMPTY_FORM);
    setSubmitted(false);
    setError('');
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 ps-11 pe-4 py-3 text-gray-800 placeholder-gray-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100';

  const fields: { key: keyof FormValues; icon: React.ElementType; type: string; dir?: 'ltr' }[] = [
    { key: 'fullName', icon: User, type: 'text' },
    { key: 'email', icon: Mail, type: 'email', dir: 'ltr' },
    { key: 'phone', icon: Phone, type: 'tel', dir: 'ltr' },
    { key: 'affiliation', icon: Building2, type: 'text' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.45 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mt-6"
    >
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('lectureRegistration.successTitle')}</h3>
            <p className="text-gray-600 leading-relaxed max-w-md mx-auto">{t('lectureRegistration.successMessage')}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                {t('lectureRegistration.registerAnother')}
              </button>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                {t('lectureRegistration.backHome')}
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={handleSubmit} noValidate exit={{ opacity: 0 }}>
            <div className="mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">{t('lectureRegistration.formTitle')}</h2>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">{t('lectureRegistration.formSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fields.map(({ key, icon: Icon, type, dir }) => (
                <label key={key} className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {t(`lectureRegistration.fields.${key}`)} <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <Icon className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type={type}
                      dir={dir}
                      value={values[key]}
                      onChange={update(key)}
                      placeholder={t(`lectureRegistration.placeholders.${key}`)}
                      maxLength={200}
                      className={inputClass}
                    />
                  </div>
                </label>
              ))}

              <label className="block md:col-span-2">
                <span className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('lectureRegistration.fields.role')} <span className="text-red-500">*</span>
                </span>
                <div className="relative">
                  <BadgeCheck className="absolute start-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select value={values.role} onChange={update('role')} className={`${inputClass} appearance-none`}>
                    <option value="">{t('lectureRegistration.placeholders.role')}</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="block md:col-span-2">
                <span className="block text-sm font-semibold text-gray-700 mb-1.5">{t('lectureRegistration.fields.notes')}</span>
                <div className="relative">
                  <MessageSquare className="absolute start-3.5 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  <textarea
                    value={values.notes}
                    onChange={update('notes')}
                    placeholder={t('lectureRegistration.placeholders.notes')}
                    rows={3}
                    maxLength={1000}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </label>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.01 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-shadow hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {submitting ? t('lectureRegistration.submitting') : t('lectureRegistration.submit')}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LectureRegistrationForm;
