import React from 'react';
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DomainValidationInfoProps {
  allowedDomains: string[];
  customMessage?: string;
  variant?: 'info' | 'success' | 'error';
}

const DomainValidationInfo: React.FC<DomainValidationInfoProps> = ({
  allowedDomains,
  customMessage,
  variant = 'info'
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />;
    }
  };

  if (!allowedDomains || allowedDomains.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border p-4 ${getVariantStyles()}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex gap-3">
        {getIcon()}
        <div className="flex-1">
          <p className="font-medium mb-2">
            {customMessage || (
              isRTL
                ? 'تنبيه: يجب استخدام البريد الإلكتروني الرسمي للمؤسسة'
                : 'Notice: You must use the official institutional email'
            )}
          </p>
          <div className="text-sm space-y-1">
            <p className="font-medium">
              {isRTL ? 'النطاقات المقبولة:' : 'Accepted domains:'}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {allowedDomains.map((domain, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    variant === 'error'
                      ? 'bg-red-100 text-red-800'
                      : variant === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {domain}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs opacity-75">
              {isRTL
                ? `مثال: student${allowedDomains[0]}`
                : `Example: student${allowedDomains[0]}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainValidationInfo;
