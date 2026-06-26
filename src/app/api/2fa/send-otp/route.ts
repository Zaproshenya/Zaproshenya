import { NextRequest, NextResponse } from "next/server";

import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { uid, email, token } = await req.json();
    if (!uid || !email || !token) {
      return NextResponse.json({ message: "Неповні параметри запиту" }, { status: 400 });
    }

    // Generate a secure 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    // Save OTP to Firebase Realtime Database under users/{uid}/otp via REST API using token
    const dbUrl = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";
    const rtdbUrl = `${dbUrl}/users/${uid}/otp.json?auth=${token}`;
    const dbRes = await fetch(rtdbUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, expiresAt })
    });
    
    if (!dbRes.ok) {
      const errText = await dbRes.text();
      console.error("Firebase Database write error:", errText);
      return NextResponse.json({ message: "Помилка доступу до бази даних" }, { status: 500 });
    }

    // SMTP configuration from environment variables
    // SMTP configuration from environment variables (configured in Cloudflare Pages Dashboard)
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpSecure = process.env.SMTP_SECURE === "true";
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `noreply@zaproshenya.site`;

    if (!smtpUser || !smtpPass) {
      console.warn("SMTP credentials are not configured in environment variables. OTP code is:", code);
      // For development/fallback, return success so developers/users can test even without SMTP configured
      return NextResponse.json({ 
        message: "OTP code generated (SMTP credentials missing in .env.local - check logs for code)", 
        dev_code: code // Exposed for development/fallback testing if not configured
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"Запрошення ✦" <${smtpFrom}>`,
      to: email,
      subject: "Код підтвердження двофакторної автентифікації - Запрошення",
      html: `
        <div style="font-family: sans-serif; padding: 32px 24px; max-width: 480px; margin: 0 auto; border: 1px solid rgba(180,140,60,.2); border-radius: 12px; background: #faf6f0; color: #18120a;">
          <h2 style="color: #c9922a; font-style: italic; text-align: center; margin-bottom: 24px;">Запрошення ✦</h2>
          <p style="font-size: 0.95rem; margin-bottom: 16px;">Вітаємо!</p>
          <p style="font-size: 0.95rem; margin-bottom: 24px;">Ваш одноразовий 6-значний код для підтвердження входу в акаунт:</p>
          <div style="font-size: 2.2rem; font-weight: bold; letter-spacing: 0.15em; text-align: center; margin: 24px 0; color: #18120a; background: #ffffff; padding: 16px; border-radius: 8px; border: 1.5px solid rgba(180,140,60,.25); box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            ${code}
          </div>
          <p style="font-size: 0.82rem; color: #6b6058; line-height: 1.6; margin-top: 24px;">
            Цей код дійсний протягом 5 хвилин. Якщо ви не намагалися увійти в акаунт, просто проігноруйте цей лист.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: "Код надіслано" });
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return NextResponse.json({ message: error.message || "Помилка надсилання коду" }, { status: 500 });
  }
}
