import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, BookOpen, Lightbulb, Video, Calendar, ChartBar as BarChart3, Settings, School, TrendingUp, Award, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClasseraIntegration } from '../../components/Admin/ClasseraIntegration';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const dashboardTabs = [
    { id: 'overview', name: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'users', name: 'إدارة المستخدمين', icon: Users },
    { id: 'projects', name: 'إدارة المشاريع', icon: BookOpen },
    { id: 'ideas', name: 'أفكار المشاريع', icon: Lightbulb },
    { id: 'videos', name: 'الفيديوهات التعليمية', icon: Video },
    { id: 'summer-program', name: 'البرنامج الصيفي', icon: Calendar },
    { id: 'classera', name: 'تكامل Classera', icon: School },
    { id: 'settings', name: 'الإعدادات', icon: Settings },
  ];

  const stats = [
    {
      title: 'إجمالي المستخدمين',
      value: '2,847',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'المشاريع النشطة',
      value: '156',
      change: '+8%',
      trend: 'up',
      icon: BookOpen,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'أفكار المشاريع',
      value: '89',
      change: '+15%',
      trend: 'up',
      icon: Lightbulb,
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'معدل النجاح',
      value: '94%',
      change: '+3%',
      trend: 'up',
      icon: Award,
      color: 'from-purple-500 to-purple-600'
    },
  ];

  const quickActions = [
    {
      title: 'إدارة أفكار المشاريع',
      description: 'إضافة وتعديل وحذف أفكار المشاريع',
      icon: Lightbulb,
      link: '/admin/manage-project-ideas',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      title: 'إدارة الفيديوهات التعليمية',
      description: 'إضافة وتعديل الفيديوهات التعليمية',
      icon: Video,
      link: '/admin/manage-videos',
      color: 'from-red-500 to-pink-500'
    },
    {
      title: 'تسجيلات البرنامج الصيفي',
      description: 'مراجعة وإدارة طلبات البرنامج الصيفي',
      icon: Calendar,
      link: '/admin/summer-program-registrations',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'إدارة المستخدمين',
      description: 'عرض وإدارة جميع مستخدمي المنصة',
      icon: Users,
      link: '/users',
      color: 'from-green-500 to-emerald-500'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">لوحة تحكم المدير</h1>
            <p className="opacity-90">إدارة شاملة لمنصة مشروعي</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">2,847</div>
            <div className="text-sm opacity-80">مستخدم نشط</div>
          </div>
          <div>
            <div className="text-2xl font-bold">156</div>
            <div className="text-sm opacity-80">مشروع نشط</div>
          </div>
          <div>
            <div className="text-2xl font-bold">89</div>
            <div className="text-sm opacity-80">فكرة مشروع</div>
          </div>
          <div>
            <div className="text-2xl font-bold">94%</div>
            <div className="text-sm opacity-80">معدل النجاح</div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className="w-4 h-4" />
                        {stat.change}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</h3>
                    <p className="text-gray-600 text-sm">{stat.title}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">إجراءات سريعة</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Link
                        to={action.link}
                        className="block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all group"
                      >
                        <div className={`w-14 h-14 bg-gradient-to-r ${action.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{action.title}</h3>
                        <p className="text-gray-600 text-sm">{action.description}</p>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة المستخدمين</h3>
              <p className="text-gray-600 mb-4">عرض وإدارة جميع مستخدمي المنصة</p>
              <Link
                to="/users"
                className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                الذهاب إلى إدارة المستخدمين
              </Link>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة المشاريع</h3>
              <p className="text-gray-600 mb-4">عرض وإدارة جميع مشاريع المنصة</p>
              <Link
                to="/projects"
                className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                الذهاب إلى المشاريع
              </Link>
            </div>
          )}

          {/* Ideas Tab */}
          {activeTab === 'ideas' && (
            <div className="text-center py-8">
              <Lightbulb className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة أفكار المشاريع</h3>
              <p className="text-gray-600 mb-4">إضافة وتعديل وحذف أفكار المشاريع</p>
              <Link
                to="/admin/manage-project-ideas"
                className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                إدارة أفكار المشاريع
              </Link>
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div className="text-center py-8">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة الفيديوهات التعليمية</h3>
              <p className="text-gray-600 mb-4">إضافة وتعديل الفيديوهات التعليمية</p>
              <Link
                to="/admin/manage-videos"
                className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                إدارة الفيديوهات
              </Link>
            </div>
          )}

          {/* Summer Program Tab */}
          {activeTab === 'summer-program' && (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إدارة البرنامج الصيفي</h3>
              <p className="text-gray-600 mb-4">مراجعة وإدارة طلبات البرنامج الصيفي</p>
              <Link
                to="/admin/summer-program-registrations"
                className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                عرض التسجيلات
              </Link>
            </div>
          )}

          {/* Classera Integration Tab */}
          {activeTab === 'classera' && <ClasseraIntegration />}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="text-center py-8">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">إعدادات النظام</h3>
              <p className="text-gray-600 mb-4">إدارة إعدادات المنصة العامة</p>
              <Link
                to="/settings"
                className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
              >
                الذهاب إلى الإعدادات
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};