import { NextRequest, NextResponse } from "next/server";
import { decrypt, encrypt } from "@/lib/encryption";

const DB_URL = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "zaproshenya.site";
  const protocol = req.headers.get("x-forwarded-proto") || "https";
  const originUrl = `${protocol}://${host}`;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateBase64 = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      console.warn("TikTok OAuth error:", errorParam);
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=${encodeURIComponent(errorParam)}`);
    }

    if (!code || !stateBase64) {
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=missing_params`);
    }

    // Decode and unpack state
    let uid: string, token: string;
    try {
      const decodedState = JSON.parse(Buffer.from(stateBase64, "base64").toString("utf8"));
      uid = decodedState.uid;
      token = decodedState.token;
    } catch (e) {
      console.error("Failed to decode state:", e);
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=invalid_state`);
    }

    if (!uid || !token) {
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=invalid_state_auth`);
    }

    // Load Client Key and Client Secret from DB to perform code exchange
    const rtdbUrl = `${DB_URL}/autopost/settings/tiktok.json?auth=${token}`;
    const dbRes = await fetch(rtdbUrl);
    if (!dbRes.ok) {
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=db_read_failure`);
    }

    const config = await dbRes.json();
    if (!config || !config.clientKey || !config.clientSecret) {
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=credentials_missing`);
    }

    const clientKey = decrypt(config.clientKey);
    const clientSecret = decrypt(config.clientSecret);

    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=decryption_failed`);
    }

    // Token exchange with TikTok OAuth v2 endpoint
    const redirectUri = `${protocol}://${host}/api/admin/autopost/oauth/tiktok/callback`;
    
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error("TikTok token exchange failure:", errBody);
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=token_exchange_failure`);
    }

    const tokenData = await tokenResponse.json();
    const { refresh_token } = tokenData;

    if (!refresh_token) {
      console.warn("No refresh token returned by TikTok");
      if (!config.refreshToken) {
        return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=no_refresh_token`);
      }
    } else {
      // Encrypt and save the TikTok refresh token
      const encryptedRefreshToken = encrypt(refresh_token);
      
      const updateRes = await fetch(`${DB_URL}/autopost/settings/tiktok/refreshToken.json?auth=${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encryptedRefreshToken)
      });

      if (!updateRes.ok) {
        console.error("Failed to save TikTok refresh token to database");
        return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=db_write_failure`);
      }
    }

    // Success! Redirect user back with success flag
    return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth=tiktok_success`);
  } catch (error: any) {
    console.error("TikTok OAuth callback error:", error);
    return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=server_error`);
  }
}
