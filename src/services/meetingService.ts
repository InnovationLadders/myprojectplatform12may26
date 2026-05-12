import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, firestoreDoc } from '../lib/firebase';
import type { ProjectMeeting } from '../types/meeting';

export const getProjectMeeting = async (projectId: string): Promise<ProjectMeeting | null> => {
  try {
    const meetingsRef = collection(db, 'project_meetings');
    const q = query(
      meetingsRef,
      where('project_id', '==', projectId),
      where('meeting_status', '==', 'active')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      project_id: data.project_id,
      meeting_code: data.meeting_code,
      meeting_link: data.meeting_link,
      meeting_status: data.meeting_status,
      started_by_user_id: data.started_by_user_id,
      started_by_user_name: data.started_by_user_name || null,
      started_at: data.started_at?.toDate() || new Date(),
      updated_at: data.updated_at?.toDate() || new Date(),
      created_at: data.created_at?.toDate() || new Date()
    };
  } catch (err) {
    console.error('Error in getProjectMeeting:', err);
    return null;
  }
};

export const createProjectMeeting = async (
  projectId: string,
  meetingLink: string,
  userId: string,
  userName: string
): Promise<ProjectMeeting | null> => {
  try {
    const meetingCode = `meeting-${projectId}-${Date.now()}`;

    const meetingsRef = collection(db, 'project_meetings');
    const docRef = await addDoc(meetingsRef, {
      project_id: projectId,
      meeting_code: meetingCode,
      meeting_link: meetingLink,
      meeting_status: 'active',
      started_by_user_id: userId,
      started_by_user_name: userName,
      started_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      created_at: serverTimestamp()
    });

    return {
      id: docRef.id,
      project_id: projectId,
      meeting_code: meetingCode,
      meeting_link: meetingLink,
      meeting_status: 'active',
      started_by_user_id: userId,
      started_by_user_name: userName,
      started_at: new Date(),
      updated_at: new Date(),
      created_at: new Date()
    };
  } catch (err) {
    console.error('Error in createProjectMeeting:', err);
    return null;
  }
};

export const resetProjectMeeting = async (projectId: string): Promise<boolean> => {
  try {
    const meetingsRef = collection(db, 'project_meetings');
    const q = query(meetingsRef, where('project_id', '==', projectId));

    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    return true;
  } catch (err) {
    console.error('Error in resetProjectMeeting:', err);
    return false;
  }
};

export const subscribeToProjectMeeting = (
  projectId: string,
  callback: (meeting: ProjectMeeting | null) => void
): Unsubscribe => {
  const meetingsRef = collection(db, 'project_meetings');
  const q = query(
    meetingsRef,
    where('project_id', '==', projectId)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const activeMeeting = snapshot.docs.find(
        doc => doc.data().meeting_status === 'active'
      );

      if (!activeMeeting) {
        callback(null);
        return;
      }

      const data = activeMeeting.data();
      callback({
        id: activeMeeting.id,
        project_id: data.project_id,
        meeting_code: data.meeting_code,
        meeting_link: data.meeting_link,
        meeting_status: data.meeting_status,
        started_by_user_id: data.started_by_user_id,
        started_by_user_name: data.started_by_user_name || null,
        started_at: data.started_at?.toDate() || new Date(),
        updated_at: data.updated_at?.toDate() || new Date(),
        created_at: data.created_at?.toDate() || new Date()
      });
    },
    (error) => {
      console.error('Error in subscribeToProjectMeeting:', error);
      callback(null);
    }
  );

  return unsubscribe;
};
