import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, 
  AlertTriangle, 
  Mail, 
  Phone, 
  RefreshCw, 
  LogOut,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PendingActivationPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const isSchool = user?.role === 'school';
  const isConsultant = user?.role === 'consultant';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
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
            {isSchool 
              ? t('pendingActivation.description.school')
              : isConsultant
                ? t('pendingActivation.description.consultant')
                : t('pendingActivation.description.default')}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-blue-800 mb-2">{t('pendingActivation.whatHappensNext')}</h2>
              <ul className="space-y-2 text-blue-700">
                <li>• {t('pendingActivation.steps.review')}</li>
                <li>• {t('pendingActivation.steps.verify')}</li>
                <li>• {t('pendingActivation.steps.email')}</li>
                <li>• {t('pendingActivation.steps.timeframe')}</li>
              </ul>
            </div>
          </div>
        </div>

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
                <a href="mailto:support@mashroui.com" className="text-blue-600 hover:underline mx-1">support@mashroui.com</a>
              </p>
            </div>
          </div>
        </div>

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