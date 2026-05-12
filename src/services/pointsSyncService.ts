import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { getAchievementConfig } from './rewardPointsService';

export interface PointsSnapshot {
  userId: string;
  totalPoints: number;
  initiationPoints: number;
  progressPoints: number;
  chatPoints: number;
  filePoints: number;
  weightedScorePoints: number;
  lastCalculated: string;
  isConsistent: boolean;
}

export const calculateStudentPointsFromSource = async (studentId: string): Promise<PointsSnapshot> => {
  try {
    const config = await getAchievementConfig();

    const projectStudentsQuery = query(
      collection(db, 'project_students'),
      where('student_id', '==', studentId)
    );
    const projectStudentsSnapshot = await getDocs(projectStudentsQuery);

    let initiationPoints = 0;
    let progressPoints = 0;
    let weightedScorePoints = 0;

    if (!projectStudentsSnapshot.empty) {
      const projectIds = projectStudentsSnapshot.docs.map(doc => doc.data().project_id);

      const projects = [];
      for (const projectId of projectIds) {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          projects.push({ id: projectDoc.id, ...projectData });

          if (projectData.status === 'active' || projectData.status === 'approved') {
            initiationPoints += config.approvedProjectPoints;
          }

          progressPoints += Math.floor((projectData.progress || 0) * config.progressPointsPerPercent);
        }
      }

      if (projectIds.length > 0) {
        const evaluationsQuery = query(
          collection(db, 'project_evaluations'),
          where('projectId', 'in', projectIds)
        );
        const evaluationsSnapshot = await getDocs(evaluationsQuery);

        evaluationsSnapshot.forEach(evalDoc => {
          const data = evalDoc.data();
          const criteria = data.criteria as Array<{ score: number; weight: number }>;
          const weightedScore = criteria.reduce((sum, criterion) =>
            sum + (criterion.score * criterion.weight), 0
          );
          weightedScorePoints += Math.floor(weightedScore * config.weightedScorePointsPerUnit);
        });
      }
    }

    const pointsQuery = query(
      collection(db, 'student_points'),
      where('userId', '==', studentId),
      limit(1)
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    let chatPoints = 0;
    let filePoints = 0;

    if (!pointsSnapshot.empty) {
      const pointsData = pointsSnapshot.docs[0].data();
      chatPoints = pointsData.chatPoints || 0;
      filePoints = pointsData.filePoints || 0;
    }

    const totalPoints = initiationPoints + progressPoints + weightedScorePoints + chatPoints + filePoints;

    return {
      userId: studentId,
      totalPoints,
      initiationPoints,
      progressPoints,
      chatPoints,
      filePoints,
      weightedScorePoints,
      lastCalculated: new Date().toISOString(),
      isConsistent: true,
    };
  } catch (error) {
    console.error('Error calculating student points from source:', error);
    throw error;
  }
};

export const syncStudentPoints = async (studentId: string): Promise<void> => {
  try {
    console.log(`🔄 Syncing points for student: ${studentId}`);

    const calculatedPoints = await calculateStudentPointsFromSource(studentId);

    const pointsQuery = query(
      collection(db, 'student_points'),
      where('userId', '==', studentId),
      limit(1)
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    if (!pointsSnapshot.empty) {
      const docRef = pointsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        totalPoints: calculatedPoints.totalPoints,
        initiationPoints: calculatedPoints.initiationPoints,
        progressPoints: calculatedPoints.progressPoints,
        weightedScorePoints: calculatedPoints.weightedScorePoints,
        chatPoints: calculatedPoints.chatPoints,
        filePoints: calculatedPoints.filePoints,
        lastUpdated: serverTimestamp(),
      });
      console.log(`✅ Points synced for student ${studentId}: ${calculatedPoints.totalPoints} total points`);
    } else {
      await addDoc(collection(db, 'student_points'), {
        userId: studentId,
        totalPoints: calculatedPoints.totalPoints,
        initiationPoints: calculatedPoints.initiationPoints,
        progressPoints: calculatedPoints.progressPoints,
        chatPoints: calculatedPoints.chatPoints,
        filePoints: calculatedPoints.filePoints,
        weightedScorePoints: calculatedPoints.weightedScorePoints,
        lastUpdated: serverTimestamp(),
      });
      console.log(`✅ Points record created for student ${studentId}: ${calculatedPoints.totalPoints} total points`);
    }
  } catch (error) {
    console.error('Error syncing student points:', error);
    throw error;
  }
};

export const checkPointsConsistency = async (studentId: string): Promise<{
  isConsistent: boolean;
  storedPoints: number;
  calculatedPoints: number;
  difference: number;
}> => {
  try {
    const pointsQuery = query(
      collection(db, 'student_points'),
      where('userId', '==', studentId),
      limit(1)
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    const storedPoints = pointsSnapshot.empty ? 0 : (pointsSnapshot.docs[0].data().totalPoints || 0);

    const calculated = await calculateStudentPointsFromSource(studentId);
    const calculatedPoints = calculated.totalPoints;

    const difference = Math.abs(storedPoints - calculatedPoints);
    const isConsistent = difference === 0;

    return {
      isConsistent,
      storedPoints,
      calculatedPoints,
      difference,
    };
  } catch (error) {
    console.error('Error checking points consistency:', error);
    throw error;
  }
};

export const subscribeToStudentPoints = (
  studentId: string,
  onUpdate: (points: {
    userId: string;
    totalPoints: number;
    initiationPoints: number;
    progressPoints: number;
    chatPoints: number;
    filePoints: number;
    weightedScorePoints: number;
    lastUpdated: string;
  }) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const pointsQuery = query(
    collection(db, 'student_points'),
    where('userId', '==', studentId),
    limit(1)
  );

  return onSnapshot(
    pointsQuery,
    (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        onUpdate({
          userId: data.userId,
          totalPoints: data.totalPoints || 0,
          initiationPoints: data.initiationPoints || 0,
          progressPoints: data.progressPoints || 0,
          chatPoints: data.chatPoints || 0,
          filePoints: data.filePoints || 0,
          weightedScorePoints: data.weightedScorePoints || 0,
          lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      } else {
        onUpdate({
          userId: studentId,
          totalPoints: 0,
          initiationPoints: 0,
          progressPoints: 0,
          chatPoints: 0,
          filePoints: 0,
          weightedScorePoints: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    },
    (error) => {
      console.error('Error in points subscription:', error);
      if (onError) {
        onError(error);
      }
    }
  );
};

export const syncAllProjectStudents = async (projectId: string): Promise<void> => {
  try {
    console.log(`🔄 Syncing all students for project: ${projectId}`);

    const projectStudentsQuery = query(
      collection(db, 'project_students'),
      where('project_id', '==', projectId)
    );
    const projectStudentsSnapshot = await getDocs(projectStudentsQuery);

    const studentIds = projectStudentsSnapshot.docs.map(doc => doc.data().student_id);

    for (const studentId of studentIds) {
      await syncStudentPoints(studentId);
    }

    console.log(`✅ Synced points for ${studentIds.length} students in project ${projectId}`);
  } catch (error) {
    console.error('Error syncing project students:', error);
    throw error;
  }
};
