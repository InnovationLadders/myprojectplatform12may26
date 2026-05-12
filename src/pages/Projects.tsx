import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FolderOpen, 
  Users, 
  Calendar, 
  Clock,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Archive,
  Star,
  Building
} from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { formatDate, getDaysRemaining } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Projects: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isSchool = user?.role === 'school';
  const isAdmin = user?.role === 'admin';
  const location = useLocation();
  
  // Initialize searchTerm from URL query parameter
  const queryParams = new URLSearchParams(location.search);
  const initialSearchTerm = queryParams.get('search') || '';

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [showFilters, setShowFilters] = useState(false);
  const [projectEvaluations, setProjectEvaluations] = useState<{[key: string]: number}>({});
  const { projects, loading, error, archiveProject, deleteProject } = useProjects();

  // Update searchTerm when URL query parameter changes
  useEffect(() => {
    const newQueryParams = new URLSearchParams(location.search);
    const newSearchTerm = newQueryParams.get('search') || '';
    setSearchTerm(newSearchTerm);
  }, [location.search]);

  // Fetch evaluations for all projects
  useEffect(() => {
    const fetchProjectEvaluations = async () => {
      if (projects.length === 0) return;
      
      try {
        console.log('Fetching evaluations for projects:', projects.map(p => p.id));
        const evaluationsRef = collection(db, 'project_evaluations');
        
        const evaluationsMap: {[key: string]: number} = {};
        
        // Fetch evaluations for each project individually
        for (const project of projects) {
          const projectId = project.id;
          console.log('Fetching evaluation for project:', projectId);
          
          const q = query(evaluationsRef, where('projectId', '==', projectId));
          const snapshot = await getDocs(q);
          
          console.log('Evaluation query result for', projectId, ':', snapshot.size, 'documents');
          
          if (!snapshot.empty) {
            const evaluationDoc = snapshot.docs[0];
            const evaluationData = evaluationDoc.data();
            console.log('Evaluation data for', projectId, ':', evaluationData);
            
            // Find the "نسبة الإنجاز" criterion
            const progressCriterion = evaluationData.criteria?.find((c: any) => {
              console.log('Checking criterion:', c.name, 'against نسبة الإنجاز');
              return c.name === 'نسبة الإنجاز';
            });
            
            console.log('Progress criterion found:', progressCriterion);
            
            if (progressCriterion) {
              const score = progressCriterion.score || 0;
              evaluationsMap[projectId] = score;
              console.log('Setting progress for', projectId, 'to', score);
            } else {
              console.log('No progress criterion found for project', projectId);
              // If no نسبة الإنجاز criterion found, check all criteria names
              if (evaluationData.criteria) {
                console.log('Available criteria names:', evaluationData.criteria.map((c: any) => c.name));
              }
            }
          } else {
            console.log('No evaluation found for project', projectId);
          }
        }
        
        console.log('Final evaluations map:', evaluationsMap);
        setProjectEvaluations(evaluationsMap);
      } catch (error) {
        console.error('Error fetching project evaluations:', error);
      }
    };

    fetchProjectEvaluations();
  }, [projects]);

  // Get the actual progress score for a project
  const getProjectProgress = (projectId: string) => {
    const progress = projectEvaluations[projectId];
    console.log('Getting progress for', projectId, ':', progress);
    return progress !== undefined ? progress : 0;
  };
  const projectStatuses = [
    { id: 'all', name: t('projects.statuses.all'), color: 'bg-gray-500' },
    { id: 'draft', name: t('projects.statuses.draft'), color: 'bg-gray-500' },
    { id: 'active', name: t('projects.statuses.active'), color: 'bg-blue-500' },
    { id: 'completed', name: t('projects.statuses.completed'), color: 'bg-green-500' },
    { id: 'archived', name: t('projects.statuses.archived'), color: 'bg-purple-500' },
  ];

  const filteredProjects = projects.filter(project => {
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'active': return <Play className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'archived': return <Archive className="w-4 h-4" />;
      default: return <FolderOpen className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return t('projects.statuses.draft');
      case 'active': return t('projects.statuses.active');
      case 'completed': return t('projects.statuses.completed');
      case 'archived': return t('projects.statuses.archived');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'stem': return t('projects.categories.stem');
      case 'entrepreneurship': return t('projects.categories.entrepreneurship');
      case 'volunteer': return t('projects.categories.volunteer');
      case 'ethics': return t('projects.categories.ethics');
      default: return category;
    }
  };

  const handleArchiveProject = async (id: string) => {
    if (window.confirm('هل أنت متأكد من أرشفة هذا المشروع؟')) {
      try {
        await archiveProject(id);
      } catch (error) {
        console.error('Error archiving project:', error);
        alert('حدث خطأ أثناء أرشفة المشروع');
      }
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المشروع؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      try {
        await deleteProject(id);
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('حدث خطأ أثناء حذف المشروع');
      }
    }
  };

  // Check if the current user can edit/delete a specific project
  const canEditProject = (project: any) => {
    if (isAdmin || isSchool) return true;
    if (isTeacher && project.teacher_id === user?.id) return true;
    if (isTeacher && project.status === 'draft' && project.school_id === user?.school_id) return true;
    if (isStudent && project.status === 'draft' && project.students?.some((s: any) => s.student_id === user?.id)) return true;
    return false;
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
        className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('projects.title')}</h1>
              <div className="text-sm text-gray-600">نسبة الإنجاز</div>
            </div>
          </div>
          
          <Link
            to="/projects/new"
            className="bg-white text-green-600 px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('projects.newProject')}
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-sm opacity-80">{t('projects.stats.total')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</div>
            <div className="text-sm opacity-80">{t('projects.stats.active')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'completed').length}</div>
            <div className="text-sm opacity-80">{t('projects.stats.completed')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {projects.length > 0 ? (Math.round(projects.reduce((acc, p) => acc + getProjectProgress(p.id), 0) / projects.length * 10) / 10).toFixed(1) : 0}
            </div>
            <div className="text-sm opacity-80">{t('projects.stats.averageProgress')}</div>
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
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('projects.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

        {/* Status Filters */}
        <div className={`mt-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <h3 className="font-medium text-gray-700 mb-3">{t('projects.projectStatus')}</h3>
          <div className="flex flex-wrap gap-2">
            {projectStatuses.map((status) => (
              <button
                key={status.id}
                onClick={() => setSelectedStatus(status.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  selectedStatus === status.id
                    ? `${status.color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusIcon(status.id)}
                {status.name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {t('projects.showing')} {filteredProjects.length} {t('projects.of')} {projects.length} {t('projects.project')}
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group"
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {getStatusText(project.status)}
                  </span>
                  <span className="text-xs text-gray-500">{getCategoryText(project.category)}</span>
                </div>
                
                <Link
                  to={`/projects/${project.id}`}
                  className="text-xl font-bold text-blue-600 hover:text-blue-800 underline transition-colors line-clamp-2"
                >
                  {project.title}
                </Link>
              </div>
              
              {canEditProject(project) && (
                <div className="relative group/menu">
                  <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <div className="absolute left-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                    <div className="p-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <Eye className="w-4 h-4" />
                        {t('projects.actions.viewDetails')}
                      </Link>
                      <Link
                        to={`/projects/${project.id}/edit`}
                        className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <Edit className="w-4 h-4" />
                        {t('projects.actions.edit')}
                      </Link>
                      <button 
                        onClick={() => handleArchiveProject(project.id)}
                        className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        <Archive className="w-4 h-4" />
                        {t('projects.actions.archive')}
                      </button>
                      <hr className="my-1" />
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('projects.actions.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Project Description */}
            <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
              {project.description}
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{t('common.progress')}</span>
                <span className="text-sm font-medium text-gray-700">نسبة الإنجاز: {getProjectProgress(project.id)}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getProjectProgress(project.id) >= 9 ? 'bg-green-500' : 
                    getProjectProgress(project.id) >= 5 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${(getProjectProgress(project.id) / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-800">
                  {project.tasks?.filter((t: any) => t.status === 'completed').length || 0}/
                  {project.tasks?.length || 0}
                </div>
                <div className="text-xs text-gray-500">{t('projects.tasks')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">{project.students?.length || 0}</div>
                <div className="text-xs text-gray-500">{t('projects.students')}</div>
              </div>
              <div>
                <div className={`text-lg font-bold ${
                  project.due_date && getDaysRemaining(project.due_date) < 0 ? 'text-red-600' :
                  project.due_date && getDaysRemaining(project.due_date) <= 7 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {project.due_date ? (
                    getDaysRemaining(project.due_date) < 0 ? t('projects.overdue') : `${getDaysRemaining(project.due_date)} ${t('projects.days')}`
                  ) : '--'}
                </div>
                <div className="text-xs text-gray-500">{t('projects.remaining')}</div>
              </div>
            </div>

            {/* Students Avatars */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {project.students?.slice(0, 4).map((ps: any, idx: number) => (
                    <img
                      key={ps.id}
                      src={ps.student?.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`}
                      alt={ps.student?.name}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      title={ps.student?.name}
                    />
                  ))}
                  {project.students && project.students.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                      +{project.students.length - 4}
                    </div>
                  )}
                </div>
                <span className="mr-3 text-sm text-gray-500">
                  {t('projects.lastUpdate')}: {formatDate(project.updated_at)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {project.rating && (
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    {project.rating.toFixed(1)}
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  {project.due_date ? formatDate(project.due_date) : t('projects.notSpecified')}
                </div>
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
            <FolderOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('projects.noProjects')}</h3>
          <p className="text-gray-600 mb-4">{t('projects.startCreating')}</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/projects/new"
              className="px-6 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('projects.createNewProject')}
            </Link>
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('common.resetFilters')}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};