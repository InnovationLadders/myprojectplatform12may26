import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, FileText, Image as ImageIcon, Video, AlertTriangle, CheckCircle } from 'lucide-react';
import { uploadFileToProjectStorage, addProjectResource } from '../../lib/firebase';

interface AddResourceModalProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({ projectId, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('الرجاء اختيار ملف للرفع.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const { downloadURL, fileType } = await uploadFileToProjectStorage(
        selectedFile,
        projectId,
        (progress) => setUploadProgress(progress)
      );

      await addProjectResource(projectId, {
        name: selectedFile.name,
        url: downloadURL,
        type: fileType,
        uploadedBy: 'user_id_placeholder', // Replace with actual user ID/name from auth context
        uploadedAt: new Date().toISOString(),
      });

      setSuccess('تم رفع الملف بنجاح!');
      onSuccess(); // Trigger parent to re-fetch data
      setTimeout(onClose, 1500); // Close modal after a short delay
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الملف.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input
      }
    }
  };

  const getFileIcon = (file: File | null) => {
    if (!file) return <FileText className="w-16 h-16 text-gray-400" />;
    if (file.type.startsWith('image/')) return <ImageIcon className="w-16 h-16 text-blue-500" />;
    if (file.type.startsWith('video/')) return <Video className="w-16 h-16 text-purple-500" />;
    return <FileText className="w-16 h-16 text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600" />
            رفع ملف جديد
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{success}</div>
          </div>
        )}

        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
               onClick={() => fileInputRef.current?.click()}>
            {getFileIcon(selectedFile)}
            <h4 className="font-medium text-gray-800 mt-4 mb-2">
              {selectedFile ? selectedFile.name : 'اسحب وأفلت الملف هنا أو اضغط للاختيار'}
            </h4>
            <p className="text-gray-600 text-sm">
              {selectedFile ? `الحجم: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'الحد الأقصى للحجم: 20MB'}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">جاري الرفع...</span>
                <span className="text-sm font-medium text-gray-700">{uploadProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            disabled={isUploading}
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري الرفع...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                رفع الملف
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};