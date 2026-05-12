import React from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  Star, 
  Target, 
  Users, 
  Lightbulb, 
  BarChart3, 
  MessageSquare, 
  Calendar 
} from 'lucide-react';
import { ProjectEvaluation } from '../../hooks/useProjectEvaluation';
import { useTranslation } from 'react-i18next';

interface EvaluationSummaryProps {
  evaluation: ProjectEvaluation;
  teacherName?: string;
}

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({ 
  evaluation, 
  teacherName = 'المعلم' 
}) => {
  const { t } = useTranslation();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCriterionIcon = (name: string) => {
    switch (name) {
      case 'نسبة الإنجاز': return <Target className="w-4 h-4" />;
      case 'جودة العمل': return <Award className="w-4 h-4" />;
      case 'التواصل والتعاون': return <Users className="w-4 h-4" />;
      case 'الإبداع والابتكار': return <Lightbulb className="w-4 h-4" />;
      case 'جودة العرض والتوثيق': return <BarChart3 className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeText = (percentage: number) => {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 70) return 'جيد';
    if (percentage >= 60) return 'مقبول';
    return 'ضعيف';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Award className="w-6 h-6 text-blue-600" />
          ملخص التقييم
        </h3>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(evaluation.updatedAt)}
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-32 h-32 bg-blue-50 rounded-full flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-blue-600">{evaluation.criteria[0].score}/10</span>
          <span className="text-sm text-blue-600">{t('common.progressScore')}</span>
        </div>
      </div>

      {/* Criteria Scores */}
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">تفاصيل التقييم</h4>
        
        {evaluation.criteria.map((criterion, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {getCriterionIcon(criterion.name)}
              <span className="font-medium text-gray-800">{criterion.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`font-bold ${getScoreColor(criterion.score, criterion.maxScore)}`}>
                {criterion.score}
              </span>
              <span className="text-gray-500">/ {criterion.maxScore}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {evaluation.feedback && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            التعليق العام
          </h4>
          <div className="bg-gray-50 p-4 rounded-xl">
            <span className="text-sm text-blue-600">{t('common.progressScore')}</span>
          </div>
        </div>
      )}

      {/* Evaluator */}
      <div className="text-sm text-gray-500 text-left">
        تم التقييم بواسطة: {teacherName}
      </div>
    </motion.div>
  );
};