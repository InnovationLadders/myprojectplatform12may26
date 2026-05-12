import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircleCheck as CheckCircle, Circle as XCircle, Lock, Mail, Loader } from 'lucide-react';
import { handleEmailVerification, handlePasswordReset } from '../lib/firebase';

export const AuthActionHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [actionCode, setActionCode] = useState('');

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (!modeParam || !oobCode) {
      setLoading(false);
      setSuccess(false);
      setMessage('رابط غير صالح. يرجى التحقق من الرابط والمحاولة مرة أخرى');
      return;
    }

    setMode(modeParam);
    setActionCode(oobCode);

    if (modeParam === 'verifyEmail') {
      handleVerifyEmail(oobCode);
    } else if (modeParam === 'resetPassword') {
      setLoading(false);
      setShowPasswordForm(true);
    } else {
      setLoading(false);
      setSuccess(false);
      setMessage('عملية غير معروفة');
    }
  }, [searchParams]);

  const handleVerifyEmail = async (code: string) => {
    setLoading(true);
    const result = await handleEmailVerification(code);
    setSuccess(result.success);
    setMessage(result.message);
    setLoading(false);

    if (result.success) {
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  const handleSubmitPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('كلمات المرور غير متطابقة');
      setSuccess(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      setSuccess(false);
      return;
    }

    setLoading(true);
    const result = await handlePasswordReset(actionCode, newPassword);
    setSuccess(result.success);
    setMessage(result.message);
    setLoading(false);
    setShowPasswordForm(false);

    if (result.success) {
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Loader className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">جارٍ المعالجة...</h2>
          <p className="text-gray-600">يرجى الانتظار قليلاً</p>
        </div>
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              إعادة تعيين كلمة المرور
            </h1>
            <p className="text-gray-600">
              أدخل كلمة المرور الجديدة
            </p>
          </div>

          {message && !success && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
              <div className="flex items-center gap-2 justify-center">
                <XCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{message}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitPasswordReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="أدخل كلمة المرور الجديدة"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="أعد إدخال كلمة المرور"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              العودة لتسجيل الدخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
          success ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {success ? (
            mode === 'verifyEmail' ? (
              <Mail className="w-10 h-10 text-green-600" />
            ) : (
              <CheckCircle className="w-10 h-10 text-green-600" />
            )
          ) : (
            <XCircle className="w-10 h-10 text-red-600" />
          )}
        </div>

        <h1 className={`text-3xl font-bold mb-3 ${success ? 'text-green-900' : 'text-red-900'}`}>
          {success ? 'تمت العملية بنجاح!' : 'حدث خطأ'}
        </h1>

        <div className={`p-4 rounded-lg mb-6 ${
          success
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <p className="font-medium">{message}</p>
        </div>

        {success && (
          <p className="text-gray-600 mb-6">
            سيتم توجيهك إلى صفحة تسجيل الدخول خلال 3 ثواني...
          </p>
        )}

        <button
          onClick={() => navigate('/login')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          الذهاب لتسجيل الدخول
        </button>
      </div>
    </div>
  );
};
