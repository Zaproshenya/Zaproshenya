import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";

const DB_URL = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");

    if (!uid || !token) {
      return NextResponse.json({ message: "Неповні параметри авторизації" }, { status: 400 });
    }

    // Load current YouTube settings to retrieve Client ID
    const rtdbUrl = `${DB_URL}/autopost/settings/youtube.json?auth=${token}`;
    const dbRes = await fetch(rtdbUrl);
    
    if (!dbRes.ok) {
      return NextResponse.json({ message: "Немає доступу або помилка завантаження конфігурації" }, { status: 403 });
    }

    const config = await dbRes.json();
    if (!config || !config.clientId) {
      return NextResponse.json({ message: "Спочатку введіть Client ID у налаштуваннях YouTube" }, { status: 400 });
    }

    const clientId = decrypt(config.clientId);
    if (!clientId) {
      return NextResponse.json({ message: "Помилка розшифрування Client ID" }, { status: 500 });
    }

    // Determine the current host to build callback redirect URI dynamically
    const host = req.headers.get("host") || "zaproshenya.site";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const redirectUri = `${protocol}://${host}/api/admin/autopost/oauth/youtube/callback`;

    // Encode uid and token into state so we can authenticate the callback write operation
    const state = Buffer.from(JSON.stringify({ uid, token })).toString("base64");

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.upload");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    googleAuthUrl.searchParams.set("state", state);

    // Redirect user to Google OAuth Consent Screen
    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error: any) {
    console.error("Error in YouTube OAuth redirect:", error);
    return NextResponse.json({ message: error.message || "Помилка ініціалізації авторизації" }, { status: 500 });
  }
}
