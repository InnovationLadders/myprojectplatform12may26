import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Activity,
  ChatActivityData,
  FileUploadActivityData,
  EvaluationActivityData
} from '../types/activity';

export async function logChatActivity(
  projectId: string,
  userId: string,
  userName: string,
  messagePreview: string,
  projectTitle: string
): Promise<void> {
  try {
    const activityData: ChatActivityData = {
      messagePreview: messagePreview.substring(0, 100)
    };

    await addDoc(collection(db, 'activities'), {
      project_id: projectId,
      user_id: userId,
      user_name: userName,
      activity_type: 'chat',
      activity_data: activityData,
      created_at: Timestamp.now(),
      project_title: projectTitle
    });
  } catch (error) {
    console.error('Error logging chat activity:', error);
  }
}

export async function logFileUploadActivity(
  projectId: string,
  userId: string,
  userName: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  projectTitle: string
): Promise<void> {
  try {
    let fileCategory: 'image' | 'video' | 'document' = 'document';
    if (fileType.startsWith('image/')) {
      fileCategory = 'image';
    } else if (fileType.startsWith('video/')) {
      fileCategory = 'video';
    }

    const activityData: FileUploadActivityData = {
      fileName,
      fileSize,
      fileType,
      fileCategory
    };

    await addDoc(collection(db, 'activities'), {
      project_id: projectId,
      user_id: userId,
      user_name: userName,
      activity_type: 'file_upload',
      activity_data: activityData,
      created_at: Timestamp.now(),
      project_title: projectTitle
    });
  } catch (error) {
    console.error('Error logging file upload activity:', error);
  }
}

export async function logEvaluationActivity(
  projectId: string,
  userId: string,
  userName: string,
  changes: Array<{ criterionName: string; oldScore: number; newScore: number }>,
  projectTitle: string
): Promise<void> {
  try {
    if (changes.length === 0) {
      return;
    }

    const activityData: EvaluationActivityData = {
      changes
    };

    await addDoc(collection(db, 'activities'), {
      project_id: projectId,
      user_id: userId,
      user_name: userName,
      activity_type: 'evaluation_update',
      activity_data: activityData,
      created_at: Timestamp.now(),
      project_title: projectTitle
    });
  } catch (error) {
    console.error('Error logging evaluation activity:', error);
  }
}

async function getActiveProjectIds(userId: string, userRole: string): Promise<string[]> {
  try {
    const projectIds: string[] = [];

    if (userRole === 'teacher') {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('teacher_id', '==', userId),
        where('status', 'in', ['active', 'in_progress'])
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      projectsSnapshot.docs.forEach(doc => projectIds.push(doc.id));
    } else if (userRole === 'school') {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('school_id', '==', userId),
        where('status', 'in', ['active', 'in_progress'])
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      projectsSnapshot.docs.forEach(doc => projectIds.push(doc.id));
    }

    if (userRole === 'student' || userRole === 'teacher') {
      const projectStudentsQuery = query(
        collection(db, 'project_students'),
        where('student_id', '==', userId)
      );
      const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
      const memberProjectIds = projectStudentsSnapshot.docs.map(doc => doc.data().project_id);

      for (const projectId of memberProjectIds) {
        if (!projectIds.includes(projectId)) {
          const projectQuery = query(
            collection(db, 'projects'),
            where('__name__', '==', projectId)
          );
          const projectSnapshot = await getDocs(projectQuery);
          if (!projectSnapshot.empty) {
            const projectData = projectSnapshot.docs[0].data();
            if (projectData.status === 'active' || projectData.status === 'in_progress') {
              projectIds.push(projectId);
            }
          }
        }
      }
    }

    return [...new Set(projectIds)];
  } catch (error) {
    console.error('Error getting active project IDs:', error);
    return [];
  }
}

export async function getRecentActivities(userId: string, userRole: string): Promise<Activity[]> {
  try {
    const projectIds = await getActiveProjectIds(userId, userRole);

    if (projectIds.length === 0) {
      return [];
    }

    const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    const activities: Activity[] = [];
    const chunks = [];
    for (let i = 0; i < projectIds.length; i += 10) {
      chunks.push(projectIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('project_id', 'in', chunk),
        where('created_at', '>=', oneDayAgo),
        orderBy('created_at', 'desc'),
        limit(50)
      );

      const activitiesSnapshot = await getDocs(activitiesQuery);

      activitiesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          project_id: data.project_id,
          user_id: data.user_id,
          user_name: data.user_name,
          activity_type: data.activity_type,
          activity_data: data.activity_data,
          created_at: data.created_at.toDate(),
          project_title: data.project_title
        });
      });
    }

    return activities
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 50);
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
}

export function subscribeToActivities(
  userId: string,
  userRole: string,
  callback: (activities: Activity[]) => void
): () => void {
  let unsubscribe: Unsubscribe | null = null;

  getActiveProjectIds(userId, userRole).then(projectIds => {
    if (projectIds.length === 0) {
      callback([]);
      return;
    }

    const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    const limitedProjectIds = projectIds.slice(0, 10);

    const activitiesQuery = query(
      collection(db, 'activities'),
      where('project_id', 'in', limitedProjectIds),
      where('created_at', '>=', oneDayAgo),
      orderBy('created_at', 'desc'),
      limit(50)
    );

    unsubscribe = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const activities: Activity[] = [];

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            project_id: data.project_id,
            user_id: data.user_id,
            user_name: data.user_name,
            activity_type: data.activity_type,
            activity_data: data.activity_data,
            created_at: data.created_at.toDate(),
            project_title: data.project_title
          });
        });

        callback(activities);
      },
      (error) => {
        console.error('Error in activities subscription:', error);
        callback([]);
      }
    );
  }).catch(error => {
    console.error('Error setting up activities subscription:', error);
    callback([]);
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}
