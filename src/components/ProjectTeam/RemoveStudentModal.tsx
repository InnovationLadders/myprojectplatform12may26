import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, UserMinus } from 'lucide-react';

interface RemoveStudentModalProps {
  studentName: string;
  studentRole: string;
  isLeader: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isRemoving: boolean;
}

export const RemoveStudentModal: React.FC<RemoveStudentModalProps> = ({
  studentName,
  studentRole,
  isLeader,
  onConfirm,
  onCancel,
  isRemoving
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              إزالة طالب من المشروع
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isRemoving}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            هل أنت متأكد من إزالة <span className="font-semibold">{studentName}</span> من المشروع؟
          </p>

          {isLeader && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-medium text-sm">
                    تحذير: هذا الطالب هو قائد الفريق
                  </p>
                  <p className="text-yellow-700 text-sm mt-1">
                    قد تحتاج إلى تعيين قائد جديد للفريق بعد إزالة هذا الطالب.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">سيتم:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• إزالة الطالب من قائمة أعضاء المشروع</li>
              <li>• إلغاء تعيين جميع المهام المرتبطة بهذا الطالب</li>
              <li>• عدم إمكانية الطالب من الوصول إلى محادثة المشروع</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            يمكنك إعادة إضافة الطالب لاحقاً إذا لزم الأمر.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isRemoving}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={isRemoving}
            className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRemoving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري الإزالة...
              </>
            ) : (
              <>
                <UserMinus className="w-5 h-5" />
                نعم، إزالة الطالب
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
