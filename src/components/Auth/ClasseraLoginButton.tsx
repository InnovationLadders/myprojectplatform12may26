import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { School, ExternalLink, Loader, CircleAlert as AlertCircle } from 'lucide-react';
import { handleClasseraLogin } from '../../lib/classera';

interface ClasseraLoginButtonProps {
  returnUrl?: string;
  className?: string;
}

export const ClasseraLoginButton: React.FC<ClasseraLoginButtonProps> = ({
  returnUrl,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [showPopupHelp, setShowPopupHelp] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const getErrorMessage = (err: Error): string => {
    const errorMessages: Record<string, string> = {
      'POPUP_BLOCKED': 'فشل في فتح نافذة تسجيل الدخول. يرجى السماح بالنوافذ المنبثقة والمحاولة مرة أخرى.',
      'POPUP_CLOSED': 'تم إغلاق النافذة قبل إكمال تسجيل الدخول. يرجى المحاولة مرة أخرى وعدم إغلاق النافذة.',
      'TIMEOUT': 'انتهت مهلة تسجيل الدخول (5 دقائق). يرجى المحاولة مرة أخرى.',
      'INVALID_TOKEN': 'تم استلام بيانات مصادقة غير صالحة. يرجى المحاولة مرة أخرى.',
      'AUTHENTICATION_FAILED': 'فشل في تسجيل الدخول. يرجى التحقق من بيانات الاعتماد والمحاولة مرة أخرى.'
    };

    return errorMessages[err.message] || err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  };

  const handleLogin = async (e: React.MouseEvent) => {
    // Prevent default and stop propagation to ensure we're in a user gesture
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsLoading(true);
      setError(null);
      setProgress('جاري فتح نافذة تسجيل الدخول...');
      setAttemptCount(prev => prev + 1);

      console.log('[ClasseraLoginButton] Starting login process, attempt:', attemptCount + 1);

      await handleClasseraLogin();

      setProgress('تم تسجيل الدخول بنجاح!');
      console.log('[ClasseraLoginButton] Login completed successfully');

      if (returnUrl) {
        window.location.href = returnUrl;
      }
    } catch (err) {
      console.error('[ClasseraLoginButton] Login failed:', err);

      if (err instanceof Error) {
        const errorMsg = getErrorMessage(err);
        setError(errorMsg);

        if (err.message === 'POPUP_BLOCKED') {
          setShowPopupHelp(true);

          if (attemptCount >= 1) {
            setError(errorMsg + '\n\nإذا استمرت المشكلة، يمكنك استخدام تسجيل الدخول العادي.');
          }
        }
      } else {
        setError('حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        onClick={handleLogin}
        disabled={isLoading}
        className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>{progress || 'جاري تسجيل الدخول...'}</span>
          </>
        ) : (
          <>
            <School className="w-5 h-5" />
            <span>تسجيل الدخول عبر Classera</span>
            <ExternalLink className="w-4 h-4" />
          </>
        )}
      </motion.button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="whitespace-pre-line">{error}</div>
              {showPopupHelp && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <p className="font-medium mb-1">كيفية السماح بالنوافذ المنبثقة:</p>
                  <ul className="text-xs space-y-1 mr-4 list-disc">
                    <li>انقر على أيقونة القفل أو المعلومات في شريط العنوان</li>
                    <li>ابحث عن "النوافذ المنبثقة" وقم بتفعيلها</li>
                    <li>أعد تحميل الصفحة وحاول مرة أخرى</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {!error && !isLoading && (
        <div className="text-xs text-gray-500 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ExternalLink className="w-3 h-3" />
            <span>سيتم فتح نافذة منبثقة لتسجيل الدخول عبر Classera</span>
          </div>
          <div className="text-amber-600 font-medium">
            يرجى السماح بالنوافذ المنبثقة في المتصفح
          </div>
        </div>
      )}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
        >
          <div className="font-bold mb-2 text-center">تعليمات مهمة:</div>
          <ol className="text-xs space-y-2 mr-4" style={{ listStyleType: 'decimal' }}>
            <li>أكمل تسجيل الدخول في النافذة المنبثقة</li>
            <li className="font-bold text-green-800">
              بعد نجاح تسجيل الدخول، أغلق النافذة المنبثقة يدوياً
            </li>
            <li>سيتم تسجيل دخولك تلقائياً في هذه الصفحة</li>
          </ol>
        </motion.div>
      )}
    </div>
  );
};