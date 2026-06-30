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
    let model = aiConfig.model || "gemini-1.5-flash";
    if (model.startsWith("models/")) {
      model = model.replace("models/", "");
    }
    
    // Normalize Gemma models if used, but preserve standard Gemini models
    const lowerModel = model.toLowerCase().trim();
    if (lowerModel.includes("gemini")) {
      // Keep standard gemini models as configured
    } else if (lowerModel.includes("gemma")) {
      if (lowerModel.includes("26b") || lowerModel.includes("26")) {
        model = "gemma-4-26b-a4b-it";
      } else {
        model = "gemma-4-31b-it";
      }
    } else {
      model = "gemini-1.5-flash"; // default fallback
    }

    const systemPrompt = `Ви є старшим копірайтером, SMM-стратегом та брендовим голосом преміального українського сервісу «Запрошення ✦» (Zaproshenya).
Ваш тон має бути професійним, вишуканим, переконливим та емоційно зрілим. Ми не використовуємо надто дитячий або легковажний сленг. Натомість ми транслюємо естетику, спокій, технологічність та бездоганний стиль.

Про сервіс «Запрошення ✦»:
- Це інноваційна digital-платформа для створення інтерактивних електронних запрошень на будь-які події (весілля, ювілеї, корпоративи, бізнес-форуми, закриті вечірки, благодійні заходи).
- Ключова цінність: повне позбавлення від організаційного стресу. Замість хаосу в чатах на 100 людей — одне красиве посилання.
- Можливості: інтерактивний RSVP-трекінг у реальному часі (гості підтверджують присутність, обирають меню, вказують побажання), інтегрована аналітика для організатора.

Ваше завдання:
На основі вхідного запиту користувача розробити високоестетичний, захоплюючий та грамотний промо-текст (опис) для публікацій у соціальних мережах (Instagram, TikTok, YouTube Shorts, Facebook) та підібрати ефективний пакет хештегов.

СУВОРІ СИСТЕМНІ ПРАВИЛА (ПОРУШЕННЯ ЗАБОРОНЕНО):
1. Ви ПОВИННІ згенерувати відповідь ВИКЛЮЧНО та СУВОРО у форматі JSON з двома полями:
   - "description": Емоційний, структурований текст опису українською мовою. Використовуйте абзаци, списки (замість стандартних маркерів використовуйте тематичні преміальні емодзі), чіткий заклик до дії (CTA).
   - "hashtags": Рядок релевантних хештегов, розділених пробілами.
2. ЗАБОРОНЕНО виводити будь-який супровідний текст, привітання, пояснення, аналіз чи коментарі до або після JSON-об'єкта. Відповідь має починатися з '{' та закінчуватися на '}'.
3. ЗАБОРОНЕНО використовувати розмітку Markdown на кшталт \`\`\`json ... \`\`\`. Повертайте ЛИШЕ чистий сирий текст JSON-об'єкта.
4. ЩОБ УНИКНУТИ ПОМИЛОК ПАРСИНГУ JSON:
   - Усі внутрішні подвійні лапки всередині тексту "description" обов'язково замінюйте на українські кутові лапки « » або одинарні лапки. Ніколи не залишайте неекранвані подвійні лапки всередині значень JSON.
   - Символи переносу рядка в полі "description" записуйте як "\\n" (символ бекслешу та n). Не робіть реальних розривів рядків всередині значень JSON!
5. Текст опису має бути завершеним і повністю готовим до публікації. Будьте максимально лаконічними та професійними, не пишіть зайвої "води".

ПРИКЛАД ОЧІКУВАНОЇ ВІДПОВІДІ (ПОВЕРТАЙТЕ СУВОРО ТАКИЙ ФОРМАТ):
{
  "description": "Мистецтво організації починається з першого дотику.\\n\\n«Запрошення ✦» — це більше, ніж digital-платформа. Це новий стандарт естетики та комфорту для ваших особливих подій: від приватних весіль до масштабних бізнес-форумів.\\n\\n✦ Безумовна естетика — створення візуального образу події, що вражає з першої секунди.\\n✦ Кінець епохи хаосу — одне вишукане посилання замінює всі організаційні питання.\\n✦ RSVP-трекінг — гості підтверджують присутність, обирають меню та вказують побажання.\\n\\n✦ Створіть своє ідеальне запрошення за посиланням у профілі.",
  "hashtags": "#Запрошення #DigitalInvitations #ЕстетикаПодій #СучаснеВесілля #EventManagement"
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

    // Parse the generated JSON block with robust string scanning (bulletproof)
    let description = "";
    let hashtags = "";

    let cleanedText = rawText.trim();
    // Remove markdown code block wraps before processing
    cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    try {
      const parsedResult = JSON.parse(cleanedText);
      description = parsedResult.description || "";
      hashtags = parsedResult.hashtags || "";
    } catch (parseError) {
      console.warn("Standard JSON.parse failed. Executing bulletproof split-and-scan parser...", parseError);

      // Robust split-and-scan:
      // Look for the boundaries of keys "description" and "hashtags".
      // Since "hashtags" follows "description", splitting on the ", "hashtags": " pattern is extremely reliable.
      const descKeyIndex = cleanedText.search(/"description"\s*:\s*"/i);
      if (descKeyIndex !== -1) {
        const match = cleanedText.substring(descKeyIndex).match(/"description"\s*:\s*"/i);
        if (match) {
          const valueStartIndex = descKeyIndex + match[0].length;
          const boundaryRegex = /",\s*"hashtags"\s*:\s*"/i;
          const boundaryMatch = cleanedText.substring(valueStartIndex).match(boundaryRegex);

          if (boundaryMatch && boundaryMatch.index !== undefined) {
            description = cleanedText.substring(valueStartIndex, valueStartIndex + boundaryMatch.index);
            const hashtagsStartIndex = valueStartIndex + boundaryMatch.index + boundaryMatch[0].length;
            const endingQuoteIndex = cleanedText.substring(hashtagsStartIndex).lastIndexOf('"');
            if (endingQuoteIndex !== -1) {
              hashtags = cleanedText.substring(hashtagsStartIndex, hashtagsStartIndex + endingQuoteIndex);
            } else {
              hashtags = cleanedText.substring(hashtagsStartIndex).replace(/\s*\}\s*$/, "").trim();
            }
          } else {
            const endingQuoteIndex = cleanedText.substring(valueStartIndex).lastIndexOf('"');
            if (endingQuoteIndex !== -1) {
              description = cleanedText.substring(valueStartIndex, valueStartIndex + endingQuoteIndex);
            } else {
              description = cleanedText.substring(valueStartIndex).replace(/\s*\}\s*$/, "").trim();
            }
          }
        }
      }

      // If split-and-scan was unable to extract the description, fallback to regex and heuristic parsing
      if (!description) {
        const descMatch = cleanedText.match(/"description"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"hashtags"|,\s*\}|\s*\}$|\s*,\s*$)/i)
                       || cleanedText.match(/"description"\s*:\s*"([\s\S]*?)"/i);
        const hashMatch = cleanedText.match(/"hashtags"\s*:\s*"([\s\S]*?)"/i);

        if (descMatch) {
          description = descMatch[1];
        } else {
          // Plain text fallback with keys removed
          description = cleanedText
            .replace(/^\{\s*/, "")
            .replace(/\s*\}$/, "")
            .replace(/"description"\s*:\s*"/i, "")
            .replace(/"\s*,\s*"hashtags"\s*:\s*"[\s\S]*$/i, "")
            .replace(/"\s*\}$/i, "")
            .trim();
        }

        if (hashMatch) {
          hashtags = hashMatch[1];
        }
      }

      // If all else fails, use hashtag scanner heuristic at the end of raw text
      if (!description) {
        const hashtagRegex = /(#[a-zA-Z0-9\u0400-\u04FF_]+\s*)+$/g;
        const hashMatches = rawText.match(hashtagRegex);
        if (hashMatches) {
          hashtags = hashMatches[0].trim();
          description = rawText.replace(hashtagRegex, "").trim();
        } else {
          description = rawText;
        }
      }

      // Final unescaping of quotes and control sequences
      description = description
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\")
        .trim();

      hashtags = hashtags
        .replace(/\\n/g, " ")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, "\\")
        .trim();
    }

    return NextResponse.json({
      description: description || rawText,
      hashtags: hashtags || ""
    });
  } catch (error: any) {
    console.error("Error in AI generate route:", error);
    return NextResponse.json({ message: error.message || "Внутрішня помилка сервера" }, { status: 500 });
  }
}
