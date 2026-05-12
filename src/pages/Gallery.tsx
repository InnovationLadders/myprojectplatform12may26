import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GalleryVertical as GalleryIcon, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Heart, 
  Star, 
  Play, 
  Award, 
  Users, 
  Calendar, 
  School, 
  Tag, 
  AlertTriangle,
  Edit,
  Trash2, // Add Trash2 for delete functionality
  MoreVertical,
  X
} from 'lucide-react';
import { useGallery } from '../hooks/useGallery';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { AddProjectModal } from '../components/Gallery/AddProjectModal';
import { DeleteConfirmationModal } from '../components/ProjectIdeas/DeleteConfirmationModal'; // Re-use generic delete modal

export const Gallery: React.FC = () => {
  const { user } = useAuth();
  const { projects, loading, error, incrementViews, incrementLikes, fetchGalleryProjects, deleteGalleryProject } = useGallery();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [likedProjects, setLikedProjects] = useState<string[]>([]);
  // State for editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<GalleryProject | null>(null);
  // State for deleting
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<GalleryProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = [
    { id: 'all', name: 'جميع المشاريع' },
    { id: 'stem', name: 'العلوم والتقنية' },
    { id: 'entrepreneurship', name: 'ريادة الأعمال' },
    { id: 'volunteer', name: 'التطوع' },
    { id: 'ethics', name: 'الأخلاق' },
  ];

  const filteredProjects = projects.filter(project => {
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.students.some(student => student.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleViewProject = async (projectId: string) => {
    try {
      await incrementViews(projectId);
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
      }
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const handleLikeProject = async (projectId: string) => {
    try {
      if (!likedProjects.includes(projectId)) {
        await incrementLikes(projectId);
        setLikedProjects(prev => [...prev, projectId]);
      }
    } catch (err) {
      console.error('Error incrementing likes:', err);
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'stem': return 'العلوم والتقنية';
      case 'entrepreneurship': return 'ريادة الأعمال';
      case 'volunteer': return 'التطوع';
      case 'ethics': return 'الأخلاق';
      default: return category;
    }
  };

  const handleEditProject = (project: GalleryProject) => {
    setProjectToEdit(project);
    setShowEditModal(true);
  };

  const handleDeleteProject = (project: GalleryProject) => {
    setProjectToDelete(project);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGalleryProject(projectToDelete.id);
      setShowDeleteConfirmModal(false);
      fetchGalleryProjects(); // Re-fetch projects after successful delete
    } catch (err) {
      console.error('Error deleting project:', err);
      // Optionally, show an error message to the user
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  // Check permissions for current user
  const canAddProject = user?.role === 'admin' || user?.role === 'school';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">حدث خطأ</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <GalleryIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">معرض المشاريع</h1>
              <p className="opacity-90">استكشف المشاريع المميزة والملهمة من طلابنا</p>
            </div>
          </div>
          
          {canAddProject && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-white text-pink-600 px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة مشروع
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-sm opacity-80">مشروع مميز</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{projects.filter(p => p.featured).length}</div>
            <div className="text-sm opacity-80">مشروع مختار</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{projects.reduce((sum, p) => sum + p.views, 0).toLocaleString()}</div>
            <div className="text-sm opacity-80">إجمالي المشاهدات</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <div className="text-sm opacity-80">فئة مختلفة</div>
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
              placeholder="البحث في المشاريع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-5 h-5" />
            الفلاتر
          </button>
        </div>

        {/* Categories */}
        <div className={`${showFilters ? 'block' : 'hidden lg:block'}`}>
          <h3 className="font-medium text-gray-700 mb-3">الفئات</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-pink-500 text-white shadow-lg'
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
          عرض {filteredProjects.length} من أصل {projects.length} مشروع
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project, index) => {
          // Define permissions for each project
          const canEdit = user?.role === 'admin' || (user?.role === 'school' && user?.schoolId === project.schoolId);
          const canDelete = user?.role === 'admin' || (user?.role === 'school' && user?.schoolId === project.schoolId);
          
          return (
            <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
          >
            {/* Project Media */}
            <div className="relative h-48 overflow-hidden">
              {project.mediaType === 'youtube' && project.video ? (
                <iframe
                  src={project.video}
                  title={project.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                />
              ) : project.mediaType === 'video' ? (
                <video
                  src={project.mediaUrl}
                  className="w-full h-full object-cover"
                  controls
                />
              ) : (
                <img
                  src={project.mediaUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              )}
              
              {project.featured && (
                <div className="absolute top-4 right-4 bg-yellow-500 text-white px-2 py-1 rounded-lg text-sm font-medium flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  مميز
                </div>
              )}
              
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {project.views}
                </div>
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {project.likes}
                </div>
              </div>
              
              <div className="absolute bottom-4 right-4">
                <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-lg text-xs font-medium">
                  {getCategoryText(project.category)}
                </span>
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
                <span className="text-sm text-gray-600">{formatDate(project.completedAt)}</span>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors">
                {project.title}
              </h3>
              
              <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                {project.description}
              </p>

              {/* Students */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">الطلاب المشاركون:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.students.slice(0, 3).map((student, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg">
                      {student}
                    </span>
                  ))}
                  {project.students.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                      +{project.students.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* School and Teacher */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <School className="w-4 h-4" />
                  <span>{project.school}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>المعلم المشرف: {project.teacher}</span>
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {project.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                        #{tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Awards */}
              {project.awards && project.awards.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">الجوائز:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {project.awards.map((award, idx) => (
                      <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-lg">
                        {award}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit and Delete Buttons */}
              {/* Actions */}
              <div className="flex items-center justify-between">
                {/* Edit and Delete Buttons */}
                {(canEdit || canDelete) && (
                  <div className="flex gap-2">
                    {canEdit && (
                      <button 
                        onClick={(e) => { e.preventDefault(); handleEditProject(project); }} 
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" 
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        onClick={(e) => { e.preventDefault(); handleDeleteProject(project); }} 
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors" 
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLikeProject(project.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      likedProjects.includes(project.id)
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  
                  {project.mediaType === 'youtube' && project.youtubeUrl && (
                    <a
                      href={project.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                    </a>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewProject(project.id)}
                    className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    عرض التفاصيل
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
          );
        })}
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
            <GalleryIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد مشاريع</h3>
          <p className="text-gray-600 mb-4">
            {projects.length === 0 
              ? 'لم يتم إضافة أي مشاريع للمعرض بعد' 
              : 'لم يتم العثور على مشاريع تطابق معايير البحث'}
          </p>
          <div className="flex justify-center gap-4">
            {canAddProject && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة مشروع جديد
              </button>
            )}
            {projects.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                إعادة تعيين الفلاتر
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="relative">
              {/* Header with media */}
              <div className="relative h-64 bg-gradient-to-r from-pink-600 to-rose-600">
                {selectedProject.mediaType === 'youtube' && selectedProject.video ? (
                  <iframe
                    src={selectedProject.video}
                    title={selectedProject.title}
                    className="w-full h-full opacity-80"
                    frameBorder="0"
                    allowFullScreen
                  />
                ) : selectedProject.mediaType === 'video' ? (
                  <video
                    src={selectedProject.mediaUrl}
                    className="w-full h-full object-cover opacity-80"
                    controls
                  />
                ) : (
                  <img 
                    src={selectedProject.mediaUrl} 
                    alt={selectedProject.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
                
                {/* Close button */}
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">
                      {getCategoryText(selectedProject.category)}
                    </span>
                    {selectedProject.featured && (
                      <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        مميز
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedProject.title}</h2>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-gray-800 mb-2">وصف المشروع</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">{selectedProject.description}</p>
                    
                    {/* Students */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">الطلاب المشاركون:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.students.map((student: string, idx: number) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-lg">
                            {student}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {selectedProject.tags && selectedProject.tags.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">الكلمات المفتاحية:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProject.tags.map((tag: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Awards */}
                    {selectedProject.awards && selectedProject.awards.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">الجوائز والإنجازات:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProject.awards.map((award: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-lg flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {award}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">معلومات المشروع</h3>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">المدرسة</p>
                          <p className="font-medium">{selectedProject.school}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">المعلم المشرف</p>
                          <p className="font-medium">{selectedProject.teacher}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">تاريخ الإكمال</p>
                          <p className="font-medium">{formatDate(selectedProject.completedAt)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">التقييم</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium">{selectedProject.rating}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">المشاهدات</p>
                          <p className="font-medium">{selectedProject.views}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">الإعجابات</p>
                          <p className="font-medium">{selectedProject.likes}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye className="w-5 h-5" />
                      <span>{selectedProject.views} مشاهدة</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Heart className="w-5 h-5" />
                      <span>{selectedProject.likes} إعجاب</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleLikeProject(selectedProject.id)}
                      className={`px-6 py-2 rounded-xl transition-colors flex items-center gap-2 ${
                        likedProjects.includes(selectedProject.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-red-100 text-red-600 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                      إعجاب
                    </button>
                    
                    {selectedProject.mediaType === 'youtube' && selectedProject.youtubeUrl && (
                      <a
                        href={selectedProject.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        مشاهدة على يوتيوب
                      </a>
                    )}
                    
                    <button 
                      onClick={() => setSelectedProject(null)}
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

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          // Refresh projects list if needed
        }}
      />
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <AddProjectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchGalleryProjects(); // Re-fetch projects after successful edit
          }}
          editingProject={projectToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && projectToDelete && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirmModal}
          onClose={() => setShowDeleteConfirmModal(false)}
          onConfirm={confirmDeleteProject}
          title={projectToDelete.title}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
};