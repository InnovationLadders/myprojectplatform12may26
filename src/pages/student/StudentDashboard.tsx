import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Lightbulb,
  MessageCircle,
  ShoppingCart,
  Bot,
  GalleryVertical,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Award,
  Users,
  ArrowRight,
  Target,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDashboardStats,
  getRecentProjects,
  getRecentProjectConversations,
  DashboardStats,
  RecentProject,
  RecentProjectConversation
} from '../../services/dashboardService';
import { RecentConversations } from '../../components/Dashboard/RecentConversations';

export const StudentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: dashboardData, isLoading: loading, error } = useQuery({
    queryKey: ['dashboardData', user?.id, user?.role],
    queryFn: async () => {
      if (!user) throw new Error('No user');
      const [statsData, projectsData] = await Promise.all([
        getDashboardStats(user.id, user.role),
        getRecentProjects(user.id, 3, user.role)
      ]);
      return { stats: statsData, projects: projectsData };
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['recentConversations', user?.id, user?.role],
    queryFn: async () => {
      if (!user) return [];
      return await getRecentProjectConversations(user.id, user.role);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const stats = dashboardData?.stats || null;
  const recentProjects = dashboardData?.projects || [];

  const quickActions = useMemo(() => [
    {
      icon: Lightbulb,
      title: t('dashboard.quickActions.exploreIdeas'),
      description: t('dashboard.quickActions.exploreIdeasDesc'),
      link: '/project-ideas',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: BookOpen,
      title: t('dashboard.quickActions.createProject'),
      description: t('dashboard.quickActions.createProjectDesc'),
      link: '/projects',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: MessageCircle,
      title: t('dashboard.quickActions.bookConsultation'),
      description: t('dashboard.quickActions.bookConsultationDesc'),
      link: '/consultations',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: ShoppingCart,
      title: t('dashboard.quickActions.visitStore'),
      description: t('dashboard.quickActions.visitStoreDesc'),
      link: '/store',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Bot,
      title: t('dashboard.quickActions.aiAssistant'),
      description: t('dashboard.quickActions.aiAssistantDesc'),
      link: '/ai-assistant',
      color: 'from-purple-500 to-blue-600'
    },
    {
      icon: GalleryVertical,
      title: t('dashboard.quickActions.viewGallery'),
      description: t('dashboard.quickActions.viewGalleryDesc'),
      link: '/gallery',
      color: 'from-indigo-500 to-purple-600'
    }
  ], [t]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
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
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {t('dashboard.welcome', { name: user?.name || t('common.user') })}
            </h1>
            <p className="opacity-90">{t('dashboard.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Conversations */}
      <RecentConversations
        conversations={conversations}
        loading={conversationsLoading}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats?.totalProjects || 0}</h3>
          <p className="text-sm text-gray-600">{t('dashboard.stats.totalProjects')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats?.activeProjects || 0}</h3>
          <p className="text-sm text-gray-600">{t('dashboard.stats.activeProjects')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-yellow-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats?.pendingTasks || 0}</h3>
          <p className="text-sm text-gray-600">{t('dashboard.stats.pendingTasks')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">{stats?.rewardPoints || 0}</h3>
          <p className="text-sm text-gray-600">{t('dashboard.stats.rewardPoints')}</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.quickActions.title')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="group"
            >
              <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-all duration-300 group-hover:scale-105">
                <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-gray-800 text-center mb-1">{action.title}</h3>
                <p className="text-xs text-gray-600 text-center line-clamp-2">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Projects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {t('dashboard.recentProjects.title')}
          </h2>
          <Link to="/projects" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
            {t('common.viewAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentProjects.length > 0 ? (
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{project.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {t(`common.${project.status}`)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {project.teamSize} {t('dashboard.recentProjects.members')}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {project.progress}%
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('dashboard.recentProjects.noProjects')}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
