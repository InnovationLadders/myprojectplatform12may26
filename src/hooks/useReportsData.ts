import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ProjectReportData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  rating: number;
  created_at: string;
  due_date: string | null;
  teacher_name: string;
  school_name: string;
  students_count: number;
  tasks_completed: number;
  tasks_total: number;
  evaluation_score: number;
  weighted_score: number;
}

export interface StudentReportData {
  id: string;
  name: string;
  email: string;
  grade: string;
  school_name: string;
  projects_count: number;
  completed_projects: number;
  average_rating: number;
  total_evaluation_score: number;
}

export interface TeacherReportData {
  id: string;
  name: string;
  email: string;
  subject: string;
  school_name: string;
  projects_count: number;
  students_count: number;
  average_project_rating: number;
  completed_projects: number;
}

export interface SchoolReportData {
  id: string;
  name: string;
  email: string;
  projects_count: number;
  teachers_count: number;
  students_count: number;
  average_rating: number;
  completion_rate: number;
}

export interface ReportsData {
  // Summary statistics
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  draftProjects: number;
  averageProgress: number;
  averageRating: number;
  
  // Detailed data
  projects: ProjectReportData[];
  students: StudentReportData[];
  teachers: TeacherReportData[];
  schools: SchoolReportData[];
  
  // Chart data
  projectsByCategory: { name: string; value: number; color: string }[];
  projectsByStatus: { name: string; مكتملة: number; نشطة: number; مسودة: number }[];
  progressDistribution: { range: string; count: number }[];
  monthlyProgress: { name: string; projects: number; completion: number }[];
}

