import React, { useState } from 'react';
import { Mail, RefreshCw, CircleCheck as CheckCircle, Clock } from 'lucide-react';
import { reloadUserEmailStatus } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const EmailVerificationPending: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [message, setMessage] = useState('');
  const { user, logout, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const handleResendEmail = async () => {
    if (resendTimer > 0) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await resendVerificationEmail();
      setMessage('تم إرسال بريد التحقق بنجاح! يرجى التحقق من صندوق الوارد الخاص بك.');
      setResendTimer(60);

      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      setMessage(error.message || 'فشل في إرسال بريد التحقق. يرجى المحاولة مرة أخرى.');
    }

    setLoading(false);
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setMessage('');

    const isVerified = await reloadUserEmailStatus();

    if (isVerified) {
      setMessage('تم تأكيد بريدك الإلكتروني بنجاح!');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setMessage('لم يتم تأكيد البريد الإلكتروني بعد. يرجى التحقق من صندوق الوارد');
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await logout(() => {
      navigate('/login');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-blue-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            تحقق من بريدك الإلكتروني
          </h1>

          <p className="text-gray-600 mb-2">
            مرحباً {user?.name}
          </p>

          <p className="text-gray-600 mb-6">
            تم إرسال رسالة تحقق إلى بريدك الإلكتروني:
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-blue-800 font-semibold">{user?.email}</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-right">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">يرجى اتباع الخطوات التالية:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>افتح صندوق الوارد في بريدك الإلكتروني</li>
                  <li>ابحث عن رسالة من المنصة</li>
                  <li>انقر على رابط التحقق في الرسالة</li>
                  <li>ارجع إلى هذه الصفحة وانقر "تحديث الحالة"</li>
                </ol>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('نجاح') || message.includes('تم تأكيد')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2 justify-center">
                {message.includes('نجاح') || message.includes('تم تأكيد') ? (
                  <CheckCircle className="w-5 h-5" />
                ) : null}
                <p className="text-sm font-medium">{message}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'جارٍ التحديث...' : 'تحديث الحالة'}
            </button>

            <button
              onClick={handleResendEmail}
              disabled={loading || resendTimer > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              {resendTimer > 0
                ? `إعادة الإرسال بعد ${resendTimer} ثانية`
                : loading
                ? 'جارٍ الإرسال...'
                : 'إعادة إرسال البريد'}
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            لم تستلم البريد؟ تحقق من مجلد البريد المزعج (Spam)
          </p>
        </div>
      </div>
    </div>
  );
};
