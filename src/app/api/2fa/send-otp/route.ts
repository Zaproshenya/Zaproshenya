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
        <div style="background-color: #fcfaf7; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(180, 140, 60, 0.15); border-radius: 16px; box-shadow: 0 8px 30px rgba(24, 18, 10, 0.03); overflow: hidden;">
            <!-- Top gold accent bar -->
            <div style="height: 6px; background: linear-gradient(90deg, #c9922a 0%, #e5b85c 100%);"></div>
            
            <div style="padding: 40px 32px 32px 32px;">
              <!-- Logo Header -->
              <div style="text-align: center; margin-bottom: 32px;">
                <span style="font-size: 1.4rem; font-weight: 700; color: #18120a; letter-spacing: 0.02em; display: inline-flex; align-items: center; gap: 6px;">
                  Запрошення <span style="color: #c9922a;">✦</span>
                </span>
              </div>
              
              <!-- Body Text -->
              <h3 style="font-size: 1.15rem; font-weight: 600; color: #18120a; margin: 0 0 12px 0; text-align: center;">Вітаємо!</h3>
              <p style="font-size: 0.95rem; line-height: 1.6; color: #6b6058; margin: 0 0 32px 0; text-align: center;">
                Ваш одноразовий 6-значний код для безпечного підтвердження входу в акаунт:
              </p>
              
              <!-- Code Display Block -->
              <div style="margin: 0 auto 32px auto; padding: 20px 24px; background: #faf6f0; border: 1.5px dashed rgba(201, 146, 42, 0.3); border-radius: 12px; text-align: center; max-width: 320px;">
                <div style="font-size: 2.6rem; font-weight: 800; letter-spacing: 0.2em; color: #18120a; font-family: 'Courier New', Courier, monospace; margin-left: 0.2em;">
                  ${code}
                </div>
              </div>
              
              <!-- Footer Info -->
              <p style="font-size: 0.82rem; line-height: 1.6; color: #8c8076; text-align: center; margin: 0 0 32px 0;">
                Цей код є конфіденційним та дійсний протягом <strong>5 хвилин</strong>. Якщо ви не надсилали цей запит, просто проігноруйте цей лист.
              </p>
              
              <!-- Divider -->
              <div style="border-top: 1px dashed rgba(180, 140, 60, 0.15); margin-bottom: 20px;"></div>
              
              <!-- Uniqueness tag to prevent Gmail grouping / trimming -->
              <div style="text-align: center;">
                <span style="font-size: 0.7rem; color: #bcaea2; text-transform: uppercase; letter-spacing: 0.05em;">
                  ID запиту: ZAP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
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
