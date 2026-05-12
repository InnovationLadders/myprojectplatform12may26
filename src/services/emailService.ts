// Email notifications are currently disabled
// TODO: Implement server-side email service using Firebase Cloud Functions
import { db, firestoreDoc } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';

const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

interface EmailRecipient {
  email: string;
  name: string;
}

interface ChatNotificationData {
  projectId: string;
  projectTitle: string;
  senderName: string;
  messagePreview: string;
  recipients: EmailRecipient[];
}

interface ProjectCreationData {
  projectId: string;
  projectTitle: string;
  projectDescription: string;
  category: string;
  difficulty: string;
  dueDate?: string;
  teacherName: string;
  teamMembers: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  supervisor: EmailRecipient;
}

const generateChatNotificationTemplate = (data: {
  recipientName: string;
  projectTitle: string;
  senderName: string;
  messagePreview: string;
  chatLink: string;
}): string => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رسالة جديدة في المشروع</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f7fa;
      margin: 0;
      padding: 0;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .message-box {
      background-color: #f3f4f6;
      border-right: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .sender {
      font-weight: 600;
      color: #3b82f6;
      margin-bottom: 8px;
    }
    .message-preview {
      color: #4b5563;
      line-height: 1.6;
    }
    .cta-button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .cta-button:hover {
      background-color: #2563eb;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .project-info {
      background-color: #eff6ff;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .project-name {
      font-weight: 600;
      color: #1e40af;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 رسالة جديدة في المشروع</h1>
    </div>
    <div class="content">
      <p class="greeting">مرحباً ${data.recipientName}،</p>

      <p>تم إرسال رسالة جديدة في مشروعك. هذه هي أول رسالة اليوم!</p>

      <div class="project-info">
        <div class="project-name">📚 ${data.projectTitle}</div>
      </div>

      <div class="message-box">
        <div class="sender">من: ${data.senderName}</div>
        <div class="message-preview">${data.messagePreview}</div>
      </div>

      <p>انقر على الزر أدناه للانتقال مباشرة إلى غرفة المحادثة والرد على الرسالة:</p>

      <div style="text-align: center;">
        <a href="${data.chatLink}" class="cta-button">افتح المحادثة</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        💡 نشجعك على التفاعل اليومي مع فريق مشروعك لضمان التواصل الفعال والتقدم المستمر.
      </p>
    </div>
    <div class="footer">
      <p>هذا البريد الإلكتروني تم إرساله تلقائياً من منصة مشروعي</p>
      <p>© 2024 منصة مشروعي - جميع الحقوق محفوظة</p>
    </div>
  </div>
</body>
</html>
  `;
};

const generateProjectCreationTemplate = (data: {
  recipientName: string;
  isTeacher: boolean;
  projectTitle: string;
  projectDescription: string;
  category: string;
  difficulty: string;
  dueDate?: string;
  teacherName: string;
  teamMembers: Array<{ name: string; role: string }>;
  projectLink: string;
}): string => {
  const categoryNames: Record<string, string> = {
    stem: 'العلوم والتكنولوجيا والهندسة والرياضيات',
    entrepreneurship: 'ريادة الأعمال',
    volunteer: 'العمل التطوعي',
    ethics: 'الأخلاقيات والقيم'
  };

  const difficultyNames: Record<string, string> = {
    beginner: 'مبتدئ',
    intermediate: 'متوسط',
    advanced: 'متقدم'
  };

  const teamMembersHtml = data.teamMembers.map(member => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
        <strong>${member.name}</strong>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">
        ${member.role === 'leader' ? '👑 قائد الفريق' : '👤 عضو'}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مشروع جديد تم إنشاؤه</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f7fa;
      margin: 0;
      padding: 0;
      direction: rtl;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .project-details {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #6b7280;
      font-weight: 500;
    }
    .detail-value {
      color: #1f2937;
      font-weight: 600;
    }
    .team-section {
      margin: 20px 0;
    }
    .team-section h3 {
      color: #1f2937;
      font-size: 18px;
      margin-bottom: 15px;
    }
    .team-table {
      width: 100%;
      border-collapse: collapse;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.3s;
    }
    .cta-button:hover {
      background-color: #059669;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
    }
    .badge-category {
      background-color: #dbeafe;
      color: #1e40af;
    }
    .badge-difficulty {
      background-color: #fef3c7;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ${data.isTeacher ? 'تم إنشاء المشروع بنجاح' : 'تمت إضافتك إلى مشروع جديد'}</h1>
    </div>
    <div class="content">
      <p class="greeting">مرحباً ${data.recipientName}،</p>

      <p>
        ${data.isTeacher
          ? 'تم إنشاء مشروع جديد بنجاح وإضافة أعضاء الفريق.'
          : `تمت إضافتك إلى مشروع جديد. نتمنى لك تجربة تعليمية ممتعة ومثمرة!`
        }
      </p>

      <div class="project-details">
        <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">📋 ${data.projectTitle}</h2>
        <p style="color: #4b5563; line-height: 1.6;">${data.projectDescription}</p>

        <div style="margin: 15px 0;">
          <span class="badge badge-category">${categoryNames[data.category] || data.category}</span>
          <span class="badge badge-difficulty" style="margin-right: 8px;">
            ${difficultyNames[data.difficulty] || data.difficulty}
          </span>
        </div>

        <div class="detail-row">
          <span class="detail-label">المشرف</span>
          <span class="detail-value">${data.teacherName}</span>
        </div>

        ${data.dueDate ? `
        <div class="detail-row">
          <span class="detail-label">الموعد النهائي</span>
          <span class="detail-value">${data.dueDate}</span>
        </div>
        ` : ''}
      </div>

      <div class="team-section">
        <h3>👥 فريق العمل (${data.teamMembers.length} ${data.teamMembers.length === 1 ? 'عضو' : 'أعضاء'})</h3>
        <table class="team-table">
          <tbody>
            ${teamMembersHtml}
          </tbody>
        </table>
      </div>

      <p>انقر على الزر أدناه لعرض تفاصيل المشروع الكاملة والبدء في العمل:</p>

      <div style="text-align: center;">
        <a href="${data.projectLink}" class="cta-button">عرض المشروع</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        💡 نوصي بمراجعة تفاصيل المشروع والتواصل مع فريقك في أقرب وقت ممكن.
      </p>
    </div>
    <div class="footer">
      <p>هذا البريد الإلكتروني تم إرساله تلقائياً من منصة مشروعي</p>
      <p>© 2024 منصة مشروعي - جميع الحقوق محفوظة</p>
    </div>
  </div>
</body>
</html>
  `;
};

export const sendFirstDailyChatNotification = async (
  data: ChatNotificationData
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[EMAIL DISABLED] Would send chat notification:', {
      projectId: data.projectId,
      projectTitle: data.projectTitle,
      recipients: data.recipients.map(r => r.email),
      senderName: data.senderName
    });

    await addDoc(collection(db, 'email_notifications'), {
      type: 'first_daily_chat',
      projectId: data.projectId,
      recipientEmail: data.recipients.map(r => r.email).join(', '),
      recipientName: data.recipients.map(r => r.name).join(', '),
      senderName: data.senderName,
      status: 'disabled',
      note: 'Email notifications are currently disabled',
      sentAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error logging email notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const sendProjectCreatedNotification = async (
  data: ProjectCreationData
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('[EMAIL DISABLED] Would send project creation notification:', {
      projectId: data.projectId,
      projectTitle: data.projectTitle,
      teamMembers: data.teamMembers.map(m => m.email),
      supervisor: data.supervisor.email
    });

    const allRecipients = [
      ...data.teamMembers.map(m => ({ email: m.email, name: m.name })),
      { email: data.supervisor.email, name: data.supervisor.name }
    ];

    await addDoc(collection(db, 'email_notifications'), {
      type: 'project_created',
      projectId: data.projectId,
      recipientEmail: allRecipients.map(r => r.email).join(', '),
      recipientName: allRecipients.map(r => r.name).join(', '),
      status: 'disabled',
      note: 'Email notifications are currently disabled',
      sentAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error logging project creation notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const checkIfFirstMessageToday = async (projectId: string): Promise<boolean> => {
  try {
    const projectRef = firestoreDoc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);

    if (!projectDoc.exists()) {
      return false;
    }

    const projectData = projectDoc.data();
    const lastNotification = projectData.last_chat_notification;

    if (!lastNotification) {
      return true;
    }

    const lastNotificationDate = lastNotification instanceof Timestamp
      ? lastNotification.toDate()
      : new Date(lastNotification);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastNotificationDateOnly = new Date(lastNotificationDate);
    lastNotificationDateOnly.setHours(0, 0, 0, 0);

    return lastNotificationDateOnly < today;
  } catch (error) {
    console.error('Error checking if first message today:', error);
    return false;
  }
};

export const updateLastChatNotification = async (projectId: string): Promise<void> => {
  try {
    const projectRef = firestoreDoc(db, 'projects', projectId);
    await getDoc(projectRef);

    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(projectRef, {
      last_chat_notification: serverTimestamp()
    });

    console.log(`Updated last_chat_notification for project ${projectId}`);
  } catch (error) {
    console.error('Error updating last chat notification:', error);
  }
};

export const getUsersByIds = async (userIds: string[]): Promise<EmailRecipient[]> => {
  try {
    const recipients: EmailRecipient[] = [];

    for (const userId of userIds) {
      try {
        const userRef = firestoreDoc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.email && userData.name) {
            recipients.push({
              email: userData.email,
              name: userData.name
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
      }
    }

    return recipients;
  } catch (error) {
    console.error('Error getting users by IDs:', error);
    return [];
  }
};