export const useReportsData = () => {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReportsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching reports data for user:', user.role, user.id);

      // Fetch projects based on user role
      let projectsQuery;
      const projectsRef = collection(db, 'projects');

      if (user.role === 'teacher') {
        // Teacher sees their own projects and draft projects from their school
        const teacherProjectsQuery = query(projectsRef, where('teacher_id', '==', user.id));
        const schoolDraftProjectsQuery = query(
          projectsRef, 
          where('school_id', '==', user.school_id),
          where('status', '==', 'draft')
        );
        
        const [teacherSnapshot, schoolDraftSnapshot] = await Promise.all([
          getDocs(teacherProjectsQuery),
          getDocs(schoolDraftProjectsQuery)
        ]);
        
        // Combine and deduplicate
        const projectMap = new Map();
        [...teacherSnapshot.docs, ...schoolDraftSnapshot.docs].forEach(doc => {
          projectMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        
        var allProjects = Array.from(projectMap.values());
      } else if (user.role === 'school') {
        // School sees all projects from their school
        projectsQuery = query(projectsRef, where('school_id', '==', user.id));
        const projectsSnapshot = await getDocs(projectsQuery);
        var allProjects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else if (user.role === 'admin') {
        // Admin sees all projects
        const projectsSnapshot = await getDocs(projectsRef);
        var allProjects = projectsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        // Students don't have access to reports
        setReportsData({
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          draftProjects: 0,
          averageProgress: 0,
          averageRating: 0,
          projects: [],
          students: [],
          teachers: [],
          schools: [],
          projectsByCategory: [],
          projectsByStatus: [],
          progressDistribution: [],
          monthlyProgress: []
        });
        setLoading(false);
        return;
      }

      console.log('Fetched projects:', allProjects.length);

      // Fetch evaluations for all projects
      const evaluationsRef = collection(db, 'project_evaluations');
      const evaluationsSnapshot = await getDocs(evaluationsRef);
      const evaluationsMap = new Map();
      
      evaluationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        evaluationsMap.set(data.projectId, data);
      });

      // Fetch all users for teacher and student data
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersMap = new Map();
      
      usersSnapshot.docs.forEach(doc => {
        usersMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // Fetch project students for student counts
      const projectStudentsRef = collection(db, 'project_students');
      const projectStudentsSnapshot = await getDocs(projectStudentsRef);
      const projectStudentsMap = new Map();
      
      projectStudentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!projectStudentsMap.has(data.project_id)) {
          projectStudentsMap.set(data.project_id, []);
        }
        projectStudentsMap.get(data.project_id).push(data);
      });

      // Process projects data
      const processedProjects: ProjectReportData[] = allProjects.map(project => {
        const evaluation = evaluationsMap.get(project.id);
        const teacher = usersMap.get(project.teacher_id);
        const school = usersMap.get(project.school_id);
        const projectStudents = projectStudentsMap.get(project.id) || [];
        
        // Calculate evaluation scores
        let evaluationScore = 0;
        let weightedScore = 0;
        
        if (evaluation && evaluation.criteria) {
          const progressCriterion = evaluation.criteria.find((c: any) => c.name === 'نسبة الإنجاز');
          evaluationScore = progressCriterion ? progressCriterion.score : 0;
          weightedScore = evaluation.criteria.reduce((total: number, criterion: any) => 
            total + (criterion.score * criterion.weight), 0
          );
        }

        return {
          id: project.id,
          title: project.title || 'مشروع بدون عنوان',
          description: project.description || '',
          category: project.category || 'غير محدد',
          status: project.status || 'draft',
          progress: evaluationScore,
          rating: weightedScore,
          created_at: project.created_at ? new Date(project.created_at.toDate()).toISOString() : new Date().toISOString(),
          due_date: project.due_date ? new Date(project.due_date.toDate()).toISOString() : null,
          teacher_name: teacher?.name || 'غير محدد',
          school_name: school?.name || 'غير محدد',
          students_count: projectStudents.length,
          tasks_completed: 0, // Will be calculated from tasks if needed
          tasks_total: 0, // Will be calculated from tasks if needed
          evaluation_score: evaluationScore,
          weighted_score: weightedScore
        };
      });

      // Process students data (only for admin and school roles)
      let processedStudents: StudentReportData[] = [];
      if (user.role === 'admin') {
        // Admin can see all students
        const students = Array.from(usersMap.values()).filter(u => u.role === 'student');
        
        processedStudents = students.map(student => {
          const studentProjects = projectStudentsSnapshot.docs
            .filter(doc => doc.data().student_id === student.id)
            .map(doc => doc.data().project_id);
          
          const studentProjectsData = allProjects.filter(p => studentProjects.includes(p.id));
          const completedProjects = studentProjectsData.filter(p => p.status === 'completed');
          
          // Calculate average rating from evaluations
          let totalRating = 0;
          let ratedProjects = 0;
          let totalEvaluationScore = 0;
          
          studentProjectsData.forEach(project => {
            const evaluation = evaluationsMap.get(project.id);
            if (evaluation && evaluation.criteria) {
              const weightedScore = evaluation.criteria.reduce((total: number, criterion: any) => 
                total + (criterion.score * criterion.weight), 0
              );
              totalRating += weightedScore;
              ratedProjects++;
              
              const progressCriterion = evaluation.criteria.find((c: any) => c.name === 'نسبة الإنجاز');
              if (progressCriterion) {
                totalEvaluationScore += progressCriterion.score;
              }
            }
          });

          const school = usersMap.get(student.school_id);

          return {
            id: student.id,
            name: student.name || 'طالب غير معروف',
            email: student.email || '',
            grade: student.grade || 'غير محدد',
            school_name: school?.name || 'غير محدد',
            projects_count: studentProjectsData.length,
            completed_projects: completedProjects.length,
            average_rating: ratedProjects > 0 ? totalRating / ratedProjects : 0,
            total_evaluation_score: totalEvaluationScore
          };
        });
      } else if (user.role === 'school') {
        // School can only see students from their own school
        const students = Array.from(usersMap.values()).filter(u => 
          u.role === 'student' && u.school_id === user.id
        );
        
        processedStudents = students.map(student => {
          const studentProjects = projectStudentsSnapshot.docs
            .filter(doc => doc.data().student_id === student.id)
            .map(doc => doc.data().project_id);
          
          // Only include projects that belong to this school
          const studentProjectsData = allProjects.filter(p => 
            studentProjects.includes(p.id) && p.school_id === user.id
          );
          const completedProjects = studentProjectsData.filter(p => p.status === 'completed');
          
          // Calculate average rating from evaluations
          let totalRating = 0;
          let ratedProjects = 0;
          let totalEvaluationScore = 0;
          
          studentProjectsData.forEach(project => {
            const evaluation = evaluationsMap.get(project.id);
            if (evaluation && evaluation.criteria) {
              const weightedScore = evaluation.criteria.reduce((total: number, criterion: any) => 
                total + (criterion.score * criterion.weight), 0
              );
              totalRating += weightedScore;
              ratedProjects++;
              
              const progressCriterion = evaluation.criteria.find((c: any) => c.name === 'نسبة الإنجاز');
              if (progressCriterion) {
                totalEvaluationScore += progressCriterion.score;
              }
            }
          });

          return {
            id: student.id,
            name: student.name || 'طالب غير معروف',
            email: student.email || '',
            grade: student.grade || 'غير محدد',
            school_name: user.name || 'غير محدد', // Use current school's name
            projects_count: studentProjectsData.length,
            completed_projects: completedProjects.length,
            average_rating: ratedProjects > 0 ? totalRating / ratedProjects : 0,
            total_evaluation_score: totalEvaluationScore
          };
        });
      } else if (user.role === 'teacher') {
        // Teacher can only see students from their own school
        const students = Array.from(usersMap.values()).filter(u => 
          u.role === 'student' && u.school_id === user.school_id
        );
        
        processedStudents = students.map(student => {
          const studentProjects = projectStudentsSnapshot.docs
            .filter(doc => doc.data().student_id === student.id)
            .map(doc => doc.data().project_id);
          
          // Only include projects that belong to the teacher's school
          const studentProjectsData = allProjects.filter(p => 
            studentProjects.includes(p.id) && p.school_id === user.school_id
          );
          const completedProjects = studentProjectsData.filter(p => p.status === 'completed');
          
          // Calculate average rating from evaluations
          let totalRating = 0;
          let ratedProjects = 0;
          let totalEvaluationScore = 0;
          
          studentProjectsData.forEach(project => {
            const evaluation = evaluationsMap.get(project.id);
            if (evaluation && evaluation.criteria) {
              const weightedScore = evaluation.criteria.reduce((total: number, criterion: any) => 
                total + (criterion.score * criterion.weight), 0
              );
              totalRating += weightedScore;
              ratedProjects++;
              
              const progressCriterion = evaluation.criteria.find((c: any) => c.name === 'نسبة الإنجاز');
              if (progressCriterion) {
                totalEvaluationScore += progressCriterion.score;
              }
            }
          });

          const school = usersMap.get(user.school_id);

          return {
            id: student.id,
            name: student.name || 'طالب غير معروف',
            email: student.email || '',
            grade: student.grade || 'غير محدد',
            school_name: school?.name || 'غير محدد',
            projects_count: studentProjectsData.length,
            completed_projects: completedProjects.length,
            average_rating: ratedProjects > 0 ? totalRating / ratedProjects : 0,
            total_evaluation_score: totalEvaluationScore
          };
        });
      }

      // Process teachers data (only for admin and school roles)
      let processedTeachers: TeacherReportData[] = [];
      if (user.role === 'admin') {
        // Admin can see all teachers
        const teachers = Array.from(usersMap.values()).filter(u => u.role === 'teacher');
        
        processedTeachers = teachers.map(teacher => {
          const teacherProjects = allProjects.filter(p => p.teacher_id === teacher.id);
          const completedProjects = teacherProjects.filter(p => p.status === 'completed');
          
          // Calculate average project rating
          let totalRating = 0;
          let ratedProjects = 0;
          
          teacherProjects.forEach(project => {
            const evaluation = evaluationsMap.get(project.id);
            if (evaluation && evaluation.criteria) {
              const weightedScore = evaluation.criteria.reduce((total: number, criterion: any) => 
                total + (criterion.score * criterion.weight), 0
              );
              totalRating += weightedScore;
              ratedProjects++;
            }
          });

          // Count unique students taught by this teacher
          const uniqueStudents = new Set();
          teacherProjects.forEach(project => {
            const projectStudents = projectStudentsMap.get(project.id) || [];
            projectStudents.forEach((ps: any) => uniqueStudents.add(ps.student_id));
          });

          const school = usersMap.get(teacher.school_id);

          return {
            id: teacher.id,
            name: teacher.name || 'معلم غير معروف',
            email: teacher.email || '',
            subject: teacher.subject || 'غير محدد',
            school_name: school?.name || 'غير محدد',
            projects_count: teacherProjects.length,
            students_count: uniqueStudents.size,
            average_project_rating: ratedProjects > 0 ? totalRating / ratedProjects : 0,
            completed_projects: completedProjects.length
          };
        });
      } else if (user.role === 'school') {
        // School can only see teachers from their own school
        const teachers = Array.from(usersMap.values()).filter(u => 
          u.role === 'teacher' && u.school_id === user.id
        );
        
        processedTeachers = teachers.map(teacher => {
          // Only include projects that belong to this school
          const teacherProjects = allProjects.filter(p => 
            p.teacher_id === teacher.id && p.school_id === user.id
          );
          const completedProjects = teacherProjects.filter(p => p.status === 'completed');
          
          // Calculate average project rating
          let totalRating = 0;
          let ratedProjects = 0;
          
          teacherProjects.forEach(project => {
            const evaluation = evaluationsMap.get(project.id);
            if (evaluation && evaluation.criteria) {
              const weightedScore = evaluation.criteria.reduce((total: number, criterion: any) => 
                total + (criterion.score * criterion.weight), 0
              );
              totalRating += weightedScore;
              ratedProjects++;
            }
          });

          // Count unique students taught by this teacher
          const uniqueStudents = new Set();
          teacherProjects.forEach(project => {
            const projectStudents = projectStudentsMap.get(project.id) || [];
            projectStudents.forEach((ps: any) => uniqueStudents.add(ps.student_id));
          });

          return {
            id: teacher.id,
            name: teacher.name || 'معلم غير معروف',
            email: teacher.email || '',
            subject: teacher.subject || 'غير محدد',
            school_name: user.name || 'غير محدد', // Use current school's name
            projects_count: teacherProjects.length,
            students_count: uniqueStudents.size,
            average_project_rating: ratedProjects > 0 ? totalRating / ratedProjects : 0,
            completed_projects: completedProjects.length
          };
        });
      }

      // Process schools data (only for admin role)
      let processedSchools: SchoolReportData[] = [];
      if (user.role === 'admin') {
        const schools = Array.from(usersMap.values()).filter(u => u.role === 'school');
        
        processedSchools = schools.map(school => {
          const schoolProjects = allProjects.filter(p => p.school_id === school.id);
          
          // Count teachers and students for this specific school
          const schoolTeachersCount = Array.from(usersMap.values()).filter(u => 
            u.role === 'teacher' && u.school_id === school.id
          ).length;
          
          const schoolStudentsCount = Array.from(usersMap.values()).filter(u => 
            u.role === 'student' && u.school_id === school.id
          ).length;
          
          // Calculate average rating
          let totalRating = 0;
          let ratedProjects = 0;
          
          schoolProjects.forEach(project => {
            const evaluation = evaluationsMap.get(project.id);
            if (evaluation && evaluation.criteria) {
              const weightedScore = evaluation.criteria.reduce((total: number, criterion: any) => 
                total + (criterion.score * criterion.weight), 0
              );
              totalRating += weightedScore;
              ratedProjects++;
            }
          });

          const completedProjects = schoolProjects.filter(p => p.status === 'completed');
          const completionRate = schoolProjects.length > 0 ? 
            (completedProjects.length / schoolProjects.length) * 100 : 0;

          return {
            id: school.id,
            name: school.name || 'مدرسة غير معروفة',
            email: school.email || '',
            projects_count: schoolProjects.length,
            teachers_count: schoolTeachersCount,
            students_count: schoolStudentsCount,
            average_rating: ratedProjects > 0 ? totalRating / ratedProjects : 0,
            completion_rate: completionRate
          };
        });
      }

      // Calculate summary statistics
      const totalProjects = processedProjects.length;
      const activeProjects = processedProjects.filter(p => p.status === 'active').length;
      const completedProjects = processedProjects.filter(p => p.status === 'completed').length;
      const draftProjects = processedProjects.filter(p => p.status === 'draft').length;
      
      const averageProgress = totalProjects > 0 ? 
        processedProjects.reduce((sum, p) => sum + p.progress, 0) / totalProjects : 0;
      
      const averageRating = totalProjects > 0 ? 
        processedProjects.reduce((sum, p) => sum + p.rating, 0) / totalProjects : 0;

      // Generate chart data
      const categoryMap = new Map();
      processedProjects.forEach(project => {
        const category = project.category;
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      const projectsByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name: name === 'stem' ? 'العلوم والتقنية' : 
              name === 'entrepreneurship' ? 'ريادة الأعمال' :
              name === 'volunteer' ? 'التطوع' :
              name === 'ethics' ? 'الأخلاق' : name,
        value: value as number,
        color: name === 'stem' ? '#3B82F6' : 
               name === 'entrepreneurship' ? '#10B981' :
               name === 'volunteer' ? '#F59E0B' :
               name === 'ethics' ? '#EF4444' : '#6B7280'
      }));

      // Generate monthly progress data (last 6 months)
      const monthlyProgress = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('ar-SA', { month: 'long' });
        
        const monthProjects = processedProjects.filter(p => {
          const projectDate = new Date(p.created_at);
          return projectDate.getMonth() === date.getMonth() && 
                 projectDate.getFullYear() === date.getFullYear();
        });
        
        const monthCompleted = monthProjects.filter(p => p.status === 'completed').length;
        const completionRate = monthProjects.length > 0 ? 
          (monthCompleted / monthProjects.length) * 100 : 0;

        monthlyProgress.push({
          name: monthName,
          projects: monthProjects.length,
          completion: completionRate
        });
      }

      // Generate progress distribution
      const progressRanges = [
        { range: '0-20%', min: 0, max: 2 },
        { range: '21-40%', min: 2.1, max: 4 },
        { range: '41-60%', min: 4.1, max: 6 },
        { range: '61-80%', min: 6.1, max: 8 },
        { range: '81-100%', min: 8.1, max: 10 }
      ];

      const progressDistribution = progressRanges.map(range => ({
        range: range.range,
        count: processedProjects.filter(p => p.progress >= range.min && p.progress <= range.max).length
      }));

      // Generate status data for charts
      const projectsByStatus = [{
        name: 'المشاريع',
        مكتملة: completedProjects,
        نشطة: activeProjects,
        مسودة: draftProjects
      }];

      const finalReportsData: ReportsData = {
        totalProjects,
        activeProjects,
        completedProjects,
        draftProjects,
        averageProgress,
        averageRating,
        projects: processedProjects,
        students: processedStudents,
        teachers: processedTeachers,
        schools: processedSchools,
        projectsByCategory,
        projectsByStatus,
        progressDistribution,
        monthlyProgress
      };

      console.log('Reports data processed:', {
        totalProjects: finalReportsData.totalProjects,
        projectsCount: finalReportsData.projects.length,
        studentsCount: finalReportsData.students.length,
        teachersCount: finalReportsData.teachers.length,
        schoolsCount: finalReportsData.schools.length
      });

      setReportsData(finalReportsData);
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات التقارير');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user]);

  return {
    reportsData,
    loading,
    error,
    refetchData: fetchReportsData
  };
};