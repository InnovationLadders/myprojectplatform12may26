import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Play, 
  Download, 
  Star,
  Clock,
  Users,
  FileText,
  Video,
  Headphones,
  Link as LinkIcon,
  Eye,
  Heart,
  Share2,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useLearningResources } from '../hooks/useLearningResources';
import { formatDate } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';

export const Resources: React.FC = () => {
  const { t } = useTranslation();
  const { resources, loading, error, incrementViews, incrementLikes } = useLearningResources();
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [likedResources, setLikedResources] = useState<string[]>([]);

  const resourceTypes = [
    { id: 'all', name: t('resources.types.all'), icon: BookOpen },
    { id: 'article', name: t('resources.types.article'), icon: FileText },
    { id: 'video', name: t('resources.types.video'), icon: Video },
    { id: 'course', name: t('resources.types.course'), icon: Play },
    { id: 'template', name: t('resources.types.template'), icon: Download },
    { id: 'podcast', name: t('resources.types.podcast'), icon: Headphones },
    { id: 'link', name: t('resources.types.link'), icon: LinkIcon },
  ];

  const categories = [
    { id: 'all', name: t('resources.categories.all') },
    { id: 'project-management', name: t('resources.categories.projectManagement') },
    { id: 'programming', name: t('resources.categories.programming') },
    { id: 'design', name: t('resources.categories.design') },
    { id: 'entrepreneurship', name: t('resources.categories.entrepreneurship') },
    { id: 'stem', name: t('resources.categories.stem') },
    { id: 'soft-skills', name: t('resources.categories.softSkills') },
  ];

  const filteredResources = resources.filter(resource => {
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesCategory && matchesSearch;
  });

  const toggleLike = (resourceId: string) => {
    if (likedResources.includes(resourceId)) {
      setLikedResources(prev => prev.filter(id => id !== resourceId));
    } else {
      setLikedResources(prev => [...prev, resourceId]);
      incrementLikes(resourceId);
    }
  };

  const handleViewResource = (resourceId: string) => {
    incrementViews(resourceId);
  };

  const getTypeIcon = (type: string) => {
    const typeInfo = resourceTypes.find(t => t.id === type);
    return typeInfo ? typeInfo.icon : FileText;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'مبتدئ': 
      case 'beginner': 
        return 'bg-green-100 text-green-800';
      case 'متوسط': 
      case 'intermediate': 
        return 'bg-yellow-100 text-yellow-800';
      case 'متقدم': 
      case 'advanced': 
        return 'bg-red-100 text-red-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'مبتدئ': 
      case 'beginner': 
        return t('resources.difficulties.beginner');
      case 'متوسط': 
      case 'intermediate': 
        return t('resources.difficulties.intermediate');
      case 'متقدم': 
      case 'advanced': 
        return t('resources.difficulties.advanced');
      default: 
        return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
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
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t('resources.title')}</h1>
            <p className="opacity-90">{t('resources.subtitle')}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{resources.length}</div>
            <div className="text-sm opacity-80">{t('resources.stats.learningResource')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{resourceTypes.length - 1}</div>
            <div className="text-sm opacity-80">{t('resources.stats.contentType')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <div className="text-sm opacity-80">{t('resources.stats.specialtyCategory')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm opacity-80">{t('resources.stats.free')}</div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('resources.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Type Filters */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-3">{t('resources.filters.contentType')}</h3>
          <div className="flex flex-wrap gap-2">
            {resourceTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  selectedType === type.id
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">{t('resources.filters.category')}</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-teal-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {t('resources.showing')} {filteredResources.length} {t('resources.of')} {resources.length} {t('resources.resource')}
        </p>
      </div>

      {/* Resources Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource, index) => {
          const TypeIcon = getTypeIcon(resource.type);
          
          return (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              {/* Resource Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={resource.thumbnail || "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400"}
                  alt={resource.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {resource.featured && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white px-2 py-1 rounded-lg text-sm font-medium">
                    {t('resources.featured')}
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                    <TypeIcon className="w-3 h-3" />
                    {resourceTypes.find(t => t.id === resource.type)?.name}
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {resource.views.toLocaleString()}
                  </div>
                  <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {resource.likes}
                  </div>
                </div>
              </div>

              {/* Resource Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{resource.rating}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(resource.difficulty || 'beginner')}`}>
                    {getDifficultyText(resource.difficulty || 'beginner')}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {resource.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {resource.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                      #{tag}
                    </span>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                      +{resource.tags.length - 3} {t('resources.more')}
                    </span>
                  )}
                </div>

                {/* Resource Info */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {resource.duration || t('resources.defaultDuration')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {resource.author}
                  </div>
                </div>

                {/* Special Info */}
                {resource.type === 'course' && resource.lessons && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>{resource.lessons} {t('resources.lesson')}</span>
                    {resource.certificate && <span>{t('resources.certifiedCourse')}</span>}
                  </div>
                )}

                {resource.type === 'template' && resource.fileSize && (
                  <div className="text-sm text-gray-500 mb-4">
                    {t('resources.fileSize')}: {resource.fileSize}
                  </div>
                )}

                {resource.type === 'podcast' && resource.episodes && (
                  <div className="text-sm text-gray-500 mb-4">
                    {resource.episodes} {t('resources.episode')}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLike(resource.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        likedResources.includes(resource.id)
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    {(resource.type === 'template' || resource.downloadUrl) && (
                      <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {resource.type === 'video' ? (
                    <a 
                      href={resource.watchUrl || resource.contentUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleViewResource(resource.id)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {t('resources.actions.watch')}
                    </a>
                  ) : (
                    <button 
                      onClick={() => handleViewResource(resource.id)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      {resource.type === 'course' && <BookOpen className="w-4 h-4" />}
                      {resource.type === 'template' && <Download className="w-4 h-4" />}
                      {resource.type === 'podcast' && <Headphones className="w-4 h-4" />}
                      {resource.type === 'article' && <FileText className="w-4 h-4" />}
                      {resource.type === 'link' && <LinkIcon className="w-4 h-4" />}
                      
                      {resource.type === 'course' && t('resources.actions.startCourse')}
                      {resource.type === 'template' && t('resources.actions.download')}
                      {resource.type === 'podcast' && t('resources.actions.listen')}
                      {resource.type === 'article' && t('resources.actions.read')}
                      {resource.type === 'link' && t('resources.actions.visit')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('resources.noResourcesFound')}</h3>
          <p className="text-gray-600 mb-4">{t('resources.tryChangingFilters')}</p>
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedCategory('all');
              setSearchTerm('');
            }}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
          >
            {t('common.resetFilters')}
          </button>
        </motion.div>
      )}
    </div>
  );
};