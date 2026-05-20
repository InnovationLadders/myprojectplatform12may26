import * as functions from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";

interface EmailPayload {
  type: "admin_new_student" | "student_activated";
  to_email: string;
  to_name: string;
  student_name?: string;
  student_email?: string;
  school_name?: string;
  login_url?: string;
}

// ... (اترك دوال بناء الـ HTML كما هي بدون تغيير) ...

// الصيغة الأكثر استقراراً للجيل الثاني لمنع أخطاء تحليل الـ Codebase
export const sendNotificationEmail = onCall(
  {
    region: "us-central1",
    secrets: ["GMAIL_APP_PASSWORD"],
  },
  async (request) => {
    const data = request.data as EmailPayload;

    if (!data.to_email || !data.type) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: to_email, type"
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "mansour@innovationladders.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const subject =
      data.type === "admin_new_student"
        ? `طلب انضمام طالب جديد - ${data.student_name || ""}`
        : `تمت الموافقة على حسابك في ${data.school_name || "المنصة"}`;

    const html =
      data.type === "admin_new_student"
        ? buildAdminNewStudentHtml(data)
        : buildStudentActivatedHtml(data);

    await transporter.sendMail({
      from: '"منصة مشروعي" <mansour@innovationladders.com>',
      to: data.to_email,
      subject,
      html,
    });

    return { success: true };
  }
);