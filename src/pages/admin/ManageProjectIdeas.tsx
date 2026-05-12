import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Search, Filter, Plus, Edit, Trash2, Eye, Download, FileSpreadsheet, Upload, AlertTriangle, MoreVertical, CheckCircle, XCircle, MessageSquare, Chrome as Broom } from 'lucide-react';
import { useProjectIdeas, ProjectIdea } from '../../hooks/useProjectIdeas';
import { IdeaFormModal } from '../../components/ProjectIdeas/IdeaFormModal';
import { DeleteConfirmationModal } from '../../components/ProjectIdeas/DeleteConfirmationModal';
import { ExcelImportExportModal } from '../../components/ProjectIdeas/ExcelImportExportModal';
import { formatDate } from '../../utils/dateUtils';
import { deleteDuplicateProjectIdeas } from '../../lib/firebase';

const ManageProjectIdeas: React.FC = () => {
  const { 
    projectIdeas, 
    loading, 
    error, 
    fetchProjectIdeas, 
    addIdea, 
    editIdea, 
    removeIdea, 
    incrementViews, 
    incrementDownloads,
    approveIdea,
    rejectIdea
  } = useProjectIdeas();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ProjectIdea | null>(null);
  const [deletingIdea, setDeletingIdea] = useState<ProjectIdea | null>(null);
  const [rejectingIdea, setRejectingIdea] = useState<ProjectIdea | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  
  // State for duplicate cleanup
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [cleanupSuccess, setCleanupSuccess] = useState<string | null>(null);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  
  // State for approving all pending ideas
  const [isApprovingPendingIdeas, setIsApprovingPendingIdeas] = useState(false);
  const [approvePendingSuccess, setApprovePendingSuccess] = useState<string | null>(null);
  const [approvePendingError, setApprovePendingError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'جميع الفئات' },
    { id: 'stem', name: 'ستيم' },
    { id: 'entrepreneurship', name: 'ريادة الأعمال' },
    { id: 'volunteer', name: 'التطوع' },
    { id: 'ethics', name: 'الأخلاق' },
  ];

  const difficulties = [
    { id: 'all', name: 'جميع المستويات' },
    { id: 'beginner', name: 'مبتدئ' },
    { id: 'intermediate', name: 'متوسط' },
    { id: 'advanced', name: 'متقدم' },
  ];

  const statuses = [
    { id: 'all', name: 'جميع الحالات', color: 'bg-gray-100 text-gray-800' },
    { id: 'pending', name: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'approved', name: 'موافق عليها', color: 'bg-green-100 text-green-800' },
    { id: 'rejected', name: 'مرفوضة', color: 'bg-red-100 text-red-800' },
  ];

  const filteredProjects = projectIdeas.filter(project => {
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || project.difficulty === selectedDifficulty;
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesDifficulty && matchesStatus && matchesSearch;
  });

  const handleAddIdea = async (ideaData: Partial<ProjectIdea>) => {
    await addIdea(ideaData);
  };

  const handleEditIdea = async (ideaData: Partial<ProjectIdea>) => {
    if (!editingIdea) return;
    await editIdea(editingIdea.id, ideaData);
  };

  const handleDeleteIdea = async () => {
    if (!deletingIdea) return;
    
    setIsDeleting(true);
    try {
      await removeIdea(deletingIdea.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting idea:', error);
    } finally {
      setIsDeleting(false);
      setDeletingIdea(null);
    }
  };

  const handleApproveIdea = async (id: string) => {
    setIsApproving(true);
    try {
      await approveIdea(id);
      await fetchProjectIdeas();
    } catch (error) {
      console.error('Error approving idea:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectIdea = async () => {
    if (!rejectingIdea || !rejectionFeedback) return;
    
    setIsRejecting(true);
    try {
      await rejectIdea(rejectingIdea.id, rejectionFeedback);
      setShowRejectModal(false);
      await fetchProjectIdeas();
    } catch (error) {
      console.error('Error rejecting idea:', error);
    } finally {
      setIsRejecting(false);
      setRejectingIdea(null);
      setRejectionFeedback('');
    }
  };

  const handleImportIdeas = async (ideas: Partial<ProjectIdea>[]) => {
    // Import each idea one by one
    for (const idea of ideas) {
      await addIdea(idea);
    }
  };
  
  const handleCleanupDuplicates = async () => {
    setIsCleaningDuplicates(true);
    setCleanupSuccess(null);
    setCleanupError(null);
    
    try {
      const deletedCount = await deleteDuplicateProjectIdeas();
      setCleanupSuccess(`تم حذف ${deletedCount} فكرة مكررة بنجاح`);
      
      // Refresh the ideas list
      await fetchProjectIdeas();
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      setCleanupError('حدث خطأ أثناء حذف الأفكار المكررة');
    } finally {
      setIsCleaningDuplicates(false);
    }
  };
  
  const handleApprovePendingIdeas = async () => {
    setIsApprovingPendingIdeas(true);
    setApprovePendingSuccess(null);
    setApprovePendingError(null);
    
    try {
      // Find all ideas that don't have 'approved' status
      const pendingIdeas = projectIdeas.filter(idea => idea.status !== 'approved');
      
      if (pendingIdeas.length === 0) {
        setApprovePendingSuccess('لا توجد أفكار في انتظار الموافقة');
        setIsApprovingPendingIdeas(false);
        return;
      }
      
      // Approve each pending idea
      let approvedCount = 0;
      for (const idea of pendingIdeas) {
        await editIdea(idea.id, { status: 'approved' });
        approvedCount++;
      }
      
      // Refresh the ideas list
      await fetchProjectIdeas();
      
      setApprovePendingSuccess(`تمت الموافقة على ${approvedCount} فكرة بنجاح`);
    } catch (error) {
      console.error('Error approving pending ideas:', error);
      setApprovePendingError('حدث خطأ أثناء الموافقة على الأفكار');
    } finally {
      setIsApprovingPendingIdeas(false);
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
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return difficulty;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'stem': return 'ستيم';
      case 'entrepreneurship': return 'ريادة الأعمال';
      case 'volunteer': return 'التطوع';
      case 'ethics': return 'الأخلاق';
      default: return category;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'approved': return 'موافق عليها';
      case 'rejected': return 'مرفوضة';
      default: return status;
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
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">إدارة أفكار المشاريع</h1>
              <p className="opacity-90">إضافة وتعديل وحذف أفكار المشاريع</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowExcelModal(true)}
              className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              استيراد / تصدير
            </button>
            <button 
              onClick={handleCleanupDuplicates}
              disabled={isCleaningDuplicates}
              className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Broom className="w-5 h-5" />
              {isCleaningDuplicates ? 'جاري الحذف...' : 'حذف المكرر'}
            </button>
            <button 
              onClick={handleApprovePendingIdeas}
              disabled={isApprovingPendingIdeas}
              className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {isApprovingPendingIdeas ? 'جاري الموافقة...' : 'الموافقة على الكل'}
            </button>
            <button 
              onClick={() => {
                setEditingIdea(null);
                setShowFormModal(true);
              }}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة فكرة جديدة
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{projectIdeas.length}</div>
            <div className="text-sm opacity-80">فكرة مشروع</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{projectIdeas.filter(p => p.status === 'pending').length}</div>
            <div className="text-sm opacity-80">قيد المراجعة</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{projectIdeas.filter(p => p.status === 'approved').length}</div>
            <div className="text-sm opacity-80">موافق عليها</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{projectIdeas.filter(p => p.status === 'rejected').length}</div>
            <div className="text-sm opacity-80">مرفوضة</div>
          </div>
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      {cleanupSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{cleanupSuccess}</p>
        </div>
      )}
      
      {cleanupError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{cleanupError}</p>
        </div>
      )}
      
      {approvePendingSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{approvePendingSuccess}</p>
        </div>
      )}
      
      {approvePendingError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{approvePendingError}</p>
        </div>
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
              placeholder="البحث في أفكار المشاريع..."
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
            الفلاتر
          </button>
        </div>

        <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          {/* Status Filter */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">حالة الفكرة</h3>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => setSelectedStatus(status.id)}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    selectedStatus === status.id
                      ? status.color
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.name}
                </button>
              ))}
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
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <h3 className="font-medium text-gray-700 mb-3">مستوى الصعوبة</h3>
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
          عرض {filteredProjects.length} من أصل {projectIdeas.length} فكرة
        </p>
      </div>

      {/* Project Ideas Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العنوان
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفئة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الصعوبة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المشاهدات
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  التنزيلات
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإنشاء
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProjects.map((idea) => (
                <tr key={idea.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden">
                        <img 
                          src={idea.image || "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=150"} 
                          alt={idea.title}
                          className="h-10 w-10 object-cover"
                        />
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">{idea.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{idea.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getCategoryText(idea.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(idea.difficulty)}`}>
                      {getDifficultyText(idea.difficulty)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(idea.status)}`}>
                      {getStatusText(idea.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {idea.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {idea.downloads}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {idea.created_at ? formatDate(idea.created_at) : 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {idea.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveIdea(idea.id)}
                            disabled={isApproving}
                            className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                            title="موافقة"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => {
                              setRejectingIdea(idea);
                              setShowRejectModal(true);
                            }}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                            title="رفض"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => {
                          setEditingIdea(idea);
                          setShowFormModal(true);
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          setDeletingIdea(idea);
                          setShowDeleteModal(true);
                        }}
                        className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => incrementViews(idea.id)}
                        className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-colors"
                        title="عرض"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => incrementDownloads(idea.id)}
                        className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-colors"
                        title="تنزيل"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12 bg-white rounded-2xl shadow-lg"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">لا توجد أفكار مشاريع</h3>
          <p className="text-gray-600 mb-4">
            {projectIdeas.length === 0 
              ? 'لم يتم إضافة أي أفكار مشاريع بعد' 
              : 'لم يتم العثور على أفكار مشاريع تطابق معايير البحث'}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setEditingIdea(null);
                setShowFormModal(true);
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة فكرة جديدة
            </button>
            {projectIdeas.length > 0 && (
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setSelectedStatus('all');
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

      {/* Idea Form Modal */}
      <IdeaFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={editingIdea ? handleEditIdea : handleAddIdea}
        editingIdea={editingIdea}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteIdea} // Use the generic DeleteConfirmationModal
        title={deletingIdea?.title || ''}
        isDeleting={isDeleting}
      />

      {/* Excel Import/Export Modal */}
      <ExcelImportExportModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onImport={handleImportIdeas}
        projectIdeas={projectIdeas}
      />

      {/* Reject Idea Modal */}
      {showRejectModal && rejectingIdea && (
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
                <XCircle className="w-6 h-6 text-red-600" />
                رفض فكرة المشروع
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                أنت على وشك رفض فكرة المشروع التالية:
              </p>
              <p className="font-semibold text-gray-800 mb-4">"{rejectingIdea.title}"</p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سبب الرفض (سيتم إرساله للمستخدم)
                </label>
                <textarea
                  value={rejectionFeedback}
                  onChange={(e) => setRejectionFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="اشرح سبب رفض هذه الفكرة..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectIdea}
                disabled={isRejecting || !rejectionFeedback.trim()}
                className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الرفض...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    تأكيد الرفض
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ManageProjectIdeas;