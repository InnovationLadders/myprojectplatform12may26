"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationEmail = void 0;
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "mansour@innovationladders.com",
        pass: "zjzx xlyb qdvp efyu",
    },
});
const buildAdminNewStudentHtml = (p) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>طلب انضمام طالب جديد</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">طلب انضمام طالب جديد</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
      <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">
        تلقّيت طلب انضمام جديد من الطالب التالي إلى مؤسستك <strong>${p.school_name || ""}</strong>، ويحتاج إلى موافقتك للتفعيل.
      </p>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px;margin-bottom:28px;">
        <p style="margin:0 0 8px;color:#0369a1;font-weight:600;font-size:15px;">بيانات الطالب</p>
        <p style="margin:4px 0;color:#1e3a5f;"><strong>الاسم:</strong> ${p.student_name || ""}</p>
        <p style="margin:4px 0;color:#1e3a5f;"><strong>البريد الإلكتروني:</strong> ${p.student_email || ""}</p>
      </div>
      <div style="text-align:center;">
        <a href="${p.login_url || "#"}"
           style="display:inline-block;background:#0ea5e9;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          مراجعة الطلب من لوحة التحكم
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:13px;border-top:1px solid #e5e7eb;">
      منصة مشروعي &mdash; جميع الحقوق محفوظة
    </div>
  </div>
</body>
</html>
`;
const buildStudentActivatedHtml = (p) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تمت الموافقة على حسابك</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fa;font-family:'Segoe UI',Tahoma,sans-serif;direction:rtl;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">تمت الموافقة على حسابك</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="font-size:17px;color:#1f2937;margin:0 0 16px;">مرحباً ${p.to_name}،</p>
      <p style="color:#4b5563;line-height:1.7;margin:0 0 24px;">
        يسعدنا إخبارك بأنه تمت <strong>الموافقة على حسابك</strong> في مؤسسة <strong>${p.school_name || ""}</strong>.
        يمكنك الآن تسجيل الدخول والبدء في استخدام منصة مشروعي بكامل مميزاتها.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:28px;">
        <p style="margin:0;color:#166534;font-size:14px;">
          إذا واجهت أي مشكلة عند تسجيل الدخول يرجى التواصل مع إدارة مؤسستك أو فريق الدعم.
        </p>
      </div>
      <div style="text-align:center;">
        <a href="${p.login_url || "#"}"
           style="display:inline-block;background:#10b981;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
          تسجيل الدخول الآن
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:13px;border-top:1px solid #e5e7eb;">
      منصة مشروعي &mdash; جميع الحقوق محفوظة
    </div>
  </div>
</body>
</html>
`;
exports.sendNotificationEmail = functions
    .region("us-central1")
    .https.onCall(async (data) => {
    if (!data.to_email || !data.type) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields: to_email, type");
    }
    const subject = data.type === "admin_new_student"
        ? `طلب انضمام طالب جديد - ${data.student_name || ""}`
        : `تمت الموافقة على حسابك في ${data.school_name || "المنصة"}`;
    const html = data.type === "admin_new_student"
        ? buildAdminNewStudentHtml(data)
        : buildStudentActivatedHtml(data);
    await transporter.sendMail({
        from: '"منصة مشروعي" <mansour@innovationladders.com>',
        to: data.to_email,
        subject,
        html,
    });
    return { success: true };
});
//# sourceMappingURL=index.js.map