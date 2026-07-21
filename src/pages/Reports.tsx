import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChartBar as BarChart3, TrendingUp, Users, BookOpen, Award, Calendar, Download, Filter, Eye, ChartPie as PieChart, ChartLine as LineChart, Activity, School, FileSpreadsheet, FileText, TriangleAlert as AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart as RechartsLineChart, Line, Area, AreaChart } from 'recharts';
import { useReportsData } from '../hooks/useReportsData';
import { ReportTable, TableColumn } from '../components/Reports/ReportTable';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

const getReportTypes = (userRole: string, t: any) => {
  const baseTypes = [
    { id: 'overview', name: t('reports.tabs.overview'), icon: BarChart3 },
    { id: 'projects', name: t('reports.tabs.projects'), icon: BookOpen },
  ];

  if (userRole === 'admin') {
    return [
      ...baseTypes,
      { id: 'schools', name: t('reports.tabs.schools'), icon: School },
      { id: 'users', name: t('reports.tabs.users'), icon: Users },
      { id: 'performance', name: t('reports.tabs.performance'), icon: TrendingUp },
    ];
  } else if (userRole === 'school') {
    return [
      ...baseTypes,
      { id: 'teachers', name: t('reports.tabs.teachers'), icon: Users },
      { id: 'students', name: t('reports.tabs.students'), icon: Users },
    ];
  } else if (userRole === 'teacher') {
    return [
      ...baseTypes,
      { id: 'students', name: t('reports.tabs.students'), icon: Users },
    ];
  }

  return baseTypes;
};

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { reportsData, loading, error } = useReportsData();
  const [selectedReport, setSelectedReport] = useState('overview');

  const reportTypes = getReportTypes(user?.role || 'student', t);

  // Define table columns for different data types
  const projectColumns: TableColumn[] = [
    {
      key: 'title',
      label: t('reports.columns.projectTitle'),
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 line-clamp-1">{row.description}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: t('reports.columns.category'),
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {value === 'stem' ? t('reports.categories.stem') :
           value === 'entrepreneurship' ? t('reports.categories.entrepreneurship') :
           value === 'volunteer' ? t('reports.categories.volunteer') :
           value === 'ethics' ? t('reports.categories.ethics') : value}
        </span>
      )
    },
    {
      key: 'status',
      label: t('reports.columns.status'),
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'active' ? 'bg-blue-100 text-blue-800' :
          value === 'draft' ? 'bg-gray-100 text-gray-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {value === 'completed' ? t('reports.statuses.completed') :
           value === 'active' ? t('reports.statuses.active') :
           value === 'draft' ? t('reports.statuses.draft') : t('reports.statuses.archived')}
        </span>
      )
    },
    {
      key: 'progress',
      label: t('reports.columns.progress'),
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                value >= 8 ? 'bg-green-500' :
                value >= 5 ? 'bg-blue-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${(value / 10) * 100}%` }}
            ></div>
          </div>
          <span className="font-medium">{value}/10</span>
        </div>
      )
    },
    {
      key: 'weighted_score',
      label: t('reports.columns.weightedScore'),
      render: (value) => (
        <span className="font-medium text-purple-600">{value.toFixed(2)}/10</span>
      )
    },
    {
      key: 'teacher_name',
      label: t('reports.columns.supervisorTeacher')
    },
    {
      key: 'school_name',
      label: t('reports.columns.school')
    },
    {
      key: 'students_count',
      label: t('reports.columns.studentsCount')
    },
    {
      key: 'created_at',
      label: t('reports.columns.createdAt'),
      render: (value) => formatDate(value)
    }
  ];

  const studentColumns: TableColumn[] = [
    {
      key: 'name',
      label: t('reports.columns.studentName'),
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'grade',
      label: t('reports.columns.grade')
    },
    {
      key: 'school_name',
      label: t('reports.columns.school')
    },
    {
      key: 'projects_count',
      label: t('reports.columns.projectsCount')
    },
    {
      key: 'completed_projects',
      label: t('reports.columns.completedProjects')
    },
    {
      key: 'average_rating',
      label: t('reports.columns.averageRating'),
      render: (value) => (
        <span className="font-medium text-blue-600">{value.toFixed(1)}/10</span>
      )
    },
    {
      key: 'total_evaluation_score',
      label: t('reports.columns.totalEvaluationScore'),
      render: (value) => (
        <span className="font-medium text-green-600">{value.toFixed(1)}</span>
      )
    }
  ];

  const teacherColumns: TableColumn[] = [
    {
      key: 'name',
      label: t('reports.columns.teacherName'),
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'subject',
      label: t('reports.columns.subject')
    },
    {
      key: 'school_name',
      label: t('reports.columns.school')
    },
    {
      key: 'projects_count',
      label: t('reports.columns.projectsCount')
    },
    {
      key: 'completed_projects',
      label: t('reports.columns.completedProjects')
    },
    {
      key: 'students_count',
      label: t('reports.columns.studentsCount')
    },
    {
      key: 'average_project_rating',
      label: t('reports.columns.averageProjectRating'),
      render: (value) => (
        <span className="font-medium text-blue-600">{value.toFixed(1)}/10</span>
      )
    }
  ];

  const schoolColumns: TableColumn[] = [
    {
      key: 'name',
      label: t('reports.columns.schoolName'),
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'projects_count',
      label: t('reports.columns.projectsCount')
    },
    {
      key: 'teachers_count',
      label: t('reports.columns.teachersCount')
    },
    {
      key: 'students_count',
      label: t('reports.columns.studentsCount')
    },
    {
      key: 'completion_rate',
      label: t('reports.columns.completionRate'),
      render: (value) => (
        <span className="font-medium text-green-600">{value.toFixed(1)}%</span>
      )
    },
    {
      key: 'average_rating',
      label: t('reports.columns.averageRating'),
      render: (value) => (
        <span className="font-medium text-blue-600">{value.toFixed(1)}/10</span>
      )
    }
  ];

  const exportAllData = () => {
    if (!reportsData) return;

    try {
      const workbook = XLSX.utils.book_new();

      // Export projects
      if (reportsData.projects.length > 0) {
        const projectsData = reportsData.projects.map(project => ({
          [t('reports.export.projectTitle')]: project.title,
          [t('reports.export.description')]: project.description,
          [t('reports.export.category')]: project.category === 'stem' ? t('reports.categories.stem') :
                   project.category === 'entrepreneurship' ? t('reports.categories.entrepreneurship') :
                   project.category === 'volunteer' ? t('reports.categories.volunteer') :
                   project.category === 'ethics' ? t('reports.categories.ethics') : project.category,
          [t('reports.export.status')]: project.status === 'completed' ? t('reports.statuses.completed') :
                   project.status === 'active' ? t('reports.statuses.active') :
                   project.status === 'draft' ? t('reports.statuses.draft') : t('reports.statuses.archived'),
          [t('reports.export.progress')]: `${project.progress}/10`,
          [t('reports.export.weightedScore')]: project.weighted_score.toFixed(2),
          [t('reports.export.supervisor')]: project.teacher_name,
          [t('reports.export.school')]: project.school_name,
          [t('reports.export.studentsCount')]: project.students_count,
          [t('reports.export.createdAt')]: formatDate(project.created_at),
          [t('reports.export.deadline')]: project.due_date ? formatDate(project.due_date) : t('reports.export.notSpecified')
        }));
        
        const projectsWorksheet = XLSX.utils.json_to_sheet(projectsData);
        XLSX.utils.book_append_sheet(workbook, projectsWorksheet, t('reports.export.sheets.projects'));
      }

      // Export students (if available)
      if (reportsData.students.length > 0) {
        const studentsData = reportsData.students.map(student => ({
          [t('reports.export.studentName')]: student.name,
          [t('reports.export.email')]: student.email,
          [t('reports.export.grade')]: student.grade,
          [t('reports.export.school')]: student.school_name,
          [t('reports.export.projectsCount')]: student.projects_count,
          [t('reports.export.completedProjects')]: student.completed_projects,
          [t('reports.export.averageRating')]: student.average_rating.toFixed(1),
          [t('reports.export.totalScore')]: student.total_evaluation_score.toFixed(1)
        }));
        
        const studentsWorksheet = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(workbook, studentsWorksheet, t('reports.export.sheets.students'));
      }

      // Export teachers (if available)
      if (reportsData.teachers.length > 0) {
        const teachersData = reportsData.teachers.map(teacher => ({
          [t('reports.export.teacherName')]: teacher.name,
          [t('reports.export.email')]: teacher.email,
          [t('reports.export.subject')]: teacher.subject,
          [t('reports.export.school')]: teacher.school_name,
          [t('reports.export.projectsCount')]: teacher.projects_count,
          [t('reports.export.completedProjects')]: teacher.completed_projects,
          [t('reports.export.studentsCount')]: teacher.students_count,
          [t('reports.export.averageRating')]: teacher.average_project_rating.toFixed(1)
        }));
        
        const teachersWorksheet = XLSX.utils.json_to_sheet(teachersData);
        XLSX.utils.book_append_sheet(workbook, teachersWorksheet, t('reports.export.sheets.teachers'));
      }

      // Export schools (if available)
      if (reportsData.schools.length > 0) {
        const schoolsData = reportsData.schools.map(school => ({
          [t('reports.export.school')]: school.name,
          [t('reports.export.email')]: school.email,
          [t('reports.export.projectsCount')]: school.projects_count,
          [t('reports.export.teachersCount')]: school.teachers_count,
          [t('reports.export.studentsCount')]: school.students_count,
          [t('reports.export.completionRate')]: `${school.completion_rate.toFixed(1)}%`,
          [t('reports.export.averageRating')]: school.average_rating.toFixed(1)
        }));
        
        const schoolsWorksheet = XLSX.utils.json_to_sheet(schoolsData);
        XLSX.utils.book_append_sheet(workbook, schoolsWorksheet, t('reports.export.sheets.schools'));
      }

      // Generate Excel file
      XLSX.writeFile(workbook, `${t('reports.export.fileName')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert(t('reports.exportError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('reports.errorOccurred')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('reports.noData')}</h2>
          <p className="text-gray-600">{t('reports.noData')}</p>
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
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
              <p className="opacity-90">{t('reports.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={exportAllData}
              className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              {t('reports.exportAll')}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{reportsData.totalProjects}</div>
            <div className="text-sm opacity-80">{t('reports.stats.activeProjects')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{reportsData.completedProjects}</div>
            <div className="text-sm opacity-80">{t('reports.stats.completedProjects')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{reportsData.averageProgress.toFixed(1)}</div>
            <div className="text-sm opacity-80">{t('reports.stats.averageProgress')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{reportsData.averageRating.toFixed(1)}</div>
            <div className="text-sm opacity-80">{t('reports.stats.averageRating')}</div>
          </div>
        </div>
      </motion.div>

      {/* Report Type Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedReport === type.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Report */}
        {selectedReport === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: t('reports.metrics.totalProjects'),
                  value: reportsData.totalProjects.toString(),
                  change: '+12%',
                  trend: 'up',
                  icon: BookOpen,
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  title: t('reports.metrics.activeProjects'),
                  value: reportsData.activeProjects.toString(),
                  change: '+8%',
                  trend: 'up',
                  icon: Activity,
                  color: 'from-green-500 to-green-600'
                },
                {
                  title: t('reports.metrics.averageProgress'),
                  value: `${reportsData.averageProgress.toFixed(1)}/10`,
                  change: '+5%',
                  trend: 'up',
                  icon: Award,
                  color: 'from-purple-500 to-purple-600'
                },
                {
                  title: t('reports.metrics.averageRating'),
                  value: reportsData.averageRating.toFixed(1),
                  change: '+0.2',
                  trend: 'up',
                  icon: TrendingUp,
                  color: 'from-orange-500 to-orange-600'
                }
              ].map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center`}>
                      <metric.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      {metric.change}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">{metric.value}</h3>
                  <p className="text-gray-600 text-sm">{metric.title}</p>
                </motion.div>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Projects Chart */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t('reports.charts.projectsTrend')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reportsData.monthlyProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="projects" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                    <Area type="monotone" dataKey="completion" stackId="2" stroke="#10B981" fill="#10B981" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Categories Pie Chart */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">{t('reports.charts.categoryDistribution')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={reportsData.projectsByCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportsData.projectsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Projects Report */}
        {selectedReport === 'projects' && (
          <ReportTable
            data={reportsData.projects}
            columns={projectColumns}
            title={t('reports.tables.projectsTitle')}
            searchPlaceholder={t('reports.tables.projectsSearch')}
            exportFileName={t('reports.tables.projectsExport')}
          />
        )}

        {/* Students Report */}
        {selectedReport === 'students' && (
          <ReportTable
            data={reportsData.students}
            columns={studentColumns}
            title={t('reports.tables.studentsTitle')}
            searchPlaceholder={t('reports.tables.studentsSearch')}
            exportFileName={t('reports.tables.studentsExport')}
          />
        )}

        {/* Teachers Report */}
        {selectedReport === 'teachers' && (
          <ReportTable
            data={reportsData.teachers}
            columns={teacherColumns}
            title={t('reports.tables.teachersTitle')}
            searchPlaceholder={t('reports.tables.teachersSearch')}
            exportFileName={t('reports.tables.teachersExport')}
          />
        )}

        {/* Schools Report */}
        {selectedReport === 'schools' && (
          <ReportTable
            data={reportsData.schools}
            columns={schoolColumns}
            title={t('reports.tables.schoolsTitle')}
            searchPlaceholder={t('reports.tables.schoolsSearch')}
            exportFileName={t('reports.tables.schoolsExport')}
          />
        )}

        {/* Performance Report */}
        {selectedReport === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{t('reports.charts.progressDistribution')}</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportsData.progressDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.averageProgress.toFixed(1)}</h3>
                <p className="text-gray-600">{t('reports.metrics.averageProgress')}</p>
                <p className="text-blue-600 text-sm mt-1">{t('reports.performance.outOf10')}</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.averageRating.toFixed(1)}</h3>
                <p className="text-gray-600">{t('reports.metrics.weightedRating')}</p>
                <p className="text-green-600 text-sm mt-1">{t('reports.performance.outOf10')}</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {reportsData.totalProjects > 0 ? 
                    ((reportsData.completedProjects / reportsData.totalProjects) * 100).toFixed(1) : 0}%
                </h3>
                <p className="text-gray-600">{t('reports.metrics.completionRate')}</p>
                <p className="text-yellow-600 text-sm mt-1">{reportsData.completedProjects} {t('reports.performance.outOf')} {reportsData.totalProjects}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Summary Cards for Role-Based Data */}
      {(user?.role === 'admin' || user?.role === 'school') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.projects.length}</h3>
            <p className="text-gray-600">{t('reports.metrics.totalProjects')}</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.students.length}</h3>
            <p className="text-gray-600">{t('reports.summary.totalStudents')}</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.teachers.length}</h3>
            <p className="text-gray-600">{t('reports.summary.totalTeachers')}</p>
          </div>
          
          {user?.role === 'admin' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <School className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.schools.length}</h3>
              <p className="text-gray-600">{t('reports.summary.totalSchools')}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};