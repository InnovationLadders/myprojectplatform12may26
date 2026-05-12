import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { School, ArrowRight, CircleCheck as CheckCircle, Users, BookOpen, Award, Info, ExternalLink } from 'lucide-react';
import { ClasseraLoginButton } from '../../components/Auth/ClasseraLoginButton';
import { CLASSERA_CONFIG } from '../../lib/classera';

export const ClasseraLogin: React.FC = () => {
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  const features = [
    {
      icon: Users,
      title: 'تسجيل دخول موحد',
      description: 'استخدم حساب Classera الخاص بك للوصول المباشر'
    },
    {
      icon: BookOpen,
      title: 'مزامنة البيانات',
      description: 'تزامن تلقائي لبيانات الطلاب والمعلمين'
    },
    {
      icon: Award,
      title: 'تتبع التقدم',
      description: 'مشاركة درجات ونتائج المشاريع مع Classera'
    }
  ];

  const testAccounts = {
    production: {
      enabled: [
        { username: 'Hasan4ts0004', role: 'Admin', password: 'Class@987' },
        { username: 'hasan4s0007', role: 'Student', password: 'Class@987' },
        { username: 'Hasan4t0002', role: 'Teacher', password: 'Class@987' },
        { username: 'LtmStdPartner', role: 'Student', password: 'Class@987' },
        { username: 'LtmTeacherPartner', role: 'Teacher', password: 'Class@987' },
        { username: 'LtmSupervisorPartner', role: 'Supervisor', password: 'Class@987' }
      ],
      disabled: [
        { username: 'cera192admin0', role: 'Admin', password: 'Class@987' },
        { username: 'cera192s0002', role: 'Student', password: 'Class@987' },
        { username: 'cera192t0003', role: 'Teacher', password: 'Class@987' }
      ]
    },
    staging: {
      enabled: [
        { username: 'aed2ts0001', role: 'Admin', password: 'Class@987' },
        { username: 'aed2s1228', role: 'Student', password: 'Class@987' },
        { username: 'aed2s0003', role: 'Student', password: 'Class@987' },
        { username: 'aed2t0001', role: 'Teacher', password: 'Class@987' },
        { username: 'LtmStdPartner', role: 'Student', password: 'Class@987' },
        { username: 'LtmTeacherPartner', role: 'Teacher', password: 'Class@987' },
        { username: 'LtmSupervisorPartner', role: 'Supervisor', password: 'Class@987' }
      ],
      disabled: [
        { username: 'arabi_hu_admin', role: 'Admin', password: 'Class@987' },
        { username: 'arabi_hu', role: 'Teacher', password: 'Class@987' },
        { username: 'arabi_hu_std', role: 'Student', password: 'Class@987' }
      ]
    }
  };

  const currentEnvironment = CLASSERA_CONFIG.IS_PRODUCTION ? 'production' : 'staging';
  const currentAccounts = testAccounts[currentEnvironment];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-right"
          >
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
              <img 
                src="/mashroui-logo.png" 
                alt="مشروعي" 
                className="h-16 w-auto"
              />
              <div className="text-2xl font-bold text-gray-800">×</div>
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <School className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              تسجيل الدخول عبر Classera
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              استخدم حساب Classera الخاص بك للوصول المباشر إلى منصة مشروعي
            </p>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Environment Info */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                <div className="text-right">
                  <h4 className="font-medium text-blue-800 mb-1">معلومات البيئة</h4>
                  <p className="text-blue-700 text-sm">
                    البيئة الحالية: {CLASSERA_CONFIG.IS_PRODUCTION ? 'الإنتاج' : 'التطوير'}
                    <br />
                    المضيف: {CLASSERA_CONFIG.HOST}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <School className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">مرحباً بك</h2>
              <p className="text-gray-600">سجل دخولك باستخدام حساب Classera</p>
            </div>

            <div className="space-y-4">
              <ClasseraLoginButton />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">أو</span>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                تسجيل الدخول العادي
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                ليس لديك حساب؟{' '}
                <Link to="/register" className="text-green-600 hover:text-green-800 font-medium">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>

            {/* Test Accounts Section */}
            {import.meta.env.DEV && (
              <div className="mt-6">
                <button
                  onClick={() => setShowTestAccounts(!showTestAccounts)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showTestAccounts ? 'إخفاء' : 'عرض'} حسابات الاختبار
                </button>
                
                {showTestAccounts && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-medium text-gray-800 mb-3">
                      حسابات الاختبار - {currentEnvironment === 'production' ? 'الإنتاج (me.classera.com)' : 'التطوير (partners-stg.classera.com)'}
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-green-700 mb-2">الحسابات المفعلة:</h5>
                        <div className="space-y-1">
                          {currentAccounts.enabled.map((account, index) => (
                            <div key={index} className="text-xs bg-green-100 text-green-800 p-2 rounded">
                              <strong>{account.username}</strong> ({account.role}) - {account.password}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-red-700 mb-2">الحسابات المعطلة:</h5>
                        <div className="space-y-1">
                          {currentAccounts.disabled.map((account, index) => (
                            <div key={index} className="text-xs bg-red-100 text-red-800 p-2 rounded">
                              <strong>{account.username}</strong> ({account.role}) - {account.password}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-800">
                        <strong>ملاحظة:</strong> استخدم الحسابات المفعلة فقط للاختبار. 
                        الحسابات المعطلة ستظهر رسالة خطأ.
                      </p>
                    </div>
                    
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-800">
                        <strong>إعدادات API:</strong><br/>
                        Partner Name: {CLASSERA_CONFIG.PARTNER_NAME}<br/>
                        Client ID: {CLASSERA_CONFIG.CLIENT_ID}<br/>
                        Platform Issuer: {CLASSERA_CONFIG.PLATFORM_ISSUER}
                      </p>
                    </div>
                    
                    <div className="mt-3 text-center">
                      <a
                        href={CLASSERA_CONFIG.WEBVIEW_LOGIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        فتح صفحة تسجيل الدخول مباشرة
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800 text-sm">اتصال آمن</h4>
                  <p className="text-green-700 text-xs">
                    يتم تشفير جميع البيانات المنقولة بين Classera ومنصة مشروعي
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};