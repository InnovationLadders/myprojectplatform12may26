import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Phone, MapPin, BookOpen, User, CircleAlert as AlertCircle, Loader as Loader2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { GRADES } from '../constants/grades';

export const SSOProfileCompletion: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    city: '',
    grade: '',
    schoolIdNumber: '',
    gender: '' as 'male' | 'female' | '',
    subject: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    // Pre-fill schoolIdNumber from sso_upn if available
    if (user?.sso_upn) {
      setFormData(prev => ({ ...prev, schoolIdNumber: user.sso_upn || '' }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isStudent && !formData.grade) {
      setError('الرجاء تحديد الصف الدراسي');
      return;
    }
    if (!formData.gender) {
      setError('الرجاء تحديد الجنس');
      return;
    }

    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setError('انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.');
        return;
      }

      const updateData: Record<string, any> = {
        phone: formData.phone || null,
        city: formData.city || null,
        gender: formData.gender || null,
        profile_incomplete: false,
        updated_at: new Date(),
      };

      if (isStudent) {
        updateData.grade = formData.grade;
      }
      if (isTeacher) {
        updateData.subject = formData.subject || null;
      }
      if (formData.schoolIdNumber) {
        updateData.schoolIdNumber = formData.schoolIdNumber;
      }

      await updateDoc(doc(db, 'users', firebaseUser.uid), updateData);
      await refreshUser();
      navigate('/projects', { replace: true });
    } catch (err: any) {
      console.error('[SSOProfileCompletion] Error updating profile:', err);
      setError('حدث خطأ أثناء حفظ البيانات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center mx-auto mb-4"
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">استكمال البيانات</h1>
            <p className="text-gray-600 text-sm">
              تم تسجيل دخولك بنجاح عبر جامعة الملك فهد. الرجاء استكمال بياناتك للمتابعة.
            </p>
          </div>

          {/* Read-only SSO info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الجنس</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.gender === 'male' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={() => handleInputChange('gender', 'male')} className="sr-only" />
                  <span className="font-medium">ذكر</span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.gender === 'female' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={() => handleInputChange('gender', 'female')} className="sr-only" />
                  <span className="font-medium">أنثى</span>
                </label>
              </div>
            </div>

            {/* Grade - students only */}
            {isStudent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الصف الدراسي</label>
                <div className="relative">
                  <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    required
                  >
                    <option value="">اختر الصف</option>
                    {GRADES.map((grade) => (
                      <option key={grade.value} value={grade.value}>{grade.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Subject - teachers only */}
            {isTeacher && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المادة الدراسية</label>
                <div className="relative">
                  <BookOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="مثال: الرياضيات"
                  />
                </div>
              </div>
            )}

            {/* School ID Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isStudent ? 'الرقم الجامعي / الرقم الأكاديمي' : 'الرقم الوظيفي'}
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.schoolIdNumber}
                  onChange={(e) => handleInputChange('schoolIdNumber', e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={isStudent ? 'الرقم الجامعي' : 'الرقم الوظيفي'}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم الجوال</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: الظهران"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ ومتابعة'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
