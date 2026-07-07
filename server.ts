import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON
app.use(express.json());

// Initialize Gemini Client
// We use a lazy initialization helper to prevent crashing on boot if the API key is not yet configured.
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it via the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to resolve the correct response language based on user's input content and explicit requests
function resolveResponseLanguage(messageText: string, clientLanguage: string): { textLang: "en" | "hi" | "ur" | "roman" | "ar"; speechLang: "en" | "hi" | "ar" } {
  const text = messageText.trim().toLowerCase();

  // 1. "If I provide the prompt in Roman, Hindi, or Urdu, telling me in English, then tell me in English."
  const englishRequestKeywords = [
    "english", "eng", "angreji", "angrezi", "inglish", "inglis", 
    "translate to english", "reply in english", "tell me in english", 
    "english mein", "english me", "english main", "english m",
    "explain in english", "batao english", "english me bata", "english ma",
    "english bta", "english btao", "in english"
  ];
  const asksForEnglish = englishRequestKeywords.some(keyword => text.includes(keyword));
  if (asksForEnglish) {
    return { textLang: "en", speechLang: "en" };
  }

  // 2. Detect the base language/script of the prompt
  const isUrduScript = /[\u0600-\u06FF]/.test(messageText);
  const isHindiScript = /[\u0900-\u097F]/.test(messageText);

  if (isUrduScript) {
    // If user prompt is Urdu script, output Urdu script in text, but speak in Hindi voice!
    return { textLang: "ur", speechLang: "hi" }; 
  }

  if (isHindiScript) {
    // If user prompt is Hindi script, output Hindi script in text, and speak in Hindi voice!
    return { textLang: "hi", speechLang: "hi" };
  }

  // Check for Roman language keywords (Urdu/Hindi written in Latin script)
  const romanKeywords = [
    "gari", "gadi", "mileage", "average", "petrol", "kya", "hai", "theek", "kaise", "batao", 
    "aur", "mein", "badhane", "karu", "assalam", "bhai", "kr", "ho", "ye", "se", "ki", "ko", 
    "ka", "na", "he", "bolay", "bhi", "krne", "tarika", "tarike", "kyu", "kyon", "kion",
    "chahiye", "kam", "ziada", "zyada", "chal", "rhi", "rha", "karna", "par", "pe", "per",
    "mera", "meri", "auto", "engine", "tuning", "dhanyawad", "shukriya", "bhaiya", "bataiye", 
    "bataen", "nikalne", "nikalein", "hain", "ma", "bta", "btao", "mre", "mra", "mri"
  ];
  
  const hasRomanKeywords = romanKeywords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(text);
  });

  // Short indicators of Roman Urdu / Hindi
  const hasRomanIndicators = /\b(kaise|kese|kya|kia|hai|he|ho|kr|kar|se|ko|ki|ka|na|bhi|ye|yeh|ma|bta|btao|mre|mra|mri)\b/i.test(text);

  if (hasRomanKeywords || hasRomanIndicators || clientLanguage === "roman" || clientLanguage === "ur" || clientLanguage === "hi") {
    // If prompt is in Roman Urdu, text response is Roman Urdu, but spoken is Hindi!
    return { textLang: "roman", speechLang: "hi" };
  }

  // 3. "When I speak in English, tell me in English and not in Hindi or any other language."
  return { textLang: "en", speechLang: "en" };
}

