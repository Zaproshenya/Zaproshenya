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

    // Map and normalize model name, default to gemma-4-31b-it as requested
    let model = aiConfig.model || "gemma-4-31b-it";
    if (model.startsWith("models/")) {
      model = model.replace("models/", "");
    }
    
    // Normalize Gemma 4 models: 31B (gemma-4-31b-it) and 26B (gemma-4-26b-a4b-it)
    const lowerModel = model.toLowerCase().trim();
    if (lowerModel.includes("26b") || lowerModel.includes("26")) {
      model = "gemma-4-26b-a4b-it";
    } else {
      model = "gemma-4-31b-it";
    }

    // Structure our prompt to enforce clean JSON response format with rich project context
    const systemPrompt = `Ти — професійний копірайтер та SMM-спеціаліст для інноваційного українського проекту «Запрошення ✦» (Zaproshenya).
    
Про проект «Запрошення ✦»:
- Це зручний та сучасний веб-сервіс для створення інтерактивних електронних запрошень на будь-які події (дні народження, весілля, благодійні зустрічі, вечірки, кава-брейки, бізнес-івенти, дитячі свята тощо).
- Сервіс допомагає організаторам керувати списками гостей, миттєво відстежувати їхні відповіді (погодився, відмовився, попросив перенести зустріч на інший час) в реальному часі.
- Платформа робить організацію подій естетичною, легкою та позбавляє від зайвих турбот.

Твоє завдання — напиши привабливий, емоційний та залучаючий україномовний опис та підібрати релевантні хештеги для публікацій у соціальних мережах (YouTube, Instagram, TikTok, Facebook) на основі запиту користувача, інтегруючи за необхідності контекст нашого проекту «Запрошення ✦» у дружньому та сучасному тоні.

Запит користувача: "${prompt}"

Ти ПОВИНЕН повернути результат у форматі JSON із двома полями:
1. "description" — текст опису українською мовою з красивими абзацами, структурованими списками та відповідними емодзі.
2. "hashtags" — рядок релевантних хештегів через пробіл (наприклад: "#благодійність #запрошення #допомога").

Поверни тільки сирий JSON без будь-якого додаткового тексту, вступів, висновків та без розмітки \`\`\`json ... \`\`\`.`;

    // Gemma models do not support responseMimeType: "application/json" in Google's API,
    // so we construct the request body conditionally.
    const buildRequestBody = (modelName: string) => {
      const isGemmaModel = modelName.toLowerCase().includes("gemma");
      const body: any = {
        contents: [{ parts: [{ text: systemPrompt }] }]
      };
      if (!isGemmaModel) {
        body.generationConfig = {
          responseMimeType: "application/json"
        };
      }
      return body;
    };

    let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRequestBody(model))
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error response:", errText);
      let customMsg = "Помилка звернення до API штучного інтелекту.";
      try {
        const errObj = JSON.parse(errText);
        if (errObj?.error?.message) {
          customMsg += ` Деталі: ${errObj.error.message}`;
        }
      } catch (_) {}
      return NextResponse.json({ message: customMsg }, { status: 502 });
    }

    const resData = await response.json();
    
    // Safely extract text from Gemini response structure
    const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return NextResponse.json({ message: "ШІ повернув пусту відповідь" }, { status: 500 });
    }

    // Parse the generated JSON block robustly
    try {
      let cleanedText = rawText.trim();
      
      // 1. Strip any conversational prefix/suffix text by extracting only the JSON curly brace object
      const firstBrace = cleanedText.indexOf("{");
      const lastBrace = cleanedText.lastIndexOf("}");
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      }

      // 2. Clean possible markdown code blocks or escaped characters
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
      
      // 3. Regex Fallback: if JSON.parse fails, manually extract description and hashtags using Regex!
      // This is extremely robust and will capture fields even if raw newlines or unescaped quotes break standard JSON.
      let description = "";
      let hashtags = "";

      const descMatch = rawText.match(/"description"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"hashtags"|\s*})/i);
      const hashMatch = rawText.match(/"hashtags"\s*:\s*"([\s\S]*?)"/i);

      if (descMatch) {
        description = descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      }
      if (hashMatch) {
        hashtags = hashMatch[1].replace(/\\"/g, '"');
      }

      if (description) {
        return NextResponse.json({
          description,
          hashtags
        });
      }

      // Fallback in case everything else failed — put the entire raw text into description
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
