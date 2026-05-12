import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableNetwork, 
  disableNetwork, 
  collection, 
  getDocs, 
  getDoc,
  doc,
  query, 
  where, 
  addDoc, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment as firestoreIncrement,
  arrayUnion,
  orderBy,
  limit,
  Timestamp,
  documentId
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

// Use environment variables if available, otherwise use these hardcoded values as fallback
// This ensures the app works even if environment variables aren't properly loaded
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCKlDIhgAIPif3q2J4TAyVSBpdrUQ2P1G8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "my-project-plateform-react.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "my-project-plateform-react",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "my-project-plateform-react.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1092300975970",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1092300975970:web:76e0d3717dbf899c7b463b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-S28HDNJNMH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Log Firebase configuration for debugging
console.log('🔥 Firebase Configuration:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  environment: import.meta.env.DEV ? 'development' : 'production',
  timestamp: new Date().toISOString()
});

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const increment = firestoreIncrement; // Export increment with a simpler name

// Export the doc function with consistent alias
export const firestoreDoc = doc;

// Export addDoc for use in other modules
export { addDoc };
// Connect to emulators if in development mode and emulators are enabled
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

if (useEmulators && import.meta.env.DEV) {
  try {
    console.log('🔧 Attempting to connect to Firebase emulators...');
    // Connect to Auth emulator
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('✅ Connected to Auth emulator on localhost:9099');
    }
    
    // Connect to Firestore emulator
    if (!db._delegate._databaseId.projectId.includes('demo-')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('✅ Connected to Firestore emulator on localhost:8080');
    }
    
    // Connect to Storage emulator
    if (!storage._delegate._host.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('✅ Connected to Storage emulator on localhost:9199');
    }
    
    console.log('🎯 All Firebase emulators connected successfully');
  } catch (error) {
    console.warn('⚠️ Failed to connect to emulators:', error);
  }
} else {
  console.log('🌐 Using production Firebase services for project:', firebaseConfig.projectId);
}

// Handle network connectivity for Firestore with better error handling
let isOnline = navigator.onLine;

const handleOnline = async () => {
  if (!isOnline) {
    isOnline = true;
    try {
      await enableNetwork(db);
      console.log('Firestore network enabled - back online');
    } catch (error) {
      console.warn('Failed to enable Firestore network:', error);
    }
  }
};

const handleOffline = async () => {
  if (isOnline) {
    isOnline = false;
    try {
      await disableNetwork(db);
      console.log('Firestore network disabled - operating offline');
    } catch (error) {
      console.warn('Failed to disable Firestore network:', error);
    }
  }
};

// Listen for network changes
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

// Initialize with current network state
if (!navigator.onLine) {
  handleOffline();
}

// Enhanced error handling wrapper for Firestore operations
const withErrorHandling = async <T>(operation: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    console.warn('Firestore operation failed:', error.message);
    
    // If it's a network error and we're not using emulators, provide helpful feedback
    if (error.code === 'unavailable' && !useEmulators) {
      console.warn('Firestore unavailable - check your internet connection or Firebase configuration');
    }
    
    return fallback;
  }
};

// Get schools function
export const getSchools = async () => {
  return withErrorHandling(async () => {
    try {
      console.log('🏫 Fetching schools from Firestore...');
      
      // Query users collection for school accounts
      const schoolsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'school')
      );
    
      const schoolsSnapshot = await getDocs(schoolsQuery);
      console.log(`📊 Found ${schoolsSnapshot.size} school documents in Firestore`);
      
      // Log raw data for each school document
      schoolsSnapshot.docs.forEach((doc, index) => {
        console.log(`🏫 School document [${index}]:`, {
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          role: doc.data().role
        });
      });
    
      // Filter active schools in the client side
      const activeSchools = schoolsSnapshot.docs
        .filter(doc => doc.data().status === 'active' || !doc.data().status)
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'مدرسة بدون اسم',
            status: data.status || 'active',
            ...data
          };
      });
      
      console.log(`✅ Filtered to ${activeSchools.length} active schools`);
      return activeSchools;
    } catch (error) {
      console.error('❌ Error in getSchools:', error);
      throw error;
    }
  }, []);
};

// Get all teachers
export const getAllTeachers = async () => {
  return withErrorHandling(async () => {
    const teachersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'teacher'),
      where('status', '==', 'active')
    );
    
    const teachersSnapshot = await getDocs(teachersQuery);
    
    return teachersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'معلم بدون اسم',
      subject: doc.data().subject,
      school_id: doc.data().school_id,
      ...doc.data()
    }));
  }, []);
};

// Get teachers by school ID
export const getTeachersBySchoolId = async (schoolId: string) => {
  return withErrorHandling(async () => {
    const teachersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'teacher'),
      where('school_id', '==', schoolId),
      where('status', '==', 'active')
    );
    
    const teachersSnapshot = await getDocs(teachersQuery);
    
    return teachersSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'معلم بدون اسم',
      subject: doc.data().subject,
      ...doc.data()
    }));
  }, []);
};

