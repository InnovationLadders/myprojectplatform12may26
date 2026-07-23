import { db, functions, firestoreDoc } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

const appUrl = typeof window !== 'undefined'
  ? window.location.origin
  : (import.meta.env.VITE_APP_URL || 'https://mashroui.com');

// ─── Shared email caller ──────────────────────────────────────────────────────

const callSendEmail = async (payload: Record<string, unknown>): Promise<void> => {
  try {
    console.log('[emailService] Attempting to send email:', {
      type: payload.type,
      to_email: payload.to_email,
      to_name: payload.to_name,
      timestamp: new Date().toISOString()
    });

    const sendEmail = httpsCallable(functions, 'sendNotificationEmail');
    const result = await sendEmail(payload);

    console.log('[emailService] Email function call successful:', result);

    // Log success to Firestore for audit trail
    await addDoc(collection(db, 'email_notifications'), {
      type: payload.type,
      to_email: payload.to_email,
      status: 'sent',
      sentAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[emailService] Failed to send email:', error);
    console.error('[emailService] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any).code,
      details: (error as any).details,
      timestamp: new Date().toISOString()
    });

    await addDoc(collection(db, 'email_notifications'), {
      type: payload.type,
      to_email: payload.to_email,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      error_code: (error as any).code,
      sentAt: serverTimestamp(),
    }).catch((logError) => {
      console.error('[emailService] Failed to log error to Firestore:', logError);
    });
  }
};

// ─── Public helpers ───────────────────────────────────────────────────────────

export interface EmailRecipient {
  email: string;
  name: string;
}
/**
 * Fetches user email and name from Firestore by user IDs
 * @param userIds - Array of user IDs to fetch
 * @returns Array of email recipients with email and name
 */
export const getUsersByIds = async (userIds: string[]): Promise<EmailRecipient[]> => {
  const recipients: EmailRecipient[] = [];
  for (const userId of userIds) {
    try {
      const userDoc = await getDoc(firestoreDoc(db, 'users', userId));
      if (userDoc.exists()) {
        const d = userDoc.data();
        if (d.email && d.name) recipients.push({ email: d.email, name: d.name });
      }
    } catch {
      // non-critical
    }
  }
  return recipients;
};

// ─── Admin / Auth notifications ───────────────────────────────────────────────
/**
 * Sends email notification to admin when a new student requests to join
 * @param params - Admin and student information
 */
export const sendAdminNewStudentEmail = async (params: {
  adminEmail: string;
  adminName: string;
  studentName: string;
  studentEmail: string;
  schoolName: string;
}): Promise<void> => {
  await callSendEmail({
    type: 'admin_new_student',
    to_email: params.adminEmail,
    to_name: params.adminName,
    student_name: params.studentName,
    student_email: params.studentEmail,
    school_name: params.schoolName,
    login_url: `${appUrl}/users`,
  });
};
/**
 * Sends email notification to student when their account is activated by admin
 * @param params - Student and school information
 */
export const sendStudentActivatedEmail = async (params: {
  userEmail: string;
  userName: string;
  schoolName: string;
}): Promise<void> => {
  await callSendEmail({
    type: 'student_activated',
    to_email: params.userEmail,
    to_name: params.userName,
    school_name: params.schoolName,
    login_url: `${appUrl}/login`,
  });
};

// ─── Project notifications ────────────────────────────────────────────────────
/**
 * Sends email notification to team members and supervisor when a new project is created
 * @param params - Project details including team members and supervisor
 */
export const sendProjectCreatedNotification = async (params: {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  category?: string;
  difficulty?: string;
  teacherName: string;
  dueDate?: string;
  teamMembers: Array<{ name: string; email: string; role: string }>;
  supervisor: EmailRecipient;
}): Promise<void> => {
  const projectLink = `${appUrl}/projects/${params.projectId}`;

  const recipients = [
    ...params.teamMembers.map(m => ({ name: m.name, email: m.email, role: m.role })),
    { name: params.supervisor.name, email: params.supervisor.email, role: 'supervisor' },
  ];

  await Promise.allSettled(
    recipients.map(r =>
      callSendEmail({
        type: 'project_created',
        to_email: r.email,
        to_name: r.name,
        project_title: params.projectTitle,
        project_description: params.projectDescription,
        teacher_name: params.teacherName,
        due_date: params.dueDate,
        team_members: params.teamMembers.map(m => ({ name: m.name, role: m.role })),
        project_link: projectLink,
      })
    )
  );
};

// ─── Consultation notifications ───────────────────────────────────────────────
/**
 * Sends email notification to consultant when a student requests a consultation
 * @param params - Consultation request details
 */
export const sendConsultationRequestedEmail = async (params: {
  consultantEmail: string;
  consultantName: string;
  studentName: string;
  topic: string;
  type?: string;
  method?: string;
  preferredDate?: string;
}): Promise<void> => {
  await callSendEmail({
    type: 'consultation_requested',
    to_email: params.consultantEmail,
    to_name: params.consultantName,
    student_requester_name: params.studentName,
    consultation_topic: params.topic,
    consultation_type: params.type,
    consultation_method: params.method,
    consultation_date: params.preferredDate,
  });
};
/**
 * Sends email notification to student when their consultation request is accepted
 * @param params - Consultation acceptance details
 */
export const sendConsultationAcceptedEmail = async (params: {
  studentEmail: string;
  studentName: string;
  consultantName: string;
  topic: string;
  scheduledDate?: string;
}): Promise<void> => {
  await callSendEmail({
    type: 'consultation_accepted',
    to_email: params.studentEmail,
    to_name: params.studentName,
    consultant_name: params.consultantName,
    consultation_topic: params.topic,
    consultation_date: params.scheduledDate,
  });
};
/**
 * Sends email notification to student when a consultation session is completed
 * @param params - Consultation completion details
 */
export const sendConsultationCompletedEmail = async (params: {
  studentEmail: string;
  studentName: string;
  topic: string;
}): Promise<void> => {
  await callSendEmail({
    type: 'consultation_completed',
    to_email: params.studentEmail,
    to_name: params.studentName,
    consultation_topic: params.topic,
  });
};

// ─── Investor notifications ───────────────────────────────────────────────────
/**
 * Sends email notification when an investor shows interest in a project
 * @param params - Investor request details
 */
export const sendInvestorRequestNewEmail = async (params: {
  recipientEmail: string;
  recipientName: string;
  investorName: string;
  investorCompany?: string;
  projectTitle: string;
  investorNotes?: string;
}): Promise<void> => {
  await callSendEmail({
    type: 'investor_request_new',
    to_email: params.recipientEmail,
    to_name: params.recipientName,
    investor_name: params.investorName,
    investor_company: params.investorCompany,
    project_title: params.projectTitle,
    investor_notes: params.investorNotes,
  });
};
/**
 * Sends email notification to investor about status update of their request
 * @param params - Status update details
 */
export const sendInvestorRequestStatusEmail = async (params: {
  investorEmail: string;
  investorName: string;
  projectTitle: string;
  status: string;
  adminNotes?: string;
}): Promise<void> => {
  await callSendEmail({
    type: 'investor_request_status_update',
    to_email: params.investorEmail,
    to_name: params.investorName,
    project_title: params.projectTitle,
    request_status: params.status,
    admin_notes: params.adminNotes,
  });
};

// ─── Achievement notifications ────────────────────────────────────────────────
/**
 * Sends email notification to user when they unlock an achievement
 * @param params - Achievement details including points
 */
export const sendAchievementUnlockedEmail = async (params: {
  userEmail: string;
  userName: string;
  achievementType: string;
  achievementPoints: number;
  totalPoints: number;
}): Promise<void> => {
  await callSendEmail({
    type: 'achievement_unlocked',
    to_email: params.userEmail,
    to_name: params.userName,
    achievement_type: params.achievementType,
    achievement_points: params.achievementPoints,
    total_points: params.totalPoints,
  });
};

// ─── Chat notifications ───────────────────────────────────────────────────────
/**
 * Checks if this is the first chat message of the day for a project
 * @param projectId - Project ID to check
 * @returns True if first message today, false otherwise
 */
export const checkIfFirstMessageToday = async (projectId: string): Promise<boolean> => {
  try {
    const projectDoc = await getDoc(firestoreDoc(db, 'projects', projectId));
    if (!projectDoc.exists()) return false;

    const data = projectDoc.data();
    const lastNotification = data.last_chat_notification;
    if (!lastNotification) return true;

    const lastDate = lastNotification instanceof Timestamp
      ? lastNotification.toDate()
      : new Date(lastNotification);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const lastDateStart = new Date(lastDate);
    lastDateStart.setHours(0, 0, 0, 0);

    return lastDateStart < todayStart;
  } catch {
    return false;
  }
};
/**
 * Updates the last chat notification timestamp for a project
 * @param projectId - Project ID to update
 */
export const updateLastChatNotification = async (projectId: string): Promise<void> => {
  try {
    const projectRef = firestoreDoc(db, 'projects', projectId);
    await updateDoc(projectRef, { last_chat_notification: serverTimestamp() });
  } catch (error) {
    console.error('[emailService] updateLastChatNotification failed:', error);
  }
};
/**
 * Sends email notification to project members for the first daily chat message
 * @param params - Chat notification details including recipients
 */
export const sendFirstDailyChatNotification = async (params: {
  projectId: string;
  projectTitle: string;
  senderName: string;
  messagePreview: string;
  recipients: EmailRecipient[];
}): Promise<void> => {
  const chatLink = `${appUrl}/projects/${params.projectId}`;

  await Promise.allSettled(
    params.recipients.map(r =>
      callSendEmail({
        type: 'first_daily_chat',
        to_email: r.email,
        to_name: r.name,
        project_title: params.projectTitle,
        sender_name: params.senderName,
        message_preview: params.messagePreview,
        chat_link: chatLink,
      })
    )
  );

  await updateLastChatNotification(params.projectId);
};
