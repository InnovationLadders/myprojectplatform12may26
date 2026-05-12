import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
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
export const db = getFirestore(app, 'myprojectplatformdammam');
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
            name: data.name || 'مؤسسة تعليمية بدون اسم',
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

// Get school by ID
export const getSchoolById = async (schoolId: string) => {
  return withErrorHandling(async () => {
    try {
      if (!schoolId) {
        return null;
      }

      console.log('🔍 Fetching school with ID:', schoolId);

      const schoolDoc = await getDoc(doc(db, 'users', schoolId));

      if (!schoolDoc.exists()) {
        console.warn('⚠️ No school found with ID:', schoolId);
        return null;
      }

      const data = schoolDoc.data();

      if (data.role !== 'school') {
        console.warn('⚠️ Document is not a school:', schoolId);
        return null;
      }

      console.log('✅ Found school:', data.name);

      return {
        id: schoolDoc.id,
        name: data.name,
        email: data.email,
        logo_url: data.logo_url,
        subdomain: data.subdomain,
        status: data.status,
        ...data
      };
    } catch (error) {
      console.error('❌ Error in getSchoolById:', error);
      throw error;
    }
  }, null);
};

// Get school by subdomain
export const getSchoolBySubdomain = async (subdomain: string) => {
  return withErrorHandling(async () => {
    try {
      console.log('🔍 Searching for school with subdomain:', subdomain);

      const schoolsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'school'),
        where('subdomain', '==', subdomain.toLowerCase())
      );

      const schoolsSnapshot = await getDocs(schoolsQuery);

      if (schoolsSnapshot.empty) {
        console.warn('⚠️ No school found with subdomain:', subdomain);
        return null;
      }

      const schoolDoc = schoolsSnapshot.docs[0];
      const data = schoolDoc.data();

      console.log('✅ Found school:', data.name);

      return {
        id: schoolDoc.id,
        name: data.name,
        email: data.email,
        logo_url: data.logo_url,
        subdomain: data.subdomain,
        status: data.status,
        ...data
      };
    } catch (error) {
      console.error('❌ Error in getSchoolBySubdomain:', error);
      throw error;
    }
  }, null);
};

// Update school subdomain
export const updateSchoolSubdomain = async (schoolId: string, subdomain: string) => {
  return withErrorHandling(async () => {
    try {
      console.log('📝 Updating subdomain for school:', schoolId);

      // Check if subdomain is already taken
      const existingSchool = await getSchoolBySubdomain(subdomain);
      if (existingSchool && existingSchool.id !== schoolId) {
        throw new Error('هذا الدومين الفرعي مستخدم بالفعل من قبل مؤسسة أخرى');
      }

      await updateDoc(doc(db, 'users', schoolId), {
        subdomain: subdomain.toLowerCase(),
        updated_at: serverTimestamp()
      });

      console.log('✅ Subdomain updated successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error updating subdomain:', error);
      throw error;
    }
  }, false);
};

