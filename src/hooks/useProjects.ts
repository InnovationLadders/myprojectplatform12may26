import { useState, useEffect } from 'react';
import {
  getProjects,
  getProjectsByTeacherId,
  getProjectsBySchoolId,
  getProjectsByStudentId,
  getProjectStudents,
  createProject as createFirebaseProject,
  updateProject as updateFirebaseProject,
  deleteProject as deleteFirebaseProject,
  addStudentToProject,
  removeStudentFromProject
} from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { awardProjectActivationPoints } from '../services/rewardPointsService';
import { syncAllProjectStudents } from '../services/pointsSyncService';
import { sendProjectCreatedNotification, getUsersByIds } from '../services/emailService';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  subject: string;
  difficulty: string;
  duration: string;
  objectives: string[];
  materials: string[];
  steps: string[];
  teacher_id: string;
  school_id: string;
  school_name?: string;
  status: string;
  progress: number;
  max_students: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let userProjects: Project[] = [];

      // Simple logic based on user role
      if (user.role === 'teacher') {
        // First, get projects where the teacher is assigned
        const teacherProjects = await getProjectsByTeacherId(user.id) as Project[];
        
        // Then, get draft projects from the teacher's school
        const schoolDraftProjectsQuery = query(
          collection(db, 'projects'),
          where('school_id', '==', user.school_id),
          where('status', '==', 'draft')
        );
        
        const schoolDraftProjectsSnapshot = await getDocs(schoolDraftProjectsQuery);
        const schoolDraftProjects = schoolDraftProjectsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            due_date: data.due_date ? data.due_date.toDate().toISOString() : null,
            created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
            updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString()
          };
        });
        
        // Combine both sets of projects, ensuring no duplicates
        const projectMap = new Map();
        
        // Add teacher's assigned projects
        teacherProjects.forEach(project => {
          projectMap.set(project.id, project);
        });
        
        // Add school's draft projects
        schoolDraftProjects.forEach(project => {
          if (!projectMap.has(project.id)) {
            projectMap.set(project.id, project);
          }
        });
        
        // Convert map back to array
        userProjects = Array.from(projectMap.values());
        
      } else if (user.role === 'student') {
        userProjects = await getProjectsByStudentId(user.id) as Project[];
      } else if (user.role === 'school') {
        // For school users, use their Firebase Auth UID to find their school document
        // Then fetch projects using that school's ID
        // The school_id should be the document ID of the school in the schools collection
        // For school users, their Firebase Auth UID should match a document in the schools collection
        userProjects = await getProjectsBySchoolId(user.id) as Project[];
      } else if (user.role === 'admin') {
        userProjects = await getProjects() as Project[];
      }

      // Fetch school names, student counts, and task counts for all projects
      const projectsWithSchoolNames = await Promise.all(
        userProjects.map(async (project) => {
          let schoolName = 'مؤسسة تعليمية غير معروفة';
          let schoolFound = false;
          let studentCount = 0;
          let totalTasks = 0;
          let completedTasks = 0;

          // Fetch student count for this project
          try {
            const projectStudentsQuery = query(
              collection(db, 'project_students'),
              where('project_id', '==', project.id)
            );
            const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
            studentCount = projectStudentsSnapshot.size;

            // Also use this query for school name inference if needed
            if (!schoolFound && !projectStudentsSnapshot.empty) {
              const firstStudentRecord = projectStudentsSnapshot.docs[0].data();
              const firstStudentId = firstStudentRecord.student_id;

              const studentDocRef = doc(db, 'users', firstStudentId);
              const studentDoc = await getDoc(studentDocRef);

              if (studentDoc.exists()) {
                const studentData = studentDoc.data();
                const studentSchoolId = studentData.school_id;

                if (studentSchoolId) {
                  const schoolDocRef = doc(db, 'users', studentSchoolId);
                  const schoolDoc = await getDoc(schoolDocRef);

                  if (schoolDoc.exists()) {
                    const schoolData = schoolDoc.data();
                    if (schoolData.role === 'school') {
                      schoolName = schoolData.name || 'مؤسسة تعليمية غير معروفة';
                      schoolFound = true;
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error fetching student count for project:', project.id, error);
          }

          // Fetch task counts for this project
          try {
            const projectTasksQuery = query(
              collection(db, 'project_tasks'),
              where('project_id', '==', project.id)
            );
            const projectTasksSnapshot = await getDocs(projectTasksQuery);
            totalTasks = projectTasksSnapshot.size;
            completedTasks = projectTasksSnapshot.docs.filter(doc => doc.data().status === 'completed').length;
          } catch (error) {
            console.error('Error fetching task counts for project:', project.id, error);
          }

          // First, try to get school from project's school_id
          if (!schoolFound && project.school_id) {
            try {
              const schoolDocRef = doc(db, 'users', project.school_id);
              const schoolDoc = await getDoc(schoolDocRef);

              if (schoolDoc.exists()) {
                const schoolData = schoolDoc.data();
                schoolName = schoolData.name || 'مؤسسة تعليمية غير معروفة';
                schoolFound = true;
              }
            } catch (error) {
              console.error('Error fetching school name for project:', project.id, error);
            }
          }

          return {
            ...project,
            school_name: schoolName,
            studentCount,
            totalTasks,
            completedTasks
          };
        })
      );

      setProjects(projectsWithSchoolNames);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل المشاريع');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Partial<Project>) => {
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

    try {
      // For school users, use their Firebase UID as the school_id
      const schoolId = user.role === 'school' ? user.id : user.school_id;

      // Ensure progress starts at 0
      const newProject = await createFirebaseProject({
        ...projectData,
        teacher_id: user.role === 'teacher' ? user.id : (projectData.teacher_id || null), // Preserve teacher_id from projectData if provided
        school_id: schoolId,
        progress: 0 // Set initial progress to 0
      });

      // Add students to the project if provided
      if (projectData.selectedStudentIds && projectData.selectedStudentIds.length > 0) {
        for (let i = 0; i < projectData.selectedStudentIds.length; i++) {
          const studentId = projectData.selectedStudentIds[i];
          await addStudentToProject({
            project_id: newProject.id,
            student_id: studentId,
            role: i === 0 ? 'leader' : 'member'
          });
        }

        // Send email notifications to team members and supervisor
        try {
          const studentRecipients = await getUsersByIds(projectData.selectedStudentIds);

          const teamMembers = studentRecipients.map((recipient, index) => ({
            name: recipient.name,
            email: recipient.email,
            role: index === 0 ? 'leader' : 'member'
          }));

          const teacherId = user.role === 'teacher' ? user.id : projectData.teacher_id;
          let supervisorInfo = { name: user.name || 'المشرف', email: user.email || '' };

          if (teacherId && teacherId !== user.id) {
            const teacherRef = doc(db, 'users', teacherId);
            const teacherDoc = await getDoc(teacherRef);
            if (teacherDoc.exists()) {
              const teacherData = teacherDoc.data();
              supervisorInfo = {
                name: teacherData.name || 'المشرف',
                email: teacherData.email || ''
              };
            }
          }

          if (supervisorInfo.email) {
            const categoryNames: Record<string, string> = {
              stem: 'العلوم والتكنولوجيا والهندسة والرياضيات',
              entrepreneurship: 'ريادة الأعمال',
              volunteer: 'العمل التطوعي',
              ethics: 'الأخلاقيات والقيم'
            };

            const difficultyNames: Record<string, string> = {
              beginner: 'مبتدئ',
              intermediate: 'متوسط',
              advanced: 'متقدم'
            };

            await sendProjectCreatedNotification({
              projectId: newProject.id,
              projectTitle: projectData.title || 'مشروع جديد',
              projectDescription: projectData.description || '',
              category: projectData.category || '',
              difficulty: projectData.difficulty || '',
              dueDate: projectData.due_date
                ? new Date(projectData.due_date).toLocaleDateString('ar-SA')
                : undefined,
              teacherName: supervisorInfo.name,
              teamMembers,
              supervisor: supervisorInfo
            });

            console.log('Project creation email notifications sent successfully');
          }
        } catch (emailError) {
          console.error('Error sending project creation email notifications:', emailError);
        }
      }

      await fetchProjects();
      return newProject;
    } catch (err) {
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      // Get the current project to check its status
      const projectRef = doc(db, 'projects', id);
      const projectDoc = await getDoc(projectRef);
      const currentProject = projectDoc.exists() ? projectDoc.data() : null;

      // If a teacher is changing the project status to 'active', assign them as the teacher
      if (user?.role === 'teacher' && updates.status === 'active') {
        updates.teacher_id = user.id;
      }

      await updateFirebaseProject(id, updates);

      // Award points to students when project is activated
      if (currentProject && currentProject.status !== 'active' && updates.status === 'active') {
        try {
          const projectStudents = await getProjectStudents(id);
          for (const student of projectStudents) {
            await awardProjectActivationPoints(student.student_id, id);
          }
        } catch (error) {
          console.error('Error awarding activation points:', error);
        }
      }

      // Sync student points if progress changed
      if (updates.progress !== undefined && currentProject && updates.progress !== currentProject.progress) {
        try {
          await syncAllProjectStudents(id);
        } catch (error) {
          console.error('Error syncing student points after progress update:', error);
        }
      }

      // Update students if provided
      if (updates.selectedStudentIds) {
        // Get current students
        const currentStudents = await getProjectStudents(id);

        // Remove students not in the new list
        for (const student of currentStudents) {
          if (!updates.selectedStudentIds.includes(student.student_id)) {
            await removeStudentFromProject(id, student.student_id);
          }
        }

        // Add new students
        for (let i = 0; i < updates.selectedStudentIds.length; i++) {
          const studentId = updates.selectedStudentIds[i];
          const existingStudent = currentStudents.find(s => s.student_id === studentId);

          if (!existingStudent) {
            await addStudentToProject({
              project_id: id,
              student_id: studentId,
              role: i === 0 ? 'leader' : 'member'
            });
          }
        }
      }

      await fetchProjects();
    } catch (err) {
      throw err;
    }
  };

  const archiveProject = async (id: string) => {
    try {
      await updateFirebaseProject(id, { status: 'archived' });
      await fetchProjects();
    } catch (err) {
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await deleteFirebaseProject(id);
      await fetchProjects();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
  };
};