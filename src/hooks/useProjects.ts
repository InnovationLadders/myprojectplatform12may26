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
      console.log('No user found, skipping project fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching projects for user:', {
        id: user.id,
        role: user.role,
        school_id: user.school_id
      });
      
      let userProjects: Project[] = [];

      // Simple logic based on user role
      if (user.role === 'teacher') {
        console.log('Fetching projects for teacher with ID:', user.id);
        
        // First, get projects where the teacher is assigned
        const teacherProjects = await getProjectsByTeacherId(user.id) as Project[];
        console.log('Teacher assigned projects fetched:', teacherProjects.length);
        
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
        
        console.log('School draft projects fetched:', schoolDraftProjects.length);
        
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
        console.log('Combined unique projects:', userProjects.length);
        
      } else if (user.role === 'student') {
        console.log('Fetching projects for student with ID:', user.id);
        userProjects = await getProjectsByStudentId(user.id) as Project[];
        console.log('Student projects fetched:', userProjects.length);
      } else if (user.role === 'school') {
        // For school users, use their Firebase Auth UID to find their school document
        // Then fetch projects using that school's ID
        console.log('Fetching projects for school user with Firebase UID:', user.id);
        
        // The school_id should be the document ID of the school in the schools collection
        // For school users, their Firebase Auth UID should match a document in the schools collection
        userProjects = await getProjectsBySchoolId(user.id) as Project[];
        console.log('School projects fetched:', userProjects.length);
      } else if (user.role === 'admin') {
        console.log('Fetching all projects for admin user');
        userProjects = await getProjects() as Project[];
        console.log('All projects fetched:', userProjects.length);
      }

      console.log('Raw projects data:', userProjects);

      // Fetch school names for all projects
      const projectsWithSchoolNames = await Promise.all(
        userProjects.map(async (project) => {
          console.log('Processing project:', project.id, 'with school_id:', project.school_id);
          
          let schoolName = 'مدرسة غير معروفة';
          let schoolFound = false;
          
          // First, try to get school from project's school_id
          if (project.school_id) {
            try {
              console.log('Fetching school for project:', project.id, 'school_id:', project.school_id);
              const schoolDocRef = doc(db, 'users', project.school_id);
              const schoolDoc = await getDoc(schoolDocRef);
              console.log('School document exists:', schoolDoc.exists());
              
              if (schoolDoc.exists()) {
                const schoolData = schoolDoc.data();
                console.log('School data:', schoolData);
                schoolName = schoolData.name || 'مدرسة غير معروفة';
                console.log('Assigned school_name:', schoolName);
                schoolFound = true;
              } else {
                console.log('School document does not exist for school_id:', project.school_id);
              }
            } catch (error) {
              console.error('Error fetching school name for project:', project.id, error);
            }
          }
          
          // If school not found from project's school_id, try to infer from first student
          if (!schoolFound) {
            console.log('School not found from project school_id, trying to infer from students for project:', project.id);
            try {
              // Get students for this project
              const projectStudentsQuery = query(
                collection(db, 'project_students'),
                where('project_id', '==', project.id)
              );
              const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
              
              if (!projectStudentsSnapshot.empty) {
                const firstStudentRecord = projectStudentsSnapshot.docs[0].data();
                const firstStudentId = firstStudentRecord.student_id;
                console.log('Found first student for project:', project.id, 'student_id:', firstStudentId);
                
                // Get the student's user document
                const studentDocRef = doc(db, 'users', firstStudentId);
                const studentDoc = await getDoc(studentDocRef);
                
                if (studentDoc.exists()) {
                  const studentData = studentDoc.data();
                  const studentSchoolId = studentData.school_id;
                  console.log('Student school_id:', studentSchoolId);
                  
                  if (studentSchoolId) {
                    // Get the school document using the student's school_id
                    const schoolDocRef = doc(db, 'users', studentSchoolId);
                    const schoolDoc = await getDoc(schoolDocRef);
                    
                    if (schoolDoc.exists()) {
                      const schoolData = schoolDoc.data();
                      if (schoolData.role === 'school') {
                        schoolName = schoolData.name || 'مدرسة غير معروفة';
                        console.log('Inferred school_name from student:', schoolName);
                        schoolFound = true;
                      } else {
                        console.log('Document found but role is not school:', schoolData.role);
                      }
                    } else {
                      console.log('School document does not exist for student school_id:', studentSchoolId);
                    }
                  } else {
                    console.log('Student has no school_id');
                  }
                } else {
                  console.log('Student document does not exist for student_id:', firstStudentId);
                }
              } else {
                console.log('No students found for project:', project.id);
              }
            } catch (error) {
              console.error('Error inferring school from students for project:', project.id, error);
            }
          }
          
          if (!schoolFound) {
            console.log('Returning project with default school_name for project:', project.id);
          }
          
          return {
            ...project,
            school_name: schoolName
          };
        })
      );
      
      console.log('Final projects with school names:', projectsWithSchoolNames.map(p => ({
        id: p.id,
        title: p.title,
        school_id: p.school_id,
        school_name: p.school_name
      })));
      
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
        teacher_id: user.role === 'teacher' ? user.id : null, // Only set teacher_id if user is a teacher
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
      }

      await fetchProjects();
      return newProject;
    } catch (err) {
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      // If a teacher is changing the project status to 'active', assign them as the teacher
      if (user?.role === 'teacher' && updates.status === 'active') {
        updates.teacher_id = user.id;
      }

      await updateFirebaseProject(id, updates);

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