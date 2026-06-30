import { NextRequest, NextResponse } from "next/server";
import { encrypt, decrypt } from "@/lib/encryption";

const DB_URL = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

// Helper to determine if a field is sensitive and needs encryption/masking
const SENSITIVE_FIELDS = [
  "accessToken",
  "pageAccessToken",
  "clientSecret",
  "refreshToken",
  "clientKey",
  "apiKey"
];

const IS_MASKED_REGEX = /^•+$/;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    if (!uid || !token) {
      return NextResponse.json({ message: "Неповні параметри запиту" }, { status: 400 });
    }

    // Direct fetch of settings from Firebase RTDB. Auth token is appended to authorize via security rules.
    const rtdbUrl = `${DB_URL}/autopost/settings.json?auth=${token}`;
    const dbRes = await fetch(rtdbUrl);
    
    if (!dbRes.ok) {
      if (dbRes.status === 401 || dbRes.status === 403) {
        return NextResponse.json({ message: "Доступ заборонено. Тільки для адміністраторів." }, { status: 403 });
      }
      const errText = await dbRes.text();
      console.error("Firebase settings read error:", errText);
      return NextResponse.json({ message: "Помилка читання бази даних" }, { status: 500 });
    }

    const rawSettings = await dbRes.json();
    if (!rawSettings) {
      // If no settings exist yet, return an empty default object
      return NextResponse.json({
        instagram: { enabled: false, businessAccountId: "", accessToken: "", pageId: "" },
        facebook: { enabled: false, pageId: "", pageAccessToken: "" },
        youtube: { enabled: false, clientId: "", clientSecret: "", refreshToken: "" },
        tiktok: { enabled: false, clientKey: "", clientSecret: "", refreshToken: "" },
        ai: { enabled: false, apiKey: "", model: "gemini-1.5-flash" }
      });
    }

    // Prepare settings to be returned to the client by masking sensitive encrypted values
    const maskedSettings: Record<string, any> = {};

    for (const [service, config] of Object.entries(rawSettings)) {
      if (typeof config === "object" && config !== null) {
        maskedSettings[service] = { ...config };
        for (const [key, value] of Object.entries(config)) {
          if (SENSITIVE_FIELDS.includes(key) && typeof value === "string" && value) {
            // Decrypt first to make sure it is a valid encrypted value before masking
            const decrypted = decrypt(value);
            if (decrypted) {
              maskedSettings[service][key] = "••••••••••••••••";
            } else {
              maskedSettings[service][key] = "";
            }
          }
        }
      } else {
        maskedSettings[service] = config;
      }
    }

    return NextResponse.json(maskedSettings);
  } catch (error: any) {
    console.error("Error in GET autopost settings:", error);
    return NextResponse.json({ message: error.message || "Внутрішня помилка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid, token, settings } = await req.json();

    if (!uid || !token || !settings) {
      return NextResponse.json({ message: "Неповні параметри запиту" }, { status: 400 });
    }

    // Read current encrypted settings from DB first so we can preserve untouched/masked sensitive fields
    const rtdbUrl = `${DB_URL}/autopost/settings.json?auth=${token}`;
    const dbGetRes = await fetch(rtdbUrl);
    
    if (!dbGetRes.ok) {
      if (dbGetRes.status === 401 || dbGetRes.status === 403) {
        return NextResponse.json({ message: "Доступ заборонено. Тільки для адміністраторів." }, { status: 403 });
      }
      return NextResponse.json({ message: "Помилка перевірки прав доступу" }, { status: 500 });
    }

    const currentSettings = (await dbGetRes.json()) || {};
    const updatedSettings: Record<string, any> = {};

    for (const [service, serviceConfig] of Object.entries(settings)) {
      if (typeof serviceConfig === "object" && serviceConfig !== null) {
        updatedSettings[service] = { ...serviceConfig };
        const currentServiceConfig = currentSettings[service] || {};

        for (const [key, val] of Object.entries(serviceConfig)) {
          if (SENSITIVE_FIELDS.includes(key) && typeof val === "string") {
            const trimmedVal = val.trim();
            
            if (IS_MASKED_REGEX.test(trimmedVal)) {
              // It is masked, preserve the existing encrypted value from DB
              updatedSettings[service][key] = currentServiceConfig[key] || "";
            } else if (trimmedVal) {
              // It is a new plain-text value, encrypt it
              updatedSettings[service][key] = encrypt(trimmedVal);
            } else {
              // Empty value
              updatedSettings[service][key] = "";
            }
          }
        }
      } else {
        updatedSettings[service] = serviceConfig;
      }
    }

    // Write updated, safely encrypted settings back to Firebase
    const dbPutRes = await fetch(rtdbUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSettings)
    });

    if (!dbPutRes.ok) {
      const errText = await dbPutRes.text();
      console.error("Firebase settings write error:", errText);
      return NextResponse.json({ message: "Помилка запису в базу даних" }, { status: 500 });
    }

    return NextResponse.json({ message: "Налаштування успішно збережено" });
  } catch (error: any) {
    console.error("Error in POST autopost settings:", error);
    return NextResponse.json({ message: error.message || "Внутрішня помилка сервера" }, { status: 500 });
  }
}
