import { useState, useEffect } from 'react';
import { getSchoolById } from '../lib/firebase';

interface School {
  id: string;
  name: string;
  email: string;
  logo_url?: string;
  subdomain?: string;
  status: string;
}

interface UseUserSchoolResult {
  school: School | null;
  schoolName: string | null;
  loading: boolean;
  error: string | null;
}

export const useUserSchool = (schoolId: string | null | undefined): UseUserSchoolResult => {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      console.log('🏫 useUserSchool - School ID received:', schoolId);

      if (!schoolId) {
        console.log('⚠️ useUserSchool - No school_id provided, skipping fetch');
        setSchool(null);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        console.log('🔄 useUserSchool - Starting fetch for school:', schoolId);
        setLoading(true);
        setError(null);

        const schoolData = await getSchoolById(schoolId);
        console.log('📦 useUserSchool - School data received:', schoolData);

        if (schoolData) {
          console.log('✅ useUserSchool - School found:', schoolData.name);
          setSchool(schoolData);
        } else {
          console.warn('❌ useUserSchool - No school found for ID:', schoolId);
          setSchool(null);
          setError('لم يتم العثور على المؤسسة التعليمية');
        }
      } catch (err) {
        console.error('❌ useUserSchool - Error fetching school:', err);
        setError('حدث خطأ أثناء تحميل بيانات المؤسسة');
        setSchool(null);
      } finally {
        setLoading(false);
        console.log('🏁 useUserSchool - Fetch complete');
      }
    };

    fetchSchool();
  }, [schoolId]);

  return {
    school,
    schoolName: school?.name || null,
    loading,
    error
  };
};
