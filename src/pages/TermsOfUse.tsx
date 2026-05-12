import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, AlertTriangle, Shield, Users, Gavel } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const TermsOfUse: React.FC = () => {
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
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">{t('legal.termsOfUse.title')}</h1>
          </div>
          <p className="text-gray-600 mt-2">{t('legal.termsOfUse.lastUpdated')}: {new Date().toLocaleDateString('ar-SA')}</p>
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
              <CheckCircle className="w-6 h-6 text-blue-600" />
              {t('legal.termsOfUse.introduction.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.termsOfUse.introduction.welcome')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.termsOfUse.introduction.acceptance')}
            </p>
          </section>

          {/* Definitions */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.definitions.title')}
            </h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li><strong>{t('legal.termsOfUse.definitions.platform')}:</strong> {t('legal.termsOfUse.definitions.platformDesc')}</li>
              <li><strong>{t('legal.termsOfUse.definitions.user')}:</strong> {t('legal.termsOfUse.definitions.userDesc')}</li>
              <li><strong>{t('legal.termsOfUse.definitions.content')}:</strong> {t('legal.termsOfUse.definitions.contentDesc')}</li>
              <li><strong>{t('legal.termsOfUse.definitions.services')}:</strong> {t('legal.termsOfUse.definitions.servicesDesc')}</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" />
              {t('legal.termsOfUse.account.title')}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.termsOfUse.account.eligibility.title')}
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
                  <li>{t('legal.termsOfUse.account.eligibility.age')}</li>
                  <li>{t('legal.termsOfUse.account.eligibility.parental')}</li>
                  <li>{t('legal.termsOfUse.account.eligibility.accurate')}</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.termsOfUse.account.security.title')}
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
                  <li>{t('legal.termsOfUse.account.security.password')}</li>
                  <li>{t('legal.termsOfUse.account.security.confidential')}</li>
                  <li>{t('legal.termsOfUse.account.security.notify')}</li>
                  <li>{t('legal.termsOfUse.account.security.liability')}</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.responsibilities.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.termsOfUse.responsibilities.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.termsOfUse.responsibilities.lawful')}</li>
              <li>{t('legal.termsOfUse.responsibilities.respectful')}</li>
              <li>{t('legal.termsOfUse.responsibilities.accurate')}</li>
              <li>{t('legal.termsOfUse.responsibilities.rights')}</li>
              <li>{t('legal.termsOfUse.responsibilities.security')}</li>
              <li>{t('legal.termsOfUse.responsibilities.appropriate')}</li>
            </ul>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              {t('legal.termsOfUse.prohibited.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.termsOfUse.prohibited.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.termsOfUse.prohibited.harm')}</li>
              <li>{t('legal.termsOfUse.prohibited.harassment')}</li>
              <li>{t('legal.termsOfUse.prohibited.spam')}</li>
              <li>{t('legal.termsOfUse.prohibited.impersonate')}</li>
              <li>{t('legal.termsOfUse.prohibited.malware')}</li>
              <li>{t('legal.termsOfUse.prohibited.reverse')}</li>
              <li>{t('legal.termsOfUse.prohibited.scraping')}</li>
              <li>{t('legal.termsOfUse.prohibited.circumvent')}</li>
              <li>{t('legal.termsOfUse.prohibited.interference')}</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              {t('legal.termsOfUse.intellectualProperty.title')}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.termsOfUse.intellectualProperty.platform.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('legal.termsOfUse.intellectualProperty.platform.description')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.termsOfUse.intellectualProperty.userContent.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed mb-2">
                  {t('legal.termsOfUse.intellectualProperty.userContent.ownership')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {t('legal.termsOfUse.intellectualProperty.userContent.license')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.termsOfUse.intellectualProperty.studentWork.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('legal.termsOfUse.intellectualProperty.studentWork.description')}
                </p>
              </div>
            </div>
          </section>

          {/* Content Guidelines */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.contentGuidelines.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.termsOfUse.contentGuidelines.intro')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.termsOfUse.contentGuidelines.original')}</li>
              <li>{t('legal.termsOfUse.contentGuidelines.respectful')}</li>
              <li>{t('legal.termsOfUse.contentGuidelines.educational')}</li>
              <li>{t('legal.termsOfUse.contentGuidelines.appropriate')}</li>
              <li>{t('legal.termsOfUse.contentGuidelines.noViolence')}</li>
              <li>{t('legal.termsOfUse.contentGuidelines.noPolitical')}</li>
            </ul>
          </section>

          {/* Privacy and Data */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.privacy.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.termsOfUse.privacy.description')}{' '}
              <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-700 underline">
                {t('legal.termsOfUse.privacy.link')}
              </Link>
            </p>
          </section>

          {/* Service Availability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.serviceAvailability.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.termsOfUse.serviceAvailability.description')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mr-4">
              <li>{t('legal.termsOfUse.serviceAvailability.maintenance')}</li>
              <li>{t('legal.termsOfUse.serviceAvailability.modifications')}</li>
              <li>{t('legal.termsOfUse.serviceAvailability.discontinuation')}</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Gavel className="w-6 h-6 text-orange-600" />
              {t('legal.termsOfUse.liability.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.termsOfUse.liability.serviceProvided')}
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.termsOfUse.liability.noWarranty')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.termsOfUse.liability.limitation')}
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.indemnification.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.termsOfUse.indemnification.description')}
            </p>
          </section>

          {/* Account Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.termination.title')}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.termsOfUse.termination.byUser.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('legal.termsOfUse.termination.byUser.description')}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {t('legal.termsOfUse.termination.byUs.title')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('legal.termsOfUse.termination.byUs.description')}
                </p>
              </div>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.disputes.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.termsOfUse.disputes.governingLaw')}
            </p>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.termsOfUse.disputes.resolution')}
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.changes.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.termsOfUse.changes.description')}
            </p>
          </section>

          {/* Contact Information */}
          <section className="border-t pt-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {t('legal.termsOfUse.contact.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {t('legal.termsOfUse.contact.description')}
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>{t('legal.termsOfUse.contact.email')}:</strong> sales@innovationladders.com
              </p>
              <p className="text-gray-700 mt-2">
                <strong>{t('legal.termsOfUse.contact.phone')}:</strong> 966554344899
              </p>
            </div>
          </section>

          {/* Acceptance */}
          <section className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <p className="text-gray-800 font-semibold text-center">
              {t('legal.termsOfUse.acceptance')}
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};
