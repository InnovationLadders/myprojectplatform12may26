import * as functions from "firebase-functions/v1";
import * as nodemailer from "nodemailer";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailType =
  | "admin_new_student"
  | "student_activated"
  | "project_created"
  | "consultation_requested"
  | "consultation_accepted"
  | "consultation_completed"
  | "investor_request_new"
  | "investor_request_status_update"
  | "achievement_unlocked"
  | "first_daily_chat";

interface EmailPayload {
  type: EmailType;
  to_email: string;
  to_name: string;
  // Auth
  student_name?: string;
  student_email?: string;
  school_name?: string;
  login_url?: string;
  // Project
  project_title?: string;
  project_description?: string;
  project_link?: string;
  teacher_name?: string;
  team_members?: Array<{ name: string; role: string }>;
  due_date?: string;
  // Consultation
  consultation_topic?: string;
  consultation_type?: string;
  consultation_method?: string;
  consultation_date?: string;
  consultant_name?: string;
  student_requester_name?: string;
  // Investor
  investor_name?: string;
  investor_company?: string;
  investor_notes?: string;
  request_status?: string;
  admin_notes?: string;
  // Achievement
  achievement_type?: string;
  achievement_points?: number;
  total_points?: number;
  // Chat
  sender_name?: string;
  message_preview?: string;
  chat_link?: string;
}

// ─── Shared template wrapper ──────────────────────────────────────────────────

const wrap = (headerColor: string, title: string, body: string): string => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <div style="background:${headerColor};padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${title}</h1>
    </div>
    <div style="padding:32px 24px;">
      ${body}
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:13px;border-top:1px solid #e5e7eb;">
      منصة مشروعي &mdash; جميع الحقوق محفوظة
    </div>
  </div>
</body>
</html>`;

const btn = (href: string, label: string, color = "#0ea5e9"): string => `
<div style="text-align:center;margin-top:24px;">
  <a href="${href}" style="display:inline-block;background:${color};color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">${label}</a>
</div>`;

const infoBox = (bgColor: string, borderColor: string, content: string): string => `
<div style="background:${bgColor};border:1px solid ${borderColor};border-radius:10px;padding:20px;margin-bottom:24px;">
  ${content}
