import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProjectIdea } from '../../hooks/useProjectIdeas';

interface ExcelImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (ideas: Partial<ProjectIdea>[]) => Promise<void>;
  projectIdeas: ProjectIdea[];
}

export const ExcelImportExportModal: React.FC<ExcelImportExportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  projectIdeas
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<Partial<ProjectIdea>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setImportedData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform the data
        const transformedData = jsonData.map((row: any) => {
          // Convert string arrays to actual arrays
          const objectives = row.objectives ? row.objectives.split(',').map((item: string) => item.trim()) : [];
          const materials = row.materials ? row.materials.split(',').map((item: string) => item.trim()) : [];
          const steps = row.steps ? row.steps.split(',').map((item: string) => item.trim()) : [];
          const tags = row.tags ? row.tags.split(',').map((item: string) => item.trim()) : [];

          return {
            title: row.title || '',
            description: row.description || '',
            category: row.category || 'stem',
            difficulty: row.difficulty || 'beginner',
            duration: row.duration || '',
            subject: row.subject || '',
            image: row.image || '',
            objectives,
            materials,
            steps,
            tags
          };
        });

        setImportedData(transformedData);
        setSuccess(`تم تحليل ${transformedData.length} فكرة مشروع بنجاح. اضغط على "استيراد" للمتابعة.`);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setError('حدث خطأ أثناء تحليل ملف Excel. تأكد من أن الملف بالتنسيق الصحيح.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError('حدث خطأ أثناء قراءة الملف.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (importedData.length === 0) {
      setError('لا توجد بيانات للاستيراد.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      await onImport(importedData);
      setSuccess(`تم استيراد ${importedData.length} فكرة مشروع بنجاح.`);
      setImportedData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error importing ideas:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء استيراد الأفكار.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Transform data for export
      const exportData = projectIdeas.map(idea => ({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        difficulty: idea.difficulty,
        duration: idea.duration,
        subject: idea.subject,
        image: idea.image,
        objectives: idea.objectives?.join(', '),
        materials: idea.materials?.join(', '),
        steps: idea.steps?.join(', '),
        tags: idea.tags?.join(', ')
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'أفكار المشاريع');

      // Generate Excel file
      XLSX.writeFile(workbook, 'project_ideas.xlsx');
      setSuccess('تم تصدير أفكار المشاريع بنجاح.');
    } catch (err) {
      console.error('Error exporting ideas:', err);
      setError('حدث خطأ أثناء تصدير الأفكار.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            استيراد وتصدير أفكار المشاريع
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            استيراد من Excel
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 font-medium text-sm border-b-2 ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            تصدير إلى Excel
          </button>
        </div>

        {/* Status Messages */}
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

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">تنسيق ملف الاستيراد</h4>
                <p className="text-sm text-blue-700">
                  يجب أن يحتوي ملف Excel على الأعمدة التالية: title, description, category, difficulty, duration, subject, image, objectives, materials, steps, tags.
                  <br />
                  للحقول التي تحتوي على قائمة (objectives, materials, steps, tags)، يجب فصل العناصر بفاصلة.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="font-medium text-gray-800 mb-2">اختر ملف Excel</h4>
              <p className="text-gray-600 text-sm mb-4">اسحب وأفلت الملف هنا أو اضغط لاختيار ملف</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                اختيار ملف
              </button>
            </div>

            {importedData.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">ملخص البيانات المستوردة</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700">عدد الأفكار: {importedData.length}</p>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <ul className="space-y-1">
                      {importedData.map((idea, index) => (
                        <li key={index} className="text-sm text-gray-600">
                          {idea.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isProcessing || importedData.length === 0}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    استيراد
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">معلومات التصدير</h4>
                <p className="text-sm text-blue-700">
                  سيتم تصدير جميع أفكار المشاريع ({projectIdeas.length} فكرة) إلى ملف Excel.
                  <br />
                  يمكنك تعديل الملف وإعادة استيراده لتحديث الأفكار.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="font-medium text-gray-800 mb-2">تصدير أفكار المشاريع</h4>
              <p className="text-gray-600 text-sm mb-4">اضغط على الزر أدناه لتصدير جميع أفكار المشاريع إلى ملف Excel</p>
              <button
                type="button"
                onClick={handleExport}
                disabled={isProcessing || projectIdeas.length === 0}
                className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري التصدير...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    تصدير إلى Excel
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};