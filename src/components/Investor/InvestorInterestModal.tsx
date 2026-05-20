import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Send, CircleCheck as CheckCircle, Clock, Circle as XCircle, TriangleAlert as AlertTriangle } from 'lucide-react';
import { useInvestorRequests, InvestorInterestRequest } from '../../hooks/useInvestorRequests';

interface InvestorInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  schoolId: string;
  schoolName: string;
}

const statusConfig = {
  pending: { label: 'قيد الانتظار', icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  in_progress: { label: 'تحت المعالجة', icon: TrendingUp, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  closed: { label: 'مغلق', icon: XCircle, color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

export const InvestorInterestModal: React.FC<InvestorInterestModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  schoolId,
  schoolName,
}) => {
  const { createRequest, checkExistingRequest } = useInvestorRequests();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingRequest, setExistingRequest] = useState<InvestorInterestRequest | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setChecking(true);
    setSubmitted(false);
    setError('');
    setNotes('');
    checkExistingRequest(projectId).then(req => {
      setExistingRequest(req);
      setChecking(false);
    });
  }, [isOpen, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('يرجى كتابة ملاحظاتك أو طلبك');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createRequest({ project_id: projectId, project_title: projectTitle, school_id: schoolId, school_name: schoolName, investor_notes: notes });
      setSubmitted(true);
    } catch (err) {
      setError('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">تسجيل الاهتمام</h2>
                  <p className="text-sm text-gray-500 truncate max-w-xs">{projectTitle}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {checking ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                </div>
              ) : submitted || existingRequest ? (
                <div className="text-center py-4">
                  {submitted ? (
                    <>
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">تم إرسال الطلب بنجاح</h3>
                      <p className="text-gray-500 text-sm mb-6">
                        سيتواصل معك مدير المؤسسة قريباً. يمكنك متابعة حالة الطلب من صفحة طلباتي.
                      </p>
                    </>
                  ) : existingRequest && (
                    <>
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">لديك طلب مسبق لهذا المشروع</h3>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-4 ${statusConfig[existingRequest.status].color}`}>
                        {React.createElement(statusConfig[existingRequest.status].icon, { className: 'w-4 h-4' })}
                        {statusConfig[existingRequest.status].label}
                      </div>
                      {existingRequest.investor_notes && (
                        <div className="bg-gray-50 rounded-xl p-4 text-right mb-3">
                          <p className="text-xs text-gray-500 mb-1">ملاحظاتك</p>
                          <p className="text-sm text-gray-700">{existingRequest.investor_notes}</p>
                        </div>
                      )}
                      {existingRequest.admin_notes && (
                        <div className="bg-emerald-50 rounded-xl p-4 text-right">
                          <p className="text-xs text-emerald-600 mb-1">ملاحظات المدير</p>
                          <p className="text-sm text-gray-700">{existingRequest.admin_notes}</p>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    إغلاق
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm text-emerald-700">
                      يمكنك تسجيل اهتمامك بهذا المشروع وطلب معلومات إضافية عنه. سيتم إشعار مدير المؤسسة بطلبك.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ملاحظاتك وطلبك للمعلومات الإضافية <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                      placeholder="اكتب ملاحظاتك وما تريد معرفته عن هذا المشروع..."
                      required
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg text-white py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          إرسال الطلب
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
