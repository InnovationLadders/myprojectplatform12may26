import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { uploadSchoolLogo, deleteSchoolLogo } from '../../lib/firebase';

interface SchoolLogoUploaderProps {
  schoolId: string;
  currentLogoUrl?: string | null;
  onLogoUpdated: (logoUrl: string | null) => void;
}

export const SchoolLogoUploader: React.FC<SchoolLogoUploaderProps> = ({
  schoolId,
  currentLogoUrl,
  onLogoUpdated
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase
      const downloadUrl = await uploadSchoolLogo(schoolId, file, (progress) => {
        setUploadProgress(progress);
      });

      onLogoUpdated(downloadUrl);
      setUploading(false);
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      setError(err.message || t('schoolCustomization.uploadError'));
      setPreviewUrl(currentLogoUrl || null);
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!currentLogoUrl) return;

    if (!confirm(t('schoolCustomization.confirmDeleteLogo'))) {
      return;
    }

    setError(null);
    setUploading(true);

    try {
      await deleteSchoolLogo(schoolId, currentLogoUrl);
      setPreviewUrl(null);
      onLogoUpdated(null);
      setUploading(false);
    } catch (err: any) {
      console.error('Error deleting logo:', err);
      setError(err.message || t('schoolCustomization.deleteError'));
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t('schoolCustomization.schoolLogo')}
      </label>

      <div className="flex items-start gap-4">
        {/* Logo Preview */}
        <div className="flex-shrink-0">
          {previewUrl ? (
            <div className="relative w-32 h-32 rounded-lg border-2 border-gray-300 overflow-hidden bg-white">
              <img
                src={previewUrl}
                alt="School Logo"
                className="w-full h-full object-contain p-2"
              />
              {!uploading && (
                <button
                  onClick={handleRemoveLogo}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title={t('common.delete')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-3">
          <div>
            <label
              htmlFor={`logo-upload-${schoolId}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                uploading
                  ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-blue-500 text-blue-600 hover:bg-blue-50'
              }`}
            >
              <Upload className="w-4 h-4" />
              {uploading ? t('common.uploading') : t('schoolCustomization.uploadLogo')}
            </label>
            <input
              id={`logo-upload-${schoolId}`}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </div>

          <p className="text-xs text-gray-500">
            {t('schoolCustomization.logoRequirements')}
          </p>

          {uploading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 text-center">
                {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
