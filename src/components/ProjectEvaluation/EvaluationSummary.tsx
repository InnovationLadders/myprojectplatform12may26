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
import i18n from '../../i18n';

interface EvaluationSummaryProps {
  evaluation: ProjectEvaluation;
  teacherName?: string;
}

export const EvaluationSummary: React.FC<EvaluationSummaryProps> = ({ 
  evaluation, 
  teacherName 
}) => {
  const { t } = useTranslation();
  
  const formatDate = (dateString: string) => {
    const locale = i18n.language?.startsWith('en') ? 'en-US' : 'ar-SA';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };

  const getCriterionIcon = (name: string) => {
    const criterionMap: Record<string, string> = {
      'نسبة الإنجاز': 'completionRate',
      'جودة العمل': 'workQuality',
      'التواصل والتعاون': 'communicationAndCooperation',
      'الإبداع والابتكار': 'creativityAndInnovation',
      'جودة العرض والتوثيق': 'presentationAndDocumentation',
      'Completion Rate': 'completionRate',
      'Work Quality': 'workQuality',
      'Communication & Cooperation': 'communicationAndCooperation',
      'Creativity & Innovation': 'creativityAndInnovation',
      'Presentation & Documentation Quality': 'presentationAndDocumentation',
    };
    const key = criterionMap[name];
    switch (key) {
      case 'completionRate': return <Target className="w-4 h-4" />;
      case 'workQuality': return <Award className="w-4 h-4" />;
      case 'communicationAndCooperation': return <Users className="w-4 h-4" />;
      case 'creativityAndInnovation': return <Lightbulb className="w-4 h-4" />;
      case 'presentationAndDocumentation': return <BarChart3 className="w-4 h-4" />;
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
    const isEnglish = i18n.language?.startsWith('en');
    if (percentage >= 90) return isEnglish ? 'Excellent' : 'ممتاز';
    if (percentage >= 80) return isEnglish ? 'Very Good' : 'جيد جداً';
    if (percentage >= 70) return isEnglish ? 'Good' : 'جيد';
    if (percentage >= 60) return isEnglish ? 'Acceptable' : 'مقبول';
    return isEnglish ? 'Weak' : 'ضعيف';
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
          {t('projectEvaluation.evaluationSummary', 'ملخص التقييم')}
        </h3>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {formatDate(evaluation.updatedAt)}
        </div>
      </div>

      {/* Overall Score */}
      <div className="flex items-center justify-center mb-6">
        <div className="w-32 h-32 bg-blue-50 rounded-full flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-blue-600">
            {evaluation.criteria.reduce((total, criterion) =>
              total + (criterion.score * criterion.weight), 0
            ).toFixed(2)}/10
          </span>
          <span className="text-sm text-blue-600">{t('projectEvaluation.overallScore')}</span>
        </div>
      </div>

      {/* Criteria Scores */}
      <div className="space-y-4 mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">{t('projectEvaluation.evaluationDetails', 'تفاصيل التقييم')}</h4>
        
        {evaluation.criteria.map((criterion, index) => {
          const criterionMap: Record<string, string> = {
            'نسبة الإنجاز': 'completionRate',
            'جودة العمل': 'workQuality',
            'التواصل والتعاون': 'communicationAndCooperation',
            'الإبداع والابتكار': 'creativityAndInnovation',
            'جودة العرض والتوثيق': 'presentationAndDocumentation',
            'Completion Rate': 'completionRate',
            'Work Quality': 'workQuality',
            'Communication & Cooperation': 'communicationAndCooperation',
            'Creativity & Innovation': 'creativityAndInnovation',
            'Presentation & Documentation Quality': 'presentationAndDocumentation',
          };
          const key = criterionMap[criterion.name];
          const translatedName = key ? t(`projectEvaluation.criteriaNames.${key}`, criterion.name) : criterion.name;
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {getCriterionIcon(criterion.name)}
                <span className="font-medium text-gray-800">{translatedName}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`font-bold ${getScoreColor(criterion.score, criterion.maxScore)}`}>
                  {criterion.score}
                </span>
                <span className="text-gray-500">/ {criterion.maxScore}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback */}
      {evaluation.feedback && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            {t('projectEvaluation.generalComment')}
          </h4>
          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-gray-700 whitespace-pre-wrap">{evaluation.feedback}</p>
          </div>
        </div>
      )}

      {/* Evaluator */}
      <div className="text-sm text-gray-500 text-left">
        {t('projectEvaluation.evaluatedBy', 'تم التقييم بواسطة')}: {teacherName || t('common.teacher')}
      </div>
    </motion.div>
  );
};
