import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Loader, School } from 'lucide-react';
import { verifyClasseraUser, createOrUpdateUserFromClassera, parseClasseraWebviewUrl } from '../../lib/classera';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export const ClasseraCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('جاري التحقق من البيانات...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        setProgress('جاري استخراج بيانات المستخدم...');
        
        // Get the auth token from URL parameters
        const authToken = searchParams.get('token');
        const returnUrl = searchParams.get('state') || '/home';
        
        if (!authToken) {
          throw new Error('لم يتم العثور على رمز المصادقة');
        }

        setProgress('جاري التحقق من صحة المستخدم مع Classera...');
        
        // Verify user with Classera API
        const apiResponse = await verifyClasseraUser(authToken);
        
        if (!apiResponse.success) {
          throw new Error('فشل في التحقق من المستخدم');
        }

        if (apiResponse.enabled !== '1') {
          throw new Error('المستخدم غير مفعل في منصة Classera للشراكة');
        }

        setProgress('جاري إنشاء/تحديث حساب المستخدم...');
        
        // Parse user data from the current URL (which should contain user info)
        const userData = parseClasseraWebviewUrl(window.location.href);
        
        if (!userData) {
          // Fallback: create basic user data from API response
          const basicUserData = {
            user_id: apiResponse.user_id,
            username: apiResponse.user_id,
            name: 'مستخدم Classera',
            type: apiResponse.role as any
          };
          
          const user = await createOrUpdateUserFromClassera(basicUserData, apiResponse);
          console.log('User created/updated:', user.id);
        } else {
          const user = await createOrUpdateUserFromClassera(userData, apiResponse);
          console.log('User created/updated:', user.id);
        }

        setProgress('جاري تسجيل الدخول...');
        
        // For development, we'll simulate successful login
        if (import.meta.env.DEV) {
          console.log('Development mode: Simulating successful Classera login');
          setStatus('success');
          setTimeout(() => {
            navigate(returnUrl);
          }, 2000);
          return;
        }

        // In production, generate custom token and sign in
        const customToken = await generateCustomTokenForUser(user.id);
        await signInWithCustomToken(auth, customToken);
        
        setStatus('success');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(returnUrl);
        }, 2000);
        
      } catch (err) {
        console.error('Classera callback error:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ في تسجيل الدخول عبر Classera');
        setStatus('error');
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="w-8 h-8 text-green-600 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">جاري تسجيل الدخول</h2>
            <p className="text-gray-600 mb-4">{progress}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">تم تسجيل الدخول بنجاح</h2>
            <p className="text-gray-600">مرحباً بك في منصة مشروعي! سيتم توجيهك الآن...</p>
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2">
                <School className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600">متصل عبر Classera</span>
              </div>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">فشل تسجيل الدخول</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/auth/classera')}
                className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                تسجيل الدخول العادي
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};