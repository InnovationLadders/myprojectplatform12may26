import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, Save, AlertTriangle, CheckCircle, MessageSquare, 
  Award, BarChart3, Target, Users, Lightbulb 
} from 'lucide-react';
import { useProjectEvaluation } from '../../hooks/useProjectEvaluation';
import { useTranslation } from 'react-i18next';

interface EvaluationFormProps {
  projectId: string;
  onSaved?: () => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({ projectId, onSaved }) => {
  const { t } = useTranslation();
  const { 
    currentEvaluation, 
    loading, 
    error, 
    updateCriterionScore, 
    updateFeedback, 
    saveEvaluation 
  } = useProjectEvaluation(projectId);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleScoreChange = (index: number, score: number) => {
    updateCriterionScore(index, score);
  };

  const handleCommentsChange = (index: number, comments: string) => {
    updateCriterionScore(index, currentEvaluation?.criteria[index].score || 0, comments);
  };

  const handleFeedbackChange = (feedback: string) => {
    updateFeedback(feedback);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const result = await saveEvaluation();
      setSaveSuccess(true);
      
      // Call the onSaved callback if provided
      if (result && onSaved) onSaved();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving evaluation:', err);
      setSaveError(err instanceof Error ? err.message : 'حدث خطأ في حفظ التقييم');
    } finally {
      setIsSaving(false);
    }
  };

  const getCriterionIcon = (name: string) => {
    switch (name) {
      case 'نسبة الإنجاز': return <Target className="w-5 h-5" />;
      case 'جودة العمل': return <Award className="w-5 h-5" />;
      case 'التواصل والتعاون': return <Users className="w-5 h-5" />;
      case 'الإبداع والابتكار': return <Lightbulb className="w-5 h-5" />;
      case 'جودة العرض والتوثيق': return <BarChart3 className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-medium">حدث خطأ</p>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  if (!currentEvaluation) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700">
        <p>لا يمكن تحميل نموذج التقييم. يرجى المحاولة مرة أخرى لاحقاً.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Award className="w-6 h-6 text-blue-600" />
        تقييم المشروع
      </h3>

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <p>تم حفظ التقييم بنجاح</p>
          </div>
        </div>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">حدث خطأ</p>
          </div>
          <p>{saveError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Overall Score */}
        <div className="mb-6 text-center">
          <div className="w-32 h-32 bg-blue-50 rounded-full flex flex-col items-center justify-center mx-auto">
            <span className="text-3xl font-bold text-blue-600">
              {currentEvaluation.criteria.reduce((total, criterion) => 
                total + (criterion.score * criterion.weight), 0
              ).toFixed(2)}/10
            </span>
            <span className="text-sm text-blue-600">الدرجة الموزونة</span>
          </div>
        </div>

        {/* Criteria */}
        <div className="space-y-6 mb-8">
          <h4 className="font-semibold text-gray-800 mb-4">معايير التقييم</h4>
          
          {currentEvaluation.criteria.map((criterion, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getCriterionIcon(criterion.name)}
                  <h5 className="font-medium text-gray-800">{criterion.name}</h5>
                  <span className="text-sm text-gray-500">({criterion.weight * 100}%)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-blue-600">{criterion.score}</span>
                  <span className="text-gray-500">/ {criterion.maxScore}</span>
                </div>
              </div>
              
              {/* Score Slider */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={criterion.maxScore}
                  step="0.5"
                  value={criterion.score}
                  onChange={(e) => handleScoreChange(index, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>{criterion.maxScore / 4}</span>
                  <span>{criterion.maxScore / 2}</span>
                  <span>{criterion.maxScore * 3/4}</span>
                  <span>{criterion.maxScore}</span>
                </div>
              </div>
              
              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={criterion.comments}
                  onChange={(e) => handleCommentsChange(index, e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="أضف ملاحظاتك حول هذا المعيار..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* Overall Feedback */}
        <div className="mb-6">
          <label className="block font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            التعليق العام
          </label>
          <textarea
            value={currentEvaluation.feedback}
            onChange={(e) => handleFeedbackChange(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="أضف تعليقك العام على المشروع وتوصياتك للطلاب..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ التقييم
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};