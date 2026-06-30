import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption";

const DB_URL = "https://zaproshenya-82751-default-rtdb.europe-west1.firebasedatabase.app";

export async function POST(req: NextRequest) {
  try {
    const { uid, token, prompt } = await req.json();

    if (!uid || !token || !prompt) {
      return NextResponse.json({ message: "Неповні параметри запиту" }, { status: 400 });
    }

    // Load AI settings from DB to get apiKey and model
    const rtdbUrl = `${DB_URL}/autopost/settings/ai.json?auth=${token}`;
    const dbRes = await fetch(rtdbUrl);
    
    if (!dbRes.ok) {
      return NextResponse.json({ message: "Помилка доступу до бази даних" }, { status: 403 });
    }

    const aiConfig = await dbRes.json();
    if (!aiConfig || !aiConfig.enabled || !aiConfig.apiKey) {
      return NextResponse.json({ message: "Будь ласка, спочатку активуйте ШІ та додайте API ключ у налаштуваннях" }, { status: 400 });
    }

    const apiKey = decrypt(aiConfig.apiKey);
    if (!apiKey) {
      return NextResponse.json({ message: "Помилка розшифрування ШІ API ключа" }, { status: 500 });
    }

    // Determine model, default to gemini-1.5-flash for maximum speed and compatibility
    let model = aiConfig.model || "gemini-1.5-flash";
    // Strip "models/" prefix if user included it in settings
    if (model.startsWith("models/")) {
      model = model.replace("models/", "");
    }

    // Structure our prompt to enforce clean JSON response format
    const systemPrompt = `Ти — професійний копірайтер та SMM-спеціаліст. Твоє завдання — написати привабливий та залучаючий україномовний опис та підібрати релевантні хештеги для публікації у соціальних мережах (YouTube, Instagram, TikTok, Facebook) на основі запиту користувача.
Запит користувача: "${prompt}"

Ти ПОВИНЕН повернути результат у форматі JSON із двома полями:
1. "description" — текст опису українською мовою з красивими абзацами та емодзі.
2. "hashtags" — рядок релевантних хештегів через пробіл (наприклад: "#благодійність #запрошення #допомога").

Поверни тільки сирий JSON без будь-якого додаткового тексту, вступів, висновків та без розмітки \`\`\`json ... \`\`\`.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error response:", errText);
      return NextResponse.json({ message: "Помилка звернення до API штучного інтелекту" }, { status: 502 });
    }

    const resData = await response.json();
    
    // Safely extract text from Gemini response structure
    const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json({ message: "ШІ повернув пусту відповідь" }, { status: 500 });
    }

    // Parse the generated JSON block
    try {
      // Clean possible markdown code blocks if the model ignored responseMimeType
      let cleanedText = rawText.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      }

      const parsedResult = JSON.parse(cleanedText);
      
      return NextResponse.json({
        description: parsedResult.description || "",
        hashtags: parsedResult.hashtags || ""
      });
    } catch (parseError) {
      console.error("Failed to parse Gemini JSON:", rawText, parseError);
      // Fallback in case JSON parsing failed — put the entire raw text into description
      return NextResponse.json({
        description: rawText,
        hashtags: ""
      });
    }
  } catch (error: any) {
    console.error("Error in AI generate route:", error);
    return NextResponse.json({ message: error.message || "Внутрішня помилка сервера" }, { status: 500 });
  }
}