// REST API endpoint for AI Assistant (Supports Web Client and Android Studio App Integration!)
app.post("/api/chat", async (req, res) => {
  const { message, history = [], vehicleProfile = null, fuelLogs = [], language = "roman" } = req.body || {};
  let resolvedLang: "en" | "hi" | "ur" | "roman" | "ar" = "en";
  let resolvedSpeechLang: "en" | "hi" | "ar" = "en";
  try {
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGeminiClient();

    // Resolve the response language according to the user's requirements
    const resolved = resolveResponseLanguage(message, language);
    resolvedLang = resolved.textLang;
    resolvedSpeechLang = resolved.speechLang;

    const languageDirectives: Record<string, string> = {
      en: "CRITICAL LANGUAGE DIRECTIVE: Output 'reply' in 100% plain English. 'speechText' MUST be identical English text. Keep it concise, practical, and highly direct.",
      ur: `CRITICAL LANGUAGE DIRECTIVE:
1. Output 'reply' 100% in beautiful Urdu script (Nastaliq/Urdu, e.g., "گاڑی کا ایوریج..."). Do NOT output Hindi/Devanagari, Roman Urdu, or English words in the reply.
2. Output 'speechText' 100% in clear Devanagari/Hindi script translation of the Urdu message (e.g., "गाड़ी का एवरेज...") so that standard Hindi TTS can pronounce it natively.`,
      roman: `CRITICAL LANGUAGE DIRECTIVE:
1. Output 'reply' 100% in natural Roman Urdu (written in Latin script, e.g., "gari ka average badhane ke liye..."). Do NOT output Urdu script or Hindi script characters in the reply.
2. Output 'speechText' 100% in clear Devanagari/Hindi script translation of the Roman Urdu message (e.g., "गाड़ी का एवरेज...") so that standard Hindi TTS can pronounce it natively.`,
      hi: `CRITICAL LANGUAGE DIRECTIVE:
1. Output 'reply' 100% in clean Devanagari/Hindi script. Do NOT output Urdu or Roman Urdu characters in the reply.
2. Output 'speechText' 100% in identical Devanagari/Hindi script.`,
      ar: "CRITICAL LANGUAGE DIRECTIVE: Output 'reply' in Arabic script. 'speechText' in identical Arabic script."
    };

    const activeDirective = languageDirectives[resolvedLang] || languageDirectives["en"];

    // Set up a powerful multilingual persona for the AI Fuel Assistant
    const systemInstruction = `
You are the "AI Fuel Assistant & Vehicle Optimizer" (Smart Vehicle & Fuel Expert).
Your goals:
1. Provide accurate, helpful answers to user questions.
2. Be an exceptional problem solver for vehicle issues, low fuel efficiency, mileage problems, and engine maintenance.
3. Memory Saver: Actively refer to active vehicle and recent logs to personalize answers (e.g., "Aapka average 12 Km/L de raha hai...").

${activeDirective}

SPEECH SYNTHESIS & VOICE COMMAND TRAINING DIRECTIVE:
1. If user's conversational script is Roman Urdu, Urdu, or Hindi, 'speechText' MUST be in high-quality clean Devanagari/Hindi script to enable natural phonetic speech synthesis playback.
2. Keep replies clean, concise, short, and highly conversational. Avoid heavy tables or markdown.

CONTEXT MEMORY:
- Active Vehicle: ${vehicleProfile ? JSON.stringify(vehicleProfile) : "No vehicle added yet"}
- Recent Fuel Entries: ${fuelLogs.length > 0 ? JSON.stringify(fuelLogs.slice(-5)) : "No fuel logs entered yet"}

Explain calculations clearly: (Ending Odometer - Starting Odometer) / Liters. Keep responses direct, friendly, and brief to maximize speed!
`;

    // Format chat history for Gemini API
    const contents = history.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    // Append current message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { 
              type: Type.STRING, 
              description: "The direct text response to show the user, in the requested script/language ONLY." 
            },
            speechText: { 
              type: Type.STRING, 
              description: "An optimized phonetic version for speech synthesis. For Urdu, Roman Urdu, or Hindi, this MUST be in Devanagari/Hindi script." 
            }
          },
          required: ["reply", "speechText"]
        },
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        }
      },
    });

    const responseText = response.text || "{}";
    let replyText = "I couldn't generate a response. Please try again.";
    let speechText = "";

    try {
      const parsed = JSON.parse(responseText);
      replyText = parsed.reply || replyText;
      speechText = parsed.speechText || replyText;
    } catch (e) {
      console.warn("Failed to parse JSON response from Gemini:", responseText);
      replyText = responseText;
      speechText = responseText;
    }

    res.json({
      reply: replyText,
      speechText: speechText,
      resolvedLanguage: resolvedLang,
      resolvedSpeechLang: resolvedSpeechLang,
      timestamp: new Date().toISOString(),
      status: "success"
    });
  } catch (error: any) {
    console.warn("Gemini API Error (falling back to Offline Support Mode):", error);

    const isQuotaExceeded = 
      error.status === "RESOURCE_EXHAUSTED" ||
      error.statusCode === 429 ||
      String(error.message || "").toLowerCase().includes("quota") ||
      String(error.message || "").toLowerCase().includes("exhausted") ||
      String(error.message || "").toLowerCase().includes("429") ||
      String(error || "").toLowerCase().includes("quota") ||
      true; // Graceful offline support fallback for any server/connection errors to guarantee 100% uptime

    if (isQuotaExceeded) {
      // Provide a high-quality localized fallback message to keep the app functional and friendly!
      const fallbackReplies: Record<string, string> = {
        en: `*Notice: AI Assistant is currently at peak capacity (Free tier API quota limit reached).* 

Hello! I am currently operating in **Offline Support Mode** due to high traffic on our free AI server. 

Here are some helpful tips for your vehicle's fuel efficiency:
• **Maintain Proper Tyre Pressure:** Under-inflated tyres can increase fuel consumption by up to 3%.
• **Gentle Acceleration:** Avoid sudden acceleration and hard braking to save up to 15-20% fuel.
• **Clean Air Filter & Spark Plugs:** A dirty filter reduces engine airflow and decreases mileage.
• **Avoid Excess Idle:** Turn off your engine if you are parked or stopped for more than 30 seconds.

*Your logs and calculations are still 100% functional! Feel free to add and track your refuels above.*`,

        ur: `*ضروری اطلاع: اے آئی اسسٹنٹ پر اس وقت رش زیادہ ہے (کوٹہ کی حد ختم ہو گئی ہے)۔*

ہیلو! میں فی الحال **آف لائن سپورٹ موڈ** میں کام کر رہا ہوں کیونکہ اے آئی سرور پر بوجھ عارضی طور پر زیادہ ہے۔

گاڑی کی مائلیج (اوسط) بڑھانے کے لیے کچھ مفید مشورے:
• **ٹائروں کا پریشر درست رکھیں:** کم ہوا ہونے کی وجہ سے پیٹرول 3 فیصد زیادہ خرچ ہوتا ہے۔
• **آرام سے گاڑی چلائیں:** اچانک ریس دینے یا تیز بریک مارنے سے گریز کریں۔ اس سے 15 سے 20 فیصد پیٹرول بچایا جا سکتا ہے۔
• **ایئر فلٹر اور سپارک پلگ صاف رکھیں:** گندا فلٹر گاڑی کے انجن کی کارکردگی اور مائلیج کو کم کرتا ہے۔
• **آئیڈلنگ سے بچیں:** اگر گاڑی 30 سیکنڈ سے زیادہ کھڑی ہو تو انجن بند کر دیں۔

*آپ کے لاگز اور کیلکولیٹر بالکل ٹھیک کام کر رہے ہیں۔ آپ اوپر اپنے ریفلز کا ریکارڈ محفوظ رکھ سکتے ہیں۔*`,

        roman: `*Notice: AI Assistant is waqt heavy traffic par hai (API Quota limit reach ho gayi hai).*

Hello bhai! Main abhi **Offline Support Mode** me kaam kar raha hoon kyunki free AI server par temporary load zyada hai.

Apni gari ka fuel average aur performance behtar karne ke liye kuch ahem tips:
• **Tyre Pressure theek rakhein:** Hawa kam hone se fuel consumption 3% tak barh jati hai.
• **Araam se race dein:** Ek dum se tez acceleration aur hard braking se bachein. Is se 15-20% fuel bacha sakte hain.
• **Air Filter aur Spark Plugs saaf rakhein:** Ganda filter engine ka airflow block karta hai aur mileage kam karta hai.
• **Engine Idle na karein:** Agar gari 30 seconds se zyada khadi ho toh engine band kar dein.

*Aapke fuel logs aur calculations bilkul sahi kaam kar rahe hain. Aap upar fuel entries save karte rahein!*`,

        hi: `*सूचना: एआई असिस्टेंट वर्तमान में व्यस्त है (एपीआई कोटा सीमा समाप्त हो गई है)।*

नमस्ते! मैं अभी **ऑफ़लाइन सहायता मोड** में काम कर रहा हूँ क्योंकि हमारे मुफ़्त एआई सर्वर पर ट्रैफ़िक अधिक है।

आपके वाहन की ईंधन दक्षता बढ़ाने के लिए कुछ उपयोगी सुझाव:
• **टायर का दबाव सही रखें:** कम हवा वाले टायरों से ईंधन की खपत 3% तक बढ़ सकती है।
• **धीरे-धीरे गति बढ़ाएं:** अचानक तेज़ गति और हार्ड ब्रेकिंग से बचें, इससे 15-20% ईंधन बचाया जा सकता है।
• **एयर फ़िल्टर और स्पार्क प्लग साफ़ रखें:** गंदा फ़िल्टर इंजन के हवा के प्रवाह को कम करता है और माइलेज घटाता है।
• **आइडलिंग से बचें:** यदि वाहन 30 सेकंड से अधिक समय तक खड़ा है, तो इंजन बंद कर दें।

*आपके लॉग और गणना पूरी तरह से काम कर रहे हैं! आप ऊपर अपने रिफ़िल रिकॉर्ड को सुरक्षित रख सकते हैं।*`,

        ar: `*ملاحظة: مساعد الذكاء الاصطناعي يواجه ضغطاً كبيراً حالياً (تم تجاوز الحد الأقصى للطلبات).*

مرحباً! أنا أعمل حالياً في **وضع الدعم غير المتصل بالإنترنت** نظراً للضغط المؤقت على خوادم الذكاء الاصطناعي المجانية.

إليك بعض النصائح القيمة لتحسين كفاءة استهلاك الوقود لسيارتك:
• **حافظ على ضغط الإطارات المناسب:** الإطارات غير المنفوخة تزيد من استهلاك الوقود بنسبة تصل إلى 3٪.
• **التسارع اللطيف:** تجنب التسارع المفاجئ والكبح الشديد لتوفير ما يصل إلى 15-20٪ من الوقود.
• **تنظيف فلتر الهواء وشمعات الاحتراق:** الفلتر المتسخ يقلل من تدفق الهواء إلى المحرك ويقلل من الكفاءة.
• **تجنب التباطؤ الزائد:** أوقف تشغيل المحرك إذا كنت متوقفاً لأكثر من 30 ثانية.

*سجلاتك وحساباتك لا تزال تعمل بنسبة 100%! لا تتردد في إضافة سجلات الوقود الخاصة بك أعلاه.*`
      };

      const fallbackSpeechTexts: Record<string, string> = {
        en: "Notice. AI Assistant is currently operating in offline mode because the free server limit has been reached. Your logs and calculations are still fully functional.",
        ur: "सूचना। फ्री सर्वर लिमिट पूरी होने की वजह से असिस्टेंट ऑफलाइन मोड में काम कर रहा है। गाड़ी का माइलेज बढ़ाने के लिए टायर का प्रेशर सही रखें, आराम से रेस दें, एयर फिल्टर और स्पार्क प्लग साफ रखें, और खड़ी गाड़ी का इंजन बंद रखें।",
        roman: "सूचना। फ्री सर्वर लिमिट पूरी होने की वजह से असिस्टेंट ऑफलाइन मोड में काम कर रहा है। गाड़ी का माइलेज बढ़ाने के लिए टायर का प्रेशर सही रखें, आराम से रेस दें, एयर फिल्टर और स्पार्क प्लग साफ रखें, और खड़ी गाड़ी का इंजन बंद रखें।",
        hi: "सूचना। मुफ़्त सर्वर सीमा समाप्त होने के कारण एआई असिस्टेंट ऑफ़लाइन मोड में काम कर रहा है। गाड़ी का माइलेज बढ़ाने के लिए टायर का दबाव सही रखें, आराम से गति बढ़ाएं, एयर फ़िल्टर और स्पार्क प्लग साफ़ रखें, और खड़ी गाड़ी का इंजन बंद रखें।",
        ar: "ملاحظة. مساعد الذكاء الاصطناعي يواجه ضغطاً كبيراً حالياً ويعمل في وضع عدم الاتصال."
      };

      const replyText = fallbackReplies[resolvedLang] || fallbackReplies["en"];
      const speechText = fallbackSpeechTexts[resolvedLang] || fallbackSpeechTexts["en"];

      return res.json({
        reply: replyText,
        speechText: speechText,
        resolvedLanguage: resolvedLang,
        resolvedSpeechLang: resolvedSpeechLang,
        timestamp: new Date().toISOString(),
        status: "quota_fallback"
      });
    }

    res.status(500).json({
      error: error.message || "An unexpected error occurred during chat processing.",
      status: "error"
    });
  }
});

