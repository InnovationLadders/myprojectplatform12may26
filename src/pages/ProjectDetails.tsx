import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Users, CheckCircle, MessageCircle, FileBox, Calendar,
  Clock, Edit, ArrowRight, AlertTriangle, Award, Eye, Video,
  Download, Plus, Upload, UserMinus, Send
} from 'lucide-react';
import { getProjectById, getProjectStudents, getProjectTasks, db, firestoreDoc, removeStudentFromProject, submitProjectToEntrepreneurship, getSubmissionByProjectId } from '../lib/firebase';
import { collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getDaysRemaining } from '../utils/dateUtils';
import { ProjectChat } from '../components/ProjectChat/ProjectChat';
import TasksList from '../components/ProjectTasks/TasksList';
import { AddTaskModal } from '../components/ProjectTasks/AddTaskModal';
import { AddTeamMemberModal } from '../components/ProjectTeam/AddTeamMemberModal';
import { RemoveStudentModal } from '../components/ProjectTeam/RemoveStudentModal';
import { EvaluationForm } from '../components/ProjectEvaluation/EvaluationForm';
import { EvaluationSummary } from '../components/ProjectEvaluation/EvaluationSummary';
import { useTranslation } from 'react-i18next';
import { useProjectEvaluation } from '../hooks/useProjectEvaluation';
import { AddResourceModal } from '../components/ProjectDetails/AddResourceModal';
import GanttChart from '../components/ProjectTasks/GanttChart';
import SubmitToEntrepreneurshipModal from '../components/Entrepreneurship/SubmitToEntrepreneurshipModal';

const ProjectDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectStudents, setProjectStudents] = useState<any[]>([]);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddTeamMemberModal, setShowAddTeamMemberModal] = useState(false);
  const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<any>(null);
  const [isRemovingStudent, setIsRemovingStudent] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);
  const { evaluation } = useProjectEvaluation(id);
  const [evaluationSaved, setEvaluationSaved] = useState(false);
  const [refreshTasks, setRefreshTasks] = useState(0);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [projectProgress, setProjectProgress] = useState<number>(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);

  // Determine user role and permissions
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isSchool = user?.role === 'school';
  const isAdmin = user?.role === 'admin';

  // Check if the current user is the project's teacher
  const isProjectTeacher = project?.teacher_id === user?.id;

  // Check if the current user is a student in the project
  // This is a simplified check, ideally you'd check project_students collection
  const isProjectStudent = projectStudents.some(s => s.student_id === user?.id);

  // Check if the current user can edit the project
  const canEditProject = isAdmin || isProjectTeacher || (isSchool && project?.school_id === user?.id);

  // Check if user can submit to entrepreneurship (teacher, project students, school admins, system admin)
  const canSubmitToEntrepreneurship = isAdmin || isProjectTeacher || isProjectStudent || (isSchool && project?.school_id === user?.id);

  // Fetch project evaluation and extract progress score
  const fetchProjectProgress = async (projectId: string) => {
    try {
      console.log('Fetching evaluation for project details:', projectId);
      const evaluationsRef = collection(db, 'project_evaluations');
      const q = query(evaluationsRef, where('projectId', '==', projectId));
      const snapshot = await getDocs(q);
      
      console.log('Project details evaluation query result:', snapshot.size, 'documents');
      
      if (!snapshot.empty) {
        const evaluationDoc = snapshot.docs[0];
        const evaluationData = evaluationDoc.data();
        console.log('Project details evaluation data:', evaluationData);
        
        // Find the "نسبة الإنجاز" criterion
        const progressCriterion = evaluationData.criteria?.find((c: any) => {
          console.log('Project details checking criterion:', c.name, 'against نسبة الإنجاز');
          return c.name === 'نسبة الإنجاز';
        });
        
        console.log('Project details progress criterion found:', progressCriterion);
        
        if (progressCriterion) {
          const score = progressCriterion.score || 0;
          console.log('Project details setting progress to:', score);
          setProjectProgress(score);
          return score;
        } else {
          console.log('Project details no progress criterion found');
          // If no نسبة الإنجاز criterion found, check all criteria names
          if (evaluationData.criteria) {
            console.log('Project details available criteria names:', evaluationData.criteria.map((c: any) => c.name));
          }
        }
      } else {
        console.log('Project details no evaluation found for project:', projectId);
      }
      
      setProjectProgress(0);
      return 0;
    } catch (error) {
      console.error('Error fetching project evaluation:', error);
      setProjectProgress(0);
      return 0;
    }
  };
  const fetchProjectDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching project details for ID:', id);
      // Fetch project data
      const projectData = await getProjectById(id);

      if (!projectData) {
        setError('المشروع غير موجود');
        setLoading(false);
        return;
      }

      console.log('Project data fetched successfully:', projectData);
      setProject(projectData);

      // Fetch supervisor/teacher name if teacher_id exists
      if (projectData.teacher_id) {
        try {
          const teacherDoc = await getDoc(firestoreDoc(db, 'users', projectData.teacher_id));
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            setSupervisorName(teacherData.name || null);
          } else {
            setSupervisorName(null);
          }
        } catch (error) {
          console.error('Error fetching supervisor name:', error);
          setSupervisorName(null);
        }
      } else {
        setSupervisorName(null);
      }

      // Fetch project students
      const studentsData = await getProjectStudents(id);
      console.log('Project students fetched:', studentsData);
      setProjectStudents(studentsData);

      // Fetch project tasks
      console.log('Fetching tasks for project ID:', id);
      const tasksData = await getProjectTasks(id);
      console.log('Project tasks fetched:', tasksData);
      setProjectTasks(tasksData);

      // Fetch project progress from evaluation
      await fetchProjectProgress(id);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات المشروع');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [id, refreshTasks]);

  // Handle URL query parameters for deep linking to specific tabs
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');

    if (tabParam) {
      // Valid tab names: overview, team, tasks, chat, files, evaluation, dates
      const validTabs = ['overview', 'team', 'tasks', 'chat', 'files', 'evaluation', 'dates'];
      if (validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [location.search]);

  // Check if project is already submitted to entrepreneurship
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      if (!id) return;

      try {
        const submission = await getSubmissionByProjectId(id);
        setIsAlreadySubmitted(!!submission);
      } catch (error) {
        console.error('Error checking submission status:', error);
      }
    };

    checkSubmissionStatus();
  }, [id]);

  const handleTaskAdded = () => {
    // Trigger a refresh by incrementing the refreshTasks counter
    setRefreshTasks(prev => prev + 1);
  };

  const handleTeamMemberAdded = () => {
    fetchProjectDetails(); // Re-fetch students after adding
  };

  const handleSubmitToEntrepreneurship = async () => {
    if (!user || !id) return;

    setIsSubmitting(true);
    try {
      await submitProjectToEntrepreneurship(id, user.id, user.role);
      setIsAlreadySubmitted(true);
      setShowSubmitModal(false);
      alert(t('entrepreneurshipSubmissions.submitSuccess'));
    } catch (error: any) {
      console.error('Error submitting project:', error);
      if (error.message === 'Project already submitted') {
        alert(t('entrepreneurshipSubmissions.alreadySubmitted'));
        setIsAlreadySubmitted(true);
      } else {
        alert(t('entrepreneurshipSubmissions.submitError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEvaluationSaved = () => {
    setEvaluationSaved(true);
    // Re-fetch project data to update progress and ensure evaluation is reflected
    fetchProjectDetails();
  };
  
  const handleResourceAdded = () => {
    fetchProjectDetails(); // Re-fetch project data to update resources
  };

  const handleRemoveStudentClick = (studentRecord: any) => {
    setStudentToRemove(studentRecord);
    setShowRemoveStudentModal(true);
    setRemoveError(null);
    setRemoveSuccess(null);
  };

  const handleRemoveStudentConfirm = async () => {
    if (!studentToRemove || !id) return;

    setIsRemovingStudent(true);
    setRemoveError(null);

    try {
      await removeStudentFromProject(id, studentToRemove.student_id);
      setRemoveSuccess(`تمت إزالة ${studentToRemove.student?.name || 'الطالب'} من المشروع بنجاح`);
      setShowRemoveStudentModal(false);
      setStudentToRemove(null);

      // Re-fetch project details to update the student list
      await fetchProjectDetails();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setRemoveSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error removing student from project:', err);
      setRemoveError(err instanceof Error ? err.message : 'حدث خطأ في إزالة الطالب من المشروع');
    } finally {
      setIsRemovingStudent(false);
    }
  };

  const handleRemoveStudentCancel = () => {
    setShowRemoveStudentModal(false);
    setStudentToRemove(null);
    setRemoveError(null);
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

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return t('projectIdeas.difficulties.beginner');
      case 'intermediate': return t('projectIdeas.difficulties.intermediate');
      case 'advanced': return t('projectIdeas.difficulties.advanced');
      default: return difficulty;
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">المشروع غير موجود</h2>
          <p className="text-gray-600">لم يتم العثور على المشروع المطلوب</p>
          <Link to="/projects" className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
            العودة إلى المشاريع
          </Link>
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
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              to="/projects"
              className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 break-words">{project.title}</h1>
                <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)} flex-shrink-0`}>
                  {getStatusText(project.status)}
                </span>
              </div>
              <p className="text-sm md:text-base text-gray-600 mt-1 line-clamp-2">{project.description}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {canSubmitToEntrepreneurship && !isAlreadySubmitted && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
                <span className="truncate">{t('entrepreneurshipSubmissions.submitButton')}</span>
              </button>
            )}

            {canEditProject && (
              <Link
                to={`/projects/${id}/edit`}
                className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <Edit className="w-4 h-4 md:w-5 md:h-5" />
                {t('common.edit')}
              </Link>
            )}
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg md:rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold text-gray-800">{projectStudents.length}</div>
                <div className="text-xs md:text-sm text-gray-600 truncate">{t('projects.students')}</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg md:rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold text-gray-800">{projectTasks.filter((t: any) => t.status === 'completed').length}</div>
                <div className="text-xs md:text-sm text-gray-600 truncate">مهام مكتملة</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg md:rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold text-gray-800 truncate">
                  {project.due_date ? (
                    getDaysRemaining(project.due_date) < 0 ? t('projects.overdue') : `${getDaysRemaining(project.due_date)} ${t('projects.days')}`
                  ) : t('common.notSpecified')}
                </div>
                <div className="text-xs md:text-sm text-gray-600 truncate">{t('projects.remaining')}</div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg md:rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <div className="text-lg md:text-2xl font-bold text-gray-800 truncate">
                  {evaluation ?
                    evaluation.criteria.reduce((total, criterion) =>
                      total + (criterion.score * criterion.weight), 0
                    ).toFixed(2) : '0.00'}/10
                </div>
                <div className="text-xs md:text-sm text-gray-600 truncate">{t('common.weightedScore')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t('common.progress')}</span>
            <span className="text-sm font-medium text-gray-700">نسبة الإنجاز: {projectProgress}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                projectProgress >= 8 ? 'bg-green-500' :
                projectProgress >= 5 ? 'bg-blue-500' :
                'bg-yellow-500'
              }`}
              style={{ width: `${(projectProgress / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 -mx-3 md:mx-0">
          <nav className="flex gap-1 md:gap-4 overflow-x-auto whitespace-nowrap px-3 md:px-0 scrollbar-hide">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 md:py-4 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm flex-shrink-0 ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{t('common.overview', 'نظرة عامة')}</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`py-2 md:py-4 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm flex-shrink-0 ${
                activeTab === 'team'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{t('common.team', 'فريق العمل')}</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-2 md:py-4 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm flex-shrink-0 ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{t('common.tasks', 'المهام')}</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className={`py-2 md:py-4 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm flex-shrink-0 ${
                activeTab === 'evaluation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <Award className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{t('common.evaluation', 'التقييم')}</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 md:py-4 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm flex-shrink-0 ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{t('common.chat', 'المحادثة')}</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`py-2 md:py-4 px-2 md:px-3 border-b-2 font-medium text-xs md:text-sm flex-shrink-0 ${
                activeTab === 'resources'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <FileBox className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">{t('common.files', 'الملفات')}</span>
              </div>
            </button>
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {t('common.overview', 'نظرة عامة')}
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">{t('common.projectInfo', 'معلومات المشروع')}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('common.category', 'الفئة')}</p>
                    <p className="font-medium text-gray-800">{getCategoryText(project.category)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('common.subject', 'الموضوع/المادة')}</p>
                    <p className="font-medium text-gray-800">{project.subject || t('common.notSpecified', 'غير محدد')}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('common.difficulty', 'مستوى الصعوبة')}</p>
                    <p className="font-medium text-gray-800">{getDifficultyText(project.difficulty)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('common.duration', 'المدة المتوقعة')}</p>
                    <p className="font-medium text-gray-800">{project.duration || t('common.notSpecified', 'غير محدد')}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">{t('common.dates', 'التواريخ')}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('common.createdAt', 'تاريخ الإنشاء')}</p>
                    <p className="font-medium text-gray-800">{formatDate(project.created_at)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('common.updatedAt', 'آخر تحديث')}</p>
                    <p className="font-medium text-gray-800">{formatDate(project.updated_at)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('common.deadline', 'الموعد النهائي')}</p>
                    <p className="font-medium text-gray-800">
                      {project.due_date ? formatDate(project.due_date) : t('common.notSpecified', 'غير محدد')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('common.remaining', 'المتبقي')}</p>
                    <p className={`font-medium ${
                      project.due_date && getDaysRemaining(project.due_date) < 0
                        ? 'text-red-600'
                        : project.due_date && getDaysRemaining(project.due_date) <= 7
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}>
                      {project.due_date
                        ? getDaysRemaining(project.due_date) < 0
                          ? t('projects.overdue', 'متأخر')
                          : `${getDaysRemaining(project.due_date)} ${t('projects.days', 'يوم')}`
                        : t('common.notSpecified', 'غير محدد')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('projects.supervisorTeacher', 'المشرف')}</p>
                    <p className="font-medium text-gray-800">
                      {supervisorName || t('common.notSpecified', 'غير محدد')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Objectives */}
            {project.objectives && project.objectives.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">{t('common.objectives', 'أهداف المشروع')}</h3>
                <div className="space-y-2">
                  {project.objectives.map((objective: string, idx: number) => (
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
            {project.materials && project.materials.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">{t('common.materials', 'المواد والأدوات المطلوبة')}</h3>
                <div className="grid md:grid-cols-2 gap-2">
                  {project.materials.map((material: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">{material}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Steps */}
            {project.steps && project.steps.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">{t('common.implementationSteps', 'خطوات تنفيذ المشروع')}</h3>
                <div className="space-y-3">
                  {project.steps.map((step: string, idx: number) => (
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
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                {t('common.team', 'فريق العمل')}
              </h2>

              {canEditProject && (
                <button
                  onClick={() => setShowAddTeamMemberModal(true)}
                  className="px-4 md:px-6 py-2 bg-blue-500 text-white rounded-lg md:rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1 md:gap-2 text-sm md:text-base"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  {t('common.addStudents', 'إضافة طلاب')}
                </button>
              )}
            </div>

            {/* Success/Error Messages */}
            {removeSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {removeSuccess}
              </motion.div>
            )}

            {removeError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {removeError}
              </div>
            )}

            {projectStudents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {projectStudents.map((studentRecord) => (
                  <div key={studentRecord.id} className="border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 hover:shadow-md transition-all relative group">
                    {canEditProject && (
                      <button
                        onClick={() => handleRemoveStudentClick(studentRecord)}
                        className="absolute top-2 left-2 md:top-3 md:left-3 p-1.5 md:p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                        title="إزالة الطالب من المشروع"
                      >
                        <UserMinus className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    )}
                    <div className="flex items-center gap-2 md:gap-3">
                      <img
                        src={studentRecord.student?.avatar_url || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150"}
                        alt={studentRecord.student?.name || "طالب"}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base text-gray-800 truncate">{studentRecord.student?.name || "طالب غير معروف"}</h3>
                        <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                          <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${
                            studentRecord.role === 'leader'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {studentRecord.role === 'leader' ? t('common.teamLeader', 'قائد الفريق') : t('common.member', 'عضو')}
                          </span>
                          {studentRecord.student?.grade && (
                            <span className="text-[10px] md:text-xs text-gray-500">{studentRecord.student.grade}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('common.noStudents', 'لا يوجد طلاب')}</h3>
                <p className="text-gray-600">{t('common.noStudentsInProject', 'لم يتم إضافة طلاب إلى هذا المشروع بعد')}</p>
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {console.log('Rendering Tasks tab with projectTasks:', projectTasks)}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  {t('common.tasks', 'المهام')}
                </h2>

                {canEditProject && (
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="px-4 md:px-6 py-2 bg-blue-500 text-white rounded-lg md:rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1 md:gap-2 text-sm md:text-base"
                  >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    {t('common.addTask', 'إضافة مهمة')}
                  </button>
                )}
              </div>

              <TasksList
                projectId={id || ''}
                tasks={projectTasks || []}
                students={projectStudents || []}
                onTaskUpdated={handleTaskAdded}
              />
            </div>

            <GanttChart
              tasks={projectTasks || []}
              students={projectStudents || []}
              projectStartDate={project?.created_at || project?.start_date || new Date().toISOString()}
              onRefresh={handleTaskAdded}
              isRefreshing={loading}
            />
          </div>
        )}

        {/* Evaluation Tab */}
        {activeTab === 'evaluation' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              {t('common.evaluation', 'التقييم')}
            </h2>

            {(isProjectTeacher || isAdmin) ? (
              <EvaluationForm
                projectId={id || ''}
                projectTitle={project?.title}
                onSaved={handleEvaluationSaved}
              />
            ) : (evaluation || evaluationSaved) ? (
              <EvaluationSummary
                evaluation={evaluation}
                teacherName={evaluation?.teacherName || t('common.teacher', 'المعلم')}
              />
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('common.noEvaluation', 'لا يوجد تقييم')}</h3>
                <p className="text-gray-600">{t('common.projectNotEvaluated', 'لم يتم تقييم المشروع بعد')}</p>
              </div>
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-600" />
              {t('common.chat', 'المحادثة')}
            </h2>
            <ProjectChat projectId={id || ''} projectTitle={project?.title} />
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileBox className="w-6 h-6 text-blue-600" />
              {t('common.files', 'الملفات')}
            </h2>
            <div className="flex justify-between items-center mb-6">
              {canEditProject && (
                <button
                  onClick={() => setShowAddResourceModal(true)}
                  className="px-4 md:px-6 py-2 bg-blue-500 text-white rounded-lg md:rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-1 md:gap-2 text-sm md:text-base"
                >
                  <Upload className="w-4 h-4 md:w-5 md:h-5" />
                  {t('common.addFile', 'إضافة ملف')}
                </button>
              )}
            </div>
            {project.resources && project.resources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {project.resources.map((resource: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg md:rounded-xl p-3 md:p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 md:gap-3 mb-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {resource.type === 'image' ? (
                          <img src={resource.url} alt={resource.name} className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover" />
                        ) : resource.type === 'video' ? (
                          <Video className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        ) : (
                          <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base text-gray-800 line-clamp-1">{resource.name}</h3>
                        <p className="text-[10px] md:text-xs text-gray-500">
                          {resource.uploadedAt ? formatDate(resource.uploadedAt.toDate ? resource.uploadedAt.toDate() : resource.uploadedAt) : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 md:px-4 py-1.5 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
                      >
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                        {t('common.view', 'عرض')}
                      </a>
                      <a
                        href={resource.url}
                        download={resource.name}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
                      >
                        <Download className="w-3 h-3 md:w-4 md:h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileBox className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('common.noFiles', 'لا توجد ملفات')}</h3>
                <p className="text-gray-600">{t('common.noFilesInProject', 'لم يتم إضافة ملفات إلى هذا المشروع بعد')}</p>
                <p className="text-gray-600 text-sm mt-2">{t('common.addFilesViaChat', 'يمكنك إضافة ملفات من خلال المحادثة')}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Modals */}
      {showAddTaskModal && (
        <AddTaskModal
          projectId={id || ''}
          students={projectStudents}
          onClose={() => setShowAddTaskModal(false)}
          onSuccess={handleTaskAdded}
        />
      )}

      {showAddTeamMemberModal && (
        <AddTeamMemberModal
          projectId={id || ''}
          maxStudents={project.max_students || 5}
          currentStudents={projectStudents}
          onClose={() => setShowAddTeamMemberModal(false)}
          onSuccess={handleTeamMemberAdded}
        />
      )}

      {/* Add Resource Modal */}
      {showAddResourceModal && (
        <AddResourceModal
          projectId={id || ''}
          onClose={() => setShowAddResourceModal(false)}
          onSuccess={handleResourceAdded}
        />
      )}

      {/* Remove Student Modal */}
      {showRemoveStudentModal && studentToRemove && (
        <RemoveStudentModal
          studentName={studentToRemove.student?.name || 'الطالب'}
          studentRole={studentToRemove.role}
          isLeader={studentToRemove.role === 'leader'}
          onConfirm={handleRemoveStudentConfirm}
          onCancel={handleRemoveStudentCancel}
          isRemoving={isRemovingStudent}
        />
      )}

      {/* Submit to Entrepreneurship Modal */}
      <SubmitToEntrepreneurshipModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmitToEntrepreneurship}
        isLoading={isSubmitting}
        projectTitle={project.title}
      />
    </div>
  );
};

export default ProjectDetails;