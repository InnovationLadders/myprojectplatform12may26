import React from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SubmitToEntrepreneurshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  projectTitle: string;
}

const SubmitToEntrepreneurshipModal: React.FC<SubmitToEntrepreneurshipModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  projectTitle
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="bg-green-100 p-1.5 md:p-2 rounded-lg flex-shrink-0">
              <Send className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            </div>
            <h2 className="text-base md:text-xl font-bold text-gray-900 truncate">
              {t('entrepreneurshipSubmissions.submitConfirmTitle')}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 flex-shrink-0 p-1"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <div className="flex gap-2 md:gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-blue-900 font-medium mb-2 text-sm md:text-base">
                  {t('entrepreneurshipSubmissions.submitConfirmMessage')}
                </p>
                <p className="text-blue-800 text-xs md:text-sm break-words">
                  <span className="font-semibold">{t('common.projectInfo')}:</span> {projectTitle}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 md:gap-3 sm:justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 md:px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{t('entrepreneurshipSubmissions.submitting')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('common.confirm')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitToEntrepreneurshipModal;
