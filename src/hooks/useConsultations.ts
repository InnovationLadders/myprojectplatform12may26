import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, Timestamp, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { getConsultants } from '../lib/firebase';

export interface Consultant {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  reviews: number;
  experience: string;
  avatar: string;
  hourlyRate: number;
  availability: string;
  languages: string[];
  location: string;
}

export interface Consultation {
  id: string;
  mentor_id: string | null;
  mentor_name?: string;
  student_id: string;
  project_id: string | null;
  topic: string;
  description: string;
  type: string;
  status: string;
  method: string;
  duration: number;
  scheduledDate?: string;
  preferredDate?: string;
  completedAt?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
}

export const useConsultations = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      console.log('Fetching consultants...');
      const consultantsData = await getConsultants();
      console.log('Consultants data received:', consultantsData);
      setConsultants(consultantsData || []);
    } catch (err) {
      console.error('Error fetching consultants:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل المستشارين');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Create a reference to the consultations collection
      const consultationsRef = collection(db, 'consultations');
      let q;
      
      if (user.role === 'student') {
        q = query(consultationsRef, where('student_id', '==', user.id));
      } else if (user.role === 'teacher' || user.role === 'consultant') {
        // For teachers/consultants, get both assigned consultations and unassigned ones
        const assignedQuery = query(consultationsRef, where('mentor_id', '==', user.id));
        const assignedSnapshot = await getDocs(assignedQuery);
        
        // Get unassigned consultations (where mentor_id is null)
        const unassignedQuery = query(consultationsRef, where('mentor_id', '==', null));
        const unassignedSnapshot = await getDocs(unassignedQuery);
        
        // Combine both results
        const combinedDocs = [...assignedSnapshot.docs, ...unassignedSnapshot.docs];
        
        if (combinedDocs.length === 0) {
          setConsultations([]);
          setLoading(false);
          return;
        }
        
        const consultationsData = await Promise.all(combinedDocs.map(async (consultationDoc) => {
          const data = consultationDoc.data();
          let mentorName = null;
          
          if (data.mentor_id) {
            try {
              const mentorDocRef = doc(db, 'users', data.mentor_id);
              const mentorDoc = await getDoc(mentorDocRef);
              if (mentorDoc.exists()) {
                mentorName = mentorDoc.data().name;
              }
            } catch (err) {
              console.error('Error fetching mentor data:', err);
            }
          }
          
          return {
            id: consultationDoc.id,
            mentor_id: data.mentor_id || null,
            mentor_name: mentorName,
            student_id: data.student_id,
            project_id: data.project_id || null,
            topic: data.topic,
            description: data.description,
            type: data.type,
            status: data.status,
            method: data.method || 'video',
            duration: data.duration || 60,
            scheduledDate: data.scheduled_at ? new Date(data.scheduled_at.toDate()).toISOString() : undefined,
            preferredDate: data.preferred_date ? new Date(data.preferred_date.toDate()).toISOString() : undefined,
            completedAt: data.completed_at ? new Date(data.completed_at.toDate()).toISOString() : undefined,
            rating: data.rating,
            feedback: data.feedback,
            createdAt: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString()
          };
        }));
        
        setConsultations(consultationsData);
        setLoading(false);
        return;
      } else {
        // Admin can see all consultations
        q = consultationsRef;
      }
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // No consultations found, initialize with empty array
        setConsultations([]);
        setLoading(false);
        return;
      }
      
      const consultationsData = await Promise.all(snapshot.docs.map(async (consultationDoc) => {
        const data = consultationDoc.data();
        let mentorName = null;
        
        if (data.mentor_id) {
          try {
            const mentorDocRef = doc(db, 'users', data.mentor_id);
            const mentorDoc = await getDoc(mentorDocRef);
            if (mentorDoc.exists()) {
              mentorName = mentorDoc.data().name;
            }
          } catch (err) {
            console.error('Error fetching mentor data:', err);
          }
        }
        
        return {
          id: consultationDoc.id,
          mentor_id: data.mentor_id || null,
          mentor_name: mentorName,
          student_id: data.student_id,
          project_id: data.project_id || null,
          topic: data.topic,
          description: data.description,
          type: data.type,
          status: data.status,
          method: data.method || 'video',
          duration: data.duration || 60,
          scheduledDate: data.scheduled_at ? new Date(data.scheduled_at.toDate()).toISOString() : undefined,
          preferredDate: data.preferred_date ? new Date(data.preferred_date.toDate()).toISOString() : undefined,
          completedAt: data.completed_at ? new Date(data.completed_at.toDate()).toISOString() : undefined,
          rating: data.rating,
          feedback: data.feedback,
          createdAt: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString()
        };
      }));
      
      setConsultations(consultationsData);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل الاستشارات');
    } finally {
      setLoading(false);
    }
  };

  const createConsultation = async (consultationData: Partial<Consultation>) => {
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');

    try {
      // Create a reference to the consultations collection
      const consultationRef = collection(db, 'consultations');
      
      // Prepare the data to be saved
      const newConsultation = {
        student_id: user.id,
        mentor_id: consultationData.mentor_id || null,
        project_id: consultationData.project_id || null,
        topic: consultationData.topic,
        description: consultationData.description,
        type: consultationData.type,
        status: consultationData.status || 'pending',
        method: consultationData.method || 'video',
        duration: consultationData.duration || 60,
        scheduled_at: consultationData.scheduledDate ? Timestamp.fromDate(new Date(consultationData.scheduledDate)) : null,
        preferred_date: consultationData.preferredDate ? Timestamp.fromDate(new Date(consultationData.preferredDate)) : null,
        created_at: serverTimestamp()
      };
      
      // Add the document to Firestore
      const docRef = await addDoc(consultationRef, newConsultation);
      
      // Refresh the consultations list
      await fetchConsultations();
      
      return { id: docRef.id, ...newConsultation };
    } catch (err) {
      console.error('Error creating consultation:', err);
      throw err;
    }
  };

  const updateConsultation = async (id: string, updates: Partial<Consultation>) => {
    try {
      // Create a reference to the consultation document
      const consultationRef = doc(db, 'consultations', id);
      
      // Prepare the data to be updated
      const updateData: any = {};
      
      if (updates.status) updateData.status = updates.status;
      if (updates.mentor_id) updateData.mentor_id = updates.mentor_id;
      if (updates.scheduledDate) updateData.scheduled_at = Timestamp.fromDate(new Date(updates.scheduledDate));
      if (updates.completedAt) updateData.completed_at = Timestamp.fromDate(new Date(updates.completedAt));
      if (updates.rating !== undefined) updateData.rating = updates.rating;
      if (updates.feedback) updateData.feedback = updates.feedback;
      
      // Add updated_at timestamp
      updateData.updated_at = serverTimestamp();
      
      // Update the document in Firestore
      await updateDoc(consultationRef, updateData);
      
      // Refresh the consultations list
      await fetchConsultations();
    } catch (err) {
      console.error('Error updating consultation:', err);
      throw err;
    }
  };

  const acceptConsultation = async (id: string, scheduledDate?: string) => {
    if (!user) throw new Error('يجب تسجيل الدخول أولاً');
    
    try {
      // Create a reference to the consultation document
      const consultationRef = doc(db, 'consultations', id);
      
      // Prepare the data to be updated
      const updateData: any = {
        mentor_id: user.id,
        status: 'scheduled',
        updated_at: serverTimestamp()
      };
      
      // Add scheduled date if provided
      if (scheduledDate) {
        updateData.scheduled_at = Timestamp.fromDate(new Date(scheduledDate));
      }
      
      // Update the document in Firestore
      await updateDoc(consultationRef, updateData);
      
      // Refresh the consultations list
      await fetchConsultations();
    } catch (err) {
      console.error('Error accepting consultation:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchConsultations();
      fetchConsultants();
    }
  }, [user]);

  return {
    consultations,
    consultants,
    loading,
    error,
    fetchConsultations,
    fetchConsultants,
    createConsultation,
    updateConsultation,
    acceptConsultation
  };
};