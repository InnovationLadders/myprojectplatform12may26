import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const KfupmCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('جاري إكمال تسجيل الدخول...');

  useEffect(() => {
    const completeLogin = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('لم يتم استلام رمز المصادقة من جامعة الملك فهد. يرجى المحاولة مرة أخرى.');
        return;
      }

      try {
        setStatus('جاري التحقق من حسابك...');
        await signInWithCustomToken(auth, token);
        setStatus('تم تسجيل الدخول بنجاح! جاري التحويل...');

        // Give AuthContext time to pick up the new user
        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 1500);
      } catch (err) {
        console.error('[KfupmCallback] Sign-in failed:', err);
        const errCode = (err as any)?.code || '';
        if (errCode === 'auth/invalid-custom-token') {
          setError('رمز المصادقة غير صالح. يرجى المحاولة مرة أخرى.');
        } else if (errCode === 'auth/network-request-failed') {
          setError('فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.');
        } else {
          setError('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }
      }
    };

    completeLogin();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center mx-auto mb-6"
          >
            <GraduationCap className="w-10 h-10 text-white" />
          </motion.div>

          {error ? (
            <>
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-right">{error}</div>
              </div>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                العودة لصفحة تسجيل الدخول
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                تسجيل الدخول عبر جامعة الملك فهد
              </h2>
              <p className="text-gray-600 mb-6 text-sm">{status}</p>
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
