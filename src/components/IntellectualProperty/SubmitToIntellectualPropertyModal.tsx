import React, { useState } from 'react';
import { X, Send, CircleAlert as AlertCircle, Lightbulb, Palette, Cpu, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SubmitToIntellectualPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ipType: string, description: string) => void;
  isLoading: boolean;
  projectTitle: string;
}

const SubmitToIntellectualPropertyModal: React.FC<SubmitToIntellectualPropertyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  projectTitle
}) => {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState('invention');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const propertyTypes = [
    { id: 'invention', name: t('intellectualProperty.types.invention'), icon: Lightbulb },
    { id: 'design', name: t('intellectualProperty.types.design'), icon: Palette },
    { id: 'software', name: t('intellectualProperty.types.software'), icon: Cpu },
    { id: 'research', name: t('intellectualProperty.types.research'), icon: BookOpen },
  ];

  const handleConfirm = () => {
    onConfirm(selectedType, description);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
      <div className="bg-white rounded-lg md:rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="bg-purple-100 p-1.5 md:p-2 rounded-lg flex-shrink-0">
              <Send className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
            </div>
            <h2 className="text-base md:text-xl font-bold text-gray-900 truncate">
              {t('ipSubmissions.submitConfirmTitle')}
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

        <div className="p-4 md:p-6 space-y-5">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4">
            <div className="flex gap-2 md:gap-3">
              <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-purple-900 font-medium mb-1 text-sm md:text-base">
                  {t('ipSubmissions.submitConfirmMessage')}
                </p>
                <p className="text-purple-800 text-xs md:text-sm break-words">
                  <span className="font-semibold">{t('common.projectInfo')}:</span> {projectTitle}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('ipSubmissions.selectType')} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {propertyTypes.map((type) => (
                <label
                  key={type.id}
                  className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                    selectedType === type.id
                      ? 'bg-purple-50 border-purple-500 text-purple-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="ipType"
                    value={type.id}
                    checked={selectedType === type.id}
                    onChange={() => setSelectedType(type.id)}
                    className="sr-only"
                  />
                  <type.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{type.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('ipSubmissions.descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              placeholder={t('ipSubmissions.descriptionPlaceholder')}
            />
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
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 md:px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{t('ipSubmissions.submitting')}</span>
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

export default SubmitToIntellectualPropertyModal;
