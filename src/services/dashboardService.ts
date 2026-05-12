import { collection, query, where, getDocs, orderBy, limit, Timestamp, getDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getRecentActivities as getActivitiesFromService } from './activityService';

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  draftProjects: number;
  pendingTasks: number;
  completedTasks: number;
  upcomingConsultations: number;
  rewardPoints: number;
  notificationsCount: number;
}

export interface UpcomingDeadline {
  id: string;
  taskName: string;
  projectId: string;
  projectName: string;
  deadline: Date;
  daysRemaining: number;
  priority: 'high' | 'medium' | 'low';
}

export interface RecentProject {
  id: string;
  title: string;
  status: string;
  progress: number;
  updatedAt: Date;
  teamSize: number;
}

export interface RecentActivity {
  id: string;
  type: 'message' | 'project_update' | 'task_completion' | 'consultation';
  title: string;
  description: string;
  timestamp: Date;
  relatedId?: string;
  icon?: string;
}

export interface RecentProjectConversation {
  id: string;
  projectId: string;
  projectTitle: string;
  message: string;
  messageType: 'text' | 'image' | 'video' | 'file';
  mediaUrl?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  timestamp: Date;
  unreadCount: number;
}

const calculateDaysRemaining = (deadline: Date): number => {
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getPriority = (daysRemaining: number): 'high' | 'medium' | 'low' => {
  if (daysRemaining < 3) return 'high';
  if (daysRemaining < 7) return 'medium';
  return 'low';
};

interface UserProjectsResult {
  projectIds: string[];
  projectsMap: Map<string, any>;
}

const getUserProjectsWithDetails = async (userId: string, userRole: string): Promise<UserProjectsResult> => {
  const projectIds: string[] = [];
  const projectsMap = new Map<string, any>();

  try {
    if (userRole === 'teacher' || userRole === 'school') {
      const field = userRole === 'teacher' ? 'teacher_id' : 'school_id';
      const projectsQuery = query(
        collection(db, 'projects'),
        where(field, '==', userId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);

      projectsSnapshot.docs.forEach(doc => {
        projectIds.push(doc.id);
        projectsMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
    }

    if (userRole === 'student' || userRole === 'teacher') {
      const projectStudentsQuery = query(
        collection(db, 'project_students'),
        where('student_id', '==', userId)
      );
      const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
      const memberProjectIds = projectStudentsSnapshot.docs.map(doc => doc.data().project_id);

      for (const projectId of memberProjectIds) {
        if (!projectsMap.has(projectId)) {
          projectIds.push(projectId);
          try {
            const projectQuery = query(
              collection(db, 'projects'),
              where('__name__', '==', projectId)
            );
            const projectSnapshot = await getDocs(projectQuery);
            if (!projectSnapshot.empty) {
              const doc = projectSnapshot.docs[0];
              projectsMap.set(projectId, { id: doc.id, ...doc.data() });
            }
          } catch (error) {
            console.warn(`Could not fetch project ${projectId}:`, error);
          }
        }
      }
    }

    return { projectIds: [...new Set(projectIds)], projectsMap };
  } catch (error) {
    console.error('Error in getUserProjectsWithDetails:', error);
    return { projectIds: [], projectsMap: new Map() };
  }
};

export const getDashboardStats = async (userId: string, userRole: string): Promise<DashboardStats> => {
  try {
    const stats: DashboardStats = {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      draftProjects: 0,
      pendingTasks: 0,
      completedTasks: 0,
      upcomingConsultations: 0,
      rewardPoints: 0,
      notificationsCount: 0,
    };

    // Execute queries in parallel for better performance
    const queries = [];

    // Get projects owned by user or where user is a member
    let projectsQuery;
    if (userRole === 'teacher') {
      projectsQuery = query(
        collection(db, 'projects'),
        where('teacher_id', '==', userId)
      );
    } else if (userRole === 'school') {
      projectsQuery = query(
        collection(db, 'projects'),
        where('school_id', '==', userId)
      );
    } else {
      projectsQuery = query(
        collection(db, 'projects'),
        where('teacher_id', '==', userId)
      );
    }
    queries.push(getDocs(projectsQuery));

    // Also get projects where user is a team member
    const projectStudentsQuery = query(
      collection(db, 'project_students'),
      where('student_id', '==', userId)
    );
    queries.push(getDocs(projectStudentsQuery));

    // Get upcoming consultations
    const consultationsQuery = query(
      collection(db, 'consultations'),
      where('student_id', '==', userId),
      where('status', '==', 'scheduled')
    );
    queries.push(getDocs(consultationsQuery));

    // Execute all queries in parallel
    const [projectsSnapshot, projectStudentsSnapshot, consultationsSnapshot] = await Promise.all(queries);

    const memberProjectIds = projectStudentsSnapshot.docs.map(doc => doc.data().project_id);

    // Combine owned and member projects
    const allProjectIds = new Set([
      ...projectsSnapshot.docs.map(doc => doc.id),
      ...memberProjectIds
    ]);

    stats.totalProjects = allProjectIds.size;

    // Count projects by status
    for (const doc of projectsSnapshot.docs) {
      const status = doc.data().status;
      if (status === 'active' || status === 'in_progress') {
        stats.activeProjects++;
      } else if (status === 'completed') {
        stats.completedProjects++;
      } else if (status === 'draft') {
        stats.draftProjects++;
      }
    }

    // Get tasks for user's projects (limit to first 5 projects to reduce load)
    if (allProjectIds.size > 0) {
      const projectIdsArray = Array.from(allProjectIds).slice(0, 5);

      // Firebase 'in' query limitation: max 10 items
      const chunks = [];
      for (let i = 0; i < projectIdsArray.length; i += 10) {
        chunks.push(projectIdsArray.slice(i, i + 10));
      }

      const taskQueries = chunks.map(chunk =>
        getDocs(query(
          collection(db, 'project_tasks'),
          where('project_id', 'in', chunk)
        ))
      );

      const taskSnapshots = await Promise.all(taskQueries);

      taskSnapshots.forEach(tasksSnapshot => {
        tasksSnapshot.docs.forEach(doc => {
          const taskData = doc.data();
          if (taskData.completed) {
            stats.completedTasks++;
          } else {
            stats.pendingTasks++;
          }
        });
      });
    }

    // Count upcoming consultations
    const now = Timestamp.now();
    stats.upcomingConsultations = consultationsSnapshot.docs.filter(doc => {
      const scheduledDate = doc.data().scheduledDate;
      if (scheduledDate && scheduledDate.toDate) {
        return scheduledDate.toDate() > now.toDate();
      }
      return false;
    }).length;

    // Get reward points from user document
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
    if (!userDoc.empty) {
      stats.rewardPoints = userDoc.docs[0].data().points || 0;
    }

    return stats;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

export const getRecentProjects = async (userId: string, limitCount: number = 3, userRole: string = 'student'): Promise<RecentProject[]> => {
  try {
    const { projectIds, projectsMap } = await getUserProjectsWithDetails(userId, userRole);

    if (projectIds.length === 0) {
      return [];
    }

    const projectsWithDetails: Array<RecentProject & { updatedAtTimestamp: number }> = [];

    // Sort projects by updated_at first, then limit to avoid unnecessary queries
    const sortedProjectIds = projectIds
      .map(id => {
        const projectData = projectsMap.get(id);
        const updatedAt = projectData?.updated_at?.toDate ? projectData.updated_at.toDate() : new Date(0);
        return { id, updatedAt: updatedAt.getTime() };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limitCount)
      .map(item => item.id);

    // Batch fetch team sizes for only the top projects in parallel
    const teamSizeMap = new Map<string, number>();

    // Fetch all team members in parallel for better performance
    const teamSizePromises = sortedProjectIds.map(async (projectId) => {
      const teamQuery = query(
        collection(db, 'project_students'),
        where('project_id', '==', projectId)
      );
      const teamSnapshot = await getDocs(teamQuery);
      return { projectId, size: teamSnapshot.size };
    });

    const teamSizes = await Promise.all(teamSizePromises);
    teamSizes.forEach(({ projectId, size }) => {
      teamSizeMap.set(projectId, size);
    });

    // Build final results using only top projects
    for (const projectId of sortedProjectIds) {
      const projectData = projectsMap.get(projectId);
      if (!projectData) continue;

      const updatedAt = projectData.updated_at?.toDate ? projectData.updated_at.toDate() : new Date();

      projectsWithDetails.push({
        id: projectId,
        title: projectData.title || 'Untitled Project',
        status: projectData.status || 'draft',
        progress: projectData.progress || 0,
        updatedAt,
        teamSize: teamSizeMap.get(projectId) || 0,
        updatedAtTimestamp: updatedAt.getTime()
      });
    }

    return projectsWithDetails.map(({ updatedAtTimestamp, ...project }) => project);
  } catch (error) {
    console.error('Error fetching recent projects:', error);
    return [];
  }
};

export const getUpcomingDeadlines = async (userId: string, limitCount: number = 3, userRole: string = 'student'): Promise<UpcomingDeadline[]> => {
  try {
    const { projectIds, projectsMap } = await getUserProjectsWithDetails(userId, userRole);

    if (projectIds.length === 0) {
      console.log('No projects found for upcoming deadlines for user:', userId);
      return [];
    }

    const deadlines: UpcomingDeadline[] = [];
    const now = new Date();

    // Limit to first 10 projects to reduce query load
    const limitedProjectIds = projectIds.slice(0, 10);
    const chunks = [];
    for (let i = 0; i < limitedProjectIds.length; i += 10) {
      chunks.push(limitedProjectIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const tasksQuery = query(
        collection(db, 'project_tasks'),
        where('project_id', 'in', chunk),
        where('completed', '==', false)
      );
      const tasksSnapshot = await getDocs(tasksQuery);

      for (const taskDoc of tasksSnapshot.docs) {
        const taskData = taskDoc.data();
        if (taskData.deadline) {
          const deadline = taskData.deadline.toDate ? taskData.deadline.toDate() : new Date(taskData.deadline);

          if (deadline > now) {
            const projectData = projectsMap.get(taskData.project_id);
            const projectName = projectData?.title || 'Unknown Project';
            const daysRemaining = calculateDaysRemaining(deadline);

            deadlines.push({
              id: taskDoc.id,
              taskName: taskData.title || 'Untitled Task',
              projectId: taskData.project_id,
              projectName,
              deadline,
              daysRemaining,
              priority: getPriority(daysRemaining),
            });
          }
        }
      }
    }

    return deadlines
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    return [];
  }
};

export const getRecentActivities = async (userId: string, limitCount: number = 3, userRole: string = 'student'): Promise<RecentActivity[]> => {
  try {
    const activities = await getActivitiesFromService(userId, userRole);

    return activities.slice(0, limitCount).map(activity => ({
      id: activity.id,
      type: activity.activity_type === 'chat' ? 'message' :
            activity.activity_type === 'file_upload' ? 'project_update' :
            activity.activity_type === 'evaluation_update' ? 'project_update' : 'message',
      title: activity.activity_type === 'chat' ? `${activity.user_name} sent a message` :
             activity.activity_type === 'file_upload' ? `${activity.user_name} uploaded a file` :
             activity.activity_type === 'evaluation_update' ? `${activity.user_name} updated evaluation` : '',
      description: activity.activity_type === 'chat' ? (activity.activity_data as any).messagePreview :
                   activity.activity_type === 'file_upload' ? (activity.activity_data as any).fileName :
                   activity.activity_type === 'evaluation_update' ? `${(activity.activity_data as any).changes.length} criteria updated` : '',
      timestamp: activity.created_at,
      relatedId: activity.project_id
    }));
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

export const getRecentProjectConversations = async (userId: string, userRole: string = 'student'): Promise<RecentProjectConversation[]> => {
  try {
    const { projectIds, projectsMap } = await getUserProjectsWithDetails(userId, userRole);

    if (projectIds.length === 0) {
      return [];
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    const twentyFourHoursAgoTimestamp = Timestamp.fromDate(twentyFourHoursAgo);

    const conversations: RecentProjectConversation[] = [];

    const limitedProjectIds = projectIds.slice(0, 5);

    const messagePromises = limitedProjectIds.map(async (projectId) => {
      try {
        const messagesQuery = query(
          collection(db, 'chat_messages'),
          where('project_id', '==', projectId),
          where('created_at', '>=', twentyFourHoursAgoTimestamp)
        );

        const messagesSnapshot = await getDocs(messagesQuery);

        const projectMessages = messagesSnapshot.docs
          .map(doc => ({ id: doc.id, data: doc.data() }))
          .sort((a, b) => {
            const aTime = a.data.created_at?.toDate?.() || new Date(0);
            const bTime = b.data.created_at?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          })
          .slice(0, 3);

        const userIds = [...new Set(projectMessages.map(msg => msg.data.user_id).filter(Boolean))];
        const userInfoMap = new Map();

        if (userIds.length > 0) {
          const userPromises = userIds.map(async (uid) => {
            try {
              const userRef = firestoreDoc(db, 'users', uid);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  uid,
                  name: userData.name || 'Unknown User',
                  avatar_url: userData.avatar_url,
                  role: userData.role
                };
              }
            } catch (err) {
              return null;
            }
            return null;
          });

          const userResults = await Promise.all(userPromises);
          userResults.filter(Boolean).forEach(user => {
            if (user) userInfoMap.set(user.uid, user);
          });
        }

        const projectData = projectsMap.get(projectId);

        return projectMessages.map(msgDoc => {
          const messageData = msgDoc.data;
          const userInfo = userInfoMap.get(messageData.user_id) || {
            name: 'Unknown User',
            avatar_url: undefined,
            role: undefined
          };
          const seenBy = messageData.seen_by || [];
          const unreadCount = seenBy.includes(userId) ? 0 : 1;

          return {
            id: msgDoc.id,
            projectId: projectId,
            projectTitle: projectData?.title || 'Unknown Project',
            message: messageData.message || '',
            messageType: messageData.message_type || 'text',
            mediaUrl: messageData.media_url,
            userId: messageData.user_id,
            userName: userInfo.name,
            userAvatar: userInfo.avatar_url,
            userRole: userInfo.role,
            timestamp: messageData.created_at?.toDate() || new Date(),
            unreadCount: unreadCount
          };
        });
      } catch (error) {
        return [];
      }
    });

    const projectConversations = await Promise.all(messagePromises);
    projectConversations.forEach(convos => {
      conversations.push(...convos);
    });

    return conversations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    return [];
  }
};

