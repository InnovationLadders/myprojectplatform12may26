import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface InvestorInterestRequest {
  id: string;
  investor_id: string;
  investor_name: string;
  investor_company?: string;
  project_id: string;
  project_title: string;
  school_id: string;
  school_name?: string;
  status: 'pending' | 'in_progress' | 'closed';
  investor_notes: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export const useInvestorRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<InvestorInterestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      let q;
      if (user.role === 'investor') {
        q = query(
          collection(db, 'investor_interest_requests'),
          where('investor_id', '==', user.id)
        );
      } else if (user.role === 'school') {
        q = query(
          collection(db, 'investor_interest_requests'),
          where('school_id', '==', user.id)
        );
      } else if (user.role === 'admin') {
        q = query(
          collection(db, 'investor_interest_requests')
        );
      } else {
        setLoading(false);
        return;
      }

      const snapshot = await getDocs(q);
      const data: InvestorInterestRequest[] = snapshot.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          investor_id: raw.investor_id || '',
          investor_name: raw.investor_name || '',
          investor_company: raw.investor_company || '',
          project_id: raw.project_id || '',
          project_title: raw.project_title || '',
          school_id: raw.school_id || '',
          school_name: raw.school_name || '',
          status: raw.status || 'pending',
          investor_notes: raw.investor_notes || '',
          admin_notes: raw.admin_notes || '',
          created_at: raw.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          updated_at: raw.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });

      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRequests(data);
    } catch (err) {
      console.error('Error fetching investor requests:', err);
      setError('حدث خطأ في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (params: {
    project_id: string;
    project_title: string;
    school_id: string;
    school_name: string;
    investor_notes: string;
  }) => {
    if (!user || user.role !== 'investor') throw new Error('غير مصرح');

    const docRef = await addDoc(collection(db, 'investor_interest_requests'), {
      investor_id: user.id,
      investor_name: user.name,
      investor_company: user.company_name || null,
      project_id: params.project_id,
      project_title: params.project_title,
      school_id: params.school_id,
      school_name: params.school_name,
      status: 'pending',
      investor_notes: params.investor_notes,
      admin_notes: '',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Send in-platform notifications
    await sendNewRequestNotifications(docRef.id, params.project_title, params.school_id);

    await fetchRequests();
    return docRef.id;
  };

  const sendNewRequestNotifications = async (
    requestId: string,
    projectTitle: string,
    schoolId: string
  ) => {
    if (!user) return;
    try {
      // Notify the school admin
      await addDoc(collection(db, 'notifications'), {
        recipient_id: schoolId,
        type: 'investor',
        title: 'طلب اهتمام مستثمر جديد',
        message: `المستثمر "${user.name}" أبدى اهتماماً بمشروع "${projectTitle}"`,
        related_id: requestId,
        read: false,
        created_at: serverTimestamp(),
      });

      // Notify all admins
      const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      const adminsSnapshot = await getDocs(adminsQuery);
      const adminNotifications = adminsSnapshot.docs.map(adminDoc =>
        addDoc(collection(db, 'notifications'), {
          recipient_id: adminDoc.id,
          type: 'investor',
          title: 'طلب اهتمام مستثمر جديد',
          message: `المستثمر "${user.name}" أبدى اهتماماً بمشروع "${projectTitle}"`,
          related_id: requestId,
          read: false,
          created_at: serverTimestamp(),
        })
      );
      await Promise.all(adminNotifications);
    } catch (err) {
      console.warn('Failed to send notifications (non-critical):', err);
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: 'pending' | 'in_progress' | 'closed',
    admin_notes: string
  ) => {
    const requestRef = doc(db, 'investor_interest_requests', requestId);
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) throw new Error('الطلب غير موجود');

    await updateDoc(requestRef, {
      status,
      admin_notes,
      updated_at: serverTimestamp(),
    });

    // Notify the investor
    const data = requestDoc.data();
    const statusLabel = status === 'in_progress' ? 'تحت المعالجة' : 'مغلق';
    try {
      await addDoc(collection(db, 'notifications'), {
        recipient_id: data.investor_id,
        type: 'investor',
        title: 'تحديث على طلب الاهتمام',
        message: `تم تحديث حالة طلبك للمشروع "${data.project_title}" إلى: ${statusLabel}${admin_notes ? `\nملاحظة: ${admin_notes}` : ''}`,
        related_id: requestId,
        read: false,
        created_at: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Failed to send investor notification:', err);
    }

    await fetchRequests();
  };

  const checkExistingRequest = async (project_id: string): Promise<InvestorInterestRequest | null> => {
    if (!user || user.role !== 'investor') return null;
    try {
      const q = query(
        collection(db, 'investor_interest_requests'),
        where('investor_id', '==', user.id),
        where('project_id', '==', project_id)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const d = snapshot.docs[0];
      const raw = d.data();
      return {
        id: d.id,
        investor_id: raw.investor_id,
        investor_name: raw.investor_name,
        investor_company: raw.investor_company,
        project_id: raw.project_id,
        project_title: raw.project_title,
        school_id: raw.school_id,
        school_name: raw.school_name,
        status: raw.status,
        investor_notes: raw.investor_notes,
        admin_notes: raw.admin_notes,
        created_at: raw.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: raw.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (user && (user.role === 'investor' || user.role === 'school' || user.role === 'admin')) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    requests,
    loading,
    error,
    fetchRequests,
    createRequest,
    updateRequestStatus,
    checkExistingRequest,
  };
};
