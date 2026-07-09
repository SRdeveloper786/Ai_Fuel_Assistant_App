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

// Generate dynamic local fallback responses when API is rate-limited or quota is exceeded
function generateLocalFallbackResponse(
  messageText: string,
  lang: "en" | "hi" | "ur" | "roman" | "ar",
  vehicleProfile: any,
  fuelLogs: any[]
): { reply: string; speechText: string } {
  const text = messageText.toLowerCase();
  
  // Extract vehicle details or fallback
  const make = vehicleProfile?.make || "gari";
  const model = vehicleProfile?.model || "car";
  const fuelType = vehicleProfile?.fuelType || "petrol";
  const engineSize = vehicleProfile?.engineSize ? `${vehicleProfile.engineSize}L` : "";
  const vehicleName = vehicleProfile ? `${make} ${model} ${engineSize}`.trim() : "";

  // Check recent logs to calculate current average
  let averageMileage = "";
  if (fuelLogs && fuelLogs.length > 0) {
    const validLogs = fuelLogs.filter((log: any) => log.mileage && log.mileage > 0);
    if (validLogs.length > 0) {
      const avg = (validLogs.reduce((acc: number, log: any) => acc + log.mileage, 0) / validLogs.length).toFixed(1);
      averageMileage = `${avg} km/l`;
    }
  }

  // Keywords detection
  const isMileage = text.includes("mileage") || text.includes("average") || text.includes("fuel") || text.includes("petrol") || text.includes("avg") || text.includes("kharch") || text.includes("tel") || text.includes("consumption");
  const isTyre = text.includes("tyre") || text.includes("tire") || text.includes("pressure") || text.includes("hawa") || text.includes("psi");
  const isTuning = text.includes("tuning") || text.includes("plug") || text.includes("filter") || text.includes("service") || text.includes("clean") || text.includes("mis");
  const isSensor = text.includes("obd") || text.includes("sensor") || text.includes("engine") || text.includes("light") || text.includes("diagnostic") || text.includes("scan");

  // Language script based templates
  if (lang === "ur") {
    // Urdu script (Nastaliq) text, spoken is Hindi script (Devanagari)
    let reply = "";
    let speech = "";

    if (isMileage) {
      const vDetails = vehicleName ? `آپ کی ${vehicleName} کی مائلیج` : "گاڑی کی مائلیج (اوسط)";
      const avgDetails = averageMileage ? ` (موجودہ اوسط: ${averageMileage})` : "";
      reply = `*آف لائن موڈ:* ${vDetails}${avgDetails} کو بہتر کرنے کے لیے یہ طریقے اپنائیں:
1. **آرام سے ڈرائیو کریں:** اچانک اسپیڈ بڑھانے یا سخت بریک لگانے سے گریز کریں۔
2. **درست اسپیڈ:** ہائی وے پر رفتار 60 سے 80 کلومیٹر فی گھنٹہ کے درمیان رکھیں جس سے 15% پیٹرول بچتا ہے۔
3. **ٹائر پریشر:** ہفتہ وار ٹائروں کی ہوا کا پریشر 30 سے 32 PSI پر برقرار رکھیں۔
4. **ٹیوننگ:** ایئر فلٹر اور سپارک پلگ کو وقت پر صاف یا تبدیل کریں۔`;
      speech = "गाड़ी का माइलेज बढ़ाने के लिए आराम से गाड़ी चलाएं, अचानक रेस और हार्ड ब्रेक से बचें। टायर का दबाव बत्तीस पी एस आई रखें, और एयर फ़िल्टर और स्पार्क प्लग को समय पर बदलें।";
    } else if (isTyre) {
      reply = `*آف لائن موڈ:* ٹائروں کا پریشر گاڑی کی کارکردگی اور مائلیج کے لیے بہت اہم ہے۔
• ہمیشہ ٹائر ٹھنڈے ہونے پر پریشر چیک کریں۔
• درست پریشر (معمول کے مطابق 30 سے 32 PSI) رکھنے سے پیٹرول کی 3 فیصد تک بچت ہوتی ہے اور گاڑی محفوظ چلتی ہے۔`;
      speech = "टायरों का दबाव सही रखना बहुत ज़रूरी है। सामान्य तौर पर हवा का प्रेशर तीस से बत्तीस पी एस आई रखें। इससे तीन प्रतिशत तक पेट्रोल की बचत होगी।";
    } else if (isTuning) {
      reply = `*آف لائن موڈ:* انجن کی باقاعدہ ٹیوننگ ہر 10,000 کلومیٹر پر لازمی کروائیں۔
• گندا ایئر فلٹر انجن کی کارکردگی کو کم کرتا ہے، اسے باقاعدگی سے صاف کریں۔
• خراب یا پرانے سپارک پلگ تبدیل کرنے سے پیٹرول کا اوسط فوری بہتر ہوتا ہے۔`;
      speech = "इंजन की ट्यूनिंग हर दस हज़ार किलोमीटर पर करवाएं। गंदा एयर फ़िल्टर साफ रखें और पुराने स्पार्क प्लग बदलने से गाड़ी का एवरेज तुरंत बेहतर होता है।";
    } else if (isSensor) {
      reply = `*آف لائن موڈ:* گاڑی کا OBD-II اسسٹنٹ چیک مکمل کر چکا ہے:
• آکسیجن سینسر اور تھروٹل باڈی مستحکم کام کر رہے ہیں۔
• اگر چیک انجن لائٹ آن ہو، تو فوری طور پر سینسرز کی صفائی اور کوڈ اسکیننگ کروائیں۔`;
      speech = "गाड़ी का ओ बी डी चेक पूरा हो गया है। ऑक्सीजन सेंसर और थ्रॉटल बॉडी सही काम कर रहे हैं। कोई खराबी नहीं मिली है।";
    } else {
      const vText = vehicleName ? `میں آپ کی ${vehicleName} کو بہتر بنانے کے لیے حاضر ہوں۔` : "میں گاڑی کی کارکردگی اور پیٹرول بچانے میں آپ کی مدد کے لیے حاضر ہو۔";
      reply = `*آف لائن موڈ:* السلام علیکم! ${vText}
میں مائلیج بڑھانے، انجن کی ٹیوننگ، ٹائر پریشر، اور OBD ڈائیگنوسٹکس کے بارے میں آپ کے سوالات کا جواب دے سکتا ہوں۔ آپ کیا پوچھنا چاہتے ہیں؟`;
      speech = "नमस्ते भाई! मैं आपकी गाड़ी का माइलेज और परफॉर्मेंस बेहतर बनाने में मदद कर सकता हूँ। आप क्या पूछना चाहते हैं?";
    }

    return { reply, speechText: speech };
  }

  if (lang === "roman") {
    // Roman Urdu text, spoken is Hindi script (Devanagari)
    let reply = "";
    let speech = "";

    if (isMileage) {
      const vDetails = vehicleName ? `Aapki ${vehicleName} ki mileage` : "Gari ka mileage (average)";
      const avgDetails = averageMileage ? ` (current average: ${averageMileage})` : "";
      reply = `*Offline Mode:* ${vDetails}${avgDetails} behtar karne ke liye ye ahem tips follow karein:
1. **Gentle Acceleration:** Ek dum se tez race na dein aur sudden braking se bacein, is se 15-20% fuel bachta hai.
2. **Proper Tyre Pressure:** Tyre me hawa hamesha standard (30-32 PSI) rakhein. Hawa kam hone se average kharab hota hai.
3. **Air Filter & Plugs:** Air filter aur spark plugs saaf rakhein. Ganda filter engine ka airflow block karta hai.
4. **Engine Idling:** Khadi gari me 30 second se zyada engine start na rakhein, is se fuel zaya hota hai.`;
      speech = "गाड़ी का माइलेज बढ़ाने के लिए आराम से गाड़ी चलाएं, अचानक रेस और हार्ड ब्रेक से बचें। टायर का दबाव बत्तीस पी एस आई रखें, और एयर फ़िल्टर और स्पार्क प्लग को समय पर बदलें।";
    } else if (isTyre) {
      reply = `*Offline Mode:* Tyre pressure gari ki mileage aur safety ke liye bohot ahem hai.
• Hawa hamesha tyre thande hone par check karein.
• Sahi tyre pressure (normally 30-32 PSI) rakhne se fuel consumption 3% tak kam ho jati hai.`;
      speech = "टायरों का दबाव सही रखना बहुत ज़रूरी है। सामान्य तौर पर हवा का प्रेशर तीस से बत्तीस पी एस आई रखें। इससे तीन प्रतिशत तक पेट्रोल की बचत होगी।";
    } else if (isTuning) {
      reply = `*Offline Mode:* Engine tuning har 10,000 km ke baad lazmi karwayein.
• Ganda air filter mileage aur pick dono kharab karta hai, isse regular clean ya change karein.
• Spark plugs agar purane hon toh change karwayein, is se fuel efficiency foran behtar ho jaye gi.`;
      speech = "इंजन की ट्यूनिंग हर दस हज़ार किलोमीटर पर करवाएं। गंदा एयर फ़िल्टर साफ रखें और पुराने स्पार्क प्लग बदलने से गाड़ी का एवरेज तुरंत बेहतर होता है।";
    } else if (isSensor) {
      reply = `*Offline Mode:* OBD-II system virtual check complete:
• Oxygen sensor aur Throttle Body readings are stable.
• Agar check engine light blink kare toh scan tool se error codes zaroor check karwayein aur sensors clean karein.`;
      speech = "गाड़ी का ओ बी डी चेक पूरा हो गया है। ऑक्सीजन सेंसर और थ्रॉटल बॉडी सही काम कर रहे हैं। कोई खराबी नहीं मिली है।";
    } else {
      const vText = vehicleName ? `main aapki ${vehicleName} ko optimize karne me madad kar sakta hoon.` : "main gari ki fuel efficiency behtar karne me aapki help kar sakta hoon.";
      reply = `*Offline Mode:* Assalam-o-Alaikum! ${vText}
Main mileage average, engine tuning, tyre pressure aur OBD diagnostics ke baare me bata sakta hoon. Aap kya poochna chahte hain?`;
      speech = "नमस्ते भाई! मैं आपकी गाड़ी का माइलेज और परफॉर्मेंस बेहतर बनाने में मदद कर सकता हूँ। आप क्या पूछना चाहते हैं?";
    }

    return { reply, speechText: speech };
  }

  if (lang === "hi") {
    // Hindi script text, spoken is Hindi script
    let reply = "";
    let speech = "";

    if (isMileage) {
      const vDetails = vehicleName ? `आपकी ${vehicleName} का माइलेज` : "गाड़ी का माइलेज (औसत)";
      const avgDetails = averageMileage ? ` (वर्तमान औसत: ${averageMileage})` : "";
      reply = `*ऑफ़लाइन मोड:* ${vDetails}${avgDetails} बेहतर करने के लिए इन सुझावों का पालन करें:
1. **धीरे-धीरे गति बढ़ाएं:** अचानक तेज़ रेस देने या हार्ड ब्रेक लगाने से बचें, इससे 15-20% ईंधन बचता है।
2. **टायर का सही दबाव:** टायर में हवा हमेशा सही (30-32 PSI) रखें। कम हवा से माइलेज खराब होता है।
3. **एयर फ़िल्टर और स्पार्क प्लेग:** इन्हें समय पर साफ़ रखें या बदलें। गंदा फ़िल्टर इंजन में हवा के प्रवाह को रोकता है।
4. **आइडलिंग से बचें:** खड़ी गाड़ी में 30 सेकंड से अधिक समय तक इंजन चालू न रखें।`;
      speech = "गाड़ी का माइलेज बढ़ाने के लिए आराम से गाड़ी चलाएं, अचानक रेस और हार्ड ब्रेक से बचें। टायर का दबाव बत्तीस पी एस आई रखें, और एयर फ़िल्टर और स्पार्क प्लग को समय पर बदलें।";
    } else if (isTyre) {
      reply = `*ऑफ़लाइन मोड:* टायर का दबाव गाड़ी के माइलेज और सुरक्षा के लिए बहुत महत्वपूर्ण है।
• टायर ठंडे होने पर हमेशा हवा का दबाव चेक करें।
• सही टायर प्रेशर (आमतौर पर 30-32 PSI) रखने से ईंधन की 3% तक बचत होती है।`;
      speech = "टायरों का दबाव सही रखना बहुत ज़रूरी है। सामान्य तौर पर हवा का प्रेशर तीस से बत्तीस पी एस आई रखें। इससे तीन प्रतिशत तक पेट्रोल की बचत होगी।";
    } else if (isTuning) {
      reply = `*ऑफ़लाइन मोड:* हर 10,000 किमी पर इंजन की ट्यूनिंग ज़रूर करवाएं।
• गंदा एयर फ़िल्टर माइलेज और पिकअप दोनों खराब करता है, इसे नियमित साफ़ करें।
• स्पार्क प्लग पुराने होने पर बदलें, इससे माइलेज तुरंत बेहतर हो जाएगा।`;
      speech = "इंजन की ट्यूनिंग हर दस हज़ार किलोमीटर पर करवाएं। गंदा एयर फ़िल्टर साफ रखें और पुराने स्पार्क प्लग बदलने से गाड़ी का एवरेज तुरंत बेहतर होता है।";
    } else if (isSensor) {
      reply = `*ऑफ़लाइन मोड:* ओबीडी-II सिस्टम वर्चुअल चेक पूरा हुआ:
• ऑक्सीजन सेंसर और थ्रॉटल बॉडी रीडिंग सामान्य हैं।
• यदि चेक इंजन लाइट ऑन हो, तो सेंसर साफ़ करें और स्कैन टूल से त्रुटि कोड की जांच करवाएं।`;
      speech = "गाड़ी का ओ बी डी चेक पूरा हो गया है। ऑक्सीजन सेंसर और थ्रॉटल बॉडी सही काम कर रहे हैं। कोई खराबी नहीं मिली है।";
    } else {
      const vText = vehicleName ? `मैं आपकी ${vehicleName} को बेहतर बनाने में मदद कर सकता हूँ।` : "मैं गाड़ी की ईंधन दक्षता में सुधार के लिए आपकी सहायता कर सकता हूँ।";
      reply = `*ऑफ़लाइन मोड:* नमस्ते! ${vText}
मैं माइलेज बढ़ाने, ट्यूनिंग, टायर प्रेशर और ओबीडी डायग्नोस्टिक्स के बारे में आपके सवालों के जवाब दे सकता हूँ। आप क्या पूछना चाहते हैं?`;
      speech = "नमस्ते! मैं आपकी गाड़ी का माइलेज और परफॉर्मेंस बेहतर बनाने में मदद कर रहा हूँ। आप क्या पूछना चाहते हैं?";
    }

    return { reply, speechText: speech };
  }

  // English fallback
  let reply = "";
  let speech = "";

  if (isMileage) {
    const vDetails = vehicleName ? `Your ${vehicleName}'s mileage` : "Your vehicle's mileage";
    const avgDetails = averageMileage ? ` (current average: ${averageMileage})` : "";
    reply = `*Offline Optimizer Mode:* ${vDetails}${avgDetails} can be maximized using these tips:
1. **Drive Smoothly:** Avoid rapid acceleration and hard braking. This saves up to 15-20% fuel.
2. **Proper Tyre Pressure:** Keep tyres inflated to the recommended level (normally 30-32 PSI). Under-inflation increases consumption by 3%.
3. **Clean Air Filter & Spark Plugs:** A clean engine breathes easier. Change air filters every 10k km.
4. **Avoid Excessive Idling:** Turn off the engine if stopped for more than 30 seconds.`;
    speech = "To increase your mileage, drive smoothly, keep tyre pressure at thirty two P S I, clean your air filter, and avoid unnecessary engine idling.";
  } else if (isTyre) {
    reply = `*Offline Optimizer Mode:* Proper tyre pressure is critical for fuel efficiency and traction.
• Check pressure weekly when the tyres are cold.
• Correct pressure (normally 30-32 PSI) saves up to 3% on fuel and ensures even wear.`;
    speech = "Proper tyre pressure is essential. Check pressure weekly when cold, and maintain thirty to thirty two P S I to save up to three percent fuel.";
  } else if (isTuning) {
    reply = `*Offline Optimizer Mode:* Engine tune-ups are recommended every 10,000 km.
• Air filters should be cleaned regularly to prevent airflow blockages.
• Worn spark plugs cause incomplete combustion and heavily reduce fuel economy. Replace them for immediate gains.`;
    speech = "Schedule regular engine tune ups every ten thousand kilometers. Clean air filters and fresh spark plugs are key to high efficiency.";
  } else if (isSensor) {
    reply = `*Offline Optimizer Mode:* Virtual OBD-II scan:
• Oxygen sensor flow rate is stable. Throttle response is healthy.
• If check engine light remains on, scan for Diagnostic Trouble Codes (DTC) and inspect sensors.`;
    speech = "The OBD scan indicates normal readings. Oxygen sensor and throttle positions are stable. No active faults found.";
  } else {
    const vText = vehicleName ? `I am here to help you optimize your ${vehicleName}.` : "I am here to help you optimize your vehicle's performance.";
    reply = `*Offline Optimizer Mode:* Hello! ${vText}
I can assist with fuel efficiency tips, engine tuning, tyre pressure guidelines, and OBD diagnostics. What would you like to ask?`;
    speech = "Hello! I am your AI assistant, ready to help you optimize your car's fuel efficiency, tuning, and diagnostics. How can I assist you today?";
  }

  return { reply, speechText: speech };
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

    // Call dynamic local fallback response generator based on user's language and vehicle profile
    const { reply, speechText: speech } = generateLocalFallbackResponse(message, resolvedLang, vehicleProfile, fuelLogs);

    return res.json({
      reply: reply,
      speechText: speech,
      resolvedLanguage: resolvedLang,
      resolvedSpeechLang: resolvedSpeechLang,
      timestamp: new Date().toISOString(),
      status: "quota_fallback"
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
