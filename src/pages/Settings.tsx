import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe, Database, Mail, Smartphone, Lock, Eye, EyeOff, Save, RefreshCw, Download, Upload, Trash2, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Camera, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUser, updateCurrentUserPassword, storage, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { useTranslation } from 'react-i18next';
import { migrateConsultantRatesToZero } from '../utils/migrateConsultantRates';
import { AvatarDisplay } from '../components/Common/AvatarDisplay';

export const Settings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';
  const isSchool = user?.role === 'school';
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    weeklyReports: false,
    marketingEmails: false,
  });

  const [appearance, setAppearance] = useState({
    theme: 'light',
    language: 'ar',
    fontSize: 'medium',
    animations: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migrationSuccess, setMigrationSuccess] = useState<string | null>(null);

  // Institution student approval state (school accounts only)
  const [requireStudentApproval, setRequireStudentApproval] = useState<boolean>(
    (user as any)?.require_student_approval ?? false
  );
  const [savingApproval, setSavingApproval] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  const settingsSections = [
    { id: 'profile', name: t('settings.sections.profile'), icon: User },
    { id: 'notifications', name: t('settings.sections.notifications'), icon: Bell },
    { id: 'security', name: t('settings.sections.security'), icon: Shield },
    { id: 'appearance', name: t('settings.sections.appearance'), icon: Palette },
    { id: 'language', name: t('settings.sections.language'), icon: Globe },
    { id: 'data', name: t('settings.sections.data'), icon: Database },
    ...(isAdmin ? [{ id: 'admin-migration', name: 'ترحيل البيانات (إدارة)', icon: RefreshCw }] : []),
    ...(isSchool ? [{ id: 'institution-settings', name: 'إعدادات القبول', icon: UserCheck }] : []),
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('notifications.')) {
      const notificationField = field.split('.')[1];
      setNotifications(prev => ({
        ...prev,
        [notificationField]: value
      }));
    } else if (field.startsWith('appearance.')) {
      const appearanceField = field.split('.')[1];
      setAppearance(prev => ({
        ...prev,
        [appearanceField]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!user) {
      setSaveError(t('settings.errors.loginRequired'));
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Prepare user data to update
      const userData = {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        // Add other fields as needed
        notifications_settings: notifications,
        appearance_settings: appearance
      };

      // Update user in Firestore
      await updateUser(user.id, userData);

      // Show success message
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError(error instanceof Error ? error.message : t('settings.errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    // Validate password fields
    if (!formData.currentPassword) {
      setPasswordError('يرجى إدخال كلمة المرور الحالية');
      return;
    }

    if (!formData.newPassword) {
      setPasswordError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }

    if (formData.newPassword.length < 6) {
      setPasswordError('يجب أن تكون كلمة المرور الجديدة 6 أحرف على الأقل');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('كلمة المرور الجديدة وتأكيد كلمة المرور غير متطابقتين');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const result = await updateCurrentUserPassword(
        formData.currentPassword,
        formData.newPassword
      );

      if (result.success) {
        setPasswordSuccess(true);
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));

        // Hide success message after 5 seconds
        setTimeout(() => {
          setPasswordSuccess(false);
        }, 5000);
      } else {
        setPasswordError(result.message);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setPasswordError(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث كلمة المرور');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggleStudentApproval = async (value: boolean) => {
    if (!user) return;
    setSavingApproval(true);
    setApprovalSuccess(false);
    try {
      const schoolRef = doc(db, 'users', user.id);
      await updateDoc(schoolRef, { require_student_approval: value });
      setRequireStudentApproval(value);
      setApprovalSuccess(true);
      setTimeout(() => setApprovalSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving student approval setting:', error);
    } finally {
      setSavingApproval(false);
    }
  };

  const handleMigrateConsultantRates = async () => {
    setIsMigrating(true);
    setMigrationError(null);
    setMigrationSuccess(null);

    try {
      const result = await migrateConsultantRatesToZero();

      if (result.success) {
        setMigrationSuccess(result.message);
        setTimeout(() => {
          setMigrationSuccess(null);
        }, 5000);
      } else {
        setMigrationError(`تم تحديث ${result.updated} من ${result.total} مستشارين. حدثت بعض الأخطاء.`);
      }
    } catch (error) {
      console.error('Error migrating consultant rates:', error);
      setMigrationError(error instanceof Error ? error.message : 'حدث خطأ أثناء ترحيل البيانات');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setAvatarError('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('نوع الملف غير مدعوم. الرجاء استخدام JPG, PNG, GIF أو WebP');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile || !user) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `profile_pictures/${user.id}/${Date.now()}_${selectedFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Error uploading avatar:', error);
          setAvatarError('حدث خطأ أثناء رفع الصورة');
          setIsUploadingAvatar(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          if (user.avatar) {
            try {
              const oldAvatarRef = ref(storage, user.avatar);
              await deleteObject(oldAvatarRef);
            } catch (error) {
              console.warn('Could not delete old avatar:', error);
            }
          }

          await updateUser(user.id, { avatar: downloadURL });

          setSelectedFile(null);
          setPreviewUrl(null);
          setUploadProgress(0);
          setIsUploadingAvatar(false);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);

          window.location.reload();
        }
      );
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarError('حدث خطأ أثناء رفع الصورة');
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !user.avatar) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      const avatarRef = ref(storage, user.avatar);
      await deleteObject(avatarRef);

      await updateUser(user.id, { avatar: null });

      setIsUploadingAvatar(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      window.location.reload();
    } catch (error) {
      console.error('Error removing avatar:', error);
      setAvatarError('حدث خطأ أثناء حذف الصورة');
      setIsUploadingAvatar(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setAvatarError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-gray-600 to-gray-800 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
            <p className="opacity-90">{t('settings.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('settings.settingsSections')}</h3>
            <nav className="space-y-2">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <section.icon className="w-5 h-5" />
                  <span className="font-medium">{section.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Success Message */}
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span>{t('settings.saveSuccess')}</span>
              </div>
            )}

            {/* Error Message */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Profile Settings */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <User className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">{t('settings.profile.title')}</h2>
                </div>

                {/* Profile Picture */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <AvatarDisplay
                        avatarUrl={user?.avatar}
                        userName={user?.name}
                        size="xl"
                      />
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{t('settings.profile.profilePicture')}</h3>
                    <p className="text-gray-600 text-sm mb-2">JPG, PNG, GIF أو WebP. الحد الأقصى 5 ميجابايت</p>

                    {avatarError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm mb-2">
                        {avatarError}
                      </div>
                    )}

                    {selectedFile && (
                      <div className="mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <span>جاري الرفع: {Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-2">
                      {selectedFile ? (
                        <>
                          <button
                            onClick={handleUploadAvatar}
                            disabled={isUploadingAvatar}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            {isUploadingAvatar ? 'جاري الرفع...' : 'رفع الصورة'}
                          </button>
                          <button
                            onClick={handleCancelUpload}
                            disabled={isUploadingAvatar}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                          >
                            إلغاء
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t('settings.profile.changePicture')}
                          </button>
                          {user?.avatar && (
                            <button
                              onClick={handleRemoveAvatar}
                              disabled={isUploadingAvatar}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {t('settings.profile.remove')}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.profile.fullName')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('common.email')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('common.phone')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.profile.timezone')}
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>{t('settings.profile.timezones.riyadh')}</option>
                      <option>{t('settings.profile.timezones.cairo')}</option>
                      <option>{t('settings.profile.timezones.dubai')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('settings.profile.bio')}
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('settings.profile.bioPlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Bell className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">{t('settings.notifications.title')}</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-800">{t('settings.notifications.emailNotifications')}</h3>
                        <p className="text-sm text-gray-600">{t('settings.notifications.emailNotificationsDesc')}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={(e) => handleInputChange('notifications.emailNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-800">{t('settings.notifications.pushNotifications')}</h3>
                        <p className="text-sm text-gray-600">{t('settings.notifications.pushNotificationsDesc')}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.pushNotifications}
                        onChange={(e) => handleInputChange('notifications.pushNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-800">{t('settings.notifications.projectUpdates')}</h3>
                        <p className="text-sm text-gray-600">{t('settings.notifications.projectUpdatesDesc')}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.projectUpdates}
                        onChange={(e) => handleInputChange('notifications.projectUpdates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-gray-600" />
                      <div>
                        <h3 className="font-medium text-gray-800">{t('settings.notifications.weeklyReports')}</h3>
                        <p className="text-sm text-gray-600">{t('settings.notifications.weeklyReportsDesc')}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.weeklyReports}
                        onChange={(e) => handleInputChange('notifications.weeklyReports', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">{t('settings.security.title')}</h2>
                </div>

                {/* Password Success Message */}
                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>تم تحديث كلمة المرور بنجاح</span>
                  </div>
                )}

                {/* Password Error Message */}
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* Change Password */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('settings.security.changePassword')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.security.currentPassword')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isUpdatingPassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          disabled={isUpdatingPassword}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.security.newPassword')}
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isUpdatingPassword}
                      />
                      <p className="text-xs text-gray-500 mt-1">يجب أن تكون 6 أحرف على الأقل</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('settings.security.confirmNewPassword')}
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isUpdatingPassword}
                      />
                    </div>

                    <button
                      onClick={handlePasswordUpdate}
                      disabled={isUpdatingPassword}
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          جاري التحديث...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          {t('settings.security.updatePassword')}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{t('settings.security.twoFactorAuth')}</h3>
                      <p className="text-gray-600 text-sm">{t('settings.security.twoFactorAuthDesc')}</p>
                    </div>
                    <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      {t('settings.security.enable')}
                    </button>
                  </div>
                </div>

                {/* Login Sessions */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('settings.security.loginSessions')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{t('settings.security.chromeWindows')}</p>
                        <p className="text-sm text-gray-600">{t('settings.security.riyadhSaudiArabia')} - {t('settings.security.activeNow')}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {t('settings.security.currentSession')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{t('settings.security.safariIphone')}</p>
                        <p className="text-sm text-gray-600">{t('settings.security.jeddahSaudiArabia')} - {t('settings.security.twoDaysAgo')}</p>
                      </div>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        {t('settings.security.endSession')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Palette className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">{t('settings.appearance.title')}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('settings.appearance.theme')}
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={appearance.theme === 'light'}
                          onChange={(e) => handleInputChange('appearance.theme', e.target.value)}
                          className="text-blue-600"
                        />
                        <span>{t('settings.appearance.lightTheme')}</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={appearance.theme === 'dark'}
                          onChange={(e) => handleInputChange('appearance.theme', e.target.value)}
                          className="text-blue-600"
                        />
                        <span>{t('settings.appearance.darkTheme')}</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="theme"
                          value="auto"
                          checked={appearance.theme === 'auto'}
                          onChange={(e) => handleInputChange('appearance.theme', e.target.value)}
                          className="text-blue-600"
                        />
                        <span>{t('settings.appearance.autoTheme')}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('settings.appearance.fontSize')}
                    </label>
                    <select
                      value={appearance.fontSize}
                      onChange={(e) => handleInputChange('appearance.fontSize', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="small">{t('settings.appearance.small')}</option>
                      <option value="medium">{t('settings.appearance.medium')}</option>
                      <option value="large">{t('settings.appearance.large')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h3 className="font-medium text-gray-800">{t('settings.appearance.animations')}</h3>
                    <p className="text-sm text-gray-600">{t('settings.appearance.animationsDesc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearance.animations}
                      onChange={(e) => handleInputChange('appearance.animations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* Language Settings */}
            {activeSection === 'language' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">{t('settings.language.title')}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('settings.language.interfaceLanguage')}
                    </label>
                    <select
                      value={appearance.language}
                      onChange={(e) => handleInputChange('appearance.language', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ar">{t('settings.language.arabic')}</option>
                      <option value="en">{t('settings.language.english')}</option>
                      <option value="fr">{t('settings.language.french')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('settings.language.timezone')}
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>{t('settings.language.timezones.riyadh')}</option>
                      <option>{t('settings.language.timezones.cairo')}</option>
                      <option>{t('settings.language.timezones.dubai')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('settings.language.dateFormat')}
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t('settings.language.timeFormat')}
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>{t('settings.language.timeFormats.24hour')}</option>
                      <option>{t('settings.language.timeFormats.12hour')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Data Settings */}
            {activeSection === 'data' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Database className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">{t('settings.data.title')}</h2>
                </div>

                {!isStudent && (
                  <>
                    {/* Export Data */}
                    <div className="border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('settings.data.exportData')}</h3>
                      <p className="text-gray-600 mb-4">{t('settings.data.exportDataDesc')}</p>
                      <button className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                        <Download className="w-5 h-5" />
                        {t('settings.data.exportData')}
                      </button>
                    </div>

                    {/* Import Data */}
                    <div className="border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('settings.data.importData')}</h3>
                      <p className="text-gray-600 mb-4">{t('settings.data.importDataDesc')}</p>
                      <button className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
                        <Upload className="w-5 h-5" />
                        {t('settings.data.importData')}
                      </button>
                    </div>

                    {/* Delete Account - Only visible to admin users */}
                    {isAdmin && (
                      <div className="border border-red-200 rounded-xl p-6 bg-red-50">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-800 mb-2">{t('settings.data.deleteAccount')}</h3>
                            <p className="text-red-700 mb-4">
                              {t('settings.data.deleteAccountWarning')}
                            </p>
                            <button className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                              <Trash2 className="w-5 h-5" />
                              {t('settings.data.permanentlyDeleteAccount')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {isStudent && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Database className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">إدارة البيانات</h3>
                    <p className="text-gray-600">
                      لا تتوفر خيارات إدارة البيانات للطلاب. يرجى التواصل مع المعلم/المشرف أو مدير المؤسسة تعليمية للمساعدة.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Admin Migration Section */}
            {activeSection === 'admin-migration' && isAdmin && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <RefreshCw className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-800">ترحيل البيانات (إدارة)</h2>
                </div>

                {migrationSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>{migrationSuccess}</div>
                  </div>
                )}

                {migrationError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>{migrationError}</div>
                  </div>
                )}

                {/* Migrate Consultant Rates to Zero */}
                <div className="border border-purple-200 rounded-xl p-6 bg-purple-50">
                  <div className="flex items-start gap-3">
                    <RefreshCw className="w-6 h-6 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-purple-800 mb-2">تحديث أسعار المستشارين إلى 0 ريال</h3>
                      <p className="text-purple-700 mb-4">
                        هذه العملية ستقوم بتحديث أسعار الساعة لجميع المستشارين في النظام إلى 0 ريال (مجاني).
                        سيتم تحديث جميع سجلات المستشارين الموجودة في قاعدة البيانات.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-yellow-800">
                            <strong>ملاحظة:</strong> هذه العملية لا يمكن التراجع عنها. سيتم تحديث جميع المستشارين الحاليين والجدد بسعر 0 ريال/ساعة.
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleMigrateConsultantRates}
                        disabled={isMigrating}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isMigrating ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            جاري تحديث البيانات...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-5 h-5" />
                            تحديث أسعار المستشارين
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Institution Settings - School accounts only */}
            {activeSection === 'institution-settings' && isSchool && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">إعدادات القبول</h2>
                </div>

                {approvalSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>تم حفظ الإعداد بنجاح</span>
                  </div>
                )}

                <div className="border border-gray-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">اشتراط الموافقة على الطلاب الجدد</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        عند التفعيل، سيبقى الطلاب الجدد المنتسبون لجهتك في حالة "قيد المراجعة" بعد تأكيد بريدهم الإلكتروني،
                        وذلك حتى تتم الموافقة عليهم يدوياً من خلال صفحة إدارة المستخدمين.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={requireStudentApproval}
                        onChange={(e) => handleToggleStudentApproval(e.target.checked)}
                        disabled={savingApproval}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                    </label>
                  </div>

                  <div className={`p-4 rounded-lg ${requireStudentApproval ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                    {requireStudentApproval ? (
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">الموافقة اليدوية مفعّلة</p>
                          <p className="text-sm text-blue-700 mt-1">
                            الطلاب الجدد من جهتك سيحتاجون إلى موافقتك من صفحة "إدارة المستخدمين" قبل أن يتمكنوا من الوصول للمنصة.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">التفعيل التلقائي مفعّل (الوضع الافتراضي)</p>
                          <p className="text-sm text-gray-600 mt-1">
                            الطلاب الجدد يتم تفعيلهم تلقائياً بمجرد تأكيد بريدهم الإلكتروني.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">كيفية الموافقة على الطلاب</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>انتقل إلى صفحة "إدارة المستخدمين" من القائمة الجانبية</li>
                    <li>ستظهر تنبيهات للطلاب المنتظرين للموافقة</li>
                    <li>انقر على "تفعيل" بجانب اسم الطالب للموافقة عليه</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('settings.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {t('settings.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};