import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Search, Filter, Plus, Edit, Trash2, Eye, Star, Clock, User, BookOpen, BarChart, Play, AlertTriangle, CheckCircle, X, Chrome as Broom } from 'lucide-react';
import { useLearningResources, LearningResource } from '../../hooks/useLearningResources';
import { VideoFormModal } from '../../components/LearningResources/VideoFormModal';
import { formatDate } from '../../utils/dateUtils';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  isDeleting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            تأكيد الحذف
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">
            هل أنت متأكد من حذف الفيديو التالي؟
          </p>
          <p className="font-semibold text-gray-800 mt-2">"{title}"</p>
          <p className="text-red-600 text-sm mt-4">
            هذا الإجراء لا يمكن التراجع عنه.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                جاري الحذف...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                تأكيد الحذف
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ManageVideos: React.FC = () => {
  const { 
    resources, 
    loading, 
    error, 
    fetchResources, 
    createResource, 
    updateResource, 
    deleteResource,
    cleanupDuplicateResources
  } = useLearningResources();
  
  const [videos, setVideos] = useState<LearningResource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<LearningResource | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState<LearningResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for cleaning up duplicates
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [cleanupSuccess, setCleanupSuccess] = useState<string | null>(null);
  const [cleanupError, setCleanupError] = useState<string | null>(null);

  // Filter videos from all resources
  useEffect(() => {
    if (resources) {
      const videoResources = resources.filter(resource => resource.type === 'video');
      setVideos(videoResources);
    }
  }, [resources]);

  // Fetch only video resources on component mount
  useEffect(() => {
    fetchResources('video');
  }, []);

  const categories = [
    { id: 'all', name: 'جميع الفئات' },
    { id: 'project-management', name: 'إدارة المشاريع' },
    { id: 'programming', name: 'البرمجة' },
    { id: 'design', name: 'التصميم' },
    { id: 'entrepreneurship', name: 'ريادة الأعمال' },
    { id: 'stem', name: 'ستيم' },
    { id: 'soft-skills', name: 'المهارات الناعمة' },
    { id: 'education', name: 'التعليم' },
    { id: 'intellectual-property', name: 'الملكية الفكرية' }
  ];

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  const handleAddVideo = async (videoData: Partial<LearningResource>) => {
    try {
      await createResource({
        ...videoData,
        type: 'video'
      });
      
      setSuccessMessage('تم إضافة الفيديو بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      return;
    } catch (error) {
      console.error('Error adding video:', error);
      throw error;
    }
  };

  const handleEditVideo = async (videoData: Partial<LearningResource>) => {
    if (!editingVideo) return;
    
    try {
      await updateResource(editingVideo.id, {
        ...videoData,
        type: 'video'
      });
      
      setSuccessMessage('تم تحديث الفيديو بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      return;
    } catch (error) {
      console.error('Error updating video:', error);
      throw error;
    }
  };

  const handleDeleteVideo = async () => {
    if (!deletingVideo) return;
    
    setIsDeleting(true);
    try {
      await deleteResource(deletingVideo.id);
      setShowDeleteModal(false);
      
      setSuccessMessage('تم حذف الفيديو بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setIsDeleting(false);
      setDeletingVideo(null);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaningDuplicates(true);
    setCleanupSuccess(null);
    setCleanupError(null);
    
    try {
      const deletedCount = await cleanupDuplicateResources();
      setCleanupSuccess(`تم حذف ${deletedCount} مورد تعليمي مكرر بنجاح`);
      
      // Refresh the videos list
      await fetchResources('video');
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      setCleanupError('حدث خطأ أثناء حذف الموارد المكررة');
    } finally {
      setIsCleaningDuplicates(false);
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return difficulty || 'غير محدد';
    }
  };

  const getCategoryText = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  if (loading && videos.length === 0) {
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
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">حدث خطأ</h2>
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">إدارة الفيديوهات التعليمية</h1>
              <p className="opacity-90">إضافة وتعديل وحذف الفيديوهات التعليمية</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCleanupDuplicates}
              disabled={isCleaningDuplicates}
              className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Broom className="w-5 h-5" />
              {isCleaningDuplicates ? 'جاري الحذف...' : 'حذف المكرر'}
            </button>
            <button 
              onClick={() => {
                setEditingVideo(null);
                setShowFormModal(true);
              }}
              className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة فيديو جديد
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{videos.length}</div>
            <div className="text-sm opacity-80">فيديو تعليمي</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{videos.filter(v => v.featured).length}</div>
            <div className="text-sm opacity-80">فيديو مميز</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{videos.reduce((sum, v) => sum + v.views, 0).toLocaleString()}</div>
            <div className="text-sm opacity-80">إجمالي المشاهدات</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <div className="text-sm opacity-80">فئة</div>
          </div>
        </div>
      </motion.div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
        >
          <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-800 mb-1">تمت العملية بنجاح</h3>
            <p className="text-green-700">{successMessage}</p>
          </div>
        </motion.div>
      )}

      {/* Cleanup Success/Error Messages */}
      {cleanupSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
        >
          <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-800 mb-1">تم حذف العناصر المكررة بنجاح</h3>
            <p className="text-green-700">{cleanupSuccess}</p>
          </div>
        </motion.div>
      )}

      {cleanupError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800 mb-1">حدث خطأ</h3>
            <p className="text-red-700">{cleanupError}</p>
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
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في الفيديوهات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">الفئات</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-emerald-500 text-white shadow-lg'
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
          عرض {filteredVideos.length} من أصل {videos.length} فيديو
        </p>
      </div>

      {/* Videos Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفيديو
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفئة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المؤلف
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستوى
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المشاهدات
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإضافة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVideos.map((video) => (
                <tr key={video.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-16 rounded-md overflow-hidden">
                        <img 
                          src={video.thumbnail || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=150"} 
                          alt={video.title}
                          className="h-10 w-16 object-cover"
                        />
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">{video.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{video.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                      {getCategoryText(video.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {video.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(video.difficulty)}`}>
                      {getDifficultyText(video.difficulty)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {video.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(video.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setEditingVideo(video);
                          setShowFormModal(true);
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setDeletingVideo(video);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <a 
                        href={video.watchUrl || video.contentUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                        title="عرض"
                      >
                        <Play className="w-5 h-5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12 bg-white rounded-2xl shadow-lg"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد فيديوهات</h3>
          <p className="text-gray-600 mb-4">
            {videos.length === 0 
              ? 'لم يتم إضافة أي فيديوهات تعليمية بعد' 
              : 'لم يتم العثور على فيديوهات تطابق معايير البحث'}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setEditingVideo(null);
                setShowFormModal(true);
              }}
              className="px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة فيديو جديد
            </button>
            {videos.length > 0 && (
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

      {/* Video Form Modal */}
      <VideoFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={editingVideo ? handleEditVideo : handleAddVideo}
        editingVideo={editingVideo}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteVideo}
        title={deletingVideo?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ManageVideos;