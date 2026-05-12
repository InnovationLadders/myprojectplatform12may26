import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  deleteDoc,
} from 'firebase/firestore';

export interface StudentPoints {
  userId: string;
  totalPoints: number;
  initiationPoints: number;
  progressPoints: number;
  chatPoints: number;
  filePoints: number;
  weightedScorePoints: number;
  lastUpdated: string;
}

export interface PointsHistory {
  id?: string;
  studentId: string;
  activityType: 'project_activation' | 'progress_update' | 'chat_message' | 'file_upload' | 'weighted_score' | 'manual_adjustment';
  pointsEarned: number;
  projectId?: string | null;
  description: string;
  timestamp: string;
  metadata?: Record<string, any> | null;
}

export interface AchievementConfig {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
  trophy: number;
  approvedProjectPoints: number;
  progressPointsPerPercent: number;
  chatMessagePoints: number;
  fileUploadPoints: number;
  weightedScorePointsPerUnit: number;
}

export interface StudentAchievement {
  id?: string;
  studentId: string;
  achievementType: 'bronze' | 'silver' | 'gold' | 'platinum' | 'trophy';
  level: number;
  earnedAt: string;
  pointsAtUnlock: number;
}

const DEFAULT_CONFIG: AchievementConfig = {
  bronze: 100,
  silver: 250,
  gold: 500,
  platinum: 750,
  trophy: 1000,
  approvedProjectPoints: 10,
  progressPointsPerPercent: 1,
  chatMessagePoints: 1,
  fileUploadPoints: 5,
  weightedScorePointsPerUnit: 10,
};

