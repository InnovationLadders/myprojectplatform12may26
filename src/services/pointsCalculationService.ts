import { db } from '../lib/firebase';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { getAchievementConfig } from './rewardPointsService.firebase';

export interface ProjectPointsContribution {
  projectId: string;
  projectTitle: string;
  progress: number;
  progressPoints: number;
  weightedScore: number;
  weightedScorePoints: number;
  hasEvaluation: boolean;
}

export interface PointsCalculationDetails {
  studentId: string;
  studentName: string;

  // Initiation Points
  initiationProjects: Array<{
    projectId: string;
    projectTitle: string;
    points: number;
  }>;
  totalInitiationPoints: number;

  // Progress Points
  progressContributions: Array<{
    projectId: string;
    projectTitle: string;
    progressPercentage: number;
    points: number;
  }>;
  totalProgressPoints: number;

  // Weighted Score Points
  weightedScoreContributions: Array<{
    projectId: string;
    projectTitle: string;
    criteria: Array<{
      name: string;
      score: number;
      weight: number;
      weightedScore: number;
    }>;
    totalWeightedScore: number;
    points: number;
  }>;
  totalWeightedScorePoints: number;

  // Chat and File Points
  totalChatPoints: number;
  totalFilePoints: number;

  // Grand Total
  grandTotal: number;

  // Configuration used
  config: {
    approvedProjectPoints: number;
    progressPointsPerPercent: number;
    weightedScorePointsPerUnit: number;
    chatMessagePoints: number;
    fileUploadPoints: number;
  };
}

/**
 * Get detailed points calculation breakdown for a student
 * This shows exactly how each point was earned
 */
export const getPointsCalculationDetails = async (studentId: string): Promise<PointsCalculationDetails> => {
  try {
    // Get student info
    const studentDoc = await getDoc(doc(db, 'users', studentId));
    const studentData = studentDoc.exists() ? studentDoc.data() : null;

    // Get current points
    const pointsQuery = query(
      collection(db, 'student_points'),
      where('userId', '==', studentId)
    );
    const pointsSnapshot = await getDocs(pointsQuery);
    const pointsData = pointsSnapshot.empty ? null : pointsSnapshot.docs[0].data();

    // Get configuration
    const config = await getAchievementConfig();

    // Get all projects for this student
    const projectStudentsQuery = query(
      collection(db, 'project_students'),
      where('student_id', '==', studentId)
    );
    const projectStudentsSnapshot = await getDocs(projectStudentsQuery);

    if (projectStudentsSnapshot.empty) {
      return {
        studentId,
        studentName: studentData?.name || 'Unknown Student',
        initiationProjects: [],
        totalInitiationPoints: pointsData?.initiationPoints || 0,
        progressContributions: [],
        totalProgressPoints: 0,
        weightedScoreContributions: [],
        totalWeightedScorePoints: 0,
        totalChatPoints: pointsData?.chatPoints || 0,
        totalFilePoints: pointsData?.filePoints || 0,
        grandTotal: pointsData?.totalPoints || 0,
        config: {
          approvedProjectPoints: config.approvedProjectPoints,
          progressPointsPerPercent: config.progressPointsPerPercent,
          weightedScorePointsPerUnit: config.weightedScorePointsPerUnit,
          chatMessagePoints: config.chatMessagePoints,
          fileUploadPoints: config.fileUploadPoints,
        },
      };
    }

    const projectIds = projectStudentsSnapshot.docs.map(doc => doc.data().project_id);

    // Get all projects data
    const projects = [];
    for (const projectId of projectIds) {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        projects.push({ id: projectDoc.id, ...projectDoc.data() });
      }
    }

    // Get all evaluations for these projects
    const evaluationsQuery = query(
      collection(db, 'project_evaluations'),
      where('projectId', 'in', projectIds.length > 0 ? projectIds : ['__none__'])
    );
    const evaluationsSnapshot = await getDocs(evaluationsQuery);
    const evaluations = evaluationsSnapshot.docs.map(doc => doc.data());

    // Build initiation projects list (activated/approved projects)
    const initiationProjects = (projects || [])
      .filter(p => p.status === 'active' || p.status === 'approved')
      .map(project => ({
        projectId: project.id,
        projectTitle: project.title,
        points: config.approvedProjectPoints,
      }));

    const totalInitiationPoints = initiationProjects.length * config.approvedProjectPoints;

    // Build progress contributions
    const progressContributions = (projects || []).map(project => ({
      projectId: project.id,
      projectTitle: project.title,
      progressPercentage: project.progress || 0,
      points: Math.floor((project.progress || 0) * config.progressPointsPerPercent),
    }));

    const totalProgressPoints = progressContributions.reduce((sum, contrib) => sum + contrib.points, 0);

    // Build weighted score contributions
    const weightedScoreContributions = (evaluations || []).map(evaluation => {
      const project = projects?.find(p => p.id === evaluation.projectId);
      const criteria = evaluation.criteria as Array<{name: string, score: number, weight: number}>;

      const criteriaDetails = criteria.map(criterion => ({
        name: criterion.name,
        score: criterion.score,
        weight: criterion.weight,
        weightedScore: criterion.score * criterion.weight,
      }));

      const totalWeightedScore = criteriaDetails.reduce((sum, c) => sum + c.weightedScore, 0);

      return {
        projectId: evaluation.projectId,
        projectTitle: project?.title || 'Unknown Project',
        criteria: criteriaDetails,
        totalWeightedScore,
        points: Math.floor(totalWeightedScore * config.weightedScorePointsPerUnit),
      };
    });

    const totalWeightedScorePoints = weightedScoreContributions.reduce((sum, contrib) => sum + contrib.points, 0);

    const grandTotal = totalInitiationPoints + totalProgressPoints + totalWeightedScorePoints +
                      (pointsData?.chatPoints || 0) + (pointsData?.filePoints || 0);

    return {
      studentId,
      studentName: studentData?.name || 'Unknown Student',
      initiationProjects,
      totalInitiationPoints,
      progressContributions,
      totalProgressPoints,
      weightedScoreContributions,
      totalWeightedScorePoints,
      totalChatPoints: pointsData?.chatPoints || 0,
      totalFilePoints: pointsData?.filePoints || 0,
      grandTotal,
      config: {
        approvedProjectPoints: config.approvedProjectPoints,
        progressPointsPerPercent: config.progressPointsPerPercent,
        weightedScorePointsPerUnit: config.weightedScorePointsPerUnit,
        chatMessagePoints: config.chatMessagePoints,
        fileUploadPoints: config.fileUploadPoints,
      },
    };
  } catch (error) {
    console.error('Error getting points calculation details:', error);
    throw error;
  }
};
