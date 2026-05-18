import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, TriangleAlert as AlertTriangle, Mail, Phone, RefreshCw, LogOut, CircleCheck as CheckCircle, Circle as XCircle, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const PendingActivationPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const hasReloaded = useRef(false);

  const isSchool = user?.role === 'school';
  const isConsultant = user?.role === 'consultant';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  // Listen for real-time status changes so the student is redirected automatically when admin approves
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      if (data.status === 'active' && !hasReloaded.current) {
        hasReloaded.current = true;
        window.location.reload();
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <div className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-16 h-16 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('pendingActivation.title')}</h1>
          <p className="text-gray-600 text-lg">
            {isStudent
              ? 'حسابك في انتظار الموافقة من قِبل جهتك التعليمية. ستصلك رسالة على بريدك الإلكتروني عند الموافقة على حسابك.'
              : isSchool
                ? t('pendingActivation.description.school')
                : isConsultant
                  ? t('pendingActivation.description.consultant')
                  : isTeacher
                    ? t('pendingActivation.description.teacher')
                    : t('pendingActivation.description.default')}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-blue-800 mb-2">{t('pendingActivation.whatHappensNext')}</h2>
              {isStudent ? (
                <ul className="space-y-2 text-blue-700">
                  <li>• تم إرسال إشعار لمسؤول جهتك التعليمية بطلب انضمامك</li>
                  <li>• سيقوم بمراجعة بياناتك والموافقة على انضمامك</li>
                  <li>• بمجرد الموافقة ستصلك رسالة تأكيد على بريدك الإلكتروني <strong>{user?.email}</strong></li>
                  <li>• ستنتقل تلقائياً للمنصة عند الموافقة دون الحاجة للتحديث اليدوي</li>
                </ul>
              ) : (
                <ul className="space-y-2 text-blue-700">
                  <li>• {t('pendingActivation.steps.review')}</li>
                  <li>• {t('pendingActivation.steps.verify')}</li>
                  <li>• {t('pendingActivation.steps.email')}</li>
                  <li>• {t('pendingActivation.steps.timeframe')}</li>
                </ul>
              )}
            </div>
          </div>
        </div>

        {isStudent && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Mail className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-800 text-sm">
              سيتم إرسال رسالة تأكيد إلى <strong>{user?.email}</strong> فور موافقة إدارة المؤسسة على حسابك. تأكد من مراجعة بريدك الإلكتروني.
            </p>
          </div>
        )}

        <div className="border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">{t('pendingActivation.contactInfo')}</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">{t('common.email')}</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            {user?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">{t('common.phone')}</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{t('pendingActivation.approvalStates.approved')}</h3>
              <p className="text-sm text-gray-600">{t('pendingActivation.approvalStates.approvedDesc')}</p>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{t('pendingActivation.approvalStates.rejected')}</h3>
              <p className="text-sm text-gray-600">{t('pendingActivation.approvalStates.rejectedDesc')}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-800 mb-2">{t('pendingActivation.needHelp')}</h2>
              <p className="text-gray-600 mb-4">
                {t('pendingActivation.helpText')}
                <a href="mailto:support@mashroui.com" className="text-blue-600 hover:underline mx-1">sales@innovationladders.com</a>
              </p>
            </div>
          </div>
        </div>

        {isStudent && (
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-500">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            يتم مراقبة حالة حسابك تلقائياً
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            {t('pendingActivation.refreshPage')}
          </button>

          <button
            onClick={logout}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            {t('pendingActivation.logout')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};