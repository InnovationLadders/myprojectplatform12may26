import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatRelativeTime, toDateObject } from '../utils/dateUtils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'message' | 'consultation' | 'project' | 'system';
  read: boolean;
  relatedId?: string; // ID of related project, consultation, etc.
  createdAt: Date;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const allNotifications: Notification[] = [];

        // 1. Get projects user is involved in
        const userProjectIds = await getUserProjectIds();
        
        // 2. Listen for new chat messages in user's projects
        if (userProjectIds.length > 0) {
          const chatNotifications = await getChatNotifications(userProjectIds);
          allNotifications.push(...chatNotifications);
        }

        // 3. Get consultation notifications
        const consultationNotifications = await getConsultationNotifications();
        allNotifications.push(...consultationNotifications);

        // 4. Get overdue project notifications
        const overdueNotifications = await getOverdueProjectNotifications();
        allNotifications.push(...overdueNotifications);

        // Sort notifications by creation time (newest first)
        allNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Limit to last 20 notifications
        setNotifications(allNotifications.slice(0, 20));
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('حدث خطأ في تحميل الإشعارات');
      } finally {
        setLoading(false);
      }
    };

    // Get project IDs where user is involved
    const getUserProjectIds = async (): Promise<string[]> => {
      const projectIds: string[] = [];

      try {
        if (user.role === 'student') {
          // Get projects where user is a student
          const projectStudentsQuery = query(
            collection(db, 'project_students'),
            where('student_id', '==', user.id)
          );
          const projectStudentsSnapshot = await getDocs(projectStudentsQuery);
          projectStudentsSnapshot.docs.forEach(doc => {
            projectIds.push(doc.data().project_id);
          });
        } else if (user.role === 'teacher') {
          // Get projects where user is the teacher
          const projectsQuery = query(
            collection(db, 'projects'),
            where('teacher_id', '==', user.id)
          );
          const projectsSnapshot = await getDocs(projectsQuery);
          projectsSnapshot.docs.forEach(doc => {
            projectIds.push(doc.id);
          });
        } else if (user.role === 'school') {
          // Get projects from user's school
          const projectsQuery = query(
            collection(db, 'projects'),
            where('school_id', '==', user.id)
          );
          const projectsSnapshot = await getDocs(projectsQuery);
          projectsSnapshot.docs.forEach(doc => {
            projectIds.push(doc.id);
          });
        } else if (user.role === 'admin') {
          // Admin can see all projects (limit to recent ones)
          const projectsQuery = query(
            collection(db, 'projects'),
            orderBy('created_at', 'desc')
          );
          const projectsSnapshot = await getDocs(projectsQuery);
          projectsSnapshot.docs.forEach(doc => {
            projectIds.push(doc.id);
          });
        }
      } catch (err) {
        console.error('Error getting user project IDs:', err);
      }

      return [...new Set(projectIds)]; // Remove duplicates
    };

    // Get chat message notifications
    const getChatNotifications = async (projectIds: string[]): Promise<Notification[]> => {
      const notifications: Notification[] = [];

      try {
        // Get recent messages from user's projects (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        for (const projectId of projectIds.slice(0, 10)) { // Limit to 10 projects for performance
          // Use simple query without orderBy to avoid composite index requirement
          const messagesQuery = query(
            collection(db, 'chat_messages'),
            where('project_id', '==', projectId)
          );

          const messagesSnapshot = await getDocs(messagesQuery);
          
          // Sort messages by created_at on client side and take recent ones
          const sortedMessages = messagesSnapshot.docs
            .sort((a, b) => {
              const aDate = a.data().created_at?.toDate() || new Date(0);
              const bDate = b.data().created_at?.toDate() || new Date(0);
              return bDate.getTime() - aDate.getTime();
            })
            .slice(0, 5); // Limit to 5 recent messages per project
          
          for (const messageDoc of sortedMessages) {
            const messageData = messageDoc.data();
            
            // Skip user's own messages
            if (messageData.user_id === user.id) continue;
            
            const messageDate = messageData.created_at?.toDate() || new Date();
            
            // Only include messages from last 24 hours
            if (messageDate > oneDayAgo) {
              // Check if user has seen this message
              const seenBy = messageData.seen_by || [];
              if (!seenBy.includes(user.id)) {
                // Get project title
                let projectTitle = 'مشروع';
                try {
                  const projectDoc = await getDoc(doc(db, 'projects', projectId));
                  if (projectDoc.exists()) {
                    projectTitle = projectDoc.data().title || 'مشروع';
                  }
                } catch (err) {
                  console.error('Error getting project title:', err);
                }

                // Get sender name
                let senderName = 'مستخدم';
                try {
                  const senderDoc = await getDoc(doc(db, 'users', messageData.user_id));
                  if (senderDoc.exists()) {
                    senderName = senderDoc.data().name || 'مستخدم';
                  }
                } catch (err) {
                  console.error('Error getting sender name:', err);
                }

                notifications.push({
                  id: messageDoc.id,
                  title: `رسالة جديدة في ${projectTitle}`,
                  message: `${senderName}: ${messageData.message.substring(0, 100)}${messageData.message.length > 100 ? '...' : ''}`,
                  time: formatRelativeTime(messageDate.toISOString()),
                  type: 'message',
                  read: false,
                  relatedId: projectId,
                  createdAt: messageDate
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Error getting chat notifications:', err);
      }

      return notifications;
    };

    // Get consultation notifications
    const getConsultationNotifications = async (): Promise<Notification[]> => {
      const notifications: Notification[] = [];

      try {
        // Get user's consultations
        // Simplified query to avoid composite index requirement
        const consultationsQuery = query(
          collection(db, 'consultations'),
          where('student_id', '==', user.id)
        );

        const consultationsSnapshot = await getDocs(consultationsQuery);
        
        // Sort on client side
        const consultationDocs = consultationsSnapshot.docs.sort((a, b) => {
          const aDate = a.data().updated_at?.toDate() || new Date(0);
          const bDate = b.data().updated_at?.toDate() || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });
        
        consultationDocs.forEach(consultationDoc => {
          const consultationData = consultationDoc.data();
          const updatedAt = consultationData.updated_at?.toDate() || new Date();
          
          // Only include consultations updated in last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          if (updatedAt > sevenDaysAgo) {
            let title = '';
            let message = '';
            
            if (consultationData.status === 'scheduled' && consultationData.mentor_id) {
              title = 'تم قبول طلب الاستشارة';
              message = `تم قبول طلب الاستشارة "${consultationData.topic}" وتحديد موعد لها`;
            } else if (consultationData.status === 'cancelled') {
              title = 'تم إلغاء الاستشارة';
              message = `تم إلغاء الاستشارة "${consultationData.topic}"`;
            } else if (consultationData.status === 'completed') {
              title = 'تمت الاستشارة بنجاح';
              message = `تمت الاستشارة "${consultationData.topic}" بنجاح. يمكنك تقييمها الآن`;
            }

            if (title && message) {
              notifications.push({
                id: `consultation_${consultationDoc.id}`,
                title,
                message,
                time: formatRelativeTime(updatedAt.toISOString()),
                type: 'consultation',
                read: false,
                relatedId: consultationDoc.id,
                createdAt: updatedAt
              });
            }
          }
        });
      } catch (err) {
        console.error('Error getting consultation notifications:', err);
      }

      return notifications;
    };

    // Get overdue project notifications
    const getOverdueProjectNotifications = async (): Promise<Notification[]> => {
      const notifications: Notification[] = [];

      try {
        const userProjectIds = await getUserProjectIds();
        const now = new Date();

        for (const projectId of userProjectIds) {
          const projectDoc = await getDoc(doc(db, 'projects', projectId));
          if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            const dueDate = toDateObject(projectData.due_date);
            
            if (dueDate && dueDate < now && projectData.status !== 'completed') {
              const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              
              notifications.push({
                id: `overdue_${projectId}`,
                title: 'مشروع متأخر',
                message: `المشروع "${projectData.title}" متأخر بـ ${daysPastDue} يوم`,
                time: formatRelativeTime(dueDate.toISOString()),
                type: 'project',
                read: false,
                relatedId: projectId,
                createdAt: dueDate
              });
            } else if (dueDate) {
              // Check for projects due in next 3 days
              const threeDaysFromNow = new Date();
              threeDaysFromNow.setDate(now.getDate() + 3);
              
              if (dueDate <= threeDaysFromNow && dueDate > now && projectData.status !== 'completed') {
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                
                notifications.push({
                  id: `due_soon_${projectId}`,
                  title: 'تذكير: موعد نهائي قريب',
                  message: `المشروع "${projectData.title}" ينتهي خلال ${daysUntilDue} يوم`,
                  time: formatRelativeTime(dueDate.toISOString()),
                  type: 'project',
                  read: false,
                  relatedId: projectId,
                  createdAt: now
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Error getting overdue project notifications:', err);
      }

      return notifications;
    };

    fetchNotifications();

    // Set up real-time listeners for new messages
    const unsubscribers: (() => void)[] = [];

    const setupRealtimeListeners = async () => {
      try {
        const userProjectIds = await getUserProjectIds();
        
        // Listen for new chat messages in user's projects
        userProjectIds.forEach(projectId => {
          // Use simple query without orderBy to avoid composite index requirement
          const messagesQuery = query(
            collection(db, 'chat_messages'),
            where('project_id', '==', projectId)
          );

          const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            // Sort changes by created_at on client side
            const sortedChanges = snapshot.docChanges().sort((a, b) => {
              const aDate = a.doc.data().created_at?.toDate() || new Date(0);
              const bDate = b.doc.data().created_at?.toDate() || new Date(0);
              return bDate.getTime() - aDate.getTime();
            });
            
            sortedChanges.forEach(change => {
              if (change.type === 'added') {
                const messageData = change.doc.data();
                
                // Skip user's own messages
                if (messageData.user_id === user.id) return;
                
                const messageDate = messageData.created_at?.toDate() || new Date();
                
                // Only add notification for very recent messages (last 5 minutes)
                const fiveMinutesAgo = new Date();
                fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
                
                if (messageDate > fiveMinutesAgo) {
                  const seenBy = messageData.seen_by || [];
                  if (!seenBy.includes(user.id)) {
                    // Add new message notification
                    fetchNotifications(); // Refresh all notifications
                  }
                }
              }
            });
          });

          unsubscribers.push(unsubscribe);
        });

        // Listen for consultation status changes
        const consultationsQuery = query(
          collection(db, 'consultations'),
          where('student_id', '==', user.id)
        );

        const consultationUnsubscribe = onSnapshot(consultationsQuery, (snapshot) => {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'modified') {
              // Refresh notifications when consultation status changes
              fetchNotifications();
            }
          });
        });

        unsubscribers.push(consultationUnsubscribe);
      } catch (err) {
        console.error('Error setting up real-time listeners:', err);
      }
    };

    setupRealtimeListeners();

    // Cleanup listeners on unmount
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    getUnreadCount
  };
};