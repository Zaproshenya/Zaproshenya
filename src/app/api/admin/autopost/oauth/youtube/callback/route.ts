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
      console.warn("Google OAuth error:", errorParam);
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

    // Load Client ID and Client Secret from DB to perform code exchange
    const rtdbUrl = `${DB_URL}/autopost/settings/youtube.json?auth=${token}`;
    const dbRes = await fetch(rtdbUrl);
    if (!dbRes.ok) {
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=db_read_failure`);
    }

    const config = await dbRes.json();
    if (!config || !config.clientId || !config.clientSecret) {
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=credentials_missing`);
    }

    const clientId = decrypt(config.clientId);
    const clientSecret = decrypt(config.clientSecret);

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=decryption_failed`);
    }

    // Direct token exchange with Google OAuth endpoint
    const redirectUri = `${protocol}://${host}/api/admin/autopost/oauth/youtube/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error("Google token exchange failure:", errBody);
      return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=token_exchange_failure`);
    }

    const tokenData = await tokenResponse.json();
    const { refresh_token } = tokenData;

    if (!refresh_token) {
      // Sometimes Google doesn't return refresh token if prompt=consent was bypassed.
      // This is mitigated by our prompt=consent setting, but we should handle it just in case.
      console.warn("No refresh token returned by Google");
      // If we don't get a new refresh token, we can check if we already have one.
      if (!config.refreshToken) {
        return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=no_refresh_token_consent`);
      }
    } else {
      // Encrypt the brand new refresh token and write it back to Firebase Realtime Database
      const encryptedRefreshToken = encrypt(refresh_token);
      
      const updateRes = await fetch(`${DB_URL}/autopost/settings/youtube/refreshToken.json?auth=${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(encryptedRefreshToken)
      });

      if (!updateRes.ok) {
        console.error("Failed to save refresh token to database");
        return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=db_write_failure`);
      }
    }

    // Success! Redirect user back to publisher admin panel with success flag
    return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth=youtube_success`);
  } catch (error: any) {
    console.error("YouTube OAuth callback error:", error);
    return NextResponse.redirect(`${originUrl}/admin?tab=publisher&oauth_error=server_error`);
  }
}
