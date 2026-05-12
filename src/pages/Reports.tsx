import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Award,
  Calendar,
  Download,
  Filter,
  Eye,
  PieChart,
  LineChart,
  Activity,
  School,
  FileSpreadsheet,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie, LineChart as RechartsLineChart, Line, Area, AreaChart } from 'recharts';
import { useReportsData } from '../hooks/useReportsData';
import { ReportTable, TableColumn } from '../components/Reports/ReportTable';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';
import * as XLSX from 'xlsx';

const getReportTypes = (userRole: string) => {
  const baseTypes = [
    { id: 'overview', name: 'نظرة عامة', icon: BarChart3 },
    { id: 'projects', name: 'تقارير المشاريع', icon: BookOpen },
  ];

  if (userRole === 'admin') {
    return [
      ...baseTypes,
      { id: 'schools', name: 'تقارير المدارس', icon: School },
      { id: 'users', name: 'تقارير المستخدمين', icon: Users },
      { id: 'performance', name: 'تقارير الأداء', icon: TrendingUp },
    ];
  } else if (userRole === 'school') {
    return [
      ...baseTypes,
      { id: 'teachers', name: 'تقارير المعلمين', icon: Users },
      { id: 'students', name: 'تقارير الطلاب', icon: Users },
    ];
  } else if (userRole === 'teacher') {
    return [
      ...baseTypes,
      { id: 'students', name: 'تقارير الطلاب', icon: Users },
    ];
  }

  return baseTypes;
};

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const { reportsData, loading, error } = useReportsData();
  const [selectedReport, setSelectedReport] = useState('overview');
  
  const reportTypes = getReportTypes(user?.role || 'student');

  // Define table columns for different data types
  const projectColumns: TableColumn[] = [
    {
      key: 'title',
      label: 'عنوان المشروع',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500 line-clamp-1">{row.description}</div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'الفئة',
      render: (value) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {value === 'stem' ? 'العلوم والتقنية' : 
           value === 'entrepreneurship' ? 'ريادة الأعمال' :
           value === 'volunteer' ? 'التطوع' :
           value === 'ethics' ? 'الأخلاق' : value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'completed' ? 'bg-green-100 text-green-800' :
          value === 'active' ? 'bg-blue-100 text-blue-800' :
          value === 'draft' ? 'bg-gray-100 text-gray-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {value === 'completed' ? 'مكتمل' :
           value === 'active' ? 'نشط' :
           value === 'draft' ? 'مسودة' : 'مؤرشف'}
        </span>
      )
    },
    {
      key: 'progress',
      label: 'نسبة الإنجاز',
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
      label: 'الدرجة الموزونة',
      render: (value) => (
        <span className="font-medium text-purple-600">{value.toFixed(2)}/10</span>
      )
    },
    {
      key: 'teacher_name',
      label: 'المعلم المشرف'
    },
    {
      key: 'school_name',
      label: 'المدرسة'
    },
    {
      key: 'students_count',
      label: 'عدد الطلاب'
    },
    {
      key: 'created_at',
      label: 'تاريخ الإنشاء',
      render: (value) => formatDate(value)
    }
  ];

  const studentColumns: TableColumn[] = [
    {
      key: 'name',
      label: 'اسم الطالب',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'grade',
      label: 'الصف الدراسي'
    },
    {
      key: 'school_name',
      label: 'المدرسة'
    },
    {
      key: 'projects_count',
      label: 'عدد المشاريع'
    },
    {
      key: 'completed_projects',
      label: 'المشاريع المكتملة'
    },
    {
      key: 'average_rating',
      label: 'متوسط التقييم',
      render: (value) => (
        <span className="font-medium text-blue-600">{value.toFixed(1)}/10</span>
      )
    },
    {
      key: 'total_evaluation_score',
      label: 'مجموع درجات الإنجاز',
      render: (value) => (
        <span className="font-medium text-green-600">{value.toFixed(1)}</span>
      )
    }
  ];

  const teacherColumns: TableColumn[] = [
    {
      key: 'name',
      label: 'اسم المعلم',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'التخصص'
    },
    {
      key: 'school_name',
      label: 'المدرسة'
    },
    {
      key: 'projects_count',
      label: 'عدد المشاريع'
    },
    {
      key: 'completed_projects',
      label: 'المشاريع المكتملة'
    },
    {
      key: 'students_count',
      label: 'عدد الطلاب'
    },
    {
      key: 'average_project_rating',
      label: 'متوسط تقييم المشاريع',
      render: (value) => (
        <span className="font-medium text-blue-600">{value.toFixed(1)}/10</span>
      )
    }
  ];

  const schoolColumns: TableColumn[] = [
    {
      key: 'name',
      label: 'اسم المدرسة',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
        </div>
      )
    },
    {
      key: 'projects_count',
      label: 'عدد المشاريع'
    },
    {
      key: 'teachers_count',
      label: 'عدد المعلمين'
    },
    {
      key: 'students_count',
      label: 'عدد الطلاب'
    },
    {
      key: 'completion_rate',
      label: 'معدل الإنجاز',
      render: (value) => (
        <span className="font-medium text-green-600">{value.toFixed(1)}%</span>
      )
    },
    {
      key: 'average_rating',
      label: 'متوسط التقييم',
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
          'عنوان المشروع': project.title,
          'الوصف': project.description,
          'الفئة': project.category === 'stem' ? 'العلوم والتقنية' : 
                   project.category === 'entrepreneurship' ? 'ريادة الأعمال' :
                   project.category === 'volunteer' ? 'التطوع' :
                   project.category === 'ethics' ? 'الأخلاق' : project.category,
          'الحالة': project.status === 'completed' ? 'مكتمل' :
                   project.status === 'active' ? 'نشط' :
                   project.status === 'draft' ? 'مسودة' : 'مؤرشف',
          'نسبة الإنجاز': `${project.progress}/10`,
          'الدرجة الموزونة': project.weighted_score.toFixed(2),
          'المعلم المشرف': project.teacher_name,
          'المدرسة': project.school_name,
          'عدد الطلاب': project.students_count,
          'تاريخ الإنشاء': formatDate(project.created_at),
          'الموعد النهائي': project.due_date ? formatDate(project.due_date) : 'غير محدد'
        }));
        
        const projectsWorksheet = XLSX.utils.json_to_sheet(projectsData);
        XLSX.utils.book_append_sheet(workbook, projectsWorksheet, 'المشاريع');
      }

      // Export students (if available)
      if (reportsData.students.length > 0) {
        const studentsData = reportsData.students.map(student => ({
          'اسم الطالب': student.name,
          'البريد الإلكتروني': student.email,
          'الصف الدراسي': student.grade,
          'المدرسة': student.school_name,
          'عدد المشاريع': student.projects_count,
          'المشاريع المكتملة': student.completed_projects,
          'متوسط التقييم': student.average_rating.toFixed(1),
          'مجموع درجات الإنجاز': student.total_evaluation_score.toFixed(1)
        }));
        
        const studentsWorksheet = XLSX.utils.json_to_sheet(studentsData);
        XLSX.utils.book_append_sheet(workbook, studentsWorksheet, 'الطلاب');
      }

      // Export teachers (if available)
      if (reportsData.teachers.length > 0) {
        const teachersData = reportsData.teachers.map(teacher => ({
          'اسم المعلم': teacher.name,
          'البريد الإلكتروني': teacher.email,
          'التخصص': teacher.subject,
          'المدرسة': teacher.school_name,
          'عدد المشاريع': teacher.projects_count,
          'المشاريع المكتملة': teacher.completed_projects,
          'عدد الطلاب': teacher.students_count,
          'متوسط تقييم المشاريع': teacher.average_project_rating.toFixed(1)
        }));
        
        const teachersWorksheet = XLSX.utils.json_to_sheet(teachersData);
        XLSX.utils.book_append_sheet(workbook, teachersWorksheet, 'المعلمين');
      }

      // Export schools (if available)
      if (reportsData.schools.length > 0) {
        const schoolsData = reportsData.schools.map(school => ({
          'اسم المدرسة': school.name,
          'البريد الإلكتروني': school.email,
          'عدد المشاريع': school.projects_count,
          'عدد المعلمين': school.teachers_count,
          'عدد الطلاب': school.students_count,
          'معدل الإنجاز': `${school.completion_rate.toFixed(1)}%`,
          'متوسط التقييم': school.average_rating.toFixed(1)
        }));
        
        const schoolsWorksheet = XLSX.utils.json_to_sheet(schoolsData);
        XLSX.utils.book_append_sheet(workbook, schoolsWorksheet, 'المدارس');
      }

      // Generate Excel file
      XLSX.writeFile(workbook, `تقرير_شامل_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">حدث خطأ</h2>
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">لا توجد بيانات</h2>
          <p className="text-gray-600">لا توجد بيانات تقارير متاحة</p>
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
              <h1 className="text-3xl font-bold">التقارير والإحصائيات</h1>
              <p className="opacity-90">تحليل شامل لأداء المنصة والمشاريع</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={exportAllData}
              className="bg-white text-indigo-600 px-6 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              تصدير شامل
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{reportsData.totalProjects}</div>
            <div className="text-sm opacity-80">مشروع نشط</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{reportsData.completedProjects}</div>
            <div className="text-sm opacity-80">مشروع مكتمل</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{reportsData.averageProgress.toFixed(1)}</div>
            <div className="text-sm opacity-80">متوسط نسبة الإنجاز</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{reportsData.averageRating.toFixed(1)}</div>
            <div className="text-sm opacity-80">متوسط التقييم</div>
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
                  title: 'إجمالي المشاريع',
                  value: reportsData.totalProjects.toString(),
                  change: '+12%',
                  trend: 'up',
                  icon: BookOpen,
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  title: 'المشاريع النشطة',
                  value: reportsData.activeProjects.toString(),
                  change: '+8%',
                  trend: 'up',
                  icon: Activity,
                  color: 'from-green-500 to-green-600'
                },
                {
                  title: 'متوسط نسبة الإنجاز',
                  value: `${reportsData.averageProgress.toFixed(1)}/10`,
                  change: '+5%',
                  trend: 'up',
                  icon: Award,
                  color: 'from-purple-500 to-purple-600'
                },
                {
                  title: 'متوسط التقييم',
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
                <h3 className="text-lg font-bold text-gray-800 mb-4">تطور المشاريع الشهرية</h3>
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
                <h3 className="text-lg font-bold text-gray-800 mb-4">توزيع المشاريع حسب الفئة</h3>
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
            title="تقرير المشاريع التفصيلي"
            searchPlaceholder="البحث في المشاريع..."
            exportFileName="تقرير_المشاريع"
          />
        )}

        {/* Students Report */}
        {selectedReport === 'students' && (
          <ReportTable
            data={reportsData.students}
            columns={studentColumns}
            title="تقرير الطلاب التفصيلي"
            searchPlaceholder="البحث في الطلاب..."
            exportFileName="تقرير_الطلاب"
          />
        )}

        {/* Teachers Report */}
        {selectedReport === 'teachers' && (
          <ReportTable
            data={reportsData.teachers}
            columns={teacherColumns}
            title="تقرير المعلمين التفصيلي"
            searchPlaceholder="البحث في المعلمين..."
            exportFileName="تقرير_المعلمين"
          />
        )}

        {/* Schools Report */}
        {selectedReport === 'schools' && (
          <ReportTable
            data={reportsData.schools}
            columns={schoolColumns}
            title="تقرير المدارس التفصيلي"
            searchPlaceholder="البحث في المدارس..."
            exportFileName="تقرير_المدارس"
          />
        )}

        {/* Performance Report */}
        {selectedReport === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">توزيع نسب الإنجاز</h3>
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
                <p className="text-gray-600">متوسط نسبة الإنجاز</p>
                <p className="text-blue-600 text-sm mt-1">من 10 درجات</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.averageRating.toFixed(1)}</h3>
                <p className="text-gray-600">متوسط التقييم الموزون</p>
                <p className="text-green-600 text-sm mt-1">من 10 درجات</p>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {reportsData.totalProjects > 0 ? 
                    ((reportsData.completedProjects / reportsData.totalProjects) * 100).toFixed(1) : 0}%
                </h3>
                <p className="text-gray-600">معدل إكمال المشاريع</p>
                <p className="text-yellow-600 text-sm mt-1">{reportsData.completedProjects} من {reportsData.totalProjects}</p>
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
            <p className="text-gray-600">إجمالي المشاريع</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.students.length}</h3>
            <p className="text-gray-600">إجمالي الطلاب</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.teachers.length}</h3>
            <p className="text-gray-600">إجمالي المعلمين</p>
          </div>
          
          {user?.role === 'admin' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <School className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{reportsData.schools.length}</h3>
              <p className="text-gray-600">إجمالي المدارس</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};