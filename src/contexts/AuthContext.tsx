import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Debug flag
const DEBUG_AUTH = true;

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'school' | 'admin' | 'consultant';
  avatar?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
  school_id?: string;
  grade?: string;
  subject?: string;
  languages?: string[];
  schoolIdNumber?: string; // New field for school ID number
  status?: string;
  schoolCity?: string; // Add school city field
  // Subscription fields for schools
  subscription_start_date?: string;
  subscription_end_date?: string;
  is_subscription_active?: boolean;
  // Consultant specific fields
  specializations?: string[];
  experience_years?: number;
  hourly_rate?: number;
  rating?: number;
  reviews_count?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOffline: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (DEBUG_AUTH) console.log("Auth state changed, user:", firebaseUser?.uid);
      
      // Clear user state if no Firebase user
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      try {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (DEBUG_AUTH) console.log("User document exists in auth state change:", userDoc.exists());
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (DEBUG_AUTH) console.log("User data in auth state change:", userData);
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || firebaseUser.displayName || '',
              role: userData.role || 'student',
              avatar: userData.avatar || firebaseUser.photoURL,
              phone: userData.phone,
              bio: userData.bio,
              createdAt: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              school_id: userData.school_id,
              grade: userData.grade,
              subject: userData.subject,
              languages: userData.languages,
              status: userData.status || 'active',
              // Consultant specific fields
              specializations: userData.specializations,
              experience_years: userData.experience_years,
              hourly_rate: userData.hourly_rate,
              rating: userData.rating,
              reviews_count: userData.reviews_count
            });
          } else {
            console.error("CRITICAL: User document doesn't exist for authenticated user:", firebaseUser.uid);
            console.log("This indicates an incomplete registration. Signing out user to prevent invalid state.");
            
            // Sign out the user since they don't have a valid profile
            await signOut(auth);
            setUser(null);
            return; // Exit early to prevent further processing
          }
        } catch (error: any) {
          // Handle various Firebase errors gracefully
          const isNetworkError = error.code === 'unavailable' || 
                                error.code === 'auth/network-request-failed' ||
                                error.code === 'firestore/unavailable' ||
                                error.message?.includes('offline') ||
                                error.message?.includes('client is offline') ||
                                error.message?.includes('network') ||
                                error.message?.includes('Could not reach Cloud Firestore backend');

          if (isNetworkError) {
            console.warn('Operating in offline mode - using basic user profile:', error.message);
            setIsOffline(true);
            
            // Create a basic user profile from Firebase Auth data for network errors only
            const basicUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'مستخدم',
              role: 'student', // Temporary role for offline mode
              avatar: firebaseUser.photoURL,
              createdAt: new Date().toISOString(),
              status: 'active'
            };
            setUser(basicUser);
          } else {
            console.error('Non-network error fetching user profile:', error);
            console.log('Signing out user due to profile fetch error to prevent invalid state.');
            
            // For non-network errors, sign out the user to prevent invalid state
            await signOut(auth);
            setUser(null);
            return; // Exit early to prevent further processing
          }
        }
      } catch (finalError) {
        console.error("Fatal error in auth state change:", finalError);
        // For any fatal errors, ensure user is signed out
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error("Failed to sign out after fatal error:", signOutError);
        }
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase user authenticated:", firebaseUser.uid);
      
      // Force a refresh of the auth state which will trigger the onAuthStateChanged listener
      // This is more reliable than manually setting the user here
      await firebaseUser.getIdToken(true);
      
      // The onAuthStateChanged listener will handle setting the user state
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed' || error.code === 'unavailable') {
        console.warn('Network request failed during login:', error.message);
        setIsOffline(true);
        throw new Error('فشل في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
      } else {
        console.error('Login error:', error);
      }
      throw error;
    }
  };

  const register = async (email: string, password: string, userData: Partial<User>) => {
    try {
      if (DEBUG_AUTH) console.log('🚀 بدء عملية التسجيل:', {
        email: email,
        role: userData.role,
        name: userData.name,
        hasSchoolId: !!userData.school_id,
        timestamp: new Date().toISOString()
      });

      // Validate required fields before proceeding
      if (!userData.role) {
        if (DEBUG_AUTH) console.error('❌ فشل التحقق: دور المستخدم مطلوب');
        throw new Error('دور المستخدم مطلوب');
      }
      
      if (!userData.name || userData.name.trim() === '') {
        if (DEBUG_AUTH) console.error('❌ فشل التحقق: اسم المستخدم مطلوب');
        throw new Error('اسم المستخدم مطلوب');
      }
      
      if (DEBUG_AUTH) console.log('✅ تم التحقق من البيانات المطلوبة بنجاح');
      
      // Log role-specific data BEFORE attempting Firebase Auth creation
      if (DEBUG_AUTH) {
        console.log('📋 تحليل البيانات الخاصة بالدور قبل إنشاء الحساب:', {
          role: userData.role,
          name: userData.name,
          email: email,
          timestamp: new Date().toISOString()
        });
        
        // Log specific data for each role
        if (userData.role === 'student') {
          console.log('👨‍🎓 بيانات الطالب المقدمة:', {
            grade: userData.grade,
            grade_type: typeof userData.grade,
            grade_provided: !!userData.grade,
            school_id: userData.school_id,
            school_id_type: typeof userData.school_id,
            school_id_provided: !!userData.school_id,
            schoolIdNumber: userData.schoolIdNumber,
            schoolIdNumber_type: typeof userData.schoolIdNumber,
            schoolIdNumber_provided: !!userData.schoolIdNumber,
            phone: userData.phone,
            phone_provided: !!userData.phone
          });
        } else if (userData.role === 'teacher') {
          console.log('👩‍🏫 بيانات المعلم المقدمة:', {
            subject: userData.subject,
            subject_type: typeof userData.subject,
            subject_provided: !!userData.subject,
            school_id: userData.school_id,
            school_id_type: typeof userData.school_id,
            school_id_provided: !!userData.school_id,
            schoolIdNumber: userData.schoolIdNumber,
            schoolIdNumber_type: typeof userData.schoolIdNumber,
            schoolIdNumber_provided: !!userData.schoolIdNumber,
            phone: userData.phone,
            phone_provided: !!userData.phone
          });
        } else if (userData.role === 'school') {
          console.log('🏫 بيانات المدرسة المقدمة:', {
            bio: userData.bio,
            bio_type: typeof userData.bio,
            bio_provided: !!userData.bio,
            phone: userData.phone,
            phone_type: typeof userData.phone,
            phone_provided: !!userData.phone,
            note: 'school_id سيتم تعيينه إلى firebaseUser.uid بعد إنشاء الحساب'
          });
        } else if (userData.role === 'consultant') {
          console.log('💼 بيانات المستشار المقدمة:', {
            bio: userData.bio,
            bio_type: typeof userData.bio,
            bio_provided: !!userData.bio,
            specializations: userData.specializations,
            specializations_count: userData.specializations?.length || 0,
            specializations_type: typeof userData.specializations,
            experience_years: userData.experience_years,
            experience_years_type: typeof userData.experience_years,
            hourly_rate: userData.hourly_rate,
            hourly_rate_type: typeof userData.hourly_rate,
            languages: userData.languages,
            languages_count: userData.languages?.length || 0,
            languages_type: typeof userData.languages,
            phone: userData.phone,
            phone_provided: !!userData.phone
          });
        }
      }
      
      if (DEBUG_AUTH) console.log('🔐 محاولة إنشاء مستخدم Firebase Auth...');
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      if (DEBUG_AUTH) console.log('✅ تم إنشاء مستخدم Firebase Auth بنجاح:', {
        role: userData.role,
        name: userData.name,
        email: userData.email,
        firebaseUid: firebaseUser.uid,
        uidType: typeof firebaseUser.uid,
        uidLength: firebaseUser.uid?.length
      });
      
      // Validate Firebase user creation
      if (!firebaseUser || !firebaseUser.uid) {
        if (DEBUG_AUTH) console.error('❌ فشل في إنشاء حساب Firebase: firebaseUser أو uid غير موجود');
        throw new Error('فشل في إنشاء حساب Firebase');
      }
      
      if (DEBUG_AUTH) console.log('🔍 تحديد الحالة الأولية والمدرسة...');
      
      // Determine initial status based on role
      let initialStatus = 'active';
      
      // If the user is a school or consultant, set status to pending for admin approval
      if (userData.role === 'school' || userData.role === 'consultant') {
        initialStatus = 'pending';
        if (DEBUG_AUTH) console.log(`📋 تم تعيين الحالة إلى "pending" لدور ${userData.role}`);
      } else {
        if (DEBUG_AUTH) console.log(`📋 تم تعيين الحالة إلى "active" لدور ${userData.role}`);
      }
      
      // Initialize schoolId to null to ensure it's never undefined
      let schoolId: string | null = null;
      
      if (DEBUG_AUTH) console.log('🏫 تحديد school_id بناءً على الدور...');
      
      if (userData.role === 'school') {
        // For schools, their school_id is their own user ID
        schoolId = firebaseUser.uid;
        if (DEBUG_AUTH) console.log('🏫 تسجيل مدرسة: تعيين school_id إلى UID الخاص:', {
          schoolId: schoolId,
          schoolIdType: typeof schoolId,
          firebaseUid: firebaseUser.uid
        });
      } else if (userData.role === 'student' || userData.role === 'teacher') {
        // For students and teachers, use the provided school_id or null
        schoolId = userData.school_id ? userData.school_id : null;
        if (DEBUG_AUTH) console.log('👨‍🎓👩‍🏫 تسجيل طالب/معلم: تعيين school_id:', {
          providedSchoolId: userData.school_id,
          finalSchoolId: schoolId,
          schoolIdType: typeof schoolId
        });
      } else {
        // For admin and consultant roles, school_id remains null
        if (DEBUG_AUTH) console.log('👑💼 تسجيل مدير/مستشار: school_id يبقى null');
      }
      
      // Validate that schoolId is never undefined
      if (schoolId === undefined) {
        if (DEBUG_AUTH) console.error('🚨 خطر: schoolId هو undefined، هذا لا يجب أن يحدث أبداً');
        schoolId = null;
      }
      
      if (DEBUG_AUTH) console.log('📝 إنشاء كائن بيانات المستخدم الأساسي...');
      
      // Create a base user data object with common fields
      const baseUserData = {
        name: userData.name || 'مستخدم جديد',
        email: firebaseUser.email || email,
        role: userData.role || 'student', // Ensure role is never undefined
        phone: userData.phone ?? null,
        bio: userData.bio ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        school_id: schoolId,
        grade: userData.grade ?? null,
        subject: userData.subject ?? null,
        schoolIdNumber: userData.schoolIdNumber ?? null,
        languages: userData.languages || ['العربية'],
        status: initialStatus,
      };
      
      if (DEBUG_AUTH) console.log('📋 بيانات المستخدم الأساسية:', {
        name: baseUserData.name,
        email: baseUserData.email,
        role: baseUserData.role,
        school_id: baseUserData.school_id,
        school_id_type: typeof baseUserData.school_id,
        status: baseUserData.status
      });
      
      // Create the final user data object, conditionally adding consultant-specific fields
      let newUserData: any = { ...baseUserData };
      
      // Only add consultant-specific fields if the role is 'consultant'
      if (userData.role === 'consultant') {
        if (DEBUG_AUTH) console.log('💼 إضافة حقول خاصة بالمستشار...');
        newUserData = {
          ...newUserData,
          specializations: userData.specializations || [],
          experience_years: userData.experience_years ?? null,
          hourly_rate: userData.hourly_rate ?? null,
          rating: 5.0,
          reviews_count: 0
        };
      }
      
      if (DEBUG_AUTH) console.log('🔍 فحص القيم غير المعرفة (undefined)...');
      // Final validation: ensure no undefined values
      const undefinedFields = Object.entries(newUserData).filter(([key, value]) => value === undefined);
      if (undefinedFields.length > 0) {
        if (DEBUG_AUTH) console.error('🚨 تم العثور على حقول undefined في بيانات المستخدم:', undefinedFields);
        // Convert undefined values to null
        undefinedFields.forEach(([key]) => {
          if (DEBUG_AUTH) console.log(`🔧 تحويل ${key} من undefined إلى null`);
          newUserData[key] = null;
        });
      } else {
        if (DEBUG_AUTH) console.log('✅ لا توجد حقول undefined - البيانات نظيفة');
      }
      
      if (DEBUG_AUTH) {
        // Create a copy for logging with readable timestamps
        const loggingData = {
          ...newUserData,
          createdAt: '[ServerTimestamp]',
          updatedAt: '[ServerTimestamp]'
        };
        
        console.log('📤 البيانات النهائية التي سيتم إرسالها إلى Firestore:', {
          uid: firebaseUser.uid,
          role: newUserData.role,
          school_id: newUserData.school_id,
          school_id_type: typeof newUserData.school_id,
          allFieldsCount: Object.keys(newUserData).length,
          completeDataPreview: JSON.stringify(loggingData, null, 2).substring(0, 500) + '...'
        });
        
        // Additional validation log for critical fields
        console.log('🔍 التحقق النهائي من الحقول الحرجة:', {
          name_valid: !!newUserData.name && newUserData.name !== '',
          email_valid: !!newUserData.email && newUserData.email !== '',
          role_valid: !!newUserData.role && ['student', 'teacher', 'school', 'admin', 'consultant'].includes(newUserData.role),
          school_id_valid: newUserData.school_id === null || (typeof newUserData.school_id === 'string' && newUserData.school_id !== ''),
          status_valid: !!newUserData.status && ['active', 'pending'].includes(newUserData.status),
          no_undefined_values: !Object.values(newUserData).includes(undefined)
        });
      }
      
      // Create user profile in Firestore with document ID matching the Firebase Auth UID
      try {
        if (DEBUG_AUTH) console.log('💾 محاولة إنشاء مستند المستخدم في Firestore...');
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
        if (DEBUG_AUTH) console.log('✅ تم إنشاء مستند المستخدم بنجاح في Firestore:', {
          role: newUserData.role,
          uid: firebaseUser.uid,
          school_id: newUserData.school_id,
          status: newUserData.status,
          timestamp: new Date().toISOString()
        });
        
        if (DEBUG_AUTH) console.log('🔄 تحديث رمز المصادقة...');
        // Force a refresh of the auth state which will trigger the onAuthStateChanged listener
        await firebaseUser.getIdToken(true);
        if (DEBUG_AUTH) console.log('✅ تم تحديث رمز المصادقة بنجاح');
        
        if (DEBUG_AUTH) console.log('🎉 اكتملت عملية التسجيل بنجاح!', {
          userRole: newUserData.role,
          userStatus: newUserData.status,
          timestamp: new Date().toISOString()
        });
        // The onAuthStateChanged listener will handle setting the user state
      } catch (firestoreError) {
        if (DEBUG_AUTH) console.error('❌ فشل في إنشاء مستند المستخدم في Firestore:', {
          error: firestoreError,
          userRole: newUserData.role,
          userEmail: newUserData.email,
          uid: firebaseUser.uid,
          errorMessage: firestoreError instanceof Error ? firestoreError.message : 'Unknown error'
        });
        
        // CRITICAL: If Firestore profile creation fails, delete the Firebase Auth user
        // to prevent orphaned accounts with incomplete profiles
        try {
          if (DEBUG_AUTH) console.log('🗑️ محاولة حذف مستخدم Firebase Auth بسبب فشل Firestore...');
          await firebaseUser.delete();
          if (DEBUG_AUTH) console.log('✅ تم حذف مستخدم Firebase Auth بنجاح بعد فشل Firestore');
        } catch (deleteError) {
          if (DEBUG_AUTH) console.error('❌ فشل في حذف مستخدم Firebase Auth بعد فشل Firestore:', deleteError);
          // Force sign out as fallback
          await signOut(auth);
          if (DEBUG_AUTH) console.log('🚪 تم تسجيل الخروج كحل بديل');
        }
        
        // Re-throw the original Firestore error
        throw firestoreError;
      }
    } catch (error: any) {
      if (DEBUG_AUTH) console.error('❌ فشلت عملية التسجيل:', {
        error: error,
        errorCode: error.code,
        errorMessage: error.message,
        userData: {
          role: userData.role,
          name: userData.name,
          email: email
        },
        timestamp: new Date().toISOString()
      });
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        if (DEBUG_AUTH) console.error('📧 البريد الإلكتروني مستخدم بالفعل:', {
          email: email,
          role: userData.role,
          suggestion: 'يجب على المستخدم استخدام بريد إلكتروني مختلف أو تسجيل الدخول'
        });
        throw new Error('هذا البريد الإلكتروني مسجل بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.');
      } else if (error.code === 'auth/weak-password') {
        if (DEBUG_AUTH) console.error('🔒 كلمة المرور ضعيفة:', {
          email: email,
          role: userData.role
        });
        throw new Error('كلمة المرور ضعيفة جداً. يرجى اختيار كلمة مرور أقوى.');
      } else if (error.code === 'auth/invalid-email') {
        if (DEBUG_AUTH) console.error('📧 البريد الإلكتروني غير صالح:', {
          email: email,
          role: userData.role
        });
        throw new Error('البريد الإلكتروني غير صالح. يرجى التحقق من صحة البريد الإلكتروني.');
      } else if (error.code === 'auth/network-request-failed' || error.code === 'unavailable') {
        if (DEBUG_AUTH) console.warn('🌐 فشل طلب الشبكة أثناء التسجيل:', error.message);
        setIsOffline(true);
        throw new Error('فشل في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
      } else {
        if (DEBUG_AUTH) console.error('❌ خطأ غير متوقع في التسجيل:', {
          errorCode: error.code,
          errorMessage: error.message,
          fullError: error
        });
        throw new Error('حدث خطأ غير متوقع أثناء التسجيل. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user: firebaseUser } = await signInWithPopup(auth, provider);
      
      // Check if user document exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        // Create user document for Google sign-in users
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: firebaseUser.displayName || 'مستخدم جديد',
          email: firebaseUser.email,
          role: 'student', // Default role for Google sign-in
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'active'
        });
      }
      
      // The onAuthStateChanged listener will handle setting the user state
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed' || error.code === 'unavailable') {
        console.warn('Network request failed during Google login:', error.message);
        setIsOffline(true);
        throw new Error('فشل في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.');
      } else {
        console.error('Google login error:', error);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if logout fails, clear the local user state
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isOffline,
    login,
    register,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};