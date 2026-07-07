var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var aiClient = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it via the Settings > Secrets panel.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function resolveResponseLanguage(messageText, clientLanguage) {
  const text = messageText.trim().toLowerCase();
  const englishRequestKeywords = [
    "english",
    "eng",
    "angreji",
    "angrezi",
    "inglish",
    "inglis",
    "translate to english",
    "reply in english",
    "tell me in english",
    "english mein",
    "english me",
    "english main",
    "english m",
    "explain in english",
    "batao english",
    "english me bata",
    "english ma",
    "english bta",
    "english btao",
    "in english"
  ];
  const asksForEnglish = englishRequestKeywords.some((keyword) => text.includes(keyword));
  if (asksForEnglish) {
    return { textLang: "en", speechLang: "en" };
  }
  const isUrduScript = /[\u0600-\u06FF]/.test(messageText);
  const isHindiScript = /[\u0900-\u097F]/.test(messageText);
  if (isUrduScript) {
    return { textLang: "ur", speechLang: "hi" };
  }
  if (isHindiScript) {
    return { textLang: "hi", speechLang: "hi" };
  }
  const romanKeywords = [
    "gari",
    "gadi",
    "mileage",
    "average",
    "petrol",
    "kya",
    "hai",
    "theek",
    "kaise",
    "batao",
    "aur",
    "mein",
    "badhane",
    "karu",
    "assalam",
    "bhai",
    "kr",
    "ho",
    "ye",
    "se",
    "ki",
    "ko",
    "ka",
    "na",
    "he",
    "bolay",
    "bhi",
    "krne",
    "tarika",
    "tarike",
    "kyu",
    "kyon",
    "kion",
    "chahiye",
    "kam",
    "ziada",
    "zyada",
    "chal",
    "rhi",
    "rha",
    "karna",
    "par",
    "pe",
    "per",
    "mera",
    "meri",
    "auto",
    "engine",
    "tuning",
    "dhanyawad",
    "shukriya",
    "bhaiya",
    "bataiye",
    "bataen",
    "nikalne",
    "nikalein",
    "hain",
    "ma",
    "bta",
    "btao",
    "mre",
    "mra",
    "mri"
  ];
  const hasRomanKeywords = romanKeywords.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(text);
  });
  const hasRomanIndicators = /\b(kaise|kese|kya|kia|hai|he|ho|kr|kar|se|ko|ki|ka|na|bhi|ye|yeh|ma|bta|btao|mre|mra|mri)\b/i.test(text);
  if (hasRomanKeywords || hasRomanIndicators || clientLanguage === "roman" || clientLanguage === "ur" || clientLanguage === "hi") {
    return { textLang: "roman", speechLang: "hi" };
  }
  return { textLang: "en", speechLang: "en" };
}
app.post("/api/chat", async (req, res) => {
  const { message, history = [], vehicleProfile = null, fuelLogs = [], language = "roman" } = req.body || {};
  let resolvedLang = "en";
  let resolvedSpeechLang = "en";
  try {
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }
    const ai = getGeminiClient();
    const resolved = resolveResponseLanguage(message, language);
    resolvedLang = resolved.textLang;
    resolvedSpeechLang = resolved.speechLang;
    const languageDirectives = {
      en: "CRITICAL LANGUAGE DIRECTIVE: Respond 100% in English language. Do not use Urdu script, Roman Urdu words, Hindi script, or Devanagari. Keep it professional, helpful, and concise.",
      ur: "CRITICAL LANGUAGE DIRECTIVE: Respond 100% in URDU script (\u0627\u0631\u062F\u0648 \u0631\u0633\u0645 \u0627\u0644\u062E\u0637/\u0646\u0633\u062A\u0639\u0644\u06CC\u0642). Do not use English script except for numbers or technical terms. Ensure you do NOT use Devanagari/Hindi script or Roman script.",
      roman: "CRITICAL LANGUAGE DIRECTIVE: Respond 100% in ROMAN URDU (Urdu written in English/Latin alphabets, e.g., 'gari ka average badhane ke liye...', 'shukriya bhai'). Do not use Urdu script (\u0627\u0631\u062F\u0648) or Hindi/Arabic scripts. Keep it extremely natural, friendly, phonetic, and respectful (e.g., using words like 'Aap', 'Bhai', 'Shukriya', 'Theek'). Do NOT output Urdu script or Hindi/Devanagari script.",
      hi: "CRITICAL LANGUAGE DIRECTIVE: Respond 100% in HINDI script (\u0939\u093F\u0902\u0926\u0940/Devanagari). Do not use Urdu script, Roman Urdu script, or English script except for pure numbers/units. Keep the vocabulary simple, friendly, and natural.",
      ar: "CRITICAL LANGUAGE DIRECTIVE: Respond 100% in Arabic script."
    };
    const activeDirective = languageDirectives[resolvedLang] || languageDirectives["en"];
    const systemInstruction = `
You are the "AI Fuel Assistant & Vehicle Optimizer" (Smart Vehicle & Fuel Expert).
Your goals:
1. Provide accurate, helpful answers to user questions.
2. Be an exceptional problem solver for vehicle issues, low fuel efficiency, mileage problems, and engine maintenance.
3. Be a "Memory Saver": Actively refer to the user's vehicles and logged fuel logs to give personalized, specific answers (e.g., "Aapka Honda Civic average 12 Km/L de raha hai, jo thoda kam hai..." or "Based on your logs, your fuel costs went up by 15% this month.").

${activeDirective}

SPEECH SYNTHESIS & VOICE COMMAND TRAINING DIRECTIVE:
1. The user may ask you to speak or tell them verbally (e.g., "mujhe bol kar batao", "mujy bol kr batao", "bol kar sunao", "speak to me", "tell me verbally", "mujhe bolo").
2. When the user asks you to speak or if they are in voice-guided mode, you MUST make your response incredibly clean, concise, flowing, and conversational, so it can be spoken out loud beautifully.
3. If the user's current conversational script is Roman Urdu, Urdu, or Hindi, and they ask you to speak, you must craft your response so it sounds perfectly natural when spoken by a Hindi voice synthesizer. Keep it in high-quality Roman Urdu or Urdu/Hindi but sound friendly and engaging!
4. Avoid heavy tables, deep nested parentheses, block code syntax, or excessive markdown formatting (like dense asterisks or weird brackets) in spoken mode. Use clear, simple, human sentences.

MULTILINGUAL AUTO-SPELLING & TYPO CORRECTION DIRECTIVE:
1. The user's input may contain multiple spelling mistakes, mechanical/keyboard typos, or highly varied phonetic slang in English, Roman Urdu, Urdu script, Hindi, or Arabic.
   Common phonetic/keyboard typos to resolve silently:
   - Vehicle/Parts: 'gari', 'gadi', 'gaari', 'bik', 'biki', 'moter', 'motorcykel', 'engin', 'enjin', 'cluch', 'break', 'break pads', 'tyre', 'tire', 'tayer', 'plg', 'pleg', 'plugs', 'filtre', 'filtr', 'presure', 'preshur'.
   - Metrics/Refuel: 'miliage', 'milej', 'avrage', 'averg', 'evrage', 'fuel', 'petrole', 'pakar', 'rupay', 'rupee', 'liter', 'leeter', 'litr', 'odometre', 'reading', 'reeding', 'staton', 'stasan'.
   - AI/Help: 'asistant', 'asisistant', 'asistent', 'asisstant', 'assisstant', 'asistant', 'coorect', 'speling', 'hlep', 'tipz', 'teps', 'tup', 'fomula', 'calculat', 'colculate'.
   - Chat/Greetings: 'shukria', 'shukriya', 'shukran', 'salam', 'slaam', 'assalam', 'hey', 'helo', 'hlw', 'plz', 'please', 'pilese', 'bolay', 'bole', 'batae', 'bataiye', 'kya', 'kia', 'he', 'hai', 'ha', 'ho', 'kr', 'kar', 'kese', 'kaise', 'kesa', 'kaisa', 'bohat', 'bohot', 'bahut', 'bhai', 'bhaya', 'tha', 'thi', 'the', 'bhi', 'bi'.
2. You MUST perform silent auto-correction on the user's query. Interpret their core intent with high accuracy, completely ignoring any typos or phonetic discrepancies.
3. Keep the correction 100% silent and seamless: Do not lecture, correct, mock, or explicitly state that the user made a spelling mistake. Respond directly to the intent of their query with pristine, high-quality, and professional language.
4. Auto-correct mixed linguistic blends (e.g. half-english, half-roman, or slang terms) into a single, cohesive, perfectly-spelled output based on the selected language, maintaining maximum accuracy.

Always adjust your response language and vocabulary to match this directive exactly.

CONTEXT MEMORY (Refer to this data to make your answers personalized):
- Active Vehicle: ${vehicleProfile ? JSON.stringify(vehicleProfile) : "No vehicle added yet"}
- Recent Fuel Entries: ${fuelLogs.length > 0 ? JSON.stringify(fuelLogs.slice(-5)) : "No fuel logs entered yet"}

Keep responses concise, clear, and action-oriented. If giving tips, use bullet points. When the user asks for calculations (e.g., how to calculate fuel average), explain the formula clearly: (Ending Odometer - Starting Odometer) / Liters.
`;
    const contents = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    const replyText = response.text || "I couldn't generate a response. Please try again.";
    res.json({
      reply: replyText,
      resolvedLanguage: resolvedLang,
      resolvedSpeechLang,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: "success"
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    const isQuotaExceeded = error.status === "RESOURCE_EXHAUSTED" || error.statusCode === 429 || String(error.message || "").toLowerCase().includes("quota") || String(error.message || "").toLowerCase().includes("exhausted") || String(error.message || "").toLowerCase().includes("429");
    if (isQuotaExceeded) {
      const fallbackReplies = {
        en: `*Notice: AI Assistant is currently at peak capacity (Free tier API quota limit reached).* 

Hello! I am currently operating in **Offline Support Mode** due to high traffic on our free AI server. 

Here are some helpful tips for your vehicle's fuel efficiency:
\u2022 **Maintain Proper Tyre Pressure:** Under-inflated tyres can increase fuel consumption by up to 3%.
\u2022 **Gentle Acceleration:** Avoid sudden acceleration and hard braking to save up to 15-20% fuel.
\u2022 **Clean Air Filter & Spark Plugs:** A dirty filter reduces engine airflow and decreases mileage.
\u2022 **Avoid Excess Idle:** Turn off your engine if you are parked or stopped for more than 30 seconds.

*Your logs and calculations are still 100% functional! Feel free to add and track your refuels above.*`,
        ur: `*\u0636\u0631\u0648\u0631\u06CC \u0627\u0637\u0644\u0627\u0639: \u0627\u06D2 \u0622\u0626\u06CC \u0627\u0633\u0633\u0679\u0646\u0679 \u067E\u0631 \u0627\u0633 \u0648\u0642\u062A \u0631\u0634 \u0632\u06CC\u0627\u062F\u06C1 \u06C1\u06D2 (\u06A9\u0648\u0679\u06C1 \u06A9\u06CC \u062D\u062F \u062E\u062A\u0645 \u06C1\u0648 \u06AF\u0626\u06CC \u06C1\u06D2)\u06D4*

\u06C1\u06CC\u0644\u0648! \u0645\u06CC\u06BA \u0641\u06CC \u0627\u0644\u062D\u0627\u0644 **\u0622\u0641 \u0644\u0627\u0626\u0646 \u0633\u067E\u0648\u0631\u0679 \u0645\u0648\u0688** \u0645\u06CC\u06BA \u06A9\u0627\u0645 \u06A9\u0631 \u0631\u06C1\u0627 \u06C1\u0648\u06BA \u06A9\u06CC\u0648\u0646\u06A9\u06C1 \u0627\u06D2 \u0622\u0626\u06CC \u0633\u0631\u0648\u0631 \u067E\u0631 \u0628\u0648\u062C\u06BE \u0639\u0627\u0631\u0636\u06CC \u0637\u0648\u0631 \u067E\u0631 \u0632\u06CC\u0627\u062F\u06C1 \u06C1\u06D2\u06D4

\u06AF\u0627\u0691\u06CC \u06A9\u06CC \u0645\u0627\u0626\u0644\u06CC\u062C (\u0627\u0648\u0633\u0637) \u0628\u0691\u06BE\u0627\u0646\u06D2 \u06A9\u06D2 \u0644\u06CC\u06D2 \u06A9\u0686\u06BE \u0645\u0641\u06CC\u062F \u0645\u0634\u0648\u0631\u06D2:
\u2022 **\u0679\u0627\u0626\u0631\u0648\u06BA \u06A9\u0627 \u067E\u0631\u06CC\u0634\u0631 \u062F\u0631\u0633\u062A \u0631\u06A9\u06BE\u06CC\u06BA:** \u06A9\u0645 \u06C1\u0648\u0627 \u06C1\u0648\u0646\u06D2 \u06A9\u06CC \u0648\u062C\u06C1 \u0633\u06D2 \u067E\u06CC\u0679\u0631\u0648\u0644 3 \u0641\u06CC\u0635\u062F \u0632\u06CC\u0627\u062F\u06C1 \u062E\u0631\u0686 \u06C1\u0648\u062A\u0627 \u06C1\u06D2\u06D4
\u2022 **\u0622\u0631\u0627\u0645 \u0633\u06D2 \u06AF\u0627\u0691\u06CC \u0686\u0644\u0627\u0626\u06CC\u06BA:** \u0627\u0686\u0627\u0646\u06A9 \u0631\u06CC\u0633 \u062F\u06CC\u0646\u06D2 \u06CC\u0627 \u062A\u06CC\u0632 \u0628\u0631\u06CC\u06A9 \u0645\u0627\u0631\u0646\u06D2 \u0633\u06D2 \u06AF\u0631\u06CC\u0632 \u06A9\u0631\u06CC\u06BA\u06D4 \u0627\u0633 \u0633\u06D2 15 \u0633\u06D2 20 \u0641\u06CC\u0635\u062F \u067E\u06CC\u0679\u0631\u0648\u0644 \u0628\u0686\u0627\u06CC\u0627 \u062C\u0627 \u0633\u06A9\u062A\u0627 \u06C1\u06D2\u06D4
\u2022 **\u0627\u06CC\u0626\u0631 \u0641\u0644\u0679\u0631 \u0627\u0648\u0631 \u0633\u067E\u0627\u0631\u06A9 \u067E\u0644\u06AF \u0635\u0627\u0641 \u0631\u06A9\u06BE\u06CC\u06BA:** \u06AF\u0646\u062F\u0627 \u0641\u0644\u0679\u0631 \u06AF\u0627\u0691\u06CC \u06A9\u06D2 \u0627\u0646\u062C\u0646 \u06A9\u06CC \u06A9\u0627\u0631\u06A9\u0631\u062F\u06AF\u06CC \u0627\u0648\u0631 \u0645\u0627\u0626\u0644\u06CC\u062C \u06A9\u0648 \u06A9\u0645 \u06A9\u0631\u062A\u0627 \u06C1\u06D2\u06D4
\u2022 **\u0622\u0626\u06CC\u0688\u0644\u0646\u06AF \u0633\u06D2 \u0628\u0686\u06CC\u06BA:** \u0627\u06AF\u0631 \u06AF\u0627\u0691\u06CC 30 \u0633\u06CC\u06A9\u0646\u0688 \u0633\u06D2 \u0632\u06CC\u0627\u062F\u06C1 \u06A9\u06BE\u0691\u06CC \u06C1\u0648 \u062A\u0648 \u0627\u0646\u062C\u0646 \u0628\u0646\u062F \u06A9\u0631 \u062F\u06CC\u06BA\u06D4

*\u0622\u067E \u06A9\u06D2 \u0644\u0627\u06AF\u0632 \u0627\u0648\u0631 \u06A9\u06CC\u0644\u06A9\u0648\u0644\u06CC\u0679\u0631 \u0628\u0627\u0644\u06A9\u0644 \u0679\u06BE\u06CC\u06A9 \u06A9\u0627\u0645 \u06A9\u0631 \u0631\u06C1\u06D2 \u06C1\u06CC\u06BA\u06D4 \u0622\u067E \u0627\u0648\u067E\u0631 \u0627\u067E\u0646\u06D2 \u0631\u06CC\u0641\u0644\u0632 \u06A9\u0627 \u0631\u06CC\u06A9\u0627\u0631\u0688 \u0645\u062D\u0641\u0648\u0638 \u0631\u06A9\u06BE \u0633\u06A9\u062A\u06D2 \u06C1\u06CC\u06BA\u06D4*`,
        roman: `*Notice: AI Assistant is waqt heavy traffic par hai (API Quota limit reach ho gayi hai).*

Hello bhai! Main abhi **Offline Support Mode** me kaam kar raha hoon kyunki free AI server par temporary load zyada hai.

Apni gari ka fuel average aur performance behtar karne ke liye kuch ahem tips:
\u2022 **Tyre Pressure theek rakhein:** Hawa kam hone se fuel consumption 3% tak barh jati hai.
\u2022 **Araam se race dein:** Ek dum se tez acceleration aur hard braking se bachein. Is se 15-20% fuel bacha sakte hain.
\u2022 **Air Filter aur Spark Plugs saaf rakhein:** Ganda filter engine ka airflow block karta hai aur mileage kam karta hai.
\u2022 **Engine Idle na karein:** Agar gari 30 seconds se zyada khadi ho toh engine band kar dein.

*Aapke fuel logs aur calculations bilkul sahi kaam kar rahe hain. Aap upar fuel entries save karte rahein!*`,
        hi: `*\u0938\u0942\u091A\u0928\u093E: \u090F\u0906\u0908 \u0905\u0938\u093F\u0938\u094D\u091F\u0947\u0902\u091F \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u092E\u0947\u0902 \u0935\u094D\u092F\u0938\u094D\u0924 \u0939\u0948 (\u090F\u092A\u0940\u0906\u0908 \u0915\u094B\u091F\u093E \u0938\u0940\u092E\u093E \u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u094B \u0917\u0908 \u0939\u0948)\u0964*

\u0928\u092E\u0938\u094D\u0924\u0947! \u092E\u0948\u0902 \u0905\u092D\u0940 **\u0911\u092B\u093C\u0932\u093E\u0907\u0928 \u0938\u0939\u093E\u092F\u0924\u093E \u092E\u094B\u0921** \u092E\u0947\u0902 \u0915\u093E\u092E \u0915\u0930 \u0930\u0939\u093E \u0939\u0942\u0901 \u0915\u094D\u092F\u094B\u0902\u0915\u093F \u0939\u092E\u093E\u0930\u0947 \u092E\u0941\u092B\u093C\u094D\u0924 \u090F\u0906\u0908 \u0938\u0930\u094D\u0935\u0930 \u092A\u0930 \u091F\u094D\u0930\u0948\u092B\u093C\u093F\u0915 \u0905\u0927\u093F\u0915 \u0939\u0948\u0964

\u0906\u092A\u0915\u0947 \u0935\u093E\u0939\u0928 \u0915\u0940 \u0908\u0902\u0927\u0928 \u0926\u0915\u094D\u0937\u0924\u093E \u092C\u0922\u093C\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0915\u0941\u091B \u0909\u092A\u092F\u094B\u0917\u0940 \u0938\u0941\u091D\u093E\u0935:
\u2022 **\u091F\u093E\u092F\u0930 \u0915\u093E \u0926\u092C\u093E\u0935 \u0938\u0939\u0940 \u0930\u0916\u0947\u0902:** \u0915\u092E \u0939\u0935\u093E \u0935\u093E\u0932\u0947 \u091F\u093E\u092F\u0930\u094B\u0902 \u0938\u0947 \u0908\u0902\u0927\u0928 \u0915\u0940 \u0916\u092A\u0924 3% \u0924\u0915 \u092C\u0922\u093C \u0938\u0915\u0924\u0940 \u0939\u0948\u0964
\u2022 **\u0927\u0940\u0930\u0947-\u0927\u0940\u0930\u0947 \u0917\u0924\u093F \u092C\u0922\u093C\u093E\u090F\u0902:** \u0905\u091A\u093E\u0928\u0915 \u0924\u0947\u091C\u093C \u0917\u0924\u093F \u0914\u0930 \u0939\u093E\u0930\u094D\u0921 \u092C\u094D\u0930\u0947\u0915\u093F\u0902\u0917 \u0938\u0947 \u092C\u091A\u0947\u0902, \u0907\u0938\u0938\u0947 15-20% \u0908\u0902\u0927\u0928 \u092C\u091A\u093E\u092F\u093E \u091C\u093E \u0938\u0915\u0924\u093E \u0939\u0948\u0964
\u2022 **\u090F\u092F\u0930 \u092B\u093C\u093F\u0932\u094D\u091F\u0930 \u0914\u0930 \u0938\u094D\u092A\u093E\u0930\u094D\u0915\u586B \u092A\u094D\u0932\u0917 \u0938\u093E\u092B\u093C \u0930\u0916\u0947\u0902:** \u0917\u0902\u0926\u093E \u092B\u093C\u093F\u0932\u094D\u091F\u0930 \u0907\u0902\u091C\u0928 \u0915\u0947 \u0939\u0935\u093E \u0915\u0947 \u092A\u094D\u0930\u0935\u093E\u0939 \u0915\u094B \u0915\u092E \u0915\u0930\u0924\u093E \u0939\u0948 \u0914\u0930 \u092E\u093E\u0907\u0932\u0947\u091C \u0918\u091F\u093E\u0924\u093E \u0939\u0948\u0964
\u2022 **\u0906\u0907\u0921\u0932\u093F\u0902\u0917 \u0938\u0947 \u092C\u091A\u0947\u0902:** \u092F\u0926\u093F \u0935\u093E\u0939\u0928 30 \u0938\u0947\u0915\u0902\u0921 \u0938\u0947 \u0905\u0927\u093F\u0915 \u0938\u092E\u092F \u0924\u0915 \u0916\u0921\u093C\u093E \u0939\u0948, \u0924\u094B \u0907\u0902\u091C\u0928 \u092C\u0902\u0926 \u0915\u0930 \u0926\u0947\u0902\u0964

*\u0906\u092A\u0915\u0947 \u0932\u0949\u0917 \u0914\u0930 \u0917\u0923\u0928\u093E \u092A\u0942\u0930\u0940 \u0924\u0930\u0939 \u0938\u0947 \u0915\u093E\u092E \u0915\u0930 \u0930\u0939\u0947 \u0939\u0948\u0902! \u0906\u092A \u090A\u092A\u0930 \u0905\u092A\u0928\u0947 \u0930\u093F\u092B\u093C\u093F\u0932 \u0930\u093F\u0915\u0949\u0930\u094D\u0921 \u0915\u094B \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0930\u0916 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964*`,
        ar: `*\u0645\u0644\u0627\u062D\u0638\u0629: \u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u064A\u0648\u0627\u062C\u0647 \u0636\u063A\u0637\u0627\u064B \u0643\u0628\u064A\u0631\u0627\u064B \u062D\u0627\u0644\u064A\u0627\u064B (\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0644\u0637\u0644\u0628\u0627\u062A).*

\u0645\u0631\u062D\u0628\u0627\u064B! \u0623\u0646\u0627 \u0623\u0639\u0645\u0644 \u062D\u0627\u0644\u064A\u0627\u064B \u0641\u064A **\u0648\u0636\u0639 \u0627\u0644\u062F\u0639\u0645 \u063A\u064A\u0631 \u0627\u0644\u0645\u062A\u0635\u0644 \u0628\u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A** \u0646\u0638\u0631\u0627\u064B \u0644\u0644\u0636\u063A\u0637 \u0627\u0644\u0645\u0624\u0642\u062A \u0639\u0644\u0649 \u062E\u0648\u0627\u062F\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629.

\u0625\u0644\u064A\u0643 \u0628\u0639\u0636 \u0627\u0644\u0646\u0635\u0627\u0626\u062D \u0627\u0644\u0642\u064A\u0645\u0629 \u0644\u062A\u062D\u0633\u064A\u0646 \u0643\u0641\u0627\u0621\u0629 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0648\u0642\u0648\u062F \u0644\u0633\u064A\u0627\u0631\u062A\u0643:
\u2022 **\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0636\u063A\u0637 \u0627\u0644\u0625\u0637\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u0633\u0628:** \u0627\u0644\u0625\u0637\u0627\u0631\u0627\u062A \u063A\u064A\u0631 \u0627\u0644\u0645\u0646\u0641\u0648\u062E\u0629 \u062A\u0632\u064A\u062F \u0645\u0646 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0648\u0642\u0648\u062F \u0628\u0646\u0633\u0628\u0629 \u062A\u0635\u0644 \u0625\u0644\u0649 3\u066A.
\u2022 **\u0627\u0644\u062A\u0633\u0627\u0631\u0639 \u0627\u0644\u0644\u0637\u064A\u0641:** \u062A\u062C\u0646\u0628 \u0627\u0644\u062A\u0633\u0627\u0631\u0639 \u0627\u0644\u0645\u0641\u0627\u062C\u0626 \u0648\u0627\u0644\u0643\u0628\u062D \u0627\u0644\u0634\u062F\u064A\u062F \u0644\u062A\u0648\u0641\u064A\u0631 \u0645\u0627 \u064A\u0635\u0644 \u0625\u0644\u0649 15-20\u066A \u0645\u0646 \u0627\u0644\u0648\u0642\u0648\u062F.
\u2022 **\u062A\u0646\u0638\u064A\u0641 \u0641\u0644\u062A\u0631 \u0627\u0644\u0647\u0648\u0627\u0621 \u0648\u0634\u0645\u0639\u0627\u062A \u0627\u0644\u0627\u062D\u062A\u0631\u0627\u0642:** \u0627\u0644\u0641\u0644\u062A\u0631 \u0627\u0644\u0645\u062A\u0633\u062E \u064A\u0642\u0644\u0644 \u0645\u0646 \u062A\u062F\u0641\u0642 \u0627\u0644\u0647\u0648\u0627\u0621 \u0625\u0644\u0649 \u0627\u0644\u0645\u062D\u0631\u0643 \u0648\u064A\u0642\u0644\u0644 \u0645\u0646 \u0627\u0644\u0643\u0641\u0627\u0621\u0629.
\u2022 **\u062A\u062C\u0646\u0628 \u0627\u0644\u062A\u0628\u0627\u0637\u0624 \u0627\u0644\u0632\u0627\u0626\u062F:** \u0623\u0648\u0642\u0641 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0645\u062D\u0631\u0643 \u0625\u0630\u0627 \u0643\u0646\u062A \u0645\u062A\u0648\u0642\u0641\u0627\u064B \u0644\u0623\u0643\u062B\u0631 \u0645\u0646 30 \u062B\u0627\u0646\u064A\u0629.

*\u0633\u062C\u0644\u0627\u062A\u0643 \u0648\u062D\u0633\u0627\u0628\u0627\u062A\u0643 \u0644\u0627 \u062A\u0632\u0627\u0644 \u062A\u0639\u0645\u0644 \u0628\u0646\u0633\u0628\u0629 100%! \u0644\u0627 \u062A\u062A\u0631\u062F\u062F \u0641\u064A \u0625\u0636\u0627\u0641\u0629 \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0648\u0642\u0648\u062F \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0643 \u0623\u0639\u0644\u0627\u0647.*`
      };
      const replyText = fallbackReplies[resolvedLang] || fallbackReplies["en"];
      return res.json({
        reply: replyText,
        resolvedLanguage: resolvedLang,
        resolvedSpeechLang,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        status: "quota_fallback"
      });
    }
    res.status(500).json({
      error: error.message || "An unexpected error occurred during chat processing.",
      status: "error"
    });
  }
});
app.post("/api/ocr-receipt", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body || {};
  try {
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 parameter is required." });
    }
    const ai = getGeminiClient();
    const imagePart = {
      inlineData: {
        mimeType,
        data: imageBase64
      }
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
          type: import_genai.Type.OBJECT,
          properties: {
            date: { type: import_genai.Type.STRING, description: "YYYY-MM-DD date format of the receipt." },
            totalCost: { type: import_genai.Type.NUMBER, description: "Total amount paid on receipt." },
            fuelFilled: { type: import_genai.Type.NUMBER, description: "Fuel volume in liters." },
            pricePerUnit: { type: import_genai.Type.NUMBER, description: "Price per single unit/liter of fuel." },
            odometer: { type: import_genai.Type.NUMBER, description: "Odometer reading in receipt if visible, otherwise null." },
            stationName: { type: import_genai.Type.STRING, description: "Fuel station franchise name." },
            currency: { type: import_genai.Type.STRING, description: "Currency symbol or code." }
          },
          required: ["date", "totalCost", "fuelFilled", "pricePerUnit"]
        }
      }
    });
    const resultText = response.text;
    if (!resultText) {
      throw new Error("OCR extraction returned an empty result.");
    }
    const parsedData = JSON.parse(resultText.trim());
    res.json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error("Receipt OCR error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to extract text from receipt image."
    });
  }
});
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: (/* @__PURE__ */ new Date()).toISOString() });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite Middleware...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode...");
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Fuel Assistant server successfully running on http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