// Get school projects count by email
export const getSchoolProjectsCountByEmail = async (email: string) => {
  return withErrorHandling(async () => {
    // First, find the school by email
    const schoolQuery = query(
      collection(db, 'users'),
      where('role', '==', 'school'),
      where('email', '==', email)
    );
    const schoolSnapshot = await getDocs(schoolQuery);
    
    if (schoolSnapshot.empty) {
      return {
        found: false,
        message: 'لم يتم العثور على مدرسة بهذا البريد الإلكتروني',
        count: 0
      };
    }
    
    const schoolDoc = schoolSnapshot.docs[0];
    const schoolId = schoolDoc.id;
    const schoolData = schoolDoc.data();
    
    // Then, get the count of projects for this school
    const projectsQuery = query(
      collection(db, 'projects'),
      where('school_id', '==', schoolId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    
    return {
      found: true,
      school: {
        id: schoolId,
        name: schoolData.name || 'مدرسة',
        email: schoolData.email
      },
      count: projectsSnapshot.size,
      projects: projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    };
  }, {
    found: false,
    message: 'حدث خطأ أثناء البحث عن المدرسة',
    count: 0
  });
};

// Get consultants function
export const getConsultants = async () => {
  return withErrorHandling(async () => {
    const consultantsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'consultant')
    );
    const consultantsSnapshot = await getDocs(consultantsQuery);
    
    console.log('Raw consultants data from Firestore:', consultantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
    
    const consultants = consultantsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Create consultant object with proper field mapping
      const consultant = {
        id: doc.id,
        name: data.name || 'مستشار',
        title: data.subject || 'مستشار',
        specialties: data.specializations || [],
        rating: data.rating || 5.0,
        reviews: data.reviews_count || 0,
        experience: data.experience_years ? `${data.experience_years} سنوات` : '5+ سنوات',
        avatar: data.avatar_url || "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
        hourlyRate: data.hourly_rate || 150,
        availability: 'متاح',
        languages: data.languages || ['العربية'],
        location: data.location || 'الرياض، السعودية'
      };
      
      console.log('Processed consultant object:', consultant);
      return consultant;
    });
    
    return consultants;
  }, []);
};

// Project functions
export const getProjects = async () => {
  return withErrorHandling(async () => {
    const projectsSnapshot = await getDocs(collection(db, 'projects'), { source: 'server' });
    return projectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        due_date: data.due_date ? data.due_date.toDate().toISOString() : null,
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString()
      };
    });
  }, []);
};

export const getProjectById = async (id: string) => {
  return withErrorHandling(async () => {
    const projectDoc = await getDoc(firestoreDoc(db, 'projects', id), { source: 'server' });
    if (projectDoc.exists()) {
      const data = projectDoc.data();
      return {
        id: projectDoc.id,
        ...data,
        due_date: data.due_date ? data.due_date.toDate().toISOString() : null,
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString()
      };
    }
    return null;
  }, null);
};

export const getProjectsByTeacherId = async (teacherId: string) => {
  return withErrorHandling(async () => {
    console.log('Fetching projects for teacher ID:', teacherId);
    
    // Only get projects where the teacher is explicitly assigned as teacher_id
    const teacherProjectsQuery = query(
      collection(db, 'projects'),
      where('teacher_id', '==', teacherId)
    );
    
    const teacherProjectsSnapshot = await getDocs(teacherProjectsQuery);
    console.log('Found', teacherProjectsSnapshot.size, 'projects for teacher');
    
    return teacherProjectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        due_date: data.due_date ? data.due_date.toDate().toISOString() : null,
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString()
      };
    });
  }, []);
};

export const getProjectsBySchoolId = async (schoolId: string) => {
  return withErrorHandling(async () => {
    const projectsQuery = query(
      collection(db, 'projects'),
      where('school_id', '==', schoolId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    return projectsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        due_date: data.due_date ? data.due_date.toDate().toISOString() : null,
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString()
      };
    });
  }, []);
};

export const getProjectsByStudentId = async (studentId: string) => {
  return withErrorHandling(async () => {
    // First get project_students where student_id matches
    const projectStudentsQuery = query(
      collection(db, 'project_students'),
      where('student_id', '==', studentId)
    );
    const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
    
    // Get project IDs
    const projectIds = projectStudentsSnapshot.docs.map(doc => doc.data().project_id);
    
    if (projectIds.length === 0) {
      return [];
    }
    
    // Get projects for these IDs
    const projects = [];
    for (const projectId of projectIds) {
      const projectDoc = await getDoc(firestoreDoc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        const data = projectDoc.data();
        projects.push({
          id: projectDoc.id,
          ...data,
          due_date: data.due_date ? data.due_date.toDate().toISOString() : null,
          created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
          updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString()
        });
      }
    }
    
    return projects;
  }, []);
};

