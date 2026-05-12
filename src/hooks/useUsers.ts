import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, updateUser, updateUserStatus, deleteUser as deleteUserFromFirestore } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  school?: string;
  school_id?: string;
  grade?: string;
  subject?: string;
  experience?: string;
  joinedAt: string;
  lastActive: string;
  projectsCount?: number;
  completedProjects?: number;
  studentsCount?: number;
  teachersCount?: number;
  status: string;
  location?: string;
  department?: string;
  permissions?: string[];
  type?: string;
  establishedYear?: string;
  certifications?: string[];
  phone?: string;
  schoolCity?: string;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUsers = async () => {
    if (!user) {
      console.log('👤 No authenticated user found, skipping user fetch');
      setUsers([]);
      setLoading(false);
      return;
    }
    try {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Starting user fetch process:', {
        currentUserRole: user.role,
        currentUserId: user.id,
        currentUserSchoolId: user.school_id,
        timestamp: new Date().toISOString()
      });
      
      const usersRef = collection(db, 'users');
      console.log('📊 Executing school queries...');
      let q = query(usersRef, orderBy('created_at', 'desc'), limit(100));
      let userDocsToFetch: any[] = [];
      
      // Filter based on user role
      if (user.role === 'school' && user.id) {
        console.log('🏫 School user detected, fetching school profile and associated users...');
        const schoolSelfSnapshot = await getDocs(query(usersRef, where('id', '==', user.id)));
        const schoolAssociatedUsersSnapshot = await getDocs(query(usersRef, where('school_id', '==', user.id), limit(100)));
        console.log('📈 School query results:', {
          schoolSelfCount: schoolSelfSnapshot.size,
          associatedUsersCount: schoolAssociatedUsersSnapshot.size,
          totalDocs: schoolSelfSnapshot.size + schoolAssociatedUsersSnapshot.size
        });

        // Schools can see their teachers and students
        q = query(usersRef, where('school_id', '==', user.id), limit(100));
      } else if (user.role === 'teacher' && user.school_id) {
        console.log('👩‍🏫 Teacher user detected, fetching students from school:', user.school_id);
        // Teachers can see students in their school
        q = query(
          usersRef, 
          where('school_id', '==', user.school_id),
          where('role', '==', 'student'),
          limit(100)
        );
        
        const teacherAssociatedStudentsSnapshot = await getDocs(q);
        console.log('📈 Teacher query results:', {
          studentsCount: teacherAssociatedStudentsSnapshot.size,
          schoolId: user.school_id
        });
        
      } else if (user.role !== 'admin') {
        console.log('👨‍🎓 Student or other non-admin user detected, no users to fetch');
        // Students can't see other users
        setUsers([]);
        setLoading(false);
        return;
      }
      
      const snapshot = await getDocs(q);
      if (user.role === 'admin') {
        console.log('👑 Admin user detected, fetching ALL users...');
        try {
          const adminSnapshot = await getDocs(usersRef); // Simple query without orderBy to avoid index issues
          
          console.log('📈 Admin query results:', {
            totalUsersCount: adminSnapshot.size,
            isEmpty: adminSnapshot.empty
          });
          
          userDocsToFetch = adminSnapshot.docs;
        } catch (adminError) {
          console.error('❌ Error in admin query:', adminError);
          throw adminError;
        }
      } else {
        userDocsToFetch = snapshot.docs;
      }
      
      console.log('📋 Total user documents to process:', userDocsToFetch.length);
      
      if (userDocsToFetch.length === 0) {
        console.log('⚠️ No user documents found to process');
        setUsers([]);
        setLoading(false);
        return;
      }

      const usersData = await Promise.all(userDocsToFetch.map(async (userDoc) => {
        const userData = userDoc.data();
        
        // Get school name and city if school_id exists
        let schoolName = 'غير محدد';
        let schoolCity = 'غير محدد';
        
        if (userData.school_id) {
          console.log('🏫 Fetching school data for school_id:', userData.school_id);
          try {
            const schoolDoc = await getDoc(doc(db, 'users', userData.school_id));
            
            console.log('🏫 School document query result:', {
              schoolId: userData.school_id,
              exists: schoolDoc.exists(),
              isSchoolRole: schoolDoc.exists() ? schoolDoc.data()?.role === 'school' : false
            });
            
            if (schoolDoc.exists() && schoolDoc.data().role === 'school') {
              const schoolData = schoolDoc.data();
              schoolName = schoolData.name || 'مدرسة غير معروفة';
              schoolCity = schoolData.city || schoolData.location || 'غير محدد';
              
              console.log('🏫 School data extracted:', {
                schoolName,
                schoolCity,
                schoolId: userData.school_id
              });
            }
          } catch (err) {
            console.error('❌ Error fetching school data for user:', userDoc.id, err);
          }
        }
        
        // Get projects count
        let projectsCount = 0;
        let completedProjects = 0;
        
        if (userData.role === 'student') {
          console.log('👨‍🎓 Fetching project count for student:', userDoc.id);
          const projectStudentsRef = collection(db, 'project_students');
          const projectStudentsQuery = query(projectStudentsRef, where('student_id', '==', userDoc.id));
          const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
          
          const projectIds = projectStudentsSnapshot.docs.map(doc => doc.data().project_id);
          
          console.log('📊 Student project data:', {
            studentId: userDoc.id,
            projectStudentRecords: projectStudentsSnapshot.size,
            uniqueProjectIds: projectIds.length
          });
          
          if (projectIds.length > 0) {
            // Get projects for this student
            for (const projectId of projectIds) {
              try {
                const projectDoc = await getDoc(doc(db, 'projects', projectId));
                if (projectDoc.exists()) {
                  projectsCount++;
                  if (projectDoc.data().status === 'completed') {
                    completedProjects++;
                  }
                }
              } catch (err) {
                console.error('❌ Error fetching project for student:', projectId, err);
              }
            }
          }
        } else if (userData.role === 'teacher') {
          console.log('👩‍🏫 Fetching project count for teacher:', userDoc.id);
          const projectsRef = collection(db, 'projects');
          const projectsQuery = query(projectsRef, where('teacher_id', '==', userDoc.id));
          const projectsSnapshot = await getDocs(projectsQuery);
          
          projectsCount = projectsSnapshot.size;
          
          console.log('📊 Teacher project data:', {
            teacherId: userDoc.id,
            projectsCount: projectsSnapshot.size
          });
          
          // Get students count for teacher
          if (userData.school_id) {
            const studentsRef = collection(db, 'users');
            const studentsQuery = query(
              studentsRef, 
              where('role', '==', 'student'),
              where('school_id', '==', userData.school_id)
            );
            const studentsSnapshot = await getDocs(studentsQuery);
            userData.studentsCount = studentsSnapshot.size;
            
            console.log('📊 Teacher students count:', {
              teacherId: userDoc.id,
              schoolId: userData.school_id,
              studentsCount: studentsSnapshot.size
            });
          }
        } else if (userData.role === 'school') {
          console.log('🏫 Fetching counts for school:', userDoc.id);
          // Get teachers and students count for school
          const teachersQuery = query(
            collection(db, 'users'),
            where('role', '==', 'teacher'),
            where('school_id', '==', userDoc.id)
          );
          const studentsQuery = query(
            collection(db, 'users'),
            where('role', '==', 'student'),
            where('school_id', '==', userDoc.id)
          );
          
          const [teachersSnapshot, studentsSnapshot] = await Promise.all([
            getDocs(teachersQuery),
            getDocs(studentsQuery)
          ]);
          
          userData.teachersCount = teachersSnapshot.size;
          userData.studentsCount = studentsSnapshot.size;
          
          console.log('📊 School counts:', {
            schoolId: userDoc.id,
            teachersCount: teachersSnapshot.size,
            studentsCount: studentsSnapshot.size
          });
        }
        
        const processedUser = {
          id: userDoc.id,
          name: userData.name || '',
          email: userData.email || '',
          role: userData.role || 'student',
          avatar: userData.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
          school: schoolName,
          school_id: userData.school_id,
          schoolCity,
          grade: userData.grade,
          subject: userData.subject,
          experience: userData.experience_years ? `${userData.experience_years} سنوات` : undefined,
          joinedAt: userData.created_at ? new Date(userData.created_at.toDate()).toISOString() : new Date().toISOString(),
          lastActive: userData.last_active_at ? new Date(userData.last_active_at.toDate()).toISOString() : new Date().toISOString(),
          projectsCount,
          completedProjects,
          studentsCount: userData.studentsCount,
          teachersCount: userData.teachersCount,
          status: userData.status || 'active',
          location: userData.city || userData.location || 'غير محدد',
          department: userData.department,
          permissions: userData.permissions,
          type: userData.type,
          establishedYear: userData.established_year,
          certifications: userData.certifications,
          phone: userData.phone
        };
        
        console.log('✅ Processed user:', {
          id: processedUser.id,
          name: processedUser.name,
          role: processedUser.role,
          school: processedUser.school,
          schoolCity: processedUser.schoolCity,
          status: processedUser.status
        });
        
        return processedUser;
      }));
      
      console.log('📊 Final users data summary:', {
        totalProcessedUsers: usersData.length,
        usersByRole: {
          students: usersData.filter(u => u.role === 'student').length,
          teachers: usersData.filter(u => u.role === 'teacher').length,
          schools: usersData.filter(u => u.role === 'school').length,
          consultants: usersData.filter(u => u.role === 'consultant').length,
          admins: usersData.filter(u => u.role === 'admin').length
        },
        usersByStatus: {
          active: usersData.filter(u => u.status === 'active').length,
          pending: usersData.filter(u => u.status === 'pending').length,
          inactive: usersData.filter(u => u.status === 'inactive').length
        }
      });
      
      setUsers(usersData);
    } catch (err) {
      console.error('❌ Critical error in fetchUsers:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        currentUserRole: user?.role,
        currentUserId: user?.id,
        timestamp: new Date().toISOString()
      });
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
      console.log('🏁 User fetch process completed');
    }
    } catch (err) {
      console.error('❌ Critical error in fetchUsers:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
        currentUserRole: user?.role,
        currentUserId: user?.id,
        timestamp: new Date().toISOString()
      });
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
      console.log('🏁 User fetch process completed');
    }
  };

  const addUser = async (userData: any) => {
    console.log('🚀 Starting addUser process:', {
      userName: userData.name,
      userEmail: userData.email,
      userRole: userData.role,
      hasPassword: !!userData.password,
      timestamp: new Date().toISOString()
    });

    try {
      console.log('🔐 Creating Firebase Auth user...');
      // Create user account using Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const userId = userCredential.user.uid;
      console.log('✅ Firebase Auth user created successfully:', {
        userId: userId,
        email: userData.email
      });

      console.log('📋 Preparing user profile data for Firestore...');
      // Prepare user profile data
      const userProfile = {
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        bio: userData.bio || '',
        role: userData.role,
        status: userData.status || 'active',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        // Role-specific fields
        ...(userData.school_id && { school_id: userData.school_id }),
        ...(userData.grade && { grade: userData.grade }),
        ...(userData.subject && { subject: userData.subject }),
        ...(userData.schoolIdNumber && { schoolIdNumber: userData.schoolIdNumber }),
        ...(userData.specializations && { specializations: userData.specializations }),
        ...(userData.experience_years !== undefined && { experience_years: userData.experience_years }),
        ...(userData.hourly_rate !== undefined && { hourly_rate: userData.hourly_rate }),
        ...(userData.languages && { languages: userData.languages }),
        ...(userData.city && { city: userData.city }),
        ...(userData.location && { location: userData.location })
      };

      console.log('📤 Saving user profile to Firestore:', {
        userId: userId,
        profileData: {
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
          school_id: userProfile.school_id,
          status: userProfile.status
        }
      });

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', userId), userProfile);
      console.log('✅ User profile saved to Firestore successfully');

      console.log('🔄 Refreshing users list...');
      // Refresh users list
      await fetchUsers();
      console.log('✅ Users list refreshed successfully');

      return { success: true, userId };
    } catch (error) {
      console.error('Error adding user:', error);
      console.log('❌ Detailed error in addUser:', {
        error: error,
        errorCode: error.code,
        errorMessage: error.message,
        userData: {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          school_id: userData.school_id
        }
      });
      throw error;
    }
  };

  const editUser = async (userId: string, userData: any) => {
    try {
      // Prepare update data
      const updateData = {
        name: userData.name,
        phone: userData.phone || '',
        bio: userData.bio || '',
        role: userData.role,
        status: userData.status,
        updated_at: serverTimestamp(),
        // Role-specific fields
        ...(userData.school_id && { school_id: userData.school_id }),
        ...(userData.grade && { grade: userData.grade }),
        ...(userData.subject && { subject: userData.subject }),
        ...(userData.schoolIdNumber && { schoolIdNumber: userData.schoolIdNumber }),
        ...(userData.specializations && { specializations: userData.specializations }),
        ...(userData.experience_years !== undefined && { experience_years: userData.experience_years }),
        ...(userData.hourly_rate !== undefined && { hourly_rate: userData.hourly_rate }),
        ...(userData.languages && { languages: userData.languages }),
        ...(userData.city && { city: userData.city }),
        ...(userData.location && { location: userData.location })
      };

      await updateUser(userId, updateData);

      // If password is provided, update it (this would require additional Firebase Auth admin operations)
      if (userData.password) {
        // Note: Updating password requires Firebase Admin SDK or user re-authentication
        console.log('Password update requested but requires additional implementation');
      }

      // Refresh users list
      await fetchUsers();

      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const removeUser = async (userId: string) => {
    try {
      await deleteUserFromFirestore(userId);
      
      // Refresh users list
      await fetchUsers();

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const activateUser = async (userId: string) => {
    try {
      await updateUserStatus(userId, 'active');
      
      // Refresh users list
      await fetchUsers();

      return { success: true };
    } catch (error) {
      console.error('Error activating user:', error);
      throw error;
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      await updateUserStatus(userId, 'inactive');
      
      // Refresh users list
      await fetchUsers();

      return { success: true };
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      console.log('🔄 useUsers effect triggered, user available:', {
        userId: user.id,
        userRole: user.role,
        userEmail: user.email
      });
      fetchUsers();
    } else {
      console.log('⏳ useUsers effect triggered but no user available yet');
    }
  }, [user]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    editUser,
    removeUser,
    activateUser,
    deactivateUser
  };
};