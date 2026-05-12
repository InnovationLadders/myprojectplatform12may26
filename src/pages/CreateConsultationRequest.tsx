import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  FolderOpen,
  Info,
  Save
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useConsultations } from '../hooks/useConsultations';
import { useProjects } from '../hooks/useProjects';
import { useTranslation } from 'react-i18next';

export const CreateConsultationRequest: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createConsultation } = useConsultations();
  const { projects } = useProjects();
  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    type: 'technical',
    method: 'video',
    duration: 60,
    project_id: '',
    preferredDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultationTypes = [
    { id: 'technical', name: t('consultations.types.technical'), description: t('consultations.typeDescriptions.technical') },
    { id: 'academic', name: t('consultations.types.academic'), description: t('consultations.typeDescriptions.academic') },
    { id: 'career', name: t('consultations.types.career'), description: t('consultations.typeDescriptions.career') },
    { id: 'project', name: t('consultations.types.project'), description: t('consultations.typeDescriptions.project') },
  ];

  const consultationMethods = [
    { id: 'video', name: t('consultations.methods.video'), icon: Video },
    { id: 'phone', name: t('consultations.methods.phone'), icon: Phone },
    { id: 'chat', name: t('consultations.methods.chat'), icon: MessageSquare },
  ];

  const consultationDurations = [
    { value: 30, label: t('consultations.durations.30min') },
    { value: 60, label: t('consultations.durations.60min') },
    { value: 90, label: t('consultations.durations.90min') },
    { value: 120, label: t('consultations.durations.120min') },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.topic || !formData.description) {
      setError(t('consultations.errors.requiredFields'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createConsultation({
        ...formData,
        status: 'pending'
      });
      navigate('/my-consultations');
    } catch (err) {
      console.error('Error submitting consultation request:', err);
      setError(err instanceof Error ? err.message : t('consultations.errors.submissionFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get active projects for the current user
  const activeProjects = projects.filter(p => p.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/my-consultations"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('consultations.createRequest.title')}</h1>
            <p className="text-gray-600">{t('consultations.createRequest.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('consultations.form.topic')} *
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('consultations.form.topicPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('consultations.form.description')} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('consultations.form.descriptionPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('consultations.form.type')} *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {consultationTypes.map((type) => (
                <label key={type.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.type === type.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="type"
                    value={type.id}
                    checked={formData.type === type.id}
                    onChange={() => handleInputChange('type', type.id)}
                    className="sr-only"
                  />
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('consultations.form.method')} *
              </label>
              <div className="space-y-2">
                {consultationMethods.map((method) => (
                  <label key={method.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    formData.method === method.id ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="method"
                      value={method.id}
                      checked={formData.method === method.id}
                      onChange={() => handleInputChange('method', method.id)}
                      className="sr-only"
                    />
                    <method.icon className="w-5 h-5" />
                    <span>{method.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('consultations.form.duration')} *
              </label>
              <div className="space-y-2">
                {consultationDurations.map((duration) => (
                  <label key={duration.value} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    formData.duration === duration.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="duration"
                      value={duration.value}
                      checked={formData.duration === duration.value}
                      onChange={() => handleInputChange('duration', duration.value)}
                      className="sr-only"
                    />
                    <Clock className="w-5 h-5" />
                    <span>{duration.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('consultations.form.relatedProject')}
              </label>
              <div className="relative">
                <FolderOpen className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.project_id}
                  onChange={(e) => handleInputChange('project_id', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('consultations.form.noProject')}</option>
                  {activeProjects.map((project) => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('consultations.form.preferredDate')}
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={formData.preferredDate}
                  onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <div className="text-blue-500 mt-1">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">{t('consultations.importantInfo.title')}</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• {t('consultations.importantInfo.review')}</li>
                <li>• {t('consultations.importantInfo.link')}</li>
                <li>• {t('consultations.importantInfo.cancel')}</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Link
              to="/my-consultations"
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('consultations.submitting')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {t('consultations.submitRequest')}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};