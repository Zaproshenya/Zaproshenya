import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { uid, code, token } = await req.json();
    if (!uid || !code || !token) {
      return NextResponse.json({ message: "Неповні параметри запиту" }, { status: 400 });
    }

    const dbUrl = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";
    const rtdbUrl = `${dbUrl}/users/${uid}/otp.json?auth=${token}`;

    // Fetch the OTP code stored in Realtime Database under users/{uid}/otp via REST API using token
    const dbRes = await fetch(rtdbUrl);
    if (!dbRes.ok) {
      const errText = await dbRes.text();
      console.error("Firebase Database read error:", errText);
      return NextResponse.json({ message: "Помилка доступу до бази даних" }, { status: 500 });
    }

    const data = await dbRes.json();
    if (!data) {
      return NextResponse.json({ message: "Код не знайдено або термін його дії закінчився" }, { status: 400 });
    }

    const { code: savedCode, expiresAt } = data;

    // Check if code matches
    if (savedCode !== code.trim()) {
      return NextResponse.json({ message: "Невірний код підтвердження" }, { status: 400 });
    }

    // Check if code has expired
    if (Date.now() > expiresAt) {
      await fetch(rtdbUrl, { method: "DELETE" }); // Clear expired OTP
      return NextResponse.json({ message: "Термін дії коду закінчився" }, { status: 400 });
    }

    // Success! Clear the OTP code from DB
    await fetch(rtdbUrl, { method: "DELETE" });

    return NextResponse.json({ message: "Код успішно підтверджено" });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ message: error.message || "Помилка перевірки коду" }, { status: 500 });
  }
}
