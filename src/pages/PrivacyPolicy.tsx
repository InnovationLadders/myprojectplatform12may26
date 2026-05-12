import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Database, Eye, UserCheck, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
            ← {t('legal.backToHome')}
          </Link>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">{t('legal.privacyPolicy.title')}</h1>
          </div>
          <p className="text-gray-600 mt-2">{t('legal.privacyPolicy.lastUpdated')}: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-8 space-y-8"
        >
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              {t('legal.privacyPolicy.introduction.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.privacyPolicy.introduction.content')}
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-green-600" />
              {t('legal.privacyPolicy.dataCollection.title')}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.privacyPolicy.dataCollection.personalInfo.title')}
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
                  <li>{t('legal.privacyPolicy.dataCollection.personalInfo.name')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.personalInfo.email')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.personalInfo.phone')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.personalInfo.school')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.personalInfo.grade')}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.privacyPolicy.dataCollection.projectInfo.title')}
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
                  <li>{t('legal.privacyPolicy.dataCollection.projectInfo.projects')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.projectInfo.tasks')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.projectInfo.files')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.projectInfo.comments')}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.privacyPolicy.dataCollection.technicalInfo.title')}
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
                  <li>{t('legal.privacyPolicy.dataCollection.technicalInfo.ip')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.technicalInfo.browser')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.technicalInfo.device')}</li>
                  <li>{t('legal.privacyPolicy.dataCollection.technicalInfo.activity')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-purple-600" />
              {t('legal.privacyPolicy.dataUsage.title')}
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.privacyPolicy.dataUsage.service')}</li>
              <li>{t('legal.privacyPolicy.dataUsage.communication')}</li>
              <li>{t('legal.privacyPolicy.dataUsage.improvement')}</li>
              <li>{t('legal.privacyPolicy.dataUsage.security')}</li>
              <li>{t('legal.privacyPolicy.dataUsage.analytics')}</li>
              <li>{t('legal.privacyPolicy.dataUsage.support')}</li>
            </ul>
          </section>

          {/* Data Storage */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.privacyPolicy.dataStorage.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.privacyPolicy.dataStorage.firebase')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.privacyPolicy.dataStorage.security')}
            </p>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.privacyPolicy.dataSharing.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.privacyPolicy.dataSharing.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.privacyPolicy.dataSharing.school')}</li>
              <li>{t('legal.privacyPolicy.dataSharing.teachers')}</li>
              <li>{t('legal.privacyPolicy.dataSharing.team')}</li>
              <li>{t('legal.privacyPolicy.dataSharing.service')}</li>
              <li>{t('legal.privacyPolicy.dataSharing.legal')}</li>
            </ul>
          </section>

          {/* Student Data Protection */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-orange-600" />
              {t('legal.privacyPolicy.studentProtection.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.privacyPolicy.studentProtection.commitment')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.privacyPolicy.studentProtection.noAds')}</li>
              <li>{t('legal.privacyPolicy.studentProtection.noSelling')}</li>
              <li>{t('legal.privacyPolicy.studentProtection.parentalAccess')}</li>
              <li>{t('legal.privacyPolicy.studentProtection.ageAppropriate')}</li>
              <li>{t('legal.privacyPolicy.studentProtection.schoolControl')}</li>
            </ul>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.privacyPolicy.userRights.title')}
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.privacyPolicy.userRights.access')}</li>
              <li>{t('legal.privacyPolicy.userRights.correction')}</li>
              <li>{t('legal.privacyPolicy.userRights.deletion')}</li>
              <li>{t('legal.privacyPolicy.userRights.export')}</li>
              <li>{t('legal.privacyPolicy.userRights.objection')}</li>
              <li>{t('legal.privacyPolicy.userRights.withdraw')}</li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.privacyPolicy.cookies.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.privacyPolicy.cookies.description')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.privacyPolicy.cookies.essential')}</li>
              <li>{t('legal.privacyPolicy.cookies.preferences')}</li>
              <li>{t('legal.privacyPolicy.cookies.analytics')}</li>
            </ul>
          </section>

          {/* Third Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.privacyPolicy.thirdParty.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.privacyPolicy.thirdParty.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.privacyPolicy.thirdParty.firebase')}</li>
              <li>{t('legal.privacyPolicy.thirdParty.googleAuth')}</li>
              <li>{t('legal.privacyPolicy.thirdParty.classera')}</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.privacyPolicy.dataRetention.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.privacyPolicy.dataRetention.description')}
            </p>
          </section>

          {/* Policy Changes */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.privacyPolicy.policyChanges.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.privacyPolicy.policyChanges.description')}
            </p>
          </section>

          {/* Contact */}
          <section className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              {t('legal.privacyPolicy.contact.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.privacyPolicy.contact.description')}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>{t('legal.privacyPolicy.contact.email')}:</strong> sales@innovationladders.com
              </p>
              <p className="text-gray-700 mt-2">
                <strong>{t('legal.privacyPolicy.contact.phone')}:</strong> 966554344899
              </p>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
};