export const getAchievementConfig = async (): Promise<AchievementConfig> => {
  try {
    const configRef = doc(db, 'points_config', 'default');
    const configDoc = await getDoc(configRef);

    if (!configDoc.exists()) {
      const configData = {
        approvedProjectPoints: DEFAULT_CONFIG.approvedProjectPoints,
        progressPointsPerPercent: DEFAULT_CONFIG.progressPointsPerPercent,
        chatMessagePoints: DEFAULT_CONFIG.chatMessagePoints,
        fileUploadPoints: DEFAULT_CONFIG.fileUploadPoints,
        weightedScorePointsPerUnit: DEFAULT_CONFIG.weightedScorePointsPerUnit,
        bronzeThreshold: DEFAULT_CONFIG.bronze,
        silverThreshold: DEFAULT_CONFIG.silver,
        goldThreshold: DEFAULT_CONFIG.gold,
        platinumThreshold: DEFAULT_CONFIG.platinum,
        trophyThreshold: DEFAULT_CONFIG.trophy,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(configRef, configData).catch(async () => {
        await addDoc(collection(db, 'points_config'), { ...configData, id: 'default' });
      });

      return DEFAULT_CONFIG;
    }

    const data = configDoc.data();
    return {
      bronze: data.bronzeThreshold || DEFAULT_CONFIG.bronze,
      silver: data.silverThreshold || DEFAULT_CONFIG.silver,
      gold: data.goldThreshold || DEFAULT_CONFIG.gold,
      platinum: data.platinumThreshold || DEFAULT_CONFIG.platinum,
      trophy: data.trophyThreshold || DEFAULT_CONFIG.trophy,
      approvedProjectPoints: data.approvedProjectPoints || DEFAULT_CONFIG.approvedProjectPoints,
      progressPointsPerPercent: data.progressPointsPerPercent || DEFAULT_CONFIG.progressPointsPerPercent,
      chatMessagePoints: data.chatMessagePoints || DEFAULT_CONFIG.chatMessagePoints,
      fileUploadPoints: data.fileUploadPoints || DEFAULT_CONFIG.fileUploadPoints,
      weightedScorePointsPerUnit: data.weightedScorePointsPerUnit || DEFAULT_CONFIG.weightedScorePointsPerUnit,
    };
  } catch (error) {
    console.error('Error in getAchievementConfig:', error);
    return DEFAULT_CONFIG;
  }
};

export const updateAchievementConfig = async (config: AchievementConfig): Promise<void> => {
  try {
    const configRef = doc(db, 'points_config', 'default');

    await updateDoc(configRef, {
      approvedProjectPoints: config.approvedProjectPoints,
      progressPointsPerPercent: config.progressPointsPerPercent,
      chatMessagePoints: config.chatMessagePoints,
      fileUploadPoints: config.fileUploadPoints,
      weightedScorePointsPerUnit: config.weightedScorePointsPerUnit,
      bronzeThreshold: config.bronze,
      silverThreshold: config.silver,
      goldThreshold: config.gold,
      platinumThreshold: config.platinum,
      trophyThreshold: config.trophy,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error in updateAchievementConfig:', error);
    throw error;
  }
};

export const getStudentPoints = async (userId: string): Promise<StudentPoints> => {
  try {
    const pointsQuery = query(
      collection(db, 'student_points'),
      where('userId', '==', userId),
      limit(1)
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    if (pointsSnapshot.empty) {
      const newPoints: StudentPoints = {
        userId,
        totalPoints: 0,
        initiationPoints: 0,
        progressPoints: 0,
        chatPoints: 0,
        filePoints: 0,
        weightedScorePoints: 0,
        lastUpdated: new Date().toISOString(),
      };

      await addDoc(collection(db, 'student_points'), {
        userId,
        totalPoints: 0,
        initiationPoints: 0,
        progressPoints: 0,
        chatPoints: 0,
        filePoints: 0,
        weightedScorePoints: 0,
        lastUpdated: serverTimestamp(),
      });

      return newPoints;
    }

    const data = pointsSnapshot.docs[0].data();
    return {
      userId: data.userId,
      totalPoints: data.totalPoints || 0,
      initiationPoints: data.initiationPoints || 0,
      progressPoints: data.progressPoints || 0,
      chatPoints: data.chatPoints || 0,
      filePoints: data.filePoints || 0,
      weightedScorePoints: data.weightedScorePoints || 0,
      lastUpdated: data.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in getStudentPoints:', error);
    throw error;
  }
};

const addPointsHistory = async (history: Omit<PointsHistory, 'id' | 'timestamp'>): Promise<void> => {
  try {
    await addDoc(collection(db, 'points_history'), {
      studentId: history.studentId,
      activityType: history.activityType,
      pointsEarned: history.pointsEarned,
      projectId: history.projectId || null,
      description: history.description,
      metadata: history.metadata || null,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding points history:', error);
  }
};

const updateStudentPoints = async (
  userId: string,
  pointsToAdd: number,
  categoryField: 'initiationPoints' | 'progressPoints' | 'chatPoints' | 'filePoints' | 'weightedScorePoints'
): Promise<void> => {
  try {
    const currentPoints = await getStudentPoints(userId);

    const newCategoryValue = currentPoints[categoryField] + pointsToAdd;
    const newTotalPoints = currentPoints.totalPoints + pointsToAdd;

    const pointsQuery = query(
      collection(db, 'student_points'),
      where('userId', '==', userId),
      limit(1)
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    if (!pointsSnapshot.empty) {
      const docRef = pointsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        totalPoints: newTotalPoints,
        [categoryField]: newCategoryValue,
        lastUpdated: serverTimestamp(),
      });
    }

    await checkAndAwardAchievements(userId);
  } catch (error) {
    console.error('Error in updateStudentPoints:', error);
    throw error;
  }
};

export const awardProjectActivationPoints = async (
  studentId: string,
  projectId: string
): Promise<void> => {
  try {
    const config = await getAchievementConfig();
    const points = config.approvedProjectPoints;

    await updateStudentPoints(studentId, points, 'initiationPoints');

    await addPointsHistory({
      studentId,
      activityType: 'project_activation',
      pointsEarned: points,
      projectId,
      description: 'Project approved and activated',
    });
  } catch (error) {
    console.error('Error awarding project activation points:', error);
  }
};

export const recalculateStudentPoints = async (studentId: string): Promise<void> => {
  try {
    console.log('🔄 Recalculating points for student:', studentId);

    const projectStudentsQuery = query(
      collection(db, 'project_students'),
      where('student_id', '==', studentId)
    );
    const projectStudentsSnapshot = await getDocs(projectStudentsQuery);

    if (projectStudentsSnapshot.empty) {
      console.log('No projects found for student:', studentId);
      return;
    }

    const projectIds = projectStudentsSnapshot.docs.map(doc => doc.data().project_id);
    console.log('Found projects:', projectIds.length);

    const projects = [];
    for (const projectId of projectIds) {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        projects.push({ id: projectDoc.id, ...projectDoc.data() });
      }
    }

    const totalProgress = projects.reduce((sum, project) => sum + (project.progress || 0), 0);
    console.log('Total progress across all projects:', totalProgress);

    const evaluationsQuery = query(
      collection(db, 'project_evaluations'),
      where('projectId', 'in', projectIds.length > 0 ? projectIds : ['__none__'])
    );
    const evaluationsSnapshot = await getDocs(evaluationsQuery);

    let totalWeightedScore = 0;
    if (!evaluationsSnapshot.empty) {
      evaluationsSnapshot.forEach(evalDoc => {
        const data = evalDoc.data();
        const criteria = data.criteria as Array<{ score: number; weight: number }>;
        const weightedScore = criteria.reduce((sum, criterion) =>
          sum + (criterion.score * criterion.weight), 0
        );
        totalWeightedScore += weightedScore;
      });
    }
    console.log('Total weighted score across all projects:', totalWeightedScore.toFixed(2));

    const config = await getAchievementConfig();

    const newProgressPoints = Math.floor(totalProgress * config.progressPointsPerPercent);
    const newWeightedScorePoints = Math.floor(totalWeightedScore * config.weightedScorePointsPerUnit);

    console.log('Calculated points - Progress:', newProgressPoints, 'Weighted Score:', newWeightedScorePoints);

    const currentPoints = await getStudentPoints(studentId);

    const newTotal = currentPoints.initiationPoints + newProgressPoints +
      currentPoints.chatPoints + currentPoints.filePoints + newWeightedScorePoints;

    console.log('Updating student points - New total:', newTotal);

    const pointsQuery = query(
      collection(db, 'student_points'),
      where('userId', '==', studentId),
      limit(1)
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    if (!pointsSnapshot.empty) {
      const docRef = pointsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        totalPoints: newTotal,
        progressPoints: newProgressPoints,
        weightedScorePoints: newWeightedScorePoints,
        lastUpdated: serverTimestamp(),
      });
    }

    await checkAndAwardAchievements(studentId);

    console.log('✅ Points recalculated successfully');
  } catch (error) {
    console.error('Error recalculating student points:', error);
    throw error;
  }
};

export const awardProgressPoints = async (
  studentId: string,
  projectId: string,
  progressIncrease: number
): Promise<void> => {
  try {
    console.log('📊 Progress update triggered for student:', studentId, 'project:', projectId);

    await addPointsHistory({
      studentId,
      activityType: 'progress_update',
      pointsEarned: 0,
      projectId,
      description: 'Progress update recorded',
      metadata: { progressIncrease },
    });

    await recalculateStudentPoints(studentId);
  } catch (error) {
    console.error('Error awarding progress points:', error);
  }
};

export const awardChatMessagePoints = async (
  studentId: string,
  projectId: string
): Promise<void> => {
  try {
    const config = await getAchievementConfig();
    const points = config.chatMessagePoints;

    await updateStudentPoints(studentId, points, 'chatPoints');

    await addPointsHistory({
      studentId,
      activityType: 'chat_message',
      pointsEarned: points,
      projectId,
      description: 'Sent a chat message',
    });
  } catch (error) {
    console.error('Error awarding chat message points:', error);
  }
};

export const awardFileUploadPoints = async (
  studentId: string,
  projectId: string,
  fileName: string
): Promise<void> => {
  try {
    const config = await getAchievementConfig();
    const points = config.fileUploadPoints;

    await updateStudentPoints(studentId, points, 'filePoints');

    await addPointsHistory({
      studentId,
      activityType: 'file_upload',
      pointsEarned: points,
      projectId,
      description: `Uploaded file: ${fileName}`,
      metadata: { fileName },
    });
  } catch (error) {
    console.error('Error awarding file upload points:', error);
  }
};

export const awardWeightedScorePoints = async (
  studentId: string,
  projectId: string,
  weightedScore: number,
  previousWeightedScore: number = 0
): Promise<void> => {
  try {
    console.log('⚖️ Weighted score update triggered for student:', studentId, 'project:', projectId);

    await addPointsHistory({
      studentId,
      activityType: 'weighted_score',
      pointsEarned: 0,
      projectId,
      description: 'Weighted score update recorded',
      metadata: { weightedScore, previousWeightedScore },
    });

    await recalculateStudentPoints(studentId);
  } catch (error) {
    console.error('Error awarding weighted score points:', error);
  }
};

export const calculateAchievements = (totalPoints: number, config: AchievementConfig) => {
  const achievements = {
    trophy: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
  };

  let remaining = totalPoints;

  achievements.trophy = Math.floor(remaining / config.trophy);
  remaining = remaining % config.trophy;

  achievements.platinum = Math.floor(remaining / config.platinum);
  remaining = remaining % config.platinum;

  achievements.gold = Math.floor(remaining / config.gold);
  remaining = remaining % config.gold;

  achievements.silver = Math.floor(remaining / config.silver);
  remaining = remaining % config.silver;

  achievements.bronze = Math.floor(remaining / config.bronze);

  return achievements;
};

const checkAndAwardAchievements = async (studentId: string): Promise<void> => {
  try {
    const points = await getStudentPoints(studentId);
    const config = await getAchievementConfig();
    const achievements = calculateAchievements(points.totalPoints, config);

    const achievementsQuery = query(
      collection(db, 'student_achievements'),
      where('studentId', '==', studentId)
    );
    const achievementsSnapshot = await getDocs(achievementsQuery);

    const existingCounts: Record<string, number> = {
      trophy: 0,
      platinum: 0,
      gold: 0,
      silver: 0,
      bronze: 0,
    };

    achievementsSnapshot.forEach(doc => {
      const data = doc.data();
      existingCounts[data.achievementType]++;
    });

    const newAchievements: any[] = [];

    for (const [type, count] of Object.entries(achievements)) {
      const existingCount = existingCounts[type];
      const newAchievementsCount = count - existingCount;

      for (let i = 0; i < newAchievementsCount; i++) {
        newAchievements.push({
          studentId,
          achievementType: type,
          level: existingCount + i + 1,
          pointsAtUnlock: points.totalPoints,
          earnedAt: serverTimestamp(),
        });
      }
    }

    if (newAchievements.length > 0) {
      for (const achievement of newAchievements) {
        await addDoc(collection(db, 'student_achievements'), achievement);
      }
    }
  } catch (error) {
    console.error('Error checking and awarding achievements:', error);
  }
};

export const getStudentAchievements = async (studentId: string): Promise<StudentAchievement[]> => {
  try {
    const achievementsQuery = query(
      collection(db, 'student_achievements'),
      where('studentId', '==', studentId),
      orderBy('earnedAt', 'desc')
    );
    const achievementsSnapshot = await getDocs(achievementsQuery);

    return achievementsSnapshot.docs.map(doc => ({
      id: doc.id,
      studentId: doc.data().studentId,
      achievementType: doc.data().achievementType as 'bronze' | 'silver' | 'gold' | 'platinum' | 'trophy',
      level: doc.data().level,
      earnedAt: doc.data().earnedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      pointsAtUnlock: doc.data().pointsAtUnlock,
    }));
  } catch (error) {
    console.error('Error in getStudentAchievements:', error);
    return [];
  }
};

export const getPointsHistory = async (
  studentId: string,
  limitCount: number = 20
): Promise<PointsHistory[]> => {
  try {
    const historyQuery = query(
      collection(db, 'points_history'),
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const historySnapshot = await getDocs(historyQuery);

    return historySnapshot.docs.map(doc => ({
      id: doc.id,
      studentId: doc.data().studentId,
      activityType: doc.data().activityType as PointsHistory['activityType'],
      pointsEarned: doc.data().pointsEarned,
      projectId: doc.data().projectId,
      description: doc.data().description,
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      metadata: doc.data().metadata,
    }));
  } catch (error) {
    console.error('Error in getPointsHistory:', error);
    return [];
  }
};

export const getTopStudents = async (schoolId?: string, limitCount: number = 10): Promise<StudentPoints[]> => {
  try {
    const pointsQuery = query(
      collection(db, 'student_points'),
      orderBy('totalPoints', 'desc'),
      limit(limitCount)
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    return pointsSnapshot.docs.map(doc => ({
      userId: doc.data().userId,
      totalPoints: doc.data().totalPoints || 0,
      initiationPoints: doc.data().initiationPoints || 0,
      progressPoints: doc.data().progressPoints || 0,
      chatPoints: doc.data().chatPoints || 0,
      filePoints: doc.data().filePoints || 0,
      weightedScorePoints: doc.data().weightedScorePoints || 0,
      lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error in getTopStudents:', error);
    return [];
  }
};

export const manuallyAdjustPoints = async (
  studentId: string,
  pointsToAdd: number,
  reason: string,
  adminId: string
): Promise<void> => {
  try {
    const currentPoints = await getStudentPoints(studentId);
    const newTotal = Math.max(0, currentPoints.totalPoints + pointsToAdd);

    const pointsQuery = query(
      collection(db, 'student_points'),
      where('userId', '==', studentId),
      limit(1)
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    if (!pointsSnapshot.empty) {
      const docRef = pointsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        totalPoints: newTotal,
        lastUpdated: serverTimestamp(),
      });
    }

    await addPointsHistory({
      studentId,
      activityType: 'manual_adjustment',
      pointsEarned: pointsToAdd,
      description: `Manual adjustment by admin: ${reason}`,
      metadata: { adminId, reason, manualAdjustment: true },
    });

    await checkAndAwardAchievements(studentId);
  } catch (error) {
    console.error('Error in manuallyAdjustPoints:', error);
    throw error;
  }
};

export const resetStudentPoints = async (studentId: string): Promise<void> => {
  try {
    const pointsQuery = query(
      collection(db, 'student_points'),
      where('userId', '==', studentId),
      limit(1)
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    if (!pointsSnapshot.empty) {
      const docRef = pointsSnapshot.docs[0].ref;
      await updateDoc(docRef, {
        totalPoints: 0,
        initiationPoints: 0,
        progressPoints: 0,
        chatPoints: 0,
        filePoints: 0,
        weightedScorePoints: 0,
        lastUpdated: serverTimestamp(),
      });
    }

    const achievementsQuery = query(
      collection(db, 'student_achievements'),
      where('studentId', '==', studentId)
    );
    const achievementsSnapshot = await getDocs(achievementsQuery);

    for (const docSnapshot of achievementsSnapshot.docs) {
      await deleteDoc(docSnapshot.ref);
    }
  } catch (error) {
    console.error('Error in resetStudentPoints:', error);
    throw error;
  }
};

export const getAllStudentsWithPoints = async (): Promise<StudentPoints[]> => {
  try {
    const pointsQuery = query(
      collection(db, 'student_points'),
      orderBy('totalPoints', 'desc')
    );
    const pointsSnapshot = await getDocs(pointsQuery);

    return pointsSnapshot.docs.map(doc => ({
      userId: doc.data().userId,
      totalPoints: doc.data().totalPoints || 0,
      initiationPoints: doc.data().initiationPoints || 0,
      progressPoints: doc.data().progressPoints || 0,
      chatPoints: doc.data().chatPoints || 0,
      filePoints: doc.data().filePoints || 0,
      weightedScorePoints: doc.data().weightedScorePoints || 0,
      lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error in getAllStudentsWithPoints:', error);
    return [];
  }
};

export interface RecalculationResult {
  totalStudents: number;
  successful: number;
  failed: number;
  errors: Array<{ studentId: string; error: string }>;
}

export const recalculateAllStudentPoints = async (
  onProgress?: (current: number, total: number, studentId: string) => void
): Promise<RecalculationResult> => {
  try {
    console.log('🔄 Starting bulk recalculation for all students...');

    const allStudents = await getAllStudentsWithPoints();
    const totalStudents = allStudents.length;

    console.log(`📊 Found ${totalStudents} students to process`);

    const result: RecalculationResult = {
      totalStudents,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < allStudents.length; i++) {
      const student = allStudents[i];

      try {
        if (onProgress) {
          onProgress(i + 1, totalStudents, student.userId);
        }

        console.log(`🔄 Processing student ${i + 1}/${totalStudents}: ${student.userId}`);

        await recalculateStudentPoints(student.userId);

        result.successful++;
        console.log(`✅ Successfully processed student: ${student.userId}`);

      } catch (error) {
        result.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push({
          studentId: student.userId,
          error: errorMessage,
        });
        console.error(`❌ Failed to process student ${student.userId}:`, error);
      }
    }

    console.log('✅ Bulk recalculation completed');
    console.log(`📊 Summary: ${result.successful} successful, ${result.failed} failed out of ${result.totalStudents} total`);

    return result;

  } catch (error) {
    console.error('❌ Error in bulk recalculation:', error);
    throw error;
  }
};
