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

    // Load current TikTok settings to retrieve Client Key
    const rtdbUrl = `${DB_URL}/autopost/settings/tiktok.json?auth=${token}`;
    const dbRes = await fetch(rtdbUrl);
    
    if (!dbRes.ok) {
      return NextResponse.json({ message: "Немає доступу або помилка завантаження конфігурації" }, { status: 403 });
    }

    const config = await dbRes.json();
    if (!config || !config.clientKey) {
      return NextResponse.json({ message: "Спочатку введіть Client Key у налаштуваннях TikTok" }, { status: 400 });
    }

    const clientKey = decrypt(config.clientKey);
    if (!clientKey) {
      return NextResponse.json({ message: "Помилка розшифрування Client Key" }, { status: 500 });
    }

    // Determine the current host to build callback redirect URI dynamically
    const host = req.headers.get("host") || "zaproshenya.site";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const redirectUri = `${protocol}://${host}/api/admin/autopost/oauth/tiktok/callback`;

    // Encode uid and token into state so we can authenticate the callback write operation
    const state = Buffer.from(JSON.stringify({ uid, token })).toString("base64");

    const tiktokAuthUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
    tiktokAuthUrl.searchParams.set("client_key", clientKey);
    tiktokAuthUrl.searchParams.set("redirect_uri", redirectUri);
    tiktokAuthUrl.searchParams.set("response_type", "code");
    // TikTok Content Posting API v2 scopes: user.info.basic, video.upload
    tiktokAuthUrl.searchParams.set("scope", "user.info.basic,video.upload");
    tiktokAuthUrl.searchParams.set("state", state);

    // Redirect user to TikTok Authorization Screen
    return NextResponse.redirect(tiktokAuthUrl.toString());
  } catch (error: any) {
    console.error("Error in TikTok OAuth redirect:", error);
    return NextResponse.json({ message: error.message || "Помилка ініціалізації авторизації" }, { status: 500 });
  }
}
