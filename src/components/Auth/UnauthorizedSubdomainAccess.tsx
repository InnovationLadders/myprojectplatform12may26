import React from 'react';
import { AlertTriangle, LogOut, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchoolBranding } from '../../contexts/SchoolBrandingContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface UnauthorizedSubdomainAccessProps {
  message: string;
  userSchoolId?: string | null;
  currentSubdomain?: string | null;
  suggestedAction?: string;
}

export const UnauthorizedSubdomainAccess: React.FC<UnauthorizedSubdomainAccessProps> = ({
  message,
  userSchoolId,
  currentSubdomain,
  suggestedAction
}) => {
  const { logout, user } = useAuth();
  const { schoolName, logoUrl } = useSchoolBranding();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = async () => {
    await logout(() => {
      window.location.href = '/';
    });
  };

  const handleGoToMainPlatform = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;

    if (hostname.includes('localhost')) {
      window.location.href = `${protocol}//localhost:${window.location.port}/`;
    } else {
      const baseDomain = hostname.split('.').slice(-2).join('.');
      window.location.href = `${protocol}//${baseDomain}/`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
          {logoUrl && schoolName ? (
            <div className="flex items-center justify-center gap-3 mb-4">
              <img
                src={logoUrl}
                alt={schoolName}
                className="h-16 w-16 object-contain bg-white rounded-lg p-2"
              />
              <h2 className="text-2xl font-bold text-white">{schoolName}</h2>
            </div>
          ) : (
            <AlertTriangle className="w-20 h-20 text-white mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold text-white">
            {i18n.language === 'ar' ? 'وصول غير مصرح به' : 'Unauthorized Access'}
          </h1>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-lg text-red-800 text-center leading-relaxed">
              {message}
            </p>
          </div>

          {currentSubdomain && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 text-center">
                {i18n.language === 'ar' ? 'الرابط الحالي:' : 'Current Subdomain:'}{' '}
                <span className="font-mono font-semibold text-gray-800">
                  {currentSubdomain}
                </span>
              </p>
            </div>
          )}

          {user && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <span className="font-semibold">{i18n.language === 'ar' ? 'المستخدم:' : 'User:'}</span>{' '}
                  {user.name}
                </p>
                <p>
                  <span className="font-semibold">{i18n.language === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span>{' '}
                  {user.email}
                </p>
                <p>
                  <span className="font-semibold">{i18n.language === 'ar' ? 'الدور:' : 'Role:'}</span>{' '}
                  {t(`roles.${user.role}`)}
                </p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-800 mb-3 text-center">
              {i18n.language === 'ar' ? 'ماذا يمكنك أن تفعل؟' : 'What can you do?'}
            </h3>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>
                  {i18n.language === 'ar'
                    ? 'استخدم الرابط الصحيح الخاص بمؤسستك التعليمية'
                    : 'Use the correct link for your educational institution'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>
                  {i18n.language === 'ar'
                    ? 'تواصل مع مسؤول المنصة في مؤسستك التعليمية للحصول على الرابط الصحيح'
                    : 'Contact your institution administrator to get the correct link'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-1">•</span>
                <span>
                  {i18n.language === 'ar'
                    ? 'تأكد من أنك قمت بتسجيل الدخول بالحساب الصحيح'
                    : 'Make sure you are logged in with the correct account'}
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              {i18n.language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </button>
            <button
              onClick={handleGoToMainPlatform}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Home className="w-5 h-5" />
              {i18n.language === 'ar' ? 'العودة للمنصة الرئيسية' : 'Go to Main Platform'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
