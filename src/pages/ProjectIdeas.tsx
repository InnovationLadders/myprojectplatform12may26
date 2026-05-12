import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Lightbulb, 
  Clock, 
  Users, 
  Star,
  BookOpen,
  Beaker,
  Briefcase,
  Heart,
  Shield,
  Plus,
  Eye,
  Download,
  AlertCircle,
  X,
  CheckCircle,
  Info,
  PlayCircle
} from 'lucide-react';
import { useProjectIdeas, ProjectIdea } from '../hooks/useProjectIdeas';
import { formatDate } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { IdeaFormModal } from '../components/ProjectIdeas/IdeaFormModal';
import { useAuth } from '../contexts/AuthContext';

export const ProjectIdeas: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const { 
    projectIdeas, 
    loading, 
    error, 
    addIdea,
    incrementViews, 
    incrementDownloads 
  } = useProjectIdeas();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ProjectIdea | null>(null);
  const [showIdeaFormModal, setShowIdeaFormModal] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const categories = [
    { id: 'all', name: t('projectIdeas.categories.all'), icon: BookOpen, color: 'from-gray-500 to-gray-600' },
    { id: 'stem', name: t('projectIdeas.categories.stem'), icon: Beaker, color: 'from-blue-500 to-blue-600' },
    { id: 'entrepreneurship', name: t('projectIdeas.categories.entrepreneurship'), icon: Briefcase, color: 'from-green-500 to-green-600' },
    { id: 'volunteer', name: t('projectIdeas.categories.volunteer'), icon: Heart, color: 'from-red-500 to-red-600' },
    { id: 'ethics', name: t('projectIdeas.categories.ethics'), icon: Shield, color: 'from-purple-500 to-purple-600' },
  ];

  const difficulties = [
    { id: 'all', name: t('projectIdeas.difficulties.all') },
    { id: 'beginner', name: t('projectIdeas.difficulties.beginner') },
    { id: 'intermediate', name: t('projectIdeas.difficulties.intermediate') },
    { id: 'advanced', name: t('projectIdeas.difficulties.advanced') },
  ];

  const filteredProjects = projectIdeas
    .filter(project => {
      // For non-admin users, only show approved ideas
      if (!isAdmin && project.status !== 'approved') {
        return false;
      }
      
      const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
      const matchesDifficulty = selectedDifficulty === 'all' || project.difficulty === selectedDifficulty;
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesDifficulty && matchesSearch;
    });

  const handleViewIdea = async (id: string) => {
    try {
      await incrementViews(id);
      // Set the selected idea to show details
      const idea = projectIdeas.find(idea => idea.id === id);
      if (idea) {
        setSelectedIdea(idea);
      }
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const handleDownloadIdea = async (id: string) => {
    try {
      await incrementDownloads(id);
      
      // Get the idea to download
      const idea = projectIdeas.find(idea => idea.id === id);
      if (idea) {
        // Create a downloadable content
        const content = `
# ${idea.title}

## الوصف
${idea.description}

## الفئة
${getCategoryText(idea.category)}

## مستوى الصعوبة
${getDifficultyText(idea.difficulty)}

## المدة المتوقعة
${idea.duration || 'غير محدد'}

## الموضوع/المادة
${idea.subject || 'غير محدد'}

## الأهداف
${idea.objectives?.map((obj: string) => `- ${obj}`).join('\n') || 'لا توجد أهداف محددة'}

## المواد المطلوبة
${idea.materials?.map((mat: string) => `- ${mat}`).join('\n') || 'لا توجد مواد محددة'}

## خطوات التنفيذ
${idea.steps?.map((step: string, index: number) => `${index + 1}. ${step}`).join('\n') || 'لا توجد خطوات محددة'}

## الكلمات المفتاحية
${idea.tags?.map((tag: string) => `#${tag}`).join(' ') || 'لا توجد كلمات مفتاحية'}
        `;
        
        // Create a blob and download it
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${idea.title.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error incrementing downloads:', err);
    }
  };

  const handleUseIdea = (ideaId: string) => {
    // Navigate to create project page with the idea ID as a query parameter
    navigate(`/projects/new?ideaId=${ideaId}`);
  };

  const handleAddIdea = async (ideaData: Partial<ProjectIdea>) => {
    try {
      await addIdea(ideaData);
      setShowIdeaFormModal(false);
      setSubmissionSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmissionSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error adding idea:', error);
      throw error;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return t('projectIdeas.difficulties.beginner');
      case 'intermediate': return t('projectIdeas.difficulties.intermediate');
      case 'advanced': return t('projectIdeas.difficulties.advanced');
      default: return difficulty;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'stem': return t('projectIdeas.categories.stem');
      case 'entrepreneurship': return t('projectIdeas.categories.entrepreneurship');
      case 'volunteer': return t('projectIdeas.categories.volunteer');
      case 'ethics': return t('projectIdeas.categories.ethics');
      default: return category;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('projectIdeas.title')}</h1>
            <p className="opacity-90">{t('projectIdeas.subtitle')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{filteredProjects.length}</div>
            <div className="text-sm opacity-80">{t('projectIdeas.stats.projectIdeas')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <div className="text-sm opacity-80">{t('projectIdeas.stats.differentCategories')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{difficulties.length - 1}</div>
            <div className="text-sm opacity-80">{t('projectIdeas.stats.difficultyLevels')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm opacity-80">{t('projectIdeas.stats.free')}</div>
          </div>
        </div>
      </motion.div>

      {/* Success Message */}
      {submissionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
        >
          <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-800 mb-1">تم إرسال فكرة المشروع بنجاح</h3>
            <p className="text-green-700">
              تم استلام فكرة المشروع وسيتم مراجعتها من قبل مدير النظام. سيتم نشرها بعد الموافقة عليها.
            </p>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('projectIdeas.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-5 h-5" />
            {t('common.filter')}
          </button>
        </div>

        {/* Filters */}
        <div className={`mt-4 space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          {/* Categories */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">{t('projectIdeas.filters.categories')}</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">{t('projectIdeas.filters.difficulty')}</h3>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    selectedDifficulty === difficulty.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {difficulty.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {t('projectIdeas.showing')} {filteredProjects.length} {t('projectIdeas.of')} {isAdmin ? projectIdeas.length : filteredProjects.length} {t('projectIdeas.idea')}
        </p>
        <button 
          onClick={() => setShowIdeaFormModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('projectIdeas.suggestNewIdea')}
        </button>
      </div>

      {/* Project Ideas Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            {/* Project Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={project.image || "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400"}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(project.difficulty)}`}>
                  {getDifficultyText(project.difficulty)}
                </span>
              </div>
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {project.views}
                </div>
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {project.downloads}
                </div>
              </div>
            </div>

            {/* Project Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{project.rating}</span>
                </div>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-600">{project.subject || getCategoryText(project.category)}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                {project.title}
              </h3>
              
              <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                {project.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {project.duration || t('resources.defaultDuration')}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {t('projectIdeas.teamwork')}
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  onClick={() => handleViewIdea(project.id)}
                >
                  {t('projectIdeas.viewDetails')}
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => handleDownloadIdea(project.id)}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('projectIdeas.noResults')}</h3>
          <p className="text-gray-600 mb-4">{t('projectIdeas.tryChangingFilters')}</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedDifficulty('all');
              setSearchTerm('');
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            {t('common.resetFilters')}
          </button>
        </motion.div>
      )}

      {/* Project Details Modal */}
      {selectedIdea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="relative">
              {/* Header with image */}
              <div className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
                {selectedIdea.image ? (
                  <img 
                    src={selectedIdea.image} 
                    alt={selectedIdea.title}
                    className="w-full h-full object-cover opacity-50"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Lightbulb className="w-24 h-24 text-white opacity-20" />
                  </div>
                )}
                
                {/* Close button */}
                <button 
                  onClick={() => setSelectedIdea(null)}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedIdea.difficulty)}`}>
                      {getDifficultyText(selectedIdea.difficulty)}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {getCategoryText(selectedIdea.category)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedIdea.title}</h2>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-gray-800 mb-2">الوصف</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">{selectedIdea.description}</p>
                    
                    {/* Tags */}
                    {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedIdea.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">معلومات المشروع</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">المدة المتوقعة</p>
                          <p className="font-medium">{selectedIdea.duration || 'غير محدد'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">الموضوع/المادة</p>
                          <p className="font-medium">{selectedIdea.subject || 'غير محدد'}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">التقييم</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium">{selectedIdea.rating}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">المشاهدات</p>
                          <p className="font-medium">{selectedIdea.views}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">التنزيلات</p>
                          <p className="font-medium">{selectedIdea.downloads}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Objectives */}
                {selectedIdea.objectives && selectedIdea.objectives.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">أهداف المشروع</h3>
                    <div className="space-y-2">
                      {selectedIdea.objectives.map((objective: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                          <p className="text-gray-700">{objective}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Materials */}
                {selectedIdea.materials && selectedIdea.materials.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">المواد والأدوات المطلوبة</h3>
                    <div className="grid md:grid-cols-2 gap-2">
                      {selectedIdea.materials.map((material: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700">{material}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Steps */}
                {selectedIdea.steps && selectedIdea.steps.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-3">خطوات تنفيذ المشروع</h3>
                    <div className="space-y-3">
                      {selectedIdea.steps.map((step: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg flex-1">
                            <p className="text-gray-700">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-5 h-5" />
                      <span>{selectedIdea.views} مشاهدة</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Download className="w-5 h-5" />
                      <span>{selectedIdea.downloads} تنزيل</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleDownloadIdea(selectedIdea.id)}
                      className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      تنزيل
                    </button>
                    <button 
                      onClick={() => handleUseIdea(selectedIdea.id)}
                      className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5" />
                      استخدم هذه الفكرة
                    </button>
                    <button 
                      onClick={() => setSelectedIdea(null)}
                      className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Idea Form Modal */}
      {showIdeaFormModal && (
        <IdeaFormModal
          isOpen={showIdeaFormModal}
          onClose={() => setShowIdeaFormModal(false)}
          onSubmit={handleAddIdea}
          editingIdea={null}
        />
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">اقتراح فكرة مشروع جديدة</h3>
            <p className="text-blue-700 mb-4">
              يمكنك اقتراح فكرة مشروع جديدة ليتم إضافتها إلى قائمة أفكار المشاريع. سيتم مراجعة الفكرة من قبل مدير النظام قبل نشرها.
            </p>
            <button 
              onClick={() => setShowIdeaFormModal(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              اقتراح فكرة جديدة
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};