// Enhanced function to get all project evaluations
export const getAllProjectEvaluations = async () => {
  return withErrorHandling(async () => {
    const evaluationsRef = collection(db, 'project_evaluations');
    const evaluationsSnapshot = await getDocs(evaluationsRef);
    
    const evaluations = evaluationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        projectId: data.projectId,
        criteria: data.criteria || [],
        feedback: data.feedback || '',
        totalScore: data.totalScore || 0,
        percentage: data.percentage || 0,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        createdBy: data.createdBy || ''
      };
    });
    
    return evaluations;
  }, []);
};
export const createProject = async (projectData: any) => {
  try {
    // Convert due_date string to Timestamp if provided
    const dueDateTimestamp = projectData.dueDate || projectData.due_date 
      ? Timestamp.fromDate(new Date(projectData.dueDate || projectData.due_date))
      : null;
    
    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      due_date: dueDateTimestamp,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      status: projectData.status || 'active', 
      progress: projectData.progress || 0,
      resources: [] // Initialize resources as an empty array
    });
    
    return {
      id: docRef.id,
      ...projectData,
      due_date: dueDateTimestamp ? dueDateTimestamp.toDate().toISOString() : null
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (id: string, updates: any) => {
  try {
    const projectRef = firestoreDoc(db, 'projects', id);
    
    // Create a copy of updates to modify
    const updatesToApply = { ...updates };
    
    // Convert due_date string to Timestamp if provided
    if (updates.dueDate || updates.due_date) {
      updatesToApply.due_date = Timestamp.fromDate(new Date(updates.dueDate || updates.due_date));
      // Remove the dueDate field if it exists to avoid duplication
      if ('dueDate' in updatesToApply) {
        delete updatesToApply.dueDate;
      }
    }
    
    // Add updated_at timestamp
    updatesToApply.updated_at = serverTimestamp();
    
    await updateDoc(projectRef, updatesToApply);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

/**
 * Uploads a file to Firebase Storage and returns its download URL and type.
 * @param file - The File object to upload.
 * @param path - The storage path (e.g., `project_resources/${projectId}`).
 * @param onProgress - Optional callback for upload progress (0-100).
 * @returns Promise resolving to an object containing `downloadURL` and `fileType`.
 */
export const uploadFileToProjectStorage = async (
  file: File,
  projectId: string,
  onProgress?: (progress: number) => void
) => {
  const storageRef = ref(storage, `project_resources/${projectId}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise<{ downloadURL: string; fileType: 'image' | 'video' | 'file' }>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        let fileType: 'image' | 'video' | 'file' = 'file';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('video/')) fileType = 'video';
        resolve({ downloadURL, fileType });
      }
    );
  });
};

// Enhanced function to get all users with role filtering
export const getAllUsers = async (roleFilter?: string) => {
  return withErrorHandling(async () => {
    const usersRef = collection(db, 'users');
    let usersQuery;
    
    if (roleFilter) {
      usersQuery = query(usersRef, where('role', '==', roleFilter));
    } else {
      usersQuery = usersRef;
    }
    
    const usersSnapshot = await getDocs(usersQuery);
    
    const users = usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'مستخدم غير معروف',
        email: data.email || '',
        role: data.role || 'student',
        school_id: data.school_id,
        grade: data.grade,
        subject: data.subject,
        status: data.status || 'active',
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString()
      };
    });
    
    return users;
  }, []);
};

// Enhanced function to get all project students relationships
export const getAllProjectStudents = async () => {
  return withErrorHandling(async () => {
    const projectStudentsRef = collection(db, 'project_students');
    const projectStudentsSnapshot = await getDocs(projectStudentsRef);
    
    const projectStudents = projectStudentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        project_id: data.project_id,
        student_id: data.student_id,
        role: data.role || 'member',
        status: data.status || 'active',
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString()
      };
    });
    
    return projectStudents;
  }, []);
};
/**
 * Add a resource to a project
 * @param projectId - The ID of the project
 * @param resourceData - The resource data to add
 * @returns Promise that resolves when the resource is added
 */
export const addProjectResource = async (projectId: string, resourceData: any) => {
  try {
    const projectRef = firestoreDoc(db, 'projects', projectId);
    
    // Check if the project exists
    const projectDoc = await getDoc(projectRef);
    if (!projectDoc.exists()) { 
      throw new Error('Project not found');
    }
    
    // Update the project with the new resource
    await updateDoc(projectRef, {
      resources: arrayUnion(resourceData),
      updated_at: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error adding project resource:', error);
    throw error;
  }
}

export const deleteProject = async (id: string) => {
  try {
    await deleteDoc(firestoreDoc(db, 'projects', id));
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Project students functions
export const getProjectStudents = async (projectId: string) => {
  return withErrorHandling(async () => {
    console.log('Fetching students for project:', projectId);
    const projectStudentsQuery = query(
      collection(db, 'project_students'),
      where('project_id', '==', projectId)
    );
    const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
    
    console.log('projectStudentsSnapshot.empty:', projectStudentsSnapshot.empty);
    console.log('Number of project_students documents found:', projectStudentsSnapshot.docs.length);
    
    const studentIds: string[] = [];
    const projectStudentRecords: any[] = [];

    projectStudentsSnapshot.forEach(docSnapshot => {
      const studentData = docSnapshot.data();
      studentIds.push(studentData.student_id);
      projectStudentRecords.push({
        id: docSnapshot.id,
        ...studentData,
        student: null // Placeholder for student details
      });
    });

    if (studentIds.length === 0) {
      return [];
    }

    // Fetch all unique student user documents in batches (Firestore 'in' query limit is 10)
    const uniqueStudentIds = [...new Set(studentIds)];
    const userDetailsMap = new Map<string, any>();

    for (let i = 0; i < uniqueStudentIds.length; i += 10) {
      const chunk = uniqueStudentIds.slice(i, i + 10);
      const usersQuery = query(
        collection(db, 'users'),
        where(documentId(), 'in', chunk) // Use documentId() for fetching by ID
      );
      const usersSnapshot = await getDocs(usersQuery);
      usersSnapshot.forEach(userDoc => {
        userDetailsMap.set(userDoc.id, userDoc.data());
      });
    }

    // Populate student details into the projectStudentRecords
    const studentsWithDetails = projectStudentRecords.map(record => ({
      ...record,
      student: userDetailsMap.get(record.student_id) || null
    }));

    console.log('Final students array from getProjectStudents (optimized):', studentsWithDetails);
    return studentsWithDetails;
  }, []);
};

export const addStudentToProject = async ({ project_id, student_id, role, created_at, status }: {
  project_id: string;
  student_id: string;
  role: string;
  created_at?: string;
  status?: string;
}) => {
  try {
    const docRef = await addDoc(collection(db, 'project_students'), {
      project_id,
      student_id,
      role,
      created_at: created_at ? Timestamp.fromDate(new Date(created_at)) : serverTimestamp(),
      status: status || 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding student to project:', error);
    throw error;
  }
};

export const removeStudentFromProject = async (projectId: string, studentId: string) => {
  try {
    const projectStudentsQuery = query(
      collection(db, 'project_students'),
      where('project_id', '==', projectId),
      where('student_id', '==', studentId)
    );
    const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
    
    for (const docSnapshot of projectStudentsSnapshot.docs) {
      await deleteDoc(docSnapshot.ref);
    }
  } catch (error) {
    console.error('Error removing student from project:', error);
    throw error;
  }
};

// Project tasks functions
export const getProjectTasks = async (projectId: string) => {
  try {
    console.log('Fetching tasks for project:', projectId);
    
    // Simple query without orderBy to avoid index issues
    const tasksQuery = query(
      collection(db, 'project_tasks'),
      where('project_id', '==', projectId)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    console.log('Tasks snapshot size:', tasksSnapshot.size);
    
    if (tasksSnapshot.empty) {
      console.log('No tasks found for project:', projectId);
      return [];
    }
    
    // Map the documents to task objects
    const tasks = tasksSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Raw task data:', { id: doc.id, ...data });
      
      // Convert Firestore timestamps to ISO strings
      return {
        id: doc.id,
        title: data.title || 'Untitled Task',
        description: data.description || '',
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        due_date: data.due_date && data.due_date.toDate ? data.due_date.toDate().toISOString() : null,
        assigned_to: data.assigned_to || null,
        progress: data.progress || 0,
        project_id: data.project_id,
        created_at: data.created_at && data.created_at.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at && data.updated_at.toDate ? data.updated_at.toDate().toISOString() : new Date().toISOString(),
        created_by: data.created_by || null
      };
    });
    
    // Sort tasks by created_at in memory (newest first)
    tasks.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    
    console.log('Processed tasks:', tasks);
    return tasks;
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return [];
  }
}

// Original function kept as backup
export const _getProjectTasks = async (projectId: string) => {
  return withErrorHandling(async () => {
    console.log('Fetching tasks for project:', projectId);
    const tasksQuery = query(
      collection(db, 'project_tasks'),
      where('project_id', '==', projectId),
      orderBy('created_at', 'desc')
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    console.log('Tasks snapshot size:', tasksSnapshot.size);
    
    return tasksSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Task data:', { id: doc.id, ...data });
      return {
        id: doc.id,
        ...data,
        due_date: data.due_date ? data.due_date.toDate().toISOString() : null,
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString()
      };
    });
  }, []);
};

export const createProjectTask = async (taskData: any) => {
  try {
    console.log('Creating project task with data:', taskData);
    // Convert due_date string to Timestamp if provided
    const dueDateTimestamp = taskData.due_date 
      ? Timestamp.fromDate(new Date(taskData.due_date))
      : null;
    
    const docRef = await addDoc(collection(db, 'project_tasks'), {
      ...taskData,
      due_date: dueDateTimestamp,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    console.log('Task created with ID:', docRef.id);
    return {
      id: docRef.id,
      ...taskData,
      due_date: dueDateTimestamp ? dueDateTimestamp.toDate().toISOString() : null
    };
  } catch (error) {
    console.error('Error creating project task:', error);
    throw error;
  }
};

// Project ideas functions - Modified to avoid composite index requirement
export const getProjectIdeas = async () => {
  return withErrorHandling(async () => {
    console.log("Getting approved project ideas from Firestore...");
    // Get all approved project ideas without ordering to avoid composite index requirement
    const ideasQuery = query(
      collection(db, 'project_ideas'),
      where('status', '==', 'approved')
    );
    const ideasSnapshot = await getDocs(ideasQuery);
    console.log("Approved project ideas snapshot size:", ideasSnapshot.size);
    
    if (ideasSnapshot.empty) {
      console.log("No approved project ideas found, returning empty array");
      return [];
    }
    
    // Get the data and sort in memory by created_at
    const ideas = ideasSnapshot.docs.map(doc => ({
      id: doc.id,
      views: 0,
      downloads: 0,
      rating: 4.5,
      ...doc.data()
    }));
    
    // Sort by created_at in descending order (newest first)
    return ideas.sort((a, b) => {
      const aDate = a.created_at?.toDate?.() || new Date(a.created_at || 0);
      const bDate = b.created_at?.toDate?.() || new Date(b.created_at || 0);
      return bDate.getTime() - aDate.getTime();
    });
  }, []);
};

// Get all project ideas (for admin) - Modified to avoid composite index requirement
export const getAllProjectIdeas = async () => {
  return withErrorHandling(async () => {
    console.log("Getting ALL project ideas (admin mode)...");
    // Get all project ideas without ordering to avoid composite index requirement
    const ideasQuery = query(collection(db, 'project_ideas'));
    const ideasSnapshot = await getDocs(ideasQuery);
    console.log("All project ideas snapshot size (admin view):", ideasSnapshot.size);
    
    if (ideasSnapshot.empty) {
      console.log("No project ideas found (admin view), returning empty array");
      return [];
    }
    
    // Get the data and sort in memory by created_at
    const ideas = ideasSnapshot.docs.map(doc => ({
      id: doc.id,
      views: 0,
      downloads: 0,
      rating: 4.5,
      ...doc.data()
    }));
    
    // Sort by created_at in descending order (newest first)
    return ideas.sort((a, b) => {
      const aDate = a.created_at?.toDate?.() || new Date(a.created_at || 0);
      const bDate = b.created_at?.toDate?.() || new Date(b.created_at || 0);
      return bDate.getTime() - aDate.getTime();
    });
  }, []);
};

export const createProjectIdea = async (ideaData: any) => {
  try {
    // Prepare the data to be saved
    const newIdea = {
      ...ideaData,
      views: ideaData.views || 0,
      downloads: ideaData.downloads || 0,
      rating: ideaData.rating || 4.5,
      status: ideaData.status || 'pending', // Default to pending
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };
    
    // Add the document to Firestore
    const docRef = await addDoc(collection(db, 'project_ideas'), newIdea);
    
    // Return the created idea with its ID
    return {
      id: docRef.id,
      ...newIdea,
      created_at: new Date().toISOString(), // Convert for immediate use in UI
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating project idea:', error);
    throw error;
  }
};

export const updateProjectIdea = async (id: string, updates: any) => {
  try {
    const ideaRef = firestoreDoc(db, 'project_ideas', id);
    
    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: serverTimestamp()
    };
    
    // Update the document in Firestore
    await updateDoc(ideaRef, updateData);
    
    return true;
  } catch (error) {
    console.error('Error updating project idea:', error);
    throw error;
  }
};

export const deleteProjectIdea = async (id: string) => {
  try {
    await deleteDoc(firestoreDoc(db, 'project_ideas', id));
    return true;
  } catch (error) {
    console.error('Error deleting project idea:', error);
    throw error;
  }
};

export const incrementProjectIdeaViews = async (id: string) => {
  try {
    const ideaRef = firestoreDoc(db, 'project_ideas', id); 
    await updateDoc(ideaRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing project idea views:', error);
    throw error;
  }
};

export const incrementProjectIdeaDownloads = async (id: string) => {
  try {
    const ideaRef = firestoreDoc(db, 'project_ideas', id); 
    await updateDoc(ideaRef, {
      downloads: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing project idea downloads:', error);
    throw error;
  }
};

export const getProjectIdeaById = async (id: string) => {
  try {
    const ideaRef = firestoreDoc(db, 'project_ideas', id);
    const ideaDoc = await getDoc(ideaRef);
    
    if (ideaDoc.exists()) {
      const data = ideaDoc.data();
      return {
        id: ideaDoc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        duration: data.duration,
        subject: data.subject,
        image: data.image,
        objectives: data.objectives || [],
        materials: data.materials || [],
        steps: data.steps || [],
        tags: data.tags || [],
        views: data.views || 0,
        downloads: data.downloads || 0,
        rating: data.rating || 4.5,
        status: data.status || 'approved',
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching project idea by ID:', error);
    throw error;
  }
};

/**
 * Deletes duplicate project ideas from the Firestore database
 * @returns {Promise<number>} The number of deleted duplicates
 */
export const deleteDuplicateProjectIdeas = async (): Promise<number> => {
  try {
    console.log('Starting cleanup of duplicate project ideas...');
    
    // Get all project ideas
    const ideasRef = collection(db, 'project_ideas');
    const snapshot = await getDocs(ideasRef);
    
    if (snapshot.empty) {
      console.log('No project ideas found to clean up');
      return 0;
    }
    
    // Map to track unique ideas
    const uniqueIdeas = new Map<string, string>(); // Map: compositeKey -> docId
    const duplicatesToDelete: string[] = [];
    
    // Process each document
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Create a composite key using title and description
      const compositeKey = `${data.title}-${data.description}`;
      
      if (uniqueIdeas.has(compositeKey)) {
        // This is a duplicate, mark for deletion
        duplicatesToDelete.push(doc.id);
      } else {
        // This is the first occurrence, add to unique ideas
        uniqueIdeas.set(compositeKey, doc.id);
      }
    });
    
    console.log(`Found ${duplicatesToDelete.length} duplicate project ideas to delete`);
    
    // Delete all duplicates
    let deletedCount = 0;
    for (const docId of duplicatesToDelete) {
      await deleteDoc(firestoreDoc(db, 'project_ideas', docId));
      deletedCount++;
    }
    
    console.log(`Successfully deleted ${deletedCount} duplicate project ideas`);
    return deletedCount;
  } catch (error) {
    console.error('Error deleting duplicate project ideas:', error);
    throw error;
  }
};

/**
 * Deletes duplicate learning resources from the Firestore database
 * @returns {Promise<number>} The number of deleted duplicates
 */
export const deleteDuplicateLearningResources = async (): Promise<number> => {
  try {
    console.log('Starting cleanup of duplicate learning resources...');
    
    // Get all learning resources
    const resourcesRef = collection(db, 'learning_resources');
    const snapshot = await getDocs(resourcesRef);
    
    if (snapshot.empty) {
      console.log('No learning resources found to clean up');
      return 0;
    }
    
    // Map to track unique resources
    const uniqueResources = new Map<string, string>(); // Map: compositeKey -> docId
    const duplicatesToDelete: string[] = [];
    
    // Process each document
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Create a composite key using title and type
      const compositeKey = `${data.title}-${data.type}`;
      
      if (uniqueResources.has(compositeKey)) {
        // This is a duplicate, mark for deletion
        duplicatesToDelete.push(doc.id);
      } else {
        // This is the first occurrence, add to unique resources
        uniqueResources.set(compositeKey, doc.id);
      }
    });
    
    console.log(`Found ${duplicatesToDelete.length} duplicate learning resources to delete`);
    
    // Delete all duplicates
    let deletedCount = 0;
    for (const docId of duplicatesToDelete) {
      await deleteDoc(firestoreDoc(db, 'learning_resources', docId));
      deletedCount++;
    }
    
    console.log(`Successfully deleted ${deletedCount} duplicate learning resources`);
    return deletedCount;
  } catch (error) {
    console.error('Error deleting duplicate learning resources:', error);
    throw error;
  }
};

// User functions
export const updateUser = async (id: string, userData: any) => {
  try {
    // Ensure that the user document exists before attempting to update
    const userDocRef = firestoreDoc(db, 'users', id);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) await updateDoc(userDocRef, { ...userData, updated_at: serverTimestamp() });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user function for admin operations
export const deleteUser = async (userId: string) => {
  try {
    const userRef = firestoreDoc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Update user status function
export const updateUserStatus = async (userId: string, status: string) => {
  try {
    await updateUser(userId, { 
      status, 
      updated_at: serverTimestamp() 
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const getStudentsBySchoolId = async (schoolId: string) => {
  return withErrorHandling(async () => {
    const studentsQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('school_id', '==', schoolId)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    return studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }, []);
};

// Store functions
export const getStoreItems = async () => {
  return withErrorHandling(async () => {
    const storeQuery = query(
      collection(db, 'store_items'),
      orderBy('created_at', 'desc')
    );
    const storeSnapshot = await getDocs(storeQuery);
    return storeSnapshot.docs.map(doc => ({
      id: doc.id,
      views: 0,
      ...doc.data()
    }));
  }, []);
};

// Summer Program Registration functions
export const getSummerProgramRegistrations = async (): Promise<SummerProgramRegistrationData[]> => {
  return withErrorHandling(async () => {
    const registrationsRef = collection(db, 'summer_program_registrations');
    const registrationsQuery = query(registrationsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(registrationsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        parentPhone: data.parentPhone,
        city: data.city,
        idNumber: data.idNumber,
        school: data.school,
        grade: data.grade,
        educationAdministration: data.educationAdministration,
        hasParticipatedBefore: data.hasParticipatedBefore,
        previousProjects: data.previousProjects,
        interests: data.interests || [],
        howDidYouHear: data.howDidYouHear,
        notes: data.notes,
        status: data.status || 'pending',
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
      };
    });
  }, []);
};

export const addSummerProgramRegistration = async (data: Partial<SummerProgramRegistrationData>): Promise<string> => {
  try {
    const registrationsRef = collection(db, 'summer_program_registrations');
    
    const registrationData = {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(registrationsRef, registrationData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding summer program registration:', error);
    throw error;
  }
};

export const updateSummerProgramRegistration = async (id: string, updates: Partial<SummerProgramRegistrationData>): Promise<void> => {
  try {
    const registrationRef = firestoreDoc(db, 'summer_program_registrations', id);
    
    await updateDoc(registrationRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating summer program registration:', error);
    throw error;
  }
};

export const deleteSummerProgramRegistration = async (id: string): Promise<void> => {
  try {
    const registrationRef = firestoreDoc(db, 'summer_program_registrations', id);
    await deleteDoc(registrationRef);
  } catch (error) {
    console.error('Error deleting summer program registration:', error);
    throw error;
  }
};

// Get projects where user is involved (for notifications)
export const getProjectsUserIsInvolvedIn = async (userId: string, userRole: string) => {
  return withErrorHandling(async () => {
    const projectIds: string[] = [];

    if (userRole === 'student') {
      // Get projects where user is a student
      const projectStudentsQuery = query(
        collection(db, 'project_students'),
        where('student_id', '==', userId)
      );
      const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
      projectStudentsSnapshot.docs.forEach(doc => {
        projectIds.push(doc.data().project_id);
      });
    } else if (userRole === 'teacher') {
      // Get projects where user is the teacher
      const projectsQuery = query(
        collection(db, 'projects'),
        where('teacher_id', '==', userId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      projectsSnapshot.docs.forEach(doc => {
        projectIds.push(doc.id);
      });
    } else if (userRole === 'school') {
      // Get projects from user's school
      const projectsQuery = query(
        collection(db, 'projects'),
        where('school_id', '==', userId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      projectsSnapshot.docs.forEach(doc => {
        projectIds.push(doc.id);
      });
    }

    return [...new Set(projectIds)]; // Remove duplicates
  }, []);
};

// Get user consultations (for notifications)
export const getUserConsultations = async (userId: string) => {
  return withErrorHandling(async () => {
    const consultationsQuery = query(
      collection(db, 'consultations'),
      where('student_id', '==', userId),
      orderBy('updated_at', 'desc')
    );
    
    const consultationsSnapshot = await getDocs(consultationsQuery);
    
    return consultationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        updated_at: data.updated_at ? data.updated_at.toDate().toISOString() : new Date().toISOString(),
        scheduled_at: data.scheduled_at ? data.scheduled_at.toDate().toISOString() : null
      };
    });
  }, []);
};

// Sample data initialization function with better error handling
export const initializeWithSampleData = async () => {
  try {
    // Skip initialization in production
    if (!import.meta.env.DEV) return;

    console.log('Checking if sample data needs to be initialized...');
    
    // Check if sample data already exists
    const usersSnapshot = await getDocs(collection(db, 'users'));
    if (!usersSnapshot.empty) {
      console.log('Users already exist, skipping sample data initialization');
      return;
    }

    console.log('Initializing sample data...');
    
    // Create a test user for each role
    const testUsers = [
      {
        name: 'طالب اختبار',
        email: 'student@test.com',
        role: 'student',
        grade: 'الصف الثاني عشر',
        school_id: 'school1',
        createdAt: serverTimestamp(),
        status: 'active'
      },
      {
        name: 'معلم اختبار',
        email: 'teacher@test.com',
        role: 'teacher',
        subject: 'الرياضيات',
        school_id: 'school1',
        createdAt: serverTimestamp(),
        status: 'active'
      },
      {
        name: 'مدرسة اختبار',
        email: 'school@test.com',
        role: 'school',
        phone: '+971501234567',
        createdAt: serverTimestamp(),
        status: 'active'
      },
      {
        name: 'مدير اختبار',
        email: 'admin@test.com',
        role: 'admin',
        createdAt: serverTimestamp(),
        status: 'active'
      }
    ];
    
    for (const user of testUsers) {
      await addDoc(collection(db, 'users'), user);
      console.log(`Created test user: ${user.name} (${user.role})`);
    }
    
    // Add sample users
    const sampleUsers = [
      // Sample students
      {
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        role: 'student',
        grade: 'الصف الثاني عشر',
        school_id: 'school1',
        status: 'active',
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      {
        name: 'سارة أحمد',
        email: 'sara@example.com',
        role: 'student',
        grade: 'الصف الحادي عشر',
        school_id: 'school1',
        status: 'active',
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      {
        name: 'محمد علي',
        email: 'mohammed@example.com',
        role: 'student',
        grade: 'الصف العاشر',
        school_id: 'school2',
        status: 'active',
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      // Sample teachers
      {
        name: 'د. فاطمة علي',
        email: 'fatima.teacher@example.com',
        role: 'teacher',
        subject: 'الرياضيات',
        school_id: 'school1',
        status: 'active',
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      {
        name: 'أ. خالد محمد',
        email: 'khalid.teacher@example.com',
        role: 'teacher',
        subject: 'العلوم',
        school_id: 'school1',
        status: 'active',
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      {
        name: 'د. نورا السعيد',
        email: 'nora.teacher@example.com',
        role: 'teacher',
        subject: 'اللغة العربية',
        school_id: 'school2',
        status: 'active',
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      // Sample schools
      {
        name: 'مدرسة النور الثانوية',
        email: 'alnoor.school@example.com',
        role: 'school',
        phone: '+971501234567',
        city: 'الرياض',
        location: 'الرياض',
        status: 'active',
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      {
        name: 'مدرسة الأمل المتوسطة',
        email: 'alamal.school@example.com',
        role: 'school',
        phone: '+966501234568',
        city: 'جدة',
        location: 'جدة',
        status: 'active',
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      // Sample consultants
      {
        name: 'د. عبدالله الخبير',
        email: 'abdullah.consultant@example.com',
        role: 'consultant',
        bio: 'خبير في الذكاء الاصطناعي والروبوتات مع أكثر من 10 سنوات خبرة',
        specializations: ['الذكاء الاصطناعي', 'الروبوتات', 'تعلم الآلة'],
        experience_years: 10,
        hourly_rate: 200,
        languages: ['العربية', 'الإنجليزية'],
        phone: '+966501234569',
        status: 'active',
        rating: 4.8,
        reviews_count: 25,
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      },
      {
        name: 'أ. مريم الاستشارية',
        email: 'mariam.consultant@example.com',
        role: 'consultant',
        bio: 'مستشارة في ريادة الأعمال والتسويق الرقمي',
        specializations: ['ريادة الأعمال', 'التسويق الرقمي', 'إدارة المشاريع'],
        experience_years: 7,
        hourly_rate: 180,
        languages: ['العربية', 'الإنجليزية', 'الفرنسية'],
        phone: '+966501234570',
        status: 'pending',
        rating: 4.6,
        reviews_count: 18,
        createdAt: serverTimestamp(),
        updated_at: serverTimestamp()
      }
    ];

    for (const user of sampleUsers) {
      try {
        await addDoc(collection(db, 'users'), user);
        console.log(`✅ Created sample user: ${user.name} (${user.role})`);
      } catch (error) {
        console.warn(`⚠️ Failed to create sample user: ${user.name}`, error);
      }
    }
    
    // Add sample project ideas
    const projectIdeasRef = collection(db, 'project_ideas');
    const projectIdeasSnapshot = await getDocs(projectIdeasRef);
    
    if (projectIdeasSnapshot.empty) {
      console.log('Adding sample project ideas...');

      const sampleIdeas = [
        {
          title: 'روبوت متتبع الخط',
          description: 'بناء روبوت يمكنه تتبع خط مرسوم على الأرض باستخدام أجهزة استشعار ضوئية',
          category: 'stem',
          difficulty: 'intermediate',
          status: 'approved',
          views: 120,
          downloads: 45,
          rating: 4.7,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        },
        {
          title: 'تطبيق لإدارة النفايات',
          description: 'تطوير تطبيق للهاتف المحمول يساعد في إدارة وفرز النفايات المنزلية',
          category: 'stem',
          difficulty: 'beginner',
          status: 'approved',
          views: 85,
          downloads: 30,
          rating: 4.5,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        },
        {
          title: 'مشروع الطاقة الشمسية',
          description: 'بناء نموذج لنظام طاقة شمسية يمكن استخدامه لشحن الأجهزة الصغيرة',
          category: 'stem',
          views: 150,
          downloads: 60,
          rating: 4.8,
          status: 'approved',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        }
      ];
      
      for (const idea of sampleIdeas) {
        try {
          await addDoc(projectIdeasRef, idea);
          console.log(`Added sample project idea: ${idea.title}`);
        } catch (error) {
          console.warn(`Failed to add sample project idea: ${idea.title}`, error);
        }
      }
    }

    console.log('Sample data initialized successfully');
  } catch (error: any) {
    // Don't throw errors for sample data initialization
    console.warn('Sample data initialization failed:', error.message);
  }
};

export default app;