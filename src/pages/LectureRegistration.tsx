import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Presentation, Clock, Video, MonitorPlay, Calendar,
  Info, ExternalLink,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ZOOM_LINK = 'https://us06web.zoom.us/j/83977271037?pwd=arFRfUDdZKXX6EHZ7JstrZQGArRkjd.1';

export const LectureRegistration: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

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

        {/* Live Lecture Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white bg-opacity-10 rounded-full -translate-y-24 translate-x-24" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white bg-opacity-10 rounded-full translate-y-16 -translate-x-16" />

          <div className="relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white bg-opacity-25 px-4 py-1.5 rounded-full text-sm font-bold mb-5">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              {t('lectureRegistration.liveLecture.badge')}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              {t('lectureRegistration.liveLecture.title')}
            </h1>

            {/* Message */}
            <p className="text-base md:text-lg opacity-95 max-w-2xl leading-relaxed">
              {t('lectureRegistration.liveLecture.message')}
            </p>

            {/* Info chips */}
            <div className="flex flex-wrap gap-4 mt-7 pt-6 border-t border-white border-opacity-20">
              <div className="flex items-center gap-2 bg-white bg-opacity-15 px-4 py-2 rounded-xl">
                <Calendar className="w-5 h-5 opacity-90" />
                <div className="text-sm">
                  <span className="opacity-75 block">{t('lectureRegistration.liveLecture.dayLabel')}</span>
                  <span className="font-semibold">{t('lectureRegistration.liveLecture.dayValue')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-15 px-4 py-2 rounded-xl">
                <Clock className="w-5 h-5 opacity-90" />
                <div className="text-sm">
                  <span className="opacity-75 block">{t('lectureRegistration.liveLecture.timeLabel')}</span>
                  <span className="font-semibold">{t('lectureRegistration.liveLecture.timeValue')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-15 px-4 py-2 rounded-xl">
                <MonitorPlay className="w-5 h-5 opacity-90" />
                <div className="text-sm">
                  <span className="opacity-75 block">{t('lectureRegistration.liveLecture.modeLabel')}</span>
                  <span className="font-semibold">{t('lectureRegistration.liveLecture.modeValue')}</span>
                </div>
              </div>
            </div>

            {/* Zoom Join Button */}
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href={ZOOM_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 w-full md:w-auto inline-flex items-center justify-center gap-3 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all"
            >
              <Video className="w-6 h-6" />
              {t('lectureRegistration.liveLecture.joinButton')}
              <ExternalLink className="w-5 h-5 opacity-70" />
            </motion.a>
          </div>
        </motion.div>

        {/* Note Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg p-6 mt-6"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-1">
                {t('lectureRegistration.liveLecture.noteTitle')}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('lectureRegistration.liveLecture.noteMessage')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Lecture Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8 mt-6"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Presentation className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {t('lectureRegistration.lectureTitle')}
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {t('lectureRegistration.lectureSubtitle')}
              </p>
            </div>
          </div>
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
