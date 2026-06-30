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

    // Map and normalize model name
    let model = aiConfig.model || "gemma-4-31b-it";
    if (model.startsWith("models/")) {
      model = model.replace("models/", "");
    }
    
    // Normalize Gemma 4 models
    const lowerModel = model.toLowerCase().trim();
    if (lowerModel.includes("26b") || lowerModel.includes("26")) {
      model = "gemma-4-26b-a4b-it";
    } else {
      model = "gemma-4-31b-it";
    }

    const systemPrompt = `Ви є старшим копірайтером, SMM-стратегом та брендовим голосом преміального українського сервісу «Запрошення ✦» (Zaproshenya).
Ваш тон має бути професійним, вишуканим, переконливим та емоційно зрілим. Ми не використовуємо надто дитячий або легковажний сленг. Натомість ми транслюємо естетику, спокій, технологічність та бездоганний стиль.

Про сервіс «Запрошення ✦»:
- Це інноваційна digital-платформа для створення інтерактивних електронних запрошень на будь-які події (весілля, ювілеї, корпоративи, бізнес-форуми, закриті вечірки, благодійні заходи).
- Ключова цінність: повне позбавлення від організаційного стресу. Замість хаосу в чатах на 100 людей — одне красиве посилання.
- Можливості: інтерактивний RSVP-трекінг у реальному часі (гості підтверджують присутність, обирають меню, вказують побажання), інтегрована аналітика для організатора.

Ваше завдання:
На основі вхідного запиту користувача розробити високоестетичний, захоплюючий та грамотний промо-текст (опис) для публікацій у соціальних мережах (Instagram, TikTok, YouTube Shorts, Facebook) та підібрати ефективний пакет хештегов.

ПРАВИЛА ФОРМУВАННЯ ВІДПОВІДІ:
1. Ви ПОВИННІ згенерувати відповідь СУВОРО у форматі JSON із двома полями:
   - "description": Емоційний, структурований текст опису українською мовою. Використовуйте абзаци, списки (замість стандартних маркерів використовуйте тематичні преміальні емодзі), чіткий заклик до дії (CTA).
   - "hashtags": Рядок релевантних хештегов, розділених пробілами.
2. ЩОБ УНИКНУТИ ПОМИЛОК ПАРСИНГУ JSON:
   - Усі внутрішні подвійні лапки всередині тексту "description" обов'язково замінюйте на українські кутові лапки « » або одинарні лапки. Ніколи не залишайте неекранвані подвійні лапки всередині значень JSON.
   - Символи переносу рядка в полі "description" записуйте як "\\n" (символ бекслешу та n). Не робіть реальних розривів рядків всередині значень JSON!
3. Повертайте ТІЛЬКИ чистий код JSON без будь-яких вступних слів, привітань, пояснень чи розмітки типу \`\`\`json ... \`\`\`.

ПРИКЛАД ОЧІКУВАНОЇ ВІДПОВІДІ:
{
  "description": "Мистецтво організації починається з першого дотику.\\n\\n«Запрошення ✦» — це більше, ніж digital-платформа. Це новий стандарт естетики та комфорту для ваших особливих подій: від приватних весіль до масштабних бізнес-форумів.\\n\\nЧому це змінює ваш досвід:\\n\\n✦ Безумовна естетика — створення візуального образу події, що вражає з першої секунди.\\n✦ Кінець епохи хаосу — забудьте про сотні повідомлень у месенджерах. Одне вишукане посилання замінює всі організаційні питання.\\n✦ Інтерактивний RSVP — гості підтверджують присутність, обирають меню та вказують побажання у зручному інтефейсі.\\n✦ Повний контроль — аналітика в реальному часі дозволяє планувати захід з хірургічною точністю.\\n\\nПеретворіть підготовку до свята на акт творчості, а не на джерело стресу. Дозвольте собі розкіш спокою та бездоганного стилю.\\n\\n✦ Створіть своє ідеальне запрошення за посиланням у профілі.",
  "hashtags": "#Запрошення #DigitalInvitations #ЕстетикаПодій #СучаснеВесілля #EventManagement #ПреміумСервіс #ОрганізаціяСвят"
}

Вхідний запит користувача: "${prompt}"`;

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
      
      // 1. Remove markdown code block wraps before processing
      cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      
      // 2. Strip any conversational prefix/suffix text by extracting only the JSON curly brace object
      const firstBrace = cleanedText.indexOf("{");
      const lastBrace = cleanedText.lastIndexOf("}");
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      }

      // Replace literal raw newlines inside the JSON string before parsing to prevent JSON.parse errors
      const parsedResult = JSON.parse(cleanedText);
      
      return NextResponse.json({
        description: parsedResult.description || "",
        hashtags: parsedResult.hashtags || ""
      });
    } catch (parseError) {
      console.warn("Standard JSON.parse failed. Executing bulletproof parser...", parseError);
      
      let description = "";
      let hashtags = "";

      // Try matching using single or multi-line greedy regex extraction
      const descMatch = rawText.match(/"description"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"hashtags"|,\s*\}|\s*\}$|\s*,\s*$)/i)
                     || rawText.match(/"description"\s*:\s*"([\s\S]*?)"/i);
      const hashMatch = rawText.match(/"hashtags"\s*:\s*"([\s\S]*?)"/i);

      if (descMatch) {
        description = descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      }
      if (hashMatch) {
        hashtags = hashMatch[1].replace(/\\"/g, '"');
      }

      // If regex failed, let's do plain-text extraction of hashtags at the end of the block
      if (!description) {
        const hashtagRegex = /(#[a-zA-Z0-9\u0400-\u04FF_]+\s*)+$/g;
        const hashMatches = rawText.match(hashtagRegex);
        if (hashMatches) {
          hashtags = hashMatches[0].trim();
          description = rawText.replace(hashtagRegex, "").trim();
        } else {
          description = rawText;
        }

        // Strip any JSON keys or raw JSON characters if the text was wrapped
        description = description
          .replace(/^\{\s*/, "")
          .replace(/\s*\}$/, "")
          .replace(/"description"\s*:\s*"/i, "")
          .replace(/"\s*,\s*"hashtags"\s*:\s*"[\s\S]*$/i, "")
          .replace(/"\s*\}$/i, "")
          .trim();
      }

      return NextResponse.json({
        description: description || rawText,
        hashtags: hashtags || ""
      });
    }
  } catch (error: any) {
    console.error("Error in AI generate route:", error);
    return NextResponse.json({ message: error.message || "Внутрішня помилка сервера" }, { status: 500 });
  }
}
