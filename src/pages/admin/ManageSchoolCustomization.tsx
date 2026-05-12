import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Globe, Save, CircleAlert as AlertCircle, CircleCheck as CheckCircle, ExternalLink, Mail, Plus, X, TestTube, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSchools, updateSchoolSubdomain, checkSubdomainAvailability } from '../../lib/firebase';
import { SchoolLogoUploader } from '../../components/Admin/SchoolLogoUploader';
import { isValidSubdomain, formatSubdomainDisplay } from '../../utils/subdomain';
import { isValidDomainFormat, normalizeDomain, testEmailAgainstDomains } from '../../utils/domainValidation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface School {
  id: string;
  name: string;
  email: string;
  subdomain?: string;
  logo_url?: string;
  status: string;
  domain_validation_enabled?: boolean;
  allowed_domains?: string[];
  domain_validation_message_ar?: string;
  domain_validation_message_en?: string;
  require_student_approval?: boolean;
}

export const ManageSchoolCustomization: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [subdomain, setSubdomain] = useState('');
  const [subdomainError, setSubdomainError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Student approval state
  const [requireStudentApproval, setRequireStudentApproval] = useState(false);
  const [savingApproval, setSavingApproval] = useState(false);

  // Domain validation states
  const [domainValidationEnabled, setDomainValidationEnabled] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [domainError, setDomainError] = useState<string | null>(null);
  const [customMessageAr, setCustomMessageAr] = useState('');
  const [customMessageEn, setCustomMessageEn] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<'valid' | 'invalid' | null>(null);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      const schoolsData = await getSchools();
      setSchools(schoolsData);
    } catch (err: any) {
      console.error('Error loading schools:', err);
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    setSubdomain(school.subdomain || '');
    setSubdomainError(null);
    setSuccessMessage(null);

    // Load student approval setting
    setRequireStudentApproval(school.require_student_approval || false);

    // Load domain validation settings
    setDomainValidationEnabled(school.domain_validation_enabled || false);
    setAllowedDomains(school.allowed_domains || []);
    setCustomMessageAr(school.domain_validation_message_ar || '');
    setCustomMessageEn(school.domain_validation_message_en || '');
    setDomainError(null);
    setTestEmail('');
    setTestResult(null);
  };

  const handleSubdomainChange = (value: string) => {
    setSubdomain(value.toLowerCase());
    setSubdomainError(null);
    setSuccessMessage(null);
  };

  const validateSubdomain = async (): Promise<boolean> => {
    if (!subdomain.trim()) {
      setSubdomainError(t('schoolCustomization.subdomainRequired'));
      return false;
    }

    if (!isValidSubdomain(subdomain)) {
      setSubdomainError(t('schoolCustomization.invalidSubdomain'));
      return false;
    }

    try {
      const isAvailable = await checkSubdomainAvailability(subdomain, selectedSchool?.id);
      if (!isAvailable) {
        setSubdomainError(t('schoolCustomization.subdomainTaken'));
        return false;
      }
      return true;
    } catch (err) {
      setSubdomainError(t('schoolCustomization.checkError'));
      return false;
    }
  };

  const handleSaveSubdomain = async () => {
    if (!selectedSchool) return;

    setSuccessMessage(null);

    const isValid = await validateSubdomain();
    if (!isValid) return;

    setSaving(true);
    try {
      await updateSchoolSubdomain(selectedSchool.id, subdomain);

      setSchools(prev =>
        prev.map(s => (s.id === selectedSchool.id ? { ...s, subdomain } : s))
      );

      setSelectedSchool(prev => prev ? { ...prev, subdomain } : null);
      setSuccessMessage(t('schoolCustomization.savedSuccessfully'));
    } catch (err: any) {
      console.error('Error saving subdomain:', err);
      setSubdomainError(err.message || t('schoolCustomization.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpdated = (logoUrl: string | null) => {
    if (!selectedSchool) return;

    setSchools(prev =>
      prev.map(s => (s.id === selectedSchool.id ? { ...s, logo_url: logoUrl || undefined } : s))
    );

    setSelectedSchool(prev => prev ? { ...prev, logo_url: logoUrl || undefined } : null);
    setSuccessMessage(t('schoolCustomization.logoUpdated'));
  };

  const handleSaveStudentApproval = async (value: boolean) => {
    if (!selectedSchool) return;
    setSavingApproval(true);
    setSuccessMessage(null);
    try {
      const schoolRef = doc(db, 'users', selectedSchool.id);
      await updateDoc(schoolRef, { require_student_approval: value });
      setRequireStudentApproval(value);
      setSchools(prev => prev.map(s => s.id === selectedSchool.id ? { ...s, require_student_approval: value } : s));
      setSelectedSchool(prev => prev ? { ...prev, require_student_approval: value } : null);
      setSuccessMessage(i18n.language === 'ar'
        ? (value ? 'تم تفعيل اشتراط الموافقة على الطلاب' : 'تم إلغاء اشتراط الموافقة على الطلاب')
        : (value ? 'Student approval requirement enabled' : 'Student approval requirement disabled'));
    } catch (err: any) {
      console.error('Error saving student approval setting:', err);
    } finally {
      setSavingApproval(false);
    }
  };

  // Domain validation handlers
  const handleAddDomain = () => {
    setDomainError(null);

    if (!newDomain.trim()) {
      setDomainError(i18n.language === 'ar' ? 'يرجى إدخال النطاق' : 'Please enter a domain');
      return;
    }

    const normalized = normalizeDomain(newDomain);

    if (!isValidDomainFormat(normalized)) {
      setDomainError(i18n.language === 'ar' ? 'صيغة النطاق غير صحيحة. مثال: @university.edu' : 'Invalid domain format. Example: @university.edu');
      return;
    }

    if (allowedDomains.includes(normalized)) {
      setDomainError(i18n.language === 'ar' ? 'هذا النطاق موجود بالفعل' : 'This domain already exists');
      return;
    }

    setAllowedDomains(prev => [...prev, normalized]);
    setNewDomain('');
    setSuccessMessage(null);
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains(prev => prev.filter(d => d !== domain));
    setSuccessMessage(null);
  };

  const handleTestEmail = () => {
    if (!testEmail.trim()) {
      setTestResult(null);
      return;
    }

    const isValid = testEmailAgainstDomains(testEmail, allowedDomains);
    setTestResult(isValid ? 'valid' : 'invalid');
  };

  const handleSaveDomainSettings = async () => {
    if (!selectedSchool) return;

    setSaving(true);
    setSuccessMessage(null);
    setDomainError(null);

    try {
      const schoolRef = doc(db, 'users', selectedSchool.id);
      await updateDoc(schoolRef, {
        domain_validation_enabled: domainValidationEnabled,
        allowed_domains: allowedDomains,
        domain_validation_message_ar: customMessageAr || null,
        domain_validation_message_en: customMessageEn || null
      });

      setSchools(prev =>
        prev.map(s =>
          s.id === selectedSchool.id
            ? {
                ...s,
                domain_validation_enabled: domainValidationEnabled,
                allowed_domains: allowedDomains,
                domain_validation_message_ar: customMessageAr,
                domain_validation_message_en: customMessageEn
              }
            : s
        )
      );

      setSelectedSchool(prev =>
        prev
          ? {
              ...prev,
              domain_validation_enabled: domainValidationEnabled,
              allowed_domains: allowedDomains,
              domain_validation_message_ar: customMessageAr,
              domain_validation_message_en: customMessageEn
            }
          : null
      );

      setSuccessMessage(i18n.language === 'ar' ? 'تم حفظ إعدادات التحقق من النطاق بنجاح' : 'Domain validation settings saved successfully');
    } catch (err: any) {
      console.error('Error saving domain settings:', err);
      setDomainError(err.message || (i18n.language === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('schoolCustomization.title')}
        </h1>
        <p className="text-gray-600">
          {t('schoolCustomization.description')}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schools List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Building className="w-5 h-5" />
                {t('schoolCustomization.schoolsList')}
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {schools.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {t('schoolCustomization.noSchools')}
                </div>
              ) : (
                schools.map((school) => (
                  <motion.button
                    key={school.id}
                    onClick={() => handleSchoolSelect(school)}
                    className={`w-full p-4 text-right hover:bg-gray-50 transition-colors ${
                      selectedSchool?.id === school.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                    whileHover={{ x: -4 }}
                  >
                    <div className="font-medium text-gray-900">{school.name}</div>
                    {school.subdomain && (
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-1 justify-end">
                        <Globe className="w-3 h-3" />
                        {school.subdomain}
                      </div>
                    )}
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Customization Form */}
        <div className="lg:col-span-2">
          {selectedSchool ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedSchool.name}
                </h2>
                <p className="text-gray-600">{selectedSchool.email}</p>
              </div>

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700">{successMessage}</p>
                </motion.div>
              )}

              {/* Subdomain Configuration */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schoolCustomization.subdomain')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      placeholder={t('schoolCustomization.subdomainPlaceholder')}
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        subdomainError ? 'border-red-500' : 'border-gray-300'
                      }`}
                      dir="ltr"
                    />
                    <button
                      onClick={handleSaveSubdomain}
                      disabled={saving || !subdomain.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                  {subdomainError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {subdomainError}
                    </p>
                  )}
                  {subdomain && !subdomainError && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700 mb-1">
                        {t('schoolCustomization.previewUrl')}:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-blue-900" dir="ltr">
                          {formatSubdomainDisplay(subdomain)}
                        </code>
                        <ExternalLink className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>{t('schoolCustomization.subdomainRules')}</p>
                  <ul className="list-disc list-inside mr-4 space-y-1">
                    <li>{t('schoolCustomization.rule1')}</li>
                    <li>{t('schoolCustomization.rule2')}</li>
                    <li>{t('schoolCustomization.rule3')}</li>
                  </ul>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Logo Upload */}
              <SchoolLogoUploader
                schoolId={selectedSchool.id}
                currentLogoUrl={selectedSchool.logo_url}
                onLogoUpdated={handleLogoUpdated}
              />

              <hr className="border-gray-200" />

              {/* Student Approval Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      {i18n.language === 'ar' ? 'إعدادات قبول الطلاب' : 'Student Approval Settings'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {i18n.language === 'ar'
                        ? 'اشتراط الموافقة اليدوية على الطلاب الجدد المنتسبين لهذه الجهة بعد تأكيد بريدهم الإلكتروني'
                        : 'Require manual approval for new students affiliated with this institution after email verification'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireStudentApproval}
                      onChange={(e) => handleSaveStudentApproval(e.target.checked)}
                      disabled={savingApproval}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                  </label>
                </div>

                <div className={`p-3 rounded-lg border ${requireStudentApproval ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-sm">
                    {requireStudentApproval
                      ? (i18n.language === 'ar'
                          ? 'الطلاب الجدد سيبقون في حالة "قيد المراجعة" بعد تأكيد بريدهم الإلكتروني حتى تتم الموافقة عليهم يدوياً من قِبل المشرف أو الجهة التعليمية.'
                          : 'New students will remain "Pending Review" after email verification until manually approved by an admin or the institution.')
                      : (i18n.language === 'ar'
                          ? 'الطلاب الجدد يتم تفعيلهم تلقائياً بعد تأكيد بريدهم الإلكتروني.'
                          : 'New students are automatically activated after email verification.')}
                  </p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Domain Validation Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      {i18n.language === 'ar' ? 'التحقق من البريد الإلكتروني (اختياري)' : 'Email Domain Validation (Optional)'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {i18n.language === 'ar'
                        ? 'تقييد التسجيل للمستخدمين الذين لديهم عناوين بريد إلكتروني رسمية فقط'
                        : 'Restrict registration to users with official email addresses only'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={domainValidationEnabled}
                      onChange={(e) => {
                        setDomainValidationEnabled(e.target.checked);
                        setSuccessMessage(null);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {!domainValidationEnabled && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      {i18n.language === 'ar'
                        ? '✓ مسموح بجميع عناوين البريد الإلكتروني'
                        : '✓ All email addresses are allowed'}
                    </p>
                  </div>
                )}

                {domainValidationEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {/* Warning if enabled but no domains */}
                    {allowedDomains.length === 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium mb-1">
                            {i18n.language === 'ar' ? 'تحذير' : 'Warning'}
                          </p>
                          <p>
                            {i18n.language === 'ar'
                              ? 'التحقق مفعل ولكن لا توجد نطاقات محددة. سيتم قبول جميع البريد الإلكتروني حتى تضيف نطاقاً واحداً على الأقل.'
                              : 'Validation is enabled but no domains specified. All emails will be accepted until you add at least one domain.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Add Domain */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {i18n.language === 'ar' ? 'إضافة نطاق بريد إلكتروني' : 'Add Email Domain'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDomain}
                          onChange={(e) => {
                            setNewDomain(e.target.value);
                            setDomainError(null);
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                          placeholder={i18n.language === 'ar' ? 'مثال: @university.edu أو university.edu' : 'Example: @university.edu or university.edu'}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          dir="ltr"
                        />
                        <button
                          onClick={handleAddDomain}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          {i18n.language === 'ar' ? 'إضافة' : 'Add'}
                        </button>
                      </div>
                      {domainError && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {domainError}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {i18n.language === 'ar'
                          ? 'يمكنك إدخال النطاق بصيغة @domain.edu أو domain.edu'
                          : 'You can enter the domain as @domain.edu or domain.edu'}
                      </p>
                    </div>

                    {/* Allowed Domains List */}
                    {allowedDomains.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {i18n.language === 'ar' ? 'النطاقات المسموح بها' : 'Allowed Domains'} ({allowedDomains.length})
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {allowedDomains.map((domain, index) => (
                            <motion.div
                              key={index}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg"
                            >
                              <span className="font-mono text-sm">{domain}</span>
                              <button
                                onClick={() => handleRemoveDomain(domain)}
                                className="hover:bg-blue-200 rounded-full p-1 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Messages */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        {i18n.language === 'ar' ? 'رسالة خطأ مخصصة (اختياري)' : 'Custom Error Message (Optional)'}
                      </label>
                      <div>
                        <input
                          type="text"
                          value={customMessageAr}
                          onChange={(e) => {
                            setCustomMessageAr(e.target.value);
                            setSuccessMessage(null);
                          }}
                          placeholder={i18n.language === 'ar' ? 'رسالة بالعربية' : 'Message in Arabic'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={customMessageEn}
                          onChange={(e) => {
                            setCustomMessageEn(e.target.value);
                            setSuccessMessage(null);
                          }}
                          placeholder={i18n.language === 'ar' ? 'رسالة بالإنجليزية' : 'Message in English'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          dir="ltr"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {i18n.language === 'ar'
                          ? 'سيتم استخدام الرسالة الافتراضية إذا تركت هذا الحقل فارغاً'
                          : 'Default message will be used if left empty'}
                      </p>
                    </div>

                    {/* Test Email */}
                    {allowedDomains.length > 0 && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <TestTube className="w-5 h-5" />
                          {i18n.language === 'ar' ? 'اختبار بريد إلكتروني' : 'Test Email'}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => {
                              setTestEmail(e.target.value);
                              setTestResult(null);
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleTestEmail()}
                            placeholder={i18n.language === 'ar' ? 'مثال: student@university.edu' : 'Example: student@university.edu'}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            dir="ltr"
                          />
                          <button
                            onClick={handleTestEmail}
                            disabled={!testEmail.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {i18n.language === 'ar' ? 'اختبار' : 'Test'}
                          </button>
                        </div>
                        {testResult === 'valid' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-green-700 text-sm"
                          >
                            <CheckCircle className="w-5 h-5" />
                            {i18n.language === 'ar' ? '✓ سيتم قبول هذا البريد الإلكتروني' : '✓ This email will be accepted'}
                          </motion.div>
                        )}
                        {testResult === 'invalid' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-red-700 text-sm"
                          >
                            <AlertCircle className="w-5 h-5" />
                            {i18n.language === 'ar' ? '✗ سيتم رفض هذا البريد الإلكتروني' : '✗ This email will be rejected'}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveDomainSettings}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? (i18n.language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (i18n.language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {t('schoolCustomization.selectSchool')}
              </h3>
              <p className="text-gray-500">
                {t('schoolCustomization.selectSchoolDesc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
