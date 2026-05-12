import { useState, useEffect } from 'react';
import { getStudentsBySchoolId } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  grade: string | null;
  school_id: string;
  created_at: string;
}

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStudents = async () => {
    if (!user || !user.school_id) return;

    try {
      setLoading(true);
      const schoolStudents = await getStudentsBySchoolId(user.school_id);
      setStudents(schoolStudents as Student[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل الطلاب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.school_id) {
      fetchStudents();
    }
  }, [user]);

  return {
    students,
    loading,
    error,
    fetchStudents,
  };
};