</div>`;

// ─── HTML builders ────────────────────────────────────────────────────────────

function buildHtml(p: EmailPayload): { subject: string; html: string } {
  const appUrl = p.login_url?.split("/").slice(0, 3).join("/") || "https://mashroui.com";

  switch (p.type) {
    case "admin_new_student": {
      return {
        subject: `طلب انضمام طالب جديد - ${p.student_name || ""}`,
        html: wrap(
          "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)",
          "طلب انضمام طالب جديد",
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">تلقّيت طلب انضمام جديد من الطالب التالي إلى مؤسستك <strong>${p.school_name || ""}</strong>، ويحتاج إلى موافقتك للتفعيل.</p>
           ${infoBox("#f0f9ff", "#bae6fd",
             `<p style="margin:0 0 8px;color:#0369a1;font-weight:600;font-size:15px;">بيانات الطالب</p>
              <p style="margin:4px 0;color:#1e3a5f;"><strong>الاسم:</strong> ${p.student_name || ""}</p>
              <p style="margin:4px 0;color:#1e3a5f;"><strong>البريد الإلكتروني:</strong> ${p.student_email || ""}</p>`
           )}
           ${btn(p.login_url || "#", "مراجعة الطلب من لوحة التحكم")}`
        ),
      };
    }

    case "student_activated": {
      return {
        subject: `تمت الموافقة على حسابك في ${p.school_name || "المنصة"}`,
        html: wrap(
          "linear-gradient(135deg,#10b981 0%,#059669 100%)",
          "تمت الموافقة على حسابك",
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">يسعدنا إخبارك بأنه تمت <strong>الموافقة على حسابك</strong> في مؤسسة <strong>${p.school_name || ""}</strong>. يمكنك الآن تسجيل الدخول والبدء في استخدام منصة مشروعي بكامل مميزاتها.</p>
           ${infoBox("#f0fdf4", "#bbf7d0",
             `<p style="margin:0;color:#166534;font-size:14px;">إذا واجهت أي مشكلة عند تسجيل الدخول يرجى التواصل مع إدارة مؤسستك أو فريق الدعم.</p>`
           )}
           ${btn(p.login_url || `${appUrl}/login`, "تسجيل الدخول الآن", "#10b981")}`
        ),
      };
    }

    case "project_created": {
      const membersHtml = (p.team_members || []).map(m =>
        `<p style="margin:4px 0;color:#1e3a5f;">• <strong>${m.name}</strong> — ${m.role === "leader" ? "قائد الفريق" : "عضو"}</p>`
      ).join("");
      return {
        subject: `تمت إضافتك إلى مشروع: ${p.project_title || ""}`,
        html: wrap(
          "linear-gradient(135deg,#10b981 0%,#059669 100%)",
          "مشروع جديد",
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">تمت إضافتك إلى مشروع جديد في منصة مشروعي.</p>
           ${infoBox("#f0fdf4", "#bbf7d0",
             `<p style="margin:0 0 8px;color:#166534;font-weight:600;font-size:15px;">${p.project_title || ""}</p>
              <p style="margin:4px 0;color:#1e3a5f;">${p.project_description || ""}</p>
              ${p.teacher_name ? `<p style="margin:8px 0 4px;color:#1e3a5f;"><strong>المشرف:</strong> ${p.teacher_name}</p>` : ""}
              ${p.due_date ? `<p style="margin:4px 0;color:#1e3a5f;"><strong>الموعد النهائي:</strong> ${p.due_date}</p>` : ""}
              ${membersHtml ? `<p style="margin:8px 0 4px;color:#1e3a5f;font-weight:600;">أعضاء الفريق:</p>${membersHtml}` : ""}`
           )}
           ${btn(p.project_link || `${appUrl}/projects`, "عرض المشروع", "#10b981")}`
        ),
      };
    }

    case "consultation_requested": {
      return {
        subject: `طلب استشارة جديد - ${p.consultation_topic || ""}`,
        html: wrap(
          "linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)",
          "طلب استشارة جديد",
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">لديك طلب استشارة جديد من الطالب <strong>${p.student_requester_name || ""}</strong>.</p>
           ${infoBox("#f5f3ff", "#ddd6fe",
             `<p style="margin:0 0 8px;color:#5b21b6;font-weight:600;font-size:15px;">تفاصيل الطلب</p>
              <p style="margin:4px 0;color:#1e3a5f;"><strong>الموضوع:</strong> ${p.consultation_topic || ""}</p>
              ${p.consultation_type ? `<p style="margin:4px 0;color:#1e3a5f;"><strong>النوع:</strong> ${p.consultation_type}</p>` : ""}
              ${p.consultation_method ? `<p style="margin:4px 0;color:#1e3a5f;"><strong>الطريقة:</strong> ${p.consultation_method === "video" ? "مرئي" : "نصي"}</p>` : ""}
              ${p.consultation_date ? `<p style="margin:4px 0;color:#1e3a5f;"><strong>التاريخ المفضل:</strong> ${p.consultation_date}</p>` : ""}`
           )}
           ${btn(`${appUrl}/consultations`, "مراجعة الطلب", "#6d28d9")}`
        ),
      };
    }

    case "consultation_accepted": {
      return {
        subject: `تم قبول طلب استشارتك - ${p.consultation_topic || ""}`,
        html: wrap(
          "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)",
          "تم قبول طلب الاستشارة",
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">تم قبول طلب استشارتك من قِبَل <strong>${p.consultant_name || "المستشار"}</strong>.</p>
           ${infoBox("#f0f9ff", "#bae6fd",
             `<p style="margin:0 0 8px;color:#0369a1;font-weight:600;font-size:15px;">تفاصيل الاستشارة</p>
              <p style="margin:4px 0;color:#1e3a5f;"><strong>الموضوع:</strong> ${p.consultation_topic || ""}</p>
              <p style="margin:4px 0;color:#1e3a5f;"><strong>المستشار:</strong> ${p.consultant_name || ""}</p>
              ${p.consultation_date ? `<p style="margin:4px 0;color:#1e3a5f;"><strong>الموعد المحدد:</strong> ${p.consultation_date}</p>` : ""}`
           )}
           ${btn(`${appUrl}/my-consultations`, "عرض الاستشارة")}`
        ),
      };
    }

    case "consultation_completed": {
      return {
        subject: `تم إكمال الاستشارة - ${p.consultation_topic || ""}`,
        html: wrap(
          "linear-gradient(135deg,#10b981 0%,#059669 100%)",
          "تم إكمال الاستشارة",
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">تم إكمال جلسة الاستشارة حول <strong>${p.consultation_topic || ""}</strong>. نأمل أن تكون قد استفدت منها.</p>
           ${infoBox("#f0fdf4", "#bbf7d0",
             `<p style="margin:0;color:#166534;font-size:14px;">نرجو منك تقييم الاستشارة لمساعدتنا على تحسين الخدمة.</p>`
           )}
           ${btn(`${appUrl}/my-consultations`, "تقييم الاستشارة", "#10b981")}`
        ),
      };
    }

    case "investor_request_new": {
      return {
        subject: `طلب اهتمام مستثمر جديد بمشروع: ${p.project_title || ""}`,
        html: wrap(
          "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
          "طلب اهتمام مستثمر جديد",
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">أبدى المستثمر <strong>${p.investor_name || ""}</strong> اهتمامه بمشروع من مشاريع مؤسستك.</p>
           ${infoBox("#fffbeb", "#fde68a",
             `<p style="margin:0 0 8px;color:#92400e;font-weight:600;font-size:15px;">تفاصيل الطلب</p>
              <p style="margin:4px 0;color:#1e3a5f;"><strong>المشروع:</strong> ${p.project_title || ""}</p>
              <p style="margin:4px 0;color:#1e3a5f;"><strong>المستثمر:</strong> ${p.investor_name || ""}</p>
              ${p.investor_company ? `<p style="margin:4px 0;color:#1e3a5f;"><strong>الشركة:</strong> ${p.investor_company}</p>` : ""}
              ${p.investor_notes ? `<p style="margin:4px 0;color:#1e3a5f;"><strong>ملاحظات:</strong> ${p.investor_notes}</p>` : ""}`
           )}
           ${btn(`${appUrl}/investor-requests`, "مراجعة الطلب", "#d97706")}`
        ),
      };
    }

    case "investor_request_status_update": {
      const statusLabel = p.request_status === "in_progress"
        ? "تحت المعالجة"
        : p.request_status === "closed"
        ? "مغلق"
        : "قيد الانتظار";
      return {
        subject: `تحديث على طلب الاهتمام بمشروع: ${p.project_title || ""}`,
        html: wrap(
          "linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%)",
          "تحديث حالة طلب الاستثمار",
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">تم تحديث حالة طلبك للمشروع <strong>${p.project_title || ""}</strong>.</p>
           ${infoBox("#f0f9ff", "#bae6fd",
             `<p style="margin:0 0 8px;color:#0369a1;font-weight:600;font-size:15px;">الحالة الجديدة: ${statusLabel}</p>
              ${p.admin_notes ? `<p style="margin:4px 0;color:#1e3a5f;"><strong>ملاحظة الإدارة:</strong> ${p.admin_notes}</p>` : ""}`
           )}
           ${btn(`${appUrl}/my-investor-requests`, "عرض طلباتي")}`
        ),
      };
    }

    case "achievement_unlocked": {
      const medals: Record<string, string> = {
        bronze: "البرونزية",
        silver: "الفضية",
        gold: "الذهبية",
        platinum: "البلاتينية",
        trophy: "الكأس",
      };
      const medalName = medals[p.achievement_type || ""] || p.achievement_type || "";
      return {
        subject: `مبروك! حصلت على وسام ${medalName}`,
        html: wrap(
          "linear-gradient(135deg,#f59e0b 0%,#d97706 100%)",
          `وسام ${medalName}`,
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مبروك ${p.to_name}!</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">لقد حصلت على وسام <strong>${medalName}</strong> في منصة مشروعي. استمر في التفاعل وأداء المهام لتحصل على المزيد!</p>
           ${infoBox("#fffbeb", "#fde68a",
             `<p style="margin:0 0 4px;color:#92400e;font-weight:600;">النقاط المكتسبة عند الفتح: ${p.achievement_points || 0}</p>
              <p style="margin:0;color:#92400e;">إجمالي نقاطك: ${p.total_points || 0}</p>`
           )}
           ${btn(`${appUrl}/student-rewards`, "عرض إنجازاتي", "#d97706")}`
        ),
      };
    }

    case "first_daily_chat": {
      return {
        subject: `رسالة جديدة في مشروع: ${p.project_title || ""}`,
        html: wrap(
          "linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)",
          "رسالة جديدة في المشروع",
          `<p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
           <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">لديك نشاط جديد في مشروعك اليوم.</p>
           ${infoBox("#eff6ff", "#bfdbfe",
             `<p style="margin:0 0 8px;color:#1e40af;font-weight:600;">${p.project_title || ""}</p>
              <p style="margin:4px 0;color:#1e3a5f;"><strong>من:</strong> ${p.sender_name || ""}</p>
              ${p.message_preview ? `<p style="margin:8px 0 0;color:#4b5563;font-style:italic;">"${p.message_preview}"</p>` : ""}`
           )}
           ${btn(p.chat_link || `${appUrl}/projects`, "فتح المحادثة")}`
        ),
      };
    }
  }
}