// Upload school logo
export const uploadSchoolLogo = async (
  schoolId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        reject(new Error('نوع الملف غير مدعوم. يرجى استخدام JPG أو PNG أو SVG'));
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت'));
        return;
      }

      // Create a reference to the storage location
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `school-logos/${schoolId}_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, fileName);

      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress:', progress + '%');
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('❌ Error uploading logo:', error);
          reject(new Error('فشل رفع الشعار. يرجى المحاولة مرة أخرى'));
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Logo uploaded successfully:', downloadURL);

            // Update school document with logo URL
            await updateDoc(doc(db, 'users', schoolId), {
              logo_url: downloadURL,
              updated_at: serverTimestamp()
            });

            console.log('✅ School document updated with logo URL');
            resolve(downloadURL);
          } catch (error) {
            console.error('❌ Error getting download URL:', error);
            reject(new Error('فشل الحصول على رابط الشعار'));
          }
        }
      );
    } catch (error) {
      console.error('❌ Error in uploadSchoolLogo:', error);
      reject(error);
    }
  });
};

// Delete school logo
export const deleteSchoolLogo = async (schoolId: string, logoUrl: string): Promise<boolean> => {
  return withErrorHandling(async () => {
    try {
      // Delete from storage
      const logoRef = ref(storage, logoUrl);
      await deleteObject(logoRef);
      console.log('✅ Logo deleted from storage');

      // Update school document
      await updateDoc(doc(db, 'users', schoolId), {
        logo_url: null,
        updated_at: serverTimestamp()
      });

      console.log('✅ School document updated - logo removed');
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting logo:', error);
      // If file doesn't exist, still update the document
      if (error.code === 'storage/object-not-found') {
        await updateDoc(doc(db, 'users', schoolId), {
          logo_url: null,
          updated_at: serverTimestamp()
        });
        return true;
      }
      throw error;
    }
  }, false);
};

// Check subdomain availability
export const checkSubdomainAvailability = async (subdomain: string, excludeSchoolId?: string): Promise<boolean> => {
  return withErrorHandling(async () => {
    try {
      const school = await getSchoolBySubdomain(subdomain);

      // If no school found, subdomain is available
      if (!school) {
        return true;
      }

      // If school found but it's the same as the one being updated, it's available
      if (excludeSchoolId && school.id === excludeSchoolId) {
        return true;
      }

      // Otherwise, subdomain is taken
      return false;
    } catch (error) {
      console.error('❌ Error checking subdomain availability:', error);
      throw error;
    }
  }, false);
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
        message: 'لم يتم العثور على مؤسسة تعليمية بهذا البريد الإلكتروني',
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
        name: schoolData.name || 'مؤسسة تعليمية',
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
    message: 'حدث خطأ أثناء البحث عن المؤسسة تعليمية',
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

    const consultants = consultantsSnapshot.docs
      .map(doc => {
        const data = doc.data();

        // Create consultant object with only actual database values
        const consultant = {
          id: doc.id,
          name: data.name || null,
          title: data.subject || data.title || null,
          specialties: data.specializations || [],
          rating: typeof data.rating === 'number' ? data.rating : 0,
          reviews: typeof data.reviews_count === 'number' ? data.reviews_count : 0,
          experience: data.experience_years ? `${data.experience_years} سنوات` : null,
          avatar: data.avatar_url || null,
          hourlyRate: typeof data.hourly_rate === 'number' ? data.hourly_rate : null,
          availability: data.availability || null,
          languages: data.languages || [],
          location: data.location || null
        };

        return consultant;
      })
      .filter(consultant => {
        // Filter out consultants with incomplete profiles
        const hasRequiredFields =
          consultant.name &&
          consultant.specialties.length > 0 &&
          consultant.hourlyRate !== null;

        if (!hasRequiredFields) {
          console.warn(`⚠️ Consultant ${consultant.id} has incomplete profile and will not be shown`);
        }

        return hasRequiredFields;
      });

    console.log(`✅ Returning ${consultants.length} consultants with complete profiles`);
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

export const updateProjectTask = async (taskId: string, taskData: any) => {
  try {
    console.log('Updating project task:', taskId, 'with data:', taskData);

    const updateData: any = {
      ...taskData,
      updated_at: serverTimestamp()
    };

    if (taskData.due_date) {
      updateData.due_date = Timestamp.fromDate(new Date(taskData.due_date));
    }

    const taskRef = doc(db, 'project_tasks', taskId);
    await updateDoc(taskRef, updateData);

    console.log('Task updated successfully:', taskId);
    return {
      id: taskId,
      ...taskData
    };
  } catch (error) {
    console.error('Error updating project task:', error);
    throw error;
  }
};

export const deleteProjectTask = async (taskId: string) => {
  try {
    console.log('Deleting project task:', taskId);
    const taskRef = doc(db, 'project_tasks', taskId);
    await deleteDoc(taskRef);
    console.log('Task deleted successfully:', taskId);
  } catch (error) {
    console.error('Error deleting project task:', error);
    throw error;
  }
};

// Helper function to extract localized content from multi-language fields
const getLocalizedField = (field: any, language: 'ar' | 'en'): any => {
  if (!field) return field;

  // Check if field is an object with language keys
  if (typeof field === 'object' && !Array.isArray(field) && (field.ar || field.en)) {
    return field[language] || field.ar || field.en || '';
  }

  // For arrays, check if it's a multi-language array
  if (typeof field === 'object' && !Array.isArray(field) && (Array.isArray(field.ar) || Array.isArray(field.en))) {
    return field[language] || field.ar || field.en || [];
  }

  // Return as-is for non-multi-language fields (backward compatibility)
  return field;
};

// Helper function to handle both Firestore Timestamp and string date formats
const convertToISOString = (dateValue: any): string => {
  console.log('convertToISOString called with:', dateValue, 'type:', typeof dateValue);

  if (!dateValue) {
    console.log('No date value, using current date');
    return new Date().toISOString();
  }

  // If it's already a string, return it
  if (typeof dateValue === 'string') {
    console.log('Date is string:', dateValue);
    return dateValue;
  }

  // If it has a toDate method (Firestore Timestamp), use it
  if (dateValue && typeof dateValue.toDate === 'function') {
    console.log('Date has toDate method, converting...');
    return dateValue.toDate().toISOString();
  }

  // Fallback to current date
  console.log('Using fallback date');
  return new Date().toISOString();
};

// Project ideas functions - Modified to avoid composite index requirement
export const getProjectIdeas = async (language: 'ar' | 'en' = 'ar') => {
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
    // Return raw data without localization - let the UI layer handle it with multiLangHelper
    const ideas = ideasSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Processing project idea document:', doc.id, 'data:', data);
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        subject: data.subject,
        duration: data.duration,
        objectives: data.objectives,
        materials: data.materials,
        steps: data.steps,
        tags: data.tags,
        category: data.category,
        difficulty: data.difficulty,
        image: data.image,
        views: data.views || 0,
        downloads: data.downloads || 0,
        rating: data.rating || 4.5,
        status: data.status,
        created_at: convertToISOString(data.created_at),
        updated_at: convertToISOString(data.updated_at),
        feedback: data.feedback
      };
    });

    // Sort by created_at in descending order (newest first)
    return ideas.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, []);
};

// Get all project ideas (for admin) - Modified to avoid composite index requirement
export const getAllProjectIdeas = async (language: 'ar' | 'en' = 'ar') => {
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
    // Return raw data without localization - let the UI layer handle it with multiLangHelper
    const ideas = ideasSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        subject: data.subject,
        duration: data.duration,
        objectives: data.objectives,
        materials: data.materials,
        steps: data.steps,
        tags: data.tags,
        category: data.category,
        difficulty: data.difficulty,
        image: data.image,
        views: data.views || 0,
        downloads: data.downloads || 0,
        rating: data.rating || 4.5,
        status: data.status,
        created_at: convertToISOString(data.created_at),
        updated_at: convertToISOString(data.updated_at),
        feedback: data.feedback
      };
    });

    // Sort by created_at in descending order (newest first)
    return ideas.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

export const getProjectIdeaById = async (id: string, language: 'ar' | 'en' = 'ar') => {
  try {
    const ideaRef = firestoreDoc(db, 'project_ideas', id);
    const ideaDoc = await getDoc(ideaRef);

    if (ideaDoc.exists()) {
      const data = ideaDoc.data();
      // Return raw data without localization - let the UI layer handle it with multiLangHelper
      return {
        id: ideaDoc.id,
        title: data.title,
        description: data.description,
        subject: data.subject,
        duration: data.duration,
        objectives: data.objectives,
        materials: data.materials,
        steps: data.steps,
        tags: data.tags,
        category: data.category,
        difficulty: data.difficulty,
        image: data.image,
        views: data.views || 0,
        downloads: data.downloads || 0,
        rating: data.rating || 4.5,
        status: data.status || 'approved',
        created_at: convertToISOString(data.created_at),
        updated_at: convertToISOString(data.updated_at),
        feedback: data.feedback
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

// Update user password function for current user
export const updateCurrentUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const user = auth.currentUser;

    if (!user || !user.email) {
      console.error('No authenticated user found');
      return {
        success: false,
        message: 'لم يتم العثور على مستخدم مسجل دخول'
      };
    }

    console.log('Starting password update process for user:', user.uid);

    // Create credential for re-authentication
    const credential = EmailAuthProvider.credential(user.email, currentPassword);

    // Re-authenticate user with current password
    console.log('Re-authenticating user...');
    await reauthenticateWithCredential(user, credential);
    console.log('User re-authenticated successfully');

    // Update password
    console.log('Updating password...');
    await firebaseUpdatePassword(user, newPassword);
    console.log('Password updated successfully');

    return {
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح'
    };
  } catch (error: any) {
    console.error('Error updating password:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/wrong-password') {
      return {
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      };
    } else if (error.code === 'auth/weak-password') {
      return {
        success: false,
        message: 'كلمة المرور الجديدة ضعيفة جداً. يجب أن تكون 6 أحرف على الأقل'
      };
    } else if (error.code === 'auth/requires-recent-login') {
      return {
        success: false,
        message: 'يجب تسجيل الدخول مرة أخرى لتغيير كلمة المرور'
      };
    } else if (error.code === 'auth/network-request-failed') {
      return {
        success: false,
        message: 'فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت'
      };
    } else {
      return {
        success: false,
        message: error.message || 'حدث خطأ أثناء تحديث كلمة المرور'
      };
    }
  }
};

// Send password reset email for admin to reset user passwords
export const sendPasswordResetEmailToUser = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Sending password reset email to:', email);

    await sendPasswordResetEmail(auth, email);

    console.log('Password reset email sent successfully');

    return {
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني'
    };
  } catch (error: any) {
    console.error('Error sending password reset email:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      return {
        success: false,
        message: 'لم يتم العثور على مستخدم بهذا البريد الإلكتروني'
      };
    } else if (error.code === 'auth/invalid-email') {
      return {
        success: false,
        message: 'البريد الإلكتروني غير صالح'
      };
    } else if (error.code === 'auth/network-request-failed') {
      return {
        success: false,
        message: 'فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت'
      };
    } else {
      return {
        success: false,
        message: error.message || 'حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور'
      };
    }
  }
};

export const sendVerificationEmail = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return {
        success: false,
        message: 'لا يوجد مستخدم مسجل الدخول'
      };
    }

    if (currentUser.emailVerified) {
      return {
        success: false,
        message: 'البريد الإلكتروني مؤكد بالفعل'
      };
    }

    await sendEmailVerification(currentUser, {
      url: window.location.origin + '/login',
      handleCodeInApp: false
    });

    return {
      success: true,
      message: 'تم إرسال بريد التحقق بنجاح. يرجى التحقق من صندوق الوارد'
    };
  } catch (error: any) {
    console.error('Error sending verification email:', error);

    if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        message: 'تم إرسال الكثير من الطلبات. يرجى الانتظار قليلاً قبل المحاولة مرة أخرى'
      };
    } else if (error.code === 'auth/network-request-failed') {
      return {
        success: false,
        message: 'فشل الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت'
      };
    } else {
      return {
        success: false,
        message: error.message || 'حدث خطأ أثناء إرسال بريد التحقق'
      };
    }
  }
};

export const reloadUserEmailStatus = async (): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return false;
    }

    await currentUser.reload();
    return currentUser.emailVerified;
  } catch (error) {
    console.error('Error reloading user email status:', error);
    return false;
  }
};

export const handleEmailVerification = async (
  actionCode: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const info = await checkActionCode(auth, actionCode);
    const userEmail = info.data.email;

    await applyActionCode(auth, actionCode);

    if (auth.currentUser) {
      await auth.currentUser.reload();
    }

    if (userEmail) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        let newStatus = 'active';
        if (userData.role === 'school' || userData.role === 'consultant' || userData.role === 'teacher') {
          newStatus = 'pending';
        } else if (userData.role === 'student' && userData.school_id) {
          // Check if the institution requires manual student approval
          try {
            const institutionDoc = await getDoc(doc(db, 'users', userData.school_id));
            if (institutionDoc.exists()) {
              const institutionData = institutionDoc.data();
              if (institutionData.require_student_approval === true) {
                newStatus = 'pending';
              }
            }
          } catch (institutionError) {
            console.warn('Could not fetch institution settings, defaulting to auto-approve:', institutionError);
          }
        }

        await updateDoc(userDoc.ref, {
          status: newStatus,
          email_verified_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });

        console.log('✅ تم تحديث حالة المستخدم بعد التحقق من البريد:', {
          email: userEmail,
          newStatus: newStatus,
          role: userData.role
        });
      }
    }

    return {
      success: true,
      message: 'تم تأكيد بريدك الإلكتروني بنجاح! يمكنك الآن تسجيل الدخول'
    };
  } catch (error: any) {
    console.error('Error verifying email:', error);

    if (error.code === 'auth/expired-action-code') {
      return {
        success: false,
        message: 'انتهت صلاحية رابط التحقق. يرجى طلب رابط جديد'
      };
    } else if (error.code === 'auth/invalid-action-code') {
      return {
        success: false,
        message: 'رابط التحقق غير صالح أو تم استخدامه بالفعل'
      };
    } else if (error.code === 'auth/user-disabled') {
      return {
        success: false,
        message: 'تم تعطيل هذا الحساب'
      };
    } else {
      return {
        success: false,
        message: error.message || 'حدث خطأ أثناء تأكيد البريد الإلكتروني'
      };
    }
  }
};

export const handlePasswordReset = async (
  actionCode: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await verifyPasswordResetCode(auth, actionCode);

    await confirmPasswordReset(auth, actionCode, newPassword);

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول'
    };
  } catch (error: any) {
    console.error('Error resetting password:', error);

    if (error.code === 'auth/expired-action-code') {
      return {
        success: false,
        message: 'انتهت صلاحية رابط إعادة تعيين كلمة المرور. يرجى طلب رابط جديد'
      };
    } else if (error.code === 'auth/invalid-action-code') {
      return {
        success: false,
        message: 'رابط إعادة التعيين غير صالح أو تم استخدامه بالفعل'
      };
    } else if (error.code === 'auth/weak-password') {
      return {
        success: false,
        message: 'كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى'
      };
    } else {
      return {
        success: false,
        message: error.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور'
      };
    }
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
        created_at: convertToISOString(data.created_at),
        updated_at: convertToISOString(data.updated_at),
        scheduled_at: data.scheduled_at ? data.scheduled_at.toDate().toISOString() : null
      };
    });
  }, []);
};

// Sample data initialization function - DISABLED FOR PRODUCTION
export const initializeWithSampleData = async () => {
  console.log('⛔ Sample data initialization is DISABLED - Production mode active');
  console.log('⛔ No mock data will be added to the database');
  return;
};

// ============================================
// Entrepreneurship Submissions Functions
// ============================================

/**
 * Submit a project to entrepreneurship
 * @param projectId - The ID of the project to submit
 * @param submittedByUserId - The ID of the user submitting (teacher, student, or school admin)
 * @param submittedByRole - The role of the submitter (teacher, student, school, admin)
 */
export const submitProjectToEntrepreneurship = async (
  projectId: string,
  submittedByUserId: string,
  submittedByRole: string
) => {
  try {
    console.log('🚀 [Entrepreneurship Submit] Starting submission process:', {
      projectId,
      submittedByUserId,
      submittedByRole,
      timestamp: new Date().toISOString()
    });

    // Check if project exists
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      console.error('❌ [Entrepreneurship Submit] Project not found:', projectId);
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();
    console.log('📄 [Entrepreneurship Submit] Project data retrieved:', {
      projectId,
      title: projectData.title,
      teacher_id: projectData.teacher_id,
      school_id: projectData.school_id,
      status: projectData.status,
      hasTeacherId: !!projectData.teacher_id,
      hasSchoolId: !!projectData.school_id
    });

    // Check if project is already submitted
    const existingSubmissionQuery = query(
      collection(db, 'entrepreneurship_submissions'),
      where('project_id', '==', projectId)
    );
    const existingSubmissions = await getDocs(existingSubmissionQuery);

    if (!existingSubmissions.empty) {
      console.warn('⚠️ [Entrepreneurship Submit] Project already submitted:', projectId);
      throw new Error('Project already submitted');
    }

    // Get teacher_id from project (using correct field name)
    const teacherId = projectData.teacher_id || '';

    // Get school_id from project
    const schoolId = projectData.school_id || '';

    console.log('🔍 [Entrepreneurship Submit] Extracted IDs:', {
      teacherId,
      schoolId,
      teacherIdExists: !!teacherId,
      schoolIdExists: !!schoolId
    });

    // Fetch teacher name from users collection
    let teacherName = '';
    if (teacherId) {
      try {
        console.log('👨‍🏫 [Entrepreneurship Submit] Fetching teacher data for ID:', teacherId);
        const teacherDoc = await getDoc(doc(db, 'users', teacherId));
        if (teacherDoc.exists()) {
          const teacherData = teacherDoc.data();
          teacherName = teacherData.name || '';
          console.log('✅ [Entrepreneurship Submit] Teacher found:', {
            teacherId,
            teacherName,
            role: teacherData.role
          });
        } else {
          console.warn('⚠️ [Entrepreneurship Submit] Teacher document not found for ID:', teacherId);
        }
      } catch (error) {
        console.error('❌ [Entrepreneurship Submit] Error fetching teacher:', {
          teacherId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      console.warn('⚠️ [Entrepreneurship Submit] No teacher ID provided in project data');
    }

    // Fetch school name from users collection
    let schoolName = '';
    if (schoolId) {
      try {
        console.log('🏫 [Entrepreneurship Submit] Fetching school data for ID:', schoolId);
        const schoolDoc = await getDoc(doc(db, 'users', schoolId));
        if (schoolDoc.exists()) {
          const schoolData = schoolDoc.data();
          schoolName = schoolData.name || '';
          console.log('✅ [Entrepreneurship Submit] School found:', {
            schoolId,
            schoolName,
            role: schoolData.role
          });
        } else {
          console.warn('⚠️ [Entrepreneurship Submit] School document not found for ID:', schoolId);
        }
      } catch (error) {
        console.error('❌ [Entrepreneurship Submit] Error fetching school:', {
          schoolId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } else {
      console.warn('⚠️ [Entrepreneurship Submit] No school ID provided in project data');
    }

    // Validate essential data
    const dataQualityIssues: string[] = [];
    if (!schoolId) {
      dataQualityIssues.push('Missing school_id');
      console.error('❌ [Entrepreneurship Submit] Critical: No school_id in project');
    }
    if (!teacherId) {
      dataQualityIssues.push('Missing teacher_id');
      console.error('❌ [Entrepreneurship Submit] Critical: No teacher_id in project');
    }
    if (!schoolName && schoolId) {
      dataQualityIssues.push('School ID exists but name not found');
      console.warn('⚠️ [Entrepreneurship Submit] School ID exists but name could not be retrieved');
    }
    if (!teacherName && teacherId) {
      dataQualityIssues.push('Teacher ID exists but name not found');
      console.warn('⚠️ [Entrepreneurship Submit] Teacher ID exists but name could not be retrieved');
    }

    if (dataQualityIssues.length > 0) {
      console.error('❌ [Entrepreneurship Submit] Data quality issues detected:', dataQualityIssues);
    }

    // Create submission document
    const submissionData = {
      project_id: projectId,
      project_title: projectData.title || '',
      teacher_id: teacherId,
      teacher_name: teacherName,
      school_id: schoolId,
      school_name: schoolName,
      submitted_by_user_id: submittedByUserId,
      submitted_by_role: submittedByRole,
      status: 'pending',
      submitted_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    console.log('📝 [Entrepreneurship Submit] Submission data prepared:', {
      project_id: projectId,
      project_title: submissionData.project_title,
      teacher_id: teacherId,
      teacher_name: teacherName,
      school_id: schoolId,
      school_name: schoolName,
      submitted_by_user_id: submittedByUserId,
      submitted_by_role: submittedByRole,
      dataQualityIssues: dataQualityIssues.length > 0 ? dataQualityIssues : 'None'
    });

    const submissionRef = await addDoc(
      collection(db, 'entrepreneurship_submissions'),
      submissionData
    );

    console.log('✅ [Entrepreneurship Submit] Submission created successfully:', {
      submissionId: submissionRef.id,
      projectId
    });

    // Mark project as submitted
    await updateDoc(doc(db, 'projects', projectId), {
      submitted_to_entrepreneurship: true,
      submitted_to_entrepreneurship_at: serverTimestamp()
    });

    console.log('✅ [Entrepreneurship Submit] Project marked as submitted:', projectId);
    console.log('🎉 [Entrepreneurship Submit] Submission process completed successfully');

    return submissionRef.id;
  } catch (error) {
    console.error('❌ [Entrepreneurship Submit] Submission failed:', {
      projectId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

/**
 * Get all entrepreneurship submissions (for admin)
 */
export const getEntrepreneurshipSubmissions = async () => {
  try {
    const submissionsQuery = query(
      collection(db, 'entrepreneurship_submissions'),
      orderBy('submitted_at', 'desc')
    );

    const snapshot = await getDocs(submissionsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submitted_at: doc.data().submitted_at?.toDate().toISOString() || null,
      updated_at: doc.data().updated_at?.toDate().toISOString() || null
    }));
  } catch (error) {
    console.error('Error getting entrepreneurship submissions:', error);
    throw error;
  }
};

/**
 * Get entrepreneurship submissions by school ID (for school admins)
 * @param schoolId - The ID of the school
 */
export const getEntrepreneurshipSubmissionsBySchoolId = async (schoolId: string) => {
  try {
    const submissionsQuery = query(
      collection(db, 'entrepreneurship_submissions'),
      where('school_id', '==', schoolId),
      orderBy('submitted_at', 'desc')
    );

    const snapshot = await getDocs(submissionsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submitted_at: doc.data().submitted_at?.toDate().toISOString() || null,
      updated_at: doc.data().updated_at?.toDate().toISOString() || null
    }));
  } catch (error) {
    console.error('Error getting school entrepreneurship submissions:', error);
    throw error;
  }
};

/**
 * Update submission status (admin only)
 * @param submissionId - The ID of the submission to update
 * @param newStatus - The new status (pending, approved, rejected)
 * @param notes - Optional notes about the status change
 */
export const updateSubmissionStatus = async (
  submissionId: string,
  newStatus: 'pending' | 'approved' | 'rejected',
  notes?: string
) => {
  try {
    const updateData: any = {
      status: newStatus,
      updated_at: serverTimestamp()
    };

    if (notes) {
      updateData.status_notes = notes;
    }

    if (newStatus === 'approved') {
      updateData.approved_at = serverTimestamp();
    } else if (newStatus === 'rejected') {
      updateData.rejected_at = serverTimestamp();
    }

    await updateDoc(doc(db, 'entrepreneurship_submissions', submissionId), updateData);
  } catch (error) {
    console.error('Error updating submission status:', error);
    throw error;
  }
};

/**
 * Get submission by project ID
 * @param projectId - The ID of the project
 */
export const getSubmissionByProjectId = async (projectId: string) => {
  try {
    const submissionQuery = query(
      collection(db, 'entrepreneurship_submissions'),
      where('project_id', '==', projectId),
      limit(1)
    );

    const snapshot = await getDocs(submissionQuery);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      submitted_at: doc.data().submitted_at?.toDate().toISOString() || null,
      updated_at: doc.data().updated_at?.toDate().toISOString() || null
    };
  } catch (error) {
    console.error('Error getting submission by project ID:', error);
    throw error;
  }
};

/**
 * Get user information by ID for display purposes
 * @param userId - The ID of the user
 */
export const getUserInfoForSubmission = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return {
      id: userDoc.id,
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || ''
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

export default app;