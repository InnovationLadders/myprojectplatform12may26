import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  type: "admin_new_student" | "student_activated";
  to_email: string;
  to_name: string;
  student_name?: string;
  student_email?: string;
  school_name?: string;
  login_url?: string;
}

const buildAdminNewStudentHtml = (p: EmailPayload): string => `
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

const buildStudentActivatedHtml = (p: EmailPayload): string => `
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();

    if (!payload.to_email || !payload.type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to_email, type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const fromEmail = Deno.env.get("FROM_EMAIL") || smtpUser || "noreply@mashroui.com";
    const fromName = Deno.env.get("FROM_NAME") || "منصة مشروعي";

    const subject =
      payload.type === "admin_new_student"
        ? `طلب انضمام طالب جديد - ${payload.student_name || ""}`
        : `تمت الموافقة على حسابك في ${payload.school_name || "المنصة"}`;

    const html =
      payload.type === "admin_new_student"
        ? buildAdminNewStudentHtml(payload)
        : buildStudentActivatedHtml(payload);

    // Send via SMTP using Deno native TCP if credentials are available
    if (smtpHost && smtpUser && smtpPass) {
      // Use nodemailer-compatible approach via npm
      const nodemailer = await import("npm:nodemailer@6.9.9");
      const transporter = nodemailer.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: payload.to_email,
        subject,
        html,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: log to console when SMTP not configured
    console.log(`[EMAIL - NO SMTP] Would send to: ${payload.to_email} | Subject: ${subject}`);
    return new Response(
      JSON.stringify({ success: true, note: "SMTP not configured, email logged only" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
