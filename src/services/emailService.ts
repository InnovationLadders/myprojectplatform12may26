import { db, functions, firestoreDoc } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

const appUrl = typeof window !== 'undefined'
  ? window.location.origin
  : (import.meta.env.VITE_APP_URL || 'https://mashroui.com');

// ─── Shared email caller ──────────────────────────────────────────────────────

const callSendEmail = async (payload: Record<string, unknown>): Promise<void> => {
  try {
    const sendEmail = httpsCallable(functions, 'sendNotificationEmail');
    await sendEmail(payload);

    // Log success to Firestore for audit trail
    await addDoc(collection(db, 'email_notifications'), {
      type: payload.type,
      to_email: payload.to_email,
      status: 'sent',
      sentAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[emailService] Failed to send email:', error);

    await addDoc(collection(db, 'email_notifications'), {
      type: payload.type,
      to_email: payload.to_email,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      sentAt: serverTimestamp(),
    }).catch(() => {});
  }
};

// ─── Public helpers ───────────────────────────────────────────────────────────

export interface EmailRecipient {
  email: string;
  name: string;
}

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

export const sendProjectCreatedNotification = async (params: {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
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

export const updateLastChatNotification = async (projectId: string): Promise<void> => {
  try {
    const projectRef = firestoreDoc(db, 'projects', projectId);
    await updateDoc(projectRef, { last_chat_notification: serverTimestamp() });
  } catch (error) {
    console.error('[emailService] updateLastChatNotification failed:', error);
  }
};

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