// ─── Cloud Function ───────────────────────────────────────────────────────────

export const sendNotificationEmail = functions
  .https.onCall(async (data: EmailPayload) => {
    console.log("sendNotificationEmail called with:", {
      type: data.type,
      to_email: data.to_email,
      to_name: data.to_name,
      timestamp: new Date().toISOString()
    });

    if (!data.to_email || !data.type) {
      console.error("Missing required fields:", { to_email: data.to_email, type: data.type });
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: to_email, type"
      );
    }

    const host = "smtp.gmail.com";
    const port = 587;
    const user = "myprojectplatform.noreply@gmail.com";
    const password = "llyfkczsldsguukh";
    const fromEmail = "myprojectplatform.noreply@gmail.com";

    console.log("Creating SMTP transporter with:", { host, port, user });

    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: user,
        pass: password,
      },
    });

    // Verify SMTP connection
    try {
      console.log("Verifying SMTP connection...");
      await transporter.verify();
      console.log("SMTP connection verified successfully");
    } catch (verifyError) {
      console.error("SMTP verification failed:", verifyError);
      throw new functions.https.HttpsError("internal", "SMTP connection failed");
    }

    const { subject, html } = buildHtml(data);

    console.log("Sending email with subject:", subject);

    try {
      const info = await transporter.sendMail({
        from: `منصة مشروعي <${fromEmail}>`,
        to: data.to_email,
        subject,
        html,
      });
      console.log("Email sent successfully:", info.messageId);
    } catch (error) {
      console.error("SMTP error:", error);
      throw new functions.https.HttpsError("internal", "Failed to send email: " + (error as Error).message);
    }

    return { success: true, messageId: "sent" };
  });
