import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { ref, get, remove } from "firebase/database";

export async function POST(req: NextRequest) {
  try {
    const { uid, code } = await req.json();
    if (!uid || !code) {
      return NextResponse.json({ message: "Неповні параметри запиту" }, { status: 400 });
    }

    // Fetch the OTP code stored in Realtime Database under users/{uid}/otp
    const otpRef = ref(db, `users/${uid}/otp`);
    const snap = await get(otpRef);

    if (!snap.exists()) {
      return NextResponse.json({ message: "Код не знайдено або термін його дії закінчився" }, { status: 400 });
    }

    const { code: savedCode, expiresAt } = snap.val();

    // Check if code matches
    if (savedCode !== code.trim()) {
      return NextResponse.json({ message: "Невірний код підтвердження" }, { status: 400 });
    }

    // Check if code has expired
    if (Date.now() > expiresAt) {
      await remove(otpRef); // Clear expired OTP
      return NextResponse.json({ message: "Термін дії коду закінчився" }, { status: 400 });
    }

    // Success! Clear the OTP code from DB
    await remove(otpRef);

    return NextResponse.json({ message: "Код успішно підтверджено" });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json({ message: error.message || "Помилка перевірки коду" }, { status: 500 });
  }
}