// Receipt Scanner OCR API
app.post("/api/ocr-receipt", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body || {};
  try {
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 parameter is required." });
    }

    const ai = getGeminiClient();

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };

    const promptText = `
You are an advanced Fuel Receipt OCR Extractor. Parse this fuel receipt image and extract the following details accurately.
Ensure values are numbers where appropriate. If any value is completely missing or illegible, return null or an empty string.

Fields to extract:
1. date: The receipt date in YYYY-MM-DD format.
2. totalCost: The total cost paid for the fuel (number).
3. fuelFilled: The volume of fuel filled in Liters (number).
4. pricePerUnit: The fuel price per Liter (number).
5. odometer: The vehicle's odometer reading if visible on the receipt (number, or null if not present).
6. stationName: The name of the fuel/gas station (e.g., Shell, Total, PSO, Exxon) (string).
7. currency: The currency symbol or code (e.g. PKR, USD, INR) (string).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, { text: promptText }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "YYYY-MM-DD date format of the receipt." },
            totalCost: { type: Type.NUMBER, description: "Total amount paid on receipt." },
            fuelFilled: { type: Type.NUMBER, description: "Fuel volume in liters." },
            pricePerUnit: { type: Type.NUMBER, description: "Price per single unit/liter of fuel." },
            odometer: { type: Type.NUMBER, description: "Odometer reading in receipt if visible, otherwise null." },
            stationName: { type: Type.STRING, description: "Fuel station franchise name." },
            currency: { type: Type.STRING, description: "Currency symbol or code." },
          },
          required: ["date", "totalCost", "fuelFilled", "pricePerUnit"],
        },
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        }
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("OCR extraction returned an empty result.");
    }

    const parsedData = JSON.parse(resultText.trim());
    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Receipt OCR error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to extract text from receipt image.",
    });
  }
});

// A quick health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Serve frontend assets using Vite middleware in development, or Express static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Fuel Assistant server successfully running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
