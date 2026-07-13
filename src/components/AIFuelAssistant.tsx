import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, SupportedLanguage, LANGUAGES, Vehicle, FuelEntry } from "../types";
import { Send, Mic, MicOff, Volume2, VolumeX, RefreshCw, AlertCircle, Play, Square, MessageSquare, Flame, Pin, Trash2, History, Compass, X, Scale, Calculator, Wrench, ChevronDown, CheckCircle, Plus, Info, Zap, Sparkles } from "lucide-react";

interface AIFuelAssistantProps {
  activeVehicle: Vehicle | null;
  fuelLogs: FuelEntry[];
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  currency?: string;
}

interface PinnedSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: string;
}

// Suggestion chips translator based on language
const SUGGESTIONS: Record<SupportedLanguage, string[]> = {
  en: [
    "How to increase my vehicle's efficiency?",
    "Show me the formula to calculate fuel efficiency",
    "What are some engine tuning tips for better efficiency?",
    "Why is my fuel average drop in winter/summer?"
  ],
  ur: [
    "گاڑی کی فیول کارکردگی (اوسط) بڑھانے کے طریقے کیا ہیں؟",
    "فیول ایوریج نکالنے کا فارمولا بتائیں",
    "بہتر کارکردگی کے لیے انجن ٹیوننگ کے اہم مشورے دیں",
    "میری گاڑی کا پیٹرول جلدی ختم ہو جاتا ہے، کیا وجہ ہو سکتی ہے؟"
  ],
  roman: [
    "Vehicle ki efficiency badhane ke asaan tarike batao",
    "Fuel average nikalne ka sahi formula kya hai?",
    "Engine tuning ke top performance tips dein",
    "Gari ka average kyu drop hota hai? Common reasons batayein"
  ],
  hi: [
    "वाहन की दक्षता (Efficiency) बढ़ाने के तरीके क्या हैं?",
    "ईंधन औसत की गणना करने का सूत्र बताएं",
    "बेहतर दक्षता के लिए इंजन ट्यूनिंग टिप्स दें",
    "मेरा ईंधन औसत अचानक क्यों कम हो गया है?"
  ],
  ar: [
    "كيف يمكنني تحسين كفاءة استهلاك الوقود لسيارتي؟",
    "ما هي الصيغة الصحيحة لحساب معدل استهلاك الوقود؟",
    "أعطني نصائح لصيانة المحرك لزيادة الأداء",
    "ما هي الأسباب الشائعة لضعف كفاءة الوقود؟"
  ],
};

// Auto-detect the input language to match user script and vocab
export function detectLanguageOfText(text: string, currentSelectedLang?: SupportedLanguage): SupportedLanguage {
  const trimmed = text.trim();
  if (!trimmed) return currentSelectedLang || "roman";

  // 1. Urdu / Arabic script character range check: \u0600-\u06FF
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    // If user explicitly selected Arabic, prioritize Arabic script for any Arabic-range text
    if (currentSelectedLang === "ar") {
      return "ar";
    }
    // If user explicitly selected Urdu, prioritize Urdu script
    if (currentSelectedLang === "ur") {
      return "ur";
    }
    // Urdu characters check: ٹ, ڈ, ڑ, ے, ں, چ, پ, ژ, گ
    if (/[ٹڈڑےںچپژگ]/.test(trimmed)) {
      return "ur";
    }
    // Arabic words indicators
    if (/\b(كيف|هل|سيارة|وقود|نعم|شكرا|جميل|مرحبا|السيارة|من|في|على|إلى|هذا|هذه|أنا|لا|سلام)\b/i.test(trimmed)) {
      return "ar";
    }
    // Arabic specific letters like ة, or specific forms that are not typically used in Urdu
    if (/[ةأإؤئى]/.test(trimmed)) {
      return "ar";
    }
    return "ur"; // Default to Urdu script
  }

  // 2. Hindi character range: \u0900-\u097F
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return "hi";
  }

  // 3. Roman Urdu / English check
  const lowercase = trimmed.toLowerCase();

  // Common Roman Urdu keywords (Urdu words written in English letters)
  const romanUrduKeywords = [
    "gari", "gadi", "mileage", "average", "petrol", "kya", "hai", "theek", "kaise", "batao", 
    "aur", "mein", "badhane", "karu", "assalam", "bhai", "kr", "ho", "ye", "se", "ki", "ko", 
    "ka", "na", "he", "bolay", "bhi", "krne", "tarika", "tarike", "kyu", "kyon", "kion",
    "chahiye", "kam", "ziada", "zyada", "chal", "rhi", "rha", "karna", "par", "pe", "per",
    "mera", "meri", "auto", "engine", "tuning", "dhanyawad", "shukriya", "bhaiya", "bataiye", 
    "bataen", "nikalne", "nikalein", "hain"
  ];

  const matchedKeywords = romanUrduKeywords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lowercase);
  });

  if (matchedKeywords.length >= 1) {
    return "roman";
  }

  // Common English words list to confirm English
  const englishWords = [
    "the", "and", "is", "of", "to", "in", "it", "you", "that", "he", "was", "for", "on", "are", 
    "as", "with", "his", "they", "i", "how", "what", "why", "where", "who", "show", "calculate", 
    "formula", "increase", "decrease", "vehicle", "car", "motorcycle", "fuel", "log", "refuel", 
    "cost", "price", "thanks", "thank", "hello", "hi", "assistant"
  ];
  const matchedEnglish = englishWords.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lowercase);
  });

  if (matchedEnglish.length > matchedKeywords.length) {
    return "en";
  }

  // Secondary indicator of Roman Urdu
  if (/\b(kaise|kese|kya|kia|hai|he|ho|kr|kar|se|ko|ki|ka|na|bhi|ye|yeh)\b/i.test(lowercase)) {
    return "roman";
  }

  return "en"; // Default fallback
}

// Complete Phonetic Translation Maps to enable native Urdu & Hindi speech accents on all platforms
const URDU_TO_DEVANAGARI_CHAR_MAP: Record<string, string> = {
  "ا": "अ", "آ": "आ", "ب": "ब", "پ": "प", "ت": "त", "ٹ": "ट", "ث": "स", "ج": "ज", "چ": "च",
  "ح": "ह", "خ": "ख", "د": "द", "ڈ": "ड", "ذ": "ज़", "ر": "र", "ڑ": "ड़", "ز": "ज़", "ژ": "झ",
  "س": "स", "ش": "श", "ص": "स", "ض": "ज़", "ط": "त", "ظ": "ज़", "ع": "अ", "غ": "ग", "ف": "फ़",
  "ق": "क़", "ک": "क", "گ": "ग", "ل": "ल", "م": "म", "ن": "न", "ں": "ँ", "و": "व", "ہ": "ह",
  "ھ": "ह", "ی": "य", "ے": "े", "ۂ": "ह", "ء": "अ", "ۃ": "त"
};

const ROMAN_TO_LANG_MAP: Record<string, { ur: string; hi: string }> = {
  "assalam": { ur: "السلام", hi: "अस्सलाम" },
  "o": { ur: "و", hi: "ओ" },
  "alaikum": { ur: "علیکم", hi: "अलैकुम" },
  "aalaikum": { ur: "علیکم", hi: "अलैकुम" },
  "assalam-o-alaikum": { ur: "السلام علیکم", hi: "अस्सलाम अलैकुम" },
  "assalamualaikum": { ur: "السلام علیکم", hi: "अस्सलाम अलैकुम" },
  "shukriya": { ur: "شکریہ", hi: "शुक्रिया" },
  "shukria": { ur: "شکریہ", hi: "शुक्रिया" },
  "bhai": { ur: "بھائی", hi: "भाई" },
  "bhaiya": { ur: "بھیا", hi: "भैया" },
  "gari": { ur: "گاڑی", hi: "गाड़ी" },
  "gadi": { ur: "گاڑی", hi: "गाड़ी" },
  "gaari": { ur: "گاڑی", hi: "गाड़ी" },
  "gariya": { ur: "گاڑیاں", hi: "गाड़ियां" },
  "gariyon": { ur: "گاڑیوں", hi: "गाड़ियों" },
  "mileage": { ur: "مائلیج", hi: "माइलेज" },
  "miliage": { ur: "مائلیج", hi: "माइलेज" },
  "milage": { ur: "مائلیج", hi: "माइलेज" },
  "average": { ur: "ایوریج", hi: "एवरेज" },
  "avrage": { ur: "ایوریج", hi: "एवरेज" },
  "fuel": { ur: "فیول", hi: "फ्यूल" },
  "petrol": { ur: "پیٹرول", hi: "पेट्रोल" },
  "diesel": { ur: "ڈیزل", hi: "डीजल" },
  "cng": { ur: "سی این جی", hi: "सीएनजी" },
  "kya": { ur: "کیا", hi: "क्या" },
  "kia": { ur: "کیا", hi: "क्या" },
  "hai": { ur: "ہے", hi: "है" },
  "he": { ur: "ہے", hi: "है" },
  "hain": { ur: "ہیں", hi: "हैं" },
  "hein": { ur: "ہیں", hi: "हैं" },
  "ho": { ur: "ہو", hi: "हो" },
  "hu": { ur: "ہوں", hi: "हूँ" },
  "hoon": { ur: "ہوں", hi: "हूँ" },
  "kaise": { ur: "کیسے", hi: "कैसे" },
  "kese": { ur: "کیسے", hi: "कैसे" },
  "kaisa": { ur: "کیسا", hi: "कैसा" },
  "kesa": { ur: "کیسا", hi: "कैसा" },
  "kaisi": { ur: "کیسی", hi: "कैसी" },
  "kesi": { ur: "کیسی", hi: "कैसी" },
  "batao": { ur: "بتاؤ", hi: "बताओ" },
  "bataen": { ur: "بتائیں", hi: "बताएं" },
  "bataiye": { ur: "بتائیے", hi: "बताइए" },
  "batayein": { ur: "بتائیں", hi: "बताएं" },
  "aur": { ur: "اور", hi: "और" },
  "mein": { ur: "میں", hi: "में" },
  "main": { ur: "میں", hi: "में" },
  "badhane": { ur: "بڑھانے", hi: "बढ़ाने" },
  "barhane": { ur: "بڑھانے", hi: "बढ़ाने" },
  "barhayein": { ur: "بڑھائیں", hi: "बढ़ाएं" },
  "badhayein": { ur: "بڑھائیں", hi: "बढ़ाएं" },
  "karu": { ur: "کروں", hi: "करूँ" },
  "karoon": { ur: "کروں", hi: "करूँ" },
  "karen": { ur: "کریں", hi: "करें" },
  "karein": { ur: "کریں", hi: "करें" },
  "karna": { ur: "کرنا", hi: "करना" },
  "karne": { ur: "کرنے", hi: "करने" },
  "kar": { ur: "کر", hi: "कर" },
  "kr": { ur: "کر", hi: "कर" },
  "kam": { ur: "کم", hi: "कम" },
  "ziada": { ur: "زیادہ", hi: "ज्यादा" },
  "zyada": { ur: "زیادہ", hi: "ज्यादा" },
  "theek": { ur: "ٹھیک", hi: "ठीक" },
  "thik": { ur: "ٹھیک", hi: "ठीक" },
  "bohot": { ur: "بہت", hi: "बहुत" },
  "bohat": { ur: "بہت", hi: "बहुत" },
  "bahut": { ur: "بہت", hi: "बहुत" },
  "chal": { ur: "چل", hi: "चल" },
  "rha": { ur: "رہا", hi: "रहा" },
  "raha": { ur: "رہا", hi: "रहा" },
  "rhi": { ur: "رہی", hi: "रही" },
  "rahi": { ur: "رہی", hi: "रही" },
  "rhe": { ur: "رہے", hi: "रहे" },
  "rahe": { ur: "رہے", hi: "रहे" },
  "ye": { ur: "یہ", hi: "यह" },
  "yeh": { ur: "یہ", hi: "यह" },
  "wo": { ur: "وہ", hi: "वह" },
  "woh": { ur: "وہ", hi: "वह" },
  "to": { ur: "تو", hi: "तो" },
  "toh": { ur: "تو", hi: "तो" },
  "par": { ur: "پر", hi: "पर" },
  "pe": { ur: "پر", hi: "पर" },
  "per": { ur: "پر", hi: "पर" },
  "mera": { ur: "میرا", hi: "मेरा" },
  "meri": { ur: "میری", hi: "मेरी" },
  "mere": { ur: "میرے", hi: "मेरे" },
  "aapka": { ur: "آپ کا", hi: "आपका" },
  "aapki": { ur: "آپ کی", hi: "आपकी" },
  "aapke": { ur: "آپ کے", hi: "आपके" },
  "aap": { ur: "آپ", hi: "आप" },
  "apka": { ur: "آپ کا", hi: "आपका" },
  "apki": { ur: "آپ کی", hi: "आपकी" },
  "apke": { ur: "آپ کے", hi: "आपके" },
  "ap": { ur: "آپ", hi: "आप" },
  "ko": { ur: "کو", hi: "को" },
  "ka": { ur: "کا", hi: "का" },
  "ki": { ur: "کی", hi: "की" },
  "ke": { ur: "کے", hi: "के" },
  "se": { ur: "سے", hi: "से" },
  "is": { ur: "اس", hi: "इस" },
  "hi": { ur: "ہی", hi: "ही" },
  "na": { ur: "نہ", hi: "ना" },
  "nahin": { ur: "نہیں", hi: "नहीं" },
  "nahi": { ur: "نہیں", hi: "नहीं" },
  "mile": { ur: "ملے", hi: "मिले" },
  "mil": { ur: "مل", hi: "मिल" },
  "gya": { ur: "گیا", hi: "गया" },
  "gaya": { ur: "گیا", hi: "गया" },
  "gayi": { ur: "گئی", hi: "गयी" },
  "gai": { ur: "گئی", hi: "गयी" },
  "gaye": { ur: "گئے", hi: "गये" },
  "filter": { ur: "فلٹر", hi: "फ़िल्टर" },
  "plug": { ur: "پلگ", hi: "प्लग" },
  "spark": { ur: "اسپارک", hi: "स्पार्क" },
  "pressure": { ur: "پریشر", hi: "प्रेशर" },
  "air": { ur: "ایئر", hi: "एयर" },
  "oil": { ur: "آئل", hi: "ऑयल" },
  "change": { ur: "چینج", hi: "चेंज" },
  "service": { ur: "سروس", hi: "सर्विस" },
  "road": { ur: "روڈ", hi: "रोड" },
  "speed": { ur: "اسپیڈ", hi: "स्पीड" },
  "limit": { ur: "لمٹ", hi: "लिमिट" },
  "drive": { ur: "ڈرائیو", hi: "ड्राइव" },
  "gear": { ur: "گیئر", hi: "गियर" },
  "clutch": { ur: "کلچ", hi: "क्लच" },
  "brake": { ur: "بریک", hi: "ब्रेक" },
  "tyre": { ur: "ٹائر", hi: "टायर" },
  "tire": { ur: "ٹائر", hi: "टायर" },
  "tyres": { ur: "ٹائر", hi: "टायर" },
  "tires": { ur: "ٹائر", hi: "टायर" },
  "tips": { ur: "ٹپس", hi: "टिप्स" },
  "tip": { ur: "ٹپ", hi: "टिप" },
  "tarika": { ur: "طریقہ", hi: "तरीका" },
  "tareeqa": { ur: "طریقہ", hi: "तरीका" },
  "tarike": { ur: "طریقے", hi: "तरीके" },
  "tareeqe": { ur: "طریقے", hi: "तरीके" },
  "kyun": { ur: "کیوں", hi: "क्यों" },
  "kyu": { ur: "کیوں", hi: "क्यों" },
  "kyon": { ur: "کیوں", hi: "क्यों" },
  "kion": { ur: "کیوں", hi: "क्यों" },
  "chahiye": { ur: "چاہیے", hi: "चाहिए" },
  "chaheye": { ur: "چاہیے", hi: "चाहिए" },
  "nikalne": { ur: "نکالنے", hi: "निकालने" },
  "nikalein": { ur: "نکالیں", hi: "निकालें" },
  "honda": { ur: "ہونڈا", hi: "होंडा" },
  "toyota": { ur: "ٹویوٹا", hi: "टोयोटा" },
  "suzuki": { ur: "سوزوکی", hi: "सुजुकी" },
  "bike": { ur: "بائیک", hi: "बाइक" },
  "motorcycle": { ur: "موٹر سائیکل", hi: "मोटरसाइकिल" },
  "car": { ur: "کار", hi: "कार" },
  "liters": { ur: "لیٹر", hi: "लीटर" },
  "liter": { ur: "لیٹر", hi: "लीटर" },
  "paisa": { ur: "روپے", hi: "रुपये" },
  "paise": { ur: "روپے", hi: "रुपये" },
  "pkr": { ur: "روپے", hi: "रुपये" },
  "rupay": { ur: "روپے", hi: "रुपये" },
  "rupe": { ur: "روپے", hi: "रुपये" },
  "rupees": { ur: "روپے", hi: "रुपये" },
  "odometer": { ur: "اوڈومیٹر", hi: "ओडोमीटर" },
  "reading": { ur: "ریڈنگ", hi: "रीडिंग" },
  "log": { ur: "لاگ", hi: "लॉग" },
  "refuel": { ur: "ریفول", hi: "रिफ्यूल" },
  "station": { ur: "اسٹیشن", hi: "स्टेशन" },
  "heavy": { ur: "ہیوی", hi: "हैवी" },
  "traffic": { ur: "ٹریفک", hi: "ट्रैफिक" },
  "city": { ur: "سٹی", hi: "सिटी" },
  "highway": { ur: "ہائی وے", hi: "हाईवे" },
  "asani": { ur: "آسانی", hi: "आसानी" },
  "asan": { ur: "آسان", hi: "आसान" },
  "mushkil": { ur: "مشکل", hi: "मुश्किल" },
  "kamzor": { ur: "کمزور", hi: "कमज़ोर" },
  "kharab": { ur: "خراب", hi: "ख़राब" },
  "theek-thak": { ur: "ٹھیک ٹھاک", hi: "ठीक-ठाक" },
  "halat": { ur: "حالت", hi: "हालत" },
  "bata": { ur: "بتا", hi: "बता" },
  "acha": { ur: "اچھا", hi: "अच्छा" },
  "achha": { ur: "اچھا", hi: "अच्छा" },
  "ache": { ur: "اچھے", hi: "अच्छे" },
  "achhe": { ur: "اچھے", hi: "अच्छे" },
  "achi": { ur: "اچھی", hi: "अच्छी" },
  "achhi": { ur: "اچھی", hi: "अच्छी" },
  "bohat-bohat": { ur: "بہت بہت", hi: "बहुत-बहुत" },
  "shukran": { ur: "شکریہ", hi: "शुक्रिया" },
  "khuda": { ur: "خدا", hi: "खुदा" },
  "hafiz": { ur: "حافظ", hi: "हाफ़िज़" },
  "allah": { ur: "اللہ", hi: "अल्लाह" },
  "taala": { ur: "تعالیٰ", hi: "ताला" },
  "sub": { ur: "سب", hi: "सब" },
  "sab": { ur: "سب", hi: "सब" },
  "baat": { ur: "بات", hi: "बात" },
  "suno": { ur: "سنو", hi: "सुनो" },
  "samajh": { ur: "سمجھ", hi: "समझ" },
  "samjh": { ur: "سمجھ", hi: "समझ" },
  "smjh": { ur: "سمجھ", hi: "समझ" },
  "smj": { ur: "سمجھ", hi: "समझ" },
  "aa": { ur: "آ", hi: "आ" },
  "g": { ur: "جی", hi: "जी" },
  "jee": { ur: "جی", hi: "जी" },
  "ji": { ur: "جی", hi: "जी" },
  "haan": { ur: "ہاں", hi: "हाँ" },
  "han": { ur: "ہاں", hi: "हाँ" },
  "mat": { ur: "مت", hi: "मत" },
  "fiker": { ur: "فکر", hi: "फिक्र" },
  "fikr": { ur: "فکر", hi: "फिक्र" },
  "tension": { ur: "ٹینشن", hi: "टेंशन" },
  "lo": { ur: "لو", hi: "लो" },
  "le": { ur: "لے", hi: "ले" },
  "chalao": { ur: "چلاؤ", hi: "चलाओ" },
  "chalaen": { ur: "چلائیں", hi: "चलाएं" },
  "chalanay": { ur: "چلانے", hi: "चलाने" },
  "bachega": { ur: "بچے گا", hi: "बचेगा" },
  "bachti": { ur: "بچتی", hi: "बचती" },
  "bachat": { ur: "بچت", hi: "बचत" },
  "kharch": { ur: "خرچ", hi: "खर्च" },
  "kharach": { ur: "خرچ", hi: "खर्च" },
  "hoga": { ur: "ہوگا", hi: "होगा" },
  "hogi": { ur: "ہوگی", hi: "होगी" },
  "hoge": { ur: "ہوگے", hi: "होंगे" },
  "honge": { ur: "ہوں گے", hi: "होंगे" },
  "zaroor": { ur: "ضرور", hi: "ज़रूर" },
  "zarur": { ur: "ضرور", hi: "ज़रूर" },
  "zaroori": { ur: "ضروری", hi: "ज़रूरी" },
  "zaruri": { ur: "ضروری", hi: "ज़रूरी" },
  "faida": { ur: "فائدہ", hi: "फ़ायदा" },
  "fayda": { ur: "فائدہ", hi: "फ़ायदा" },
  "nuksan": { ur: "نقصان", hi: "नुकसान" },
  "nuqsan": { ur: "نقصان", hi: "नुकसान" }
};

function transliterateUrduToDevanagari(urduText: string): string {
  let result = "";
  for (let i = 0; i < urduText.length; i++) {
    const char = urduText[i];
    result += URDU_TO_DEVANAGARI_CHAR_MAP[char] || char;
  }
  return result;
}

function selectBestVoice(voices: SpeechSynthesisVoice[], targetLang: "ur" | "roman" | "hi" | "en" | "ar"): { voice: SpeechSynthesisVoice | null; actualLang: "ur" | "hi" | "en" | "ar" } {
  if (voices.length === 0) {
    return { voice: null, actualLang: targetLang === "roman" ? "ur" : targetLang };
  }

  const cleanTarget = targetLang === "roman" ? "ur" : targetLang;

  const findMaleVoice = (langPrefix: string): SpeechSynthesisVoice | null => {
    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));
    if (langVoices.length === 0) return null;

    const maleIndicators = [
      "male", "guy", "boy", "man", "david", "mark", "george", "ravi", 
      "madhur", "maged", "naayf", "hamed", "daniel", "premium male", 
      "natural male", "cloud male", "wavenet male", "neural male", 
      "standard-b", "standard-c", "standard-d"
    ];
    
    const femaleIndicators = [
      "female", "girl", "woman", "zira", "hazel", "susan", "heera", 
      "kalpana", "shweta", "naoko", "elsa", "zariyah", "swara", 
      "karen", "moira", "tessa", "veena", "shruthi"
    ];

    // Priority 1: High quality male voice with explicit male indicator in name
    const perfectMale = langVoices.find(v => {
      const nameLower = v.name.toLowerCase();
      return maleIndicators.some(ind => nameLower.includes(ind));
    });
    if (perfectMale) return perfectMale;

    // Priority 2: Voice that does not have any female indicator in its name
    const neutralMale = langVoices.find(v => {
      const nameLower = v.name.toLowerCase();
      return !femaleIndicators.some(ind => nameLower.includes(ind));
    });
    if (neutralMale) return neutralMale;

    // Priority 3: Fallback to the first voice matching the language prefix
    return langVoices[0];
  };

  let selectedVoice: SpeechSynthesisVoice | null = null;
  let finalLang: "ur" | "hi" | "en" | "ar" = "en";

  if (cleanTarget === "hi" || cleanTarget === "ur") {
    selectedVoice = findMaleVoice("hi");
    if (selectedVoice) {
      finalLang = "hi";
    } else {
      selectedVoice = findMaleVoice("en");
      finalLang = "en";
    }
  } else if (cleanTarget === "ar") {
    selectedVoice = findMaleVoice("ar");
    if (selectedVoice) {
      finalLang = "ar";
    } else {
      selectedVoice = findMaleVoice("en");
      finalLang = "en";
    }
  } else {
    selectedVoice = findMaleVoice("en");
    finalLang = "en";
  }

  return { voice: selectedVoice, actualLang: finalLang };
}

export function prepareTextForTTS(text: string, targetLang: "ur" | "hi" | "en", currency: string = "PKR"): string {
  let cleanText = text
    .replace(/[*#`_]/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .trim();

  if (targetLang === "en") {
    return cleanText;
  }

  // Determine spoken terms for current currency
  let urCurrencySpoken = "روپے";
  let hiCurrencySpoken = "रुपये";

  const upperCurr = currency.toUpperCase();
  if (upperCurr === "USD") {
    urCurrencySpoken = "ڈالر";
    hiCurrencySpoken = "डॉलर";
  } else if (upperCurr === "EUR") {
    urCurrencySpoken = "یورو";
    hiCurrencySpoken = "यूरो";
  } else if (upperCurr === "AED") {
    urCurrencySpoken = "درہم";
    hiCurrencySpoken = "दिरहम";
  } else if (upperCurr === "SAR") {
    urCurrencySpoken = "ریال";
    hiCurrencySpoken = "रियाल";
  } else if (upperCurr === "GBP") {
    urCurrencySpoken = "پاؤنڈ";
    hiCurrencySpoken = "पाउंड";
  } else if (upperCurr === "PKR" || upperCurr === "INR") {
    urCurrencySpoken = "روپے";
    hiCurrencySpoken = "रुपये";
  } else {
    // For other custom currencies, just speak the uppercase characters or letters
    urCurrencySpoken = currency;
    hiCurrencySpoken = currency;
  }

  // Pre-process common metrics and abbreviations for elegant spoken flow
  if (targetLang === "ur") {
    cleanText = cleanText
      .replace(/\bkm\/l\b/gi, "کلومیٹر فی لیٹر")
      .replace(/\bmpg\b/gi, "میل فی گیلن")
      .replace(/\bpkr\b/gi, urCurrencySpoken)
      .replace(new RegExp(`\\b${currency}\\b`, "gi"), urCurrencySpoken)
      .replace(/\brs\.?\b/gi, urCurrencySpoken)
      .replace(/\bliters?\b/gi, "لیٹر")
      .replace(/\bkm\b/gi, "کلومیٹر")
      .replace(/\bmiles?\b/gi, "میل")
      .replace(/\b%\b/g, " فیصد");
  } else if (targetLang === "hi") {
    cleanText = cleanText
      .replace(/\bkm\/l\b/gi, "किलोमीटर प्रति लीटर")
      .replace(/\bmpg\b/gi, "मील प्रति गैलन")
      .replace(/\bpkr\b/gi, hiCurrencySpoken)
      .replace(new RegExp(`\\b${currency}\\b`, "gi"), hiCurrencySpoken)
      .replace(/\brs\.?\b/gi, hiCurrencySpoken)
      .replace(/\bliters?\b/gi, "लीटर")
      .replace(/\bkm\b/gi, "किलोमीटर")
      .replace(/\bmiles?\b/gi, "मील")
      .replace(/\b%\b/g, " प्रतिशत");
  }

  // Tokenize text into words and keep spaces/punctuation
  const words = cleanText.split(/(\s+|\b)/);

  const processedWords = words.map(word => {
    const lowerWord = word.toLowerCase().trim();
    if (!lowerWord) return word;

    // Check if word is in our Roman map
    if (ROMAN_TO_LANG_MAP[lowerWord]) {
      return targetLang === "ur" ? ROMAN_TO_LANG_MAP[lowerWord].ur : ROMAN_TO_LANG_MAP[lowerWord].hi;
    }

    // If target is Urdu and the text is already Urdu script, keep it
    if (targetLang === "ur" && /[\u0600-\u06FF]/.test(word)) {
      return word;
    }

    // If target is Hindi and text is Urdu script, transliterate Urdu script to Devanagari phonetically
    if (targetLang === "hi" && /[\u0600-\u06FF]/.test(word)) {
      return transliterateUrduToDevanagari(word);
    }

    // Return as is for english words or punctuation
    return word;
  });

  return processedWords.join("");
}

export default function AIFuelAssistant({
  activeVehicle,
  fuelLogs,
  currentLanguage,
  onLanguageChange,
  currency = "PKR",
}: AIFuelAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem("smart_fuel_chat_history");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load chat history from localStorage:", e);
    }
    return [
      {
        id: "greet_" + Date.now(),
        role: "model",
        text: LANGUAGES[currentLanguage]?.greeting || LANGUAGES.en.greeting,
        timestamp: new Date().toISOString(),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voicePlaybackEnabled, setVoicePlaybackEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pinnedSessions, setPinnedSessions] = useState<PinnedSession[]>(() => {
    try {
      const stored = localStorage.getItem("pinned_fuel_chats");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load pinned chats:", e);
      return [];
    }
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(() => {
    return localStorage.getItem("assistant_auto_detect_lang") === "true";
  });

  // Nested Panel Navigation
  const [activePanel, setActivePanel] = useState<"chat" | "tools" | "voicelog">("chat");
  const [activeTool, setActiveTool] = useState<"converter" | "predictor" | "diagnostic">("converter");

  // Voice Command History
  const [voiceCommandHistory, setVoiceCommandHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("voice_command_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Unit Converter States
  const [convertVal, setConvertVal] = useState<string>("10");
  const [convertType, setConvertType] = useState<"l_to_gal" | "gal_to_l" | "km_to_mi" | "mi_to_km" | "kml_to_mpg" | "mpg_to_kml" | "pkr_to_usd" | "usd_to_pkr">("l_to_gal");
  const [convertResult, setConvertResult] = useState<string>("");
  const [convertHistory, setConvertHistory] = useState<Array<{ id: string; type: string; input: string; result: string; timestamp: string }>>(() => {
    try {
      const saved = localStorage.getItem("unit_convert_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // AI Fuel Predictor States
  const [predictorSpeed, setPredictorSpeed] = useState<number>(80);
  const [predictorAc, setPredictorAc] = useState<boolean>(true);
  const [predictorPassengers, setPredictorPassengers] = useState<number>(2);
  const [predictorStyle, setPredictorStyle] = useState<"gentle" | "moderate" | "aggressive">("moderate");

  // AI Diagnostic Checklist States
  const [diagnosticIssues, setDiagnosticIssues] = useState<{ [key: string]: boolean }>({
    low_mileage: false,
    black_smoke: false,
    rough_idle: false,
    hard_start: false,
    clutch_slip: false,
  });

  // Abort Controller for Prompt Cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setErrorMsg("Prompt generation cancelled. (آپ نے پرامپٹ منسوخ کر دیا)");
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      if (updated.length === 0) {
        return [
          {
            id: "greet_" + Date.now(),
            role: "model",
            text: LANGUAGES[currentLanguage]?.greeting || LANGUAGES.en.greeting,
            timestamp: new Date().toISOString(),
          }
        ];
      }
      return updated;
    });
  };

  // Unit Converter Execution Hook
  useEffect(() => {
    const val = parseFloat(convertVal);
    if (isNaN(val) || val <= 0) {
      setConvertResult("");
      return;
    }

    let res = 0;
    let label = "";
    switch (convertType) {
      case "l_to_gal":
        res = val * 0.264172;
        label = `${val} Liters = ${res.toFixed(2)} Gallons (US)`;
        break;
      case "gal_to_l":
        res = val * 3.78541;
        label = `${val} Gallons (US) = ${res.toFixed(2)} Liters`;
        break;
      case "km_to_mi":
        res = val * 0.621371;
        label = `${val} Kilometers = ${res.toFixed(2)} Miles`;
        break;
      case "mi_to_km":
        res = val * 1.60934;
        label = `${val} Miles = ${res.toFixed(2)} Kilometers`;
        break;
      case "kml_to_mpg":
        res = val * 2.35214583;
        label = `${val} Km/L = ${res.toFixed(2)} MPG (US)`;
        break;
      case "mpg_to_kml":
        res = val * 0.425143707;
        label = `${val} MPG (US) = ${res.toFixed(2)} Km/L`;
        break;
      case "pkr_to_usd":
        res = val / 278.50;
        label = `${currency} ${val} = $ ${res.toFixed(2)} USD`;
        break;
      case "usd_to_pkr":
        res = val * 278.50;
        label = `$ ${val} USD = ${currency} ${res.toFixed(2)}`;
        break;
    }

    setConvertResult(label);
  }, [convertVal, convertType, currency]);

  const handleSaveConversion = () => {
    if (!convertResult) return;
    const newLog = {
      id: "conv_" + Date.now(),
      type: convertType,
      input: convertVal,
      result: convertResult,
      timestamp: new Date().toISOString()
    };
    setConvertHistory(prev => {
      const updated = [newLog, ...prev].slice(0, 8);
      localStorage.setItem("unit_convert_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearConversionHistory = () => {
    setConvertHistory([]);
    localStorage.removeItem("unit_convert_history");
  };

  const handleDiscussConversionWithAI = (logText: string) => {
    setActivePanel("chat");
    handleSendMessage(`Explain the physics behind this conversion or how to use it in planning: "${logText}"`);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-save active conversation to localStorage
  useEffect(() => {
    localStorage.setItem("smart_fuel_chat_history", JSON.stringify(messages));
  }, [messages]);

  // Auto-save active pinned session whenever messages update
  useEffect(() => {
    if (activeSessionId && messages.length > 1) {
      setPinnedSessions(prev => {
        const updated = prev.map(session => {
          if (session.id === activeSessionId) {
            return {
              ...session,
              messages: messages,
              timestamp: new Date().toISOString()
            };
          }
          return session;
        });
        localStorage.setItem("pinned_fuel_chats", JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, activeSessionId]);

  const handlePinChat = () => {
    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length === 0) {
      setErrorMsg("No conversation to pin yet! Please send a message first.");
      return;
    }

    const firstUserMsg = userMessages[0].text;
    const cleanTitle = firstUserMsg.length > 25 ? firstUserMsg.slice(0, 25) + "..." : firstUserMsg;

    let updatedSessions: PinnedSession[] = [];
    if (activeSessionId) {
      updatedSessions = pinnedSessions.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            messages: messages,
            timestamp: new Date().toISOString()
          };
        }
        return session;
      });
    } else {
      const newSessionId = "session_" + Date.now();
      const newSession: PinnedSession = {
        id: newSessionId,
        title: cleanTitle,
        messages: messages,
        timestamp: new Date().toISOString()
      };
      updatedSessions = [newSession, ...pinnedSessions];
      setActiveSessionId(newSessionId);
    }

    setPinnedSessions(updatedSessions);
    localStorage.setItem("pinned_fuel_chats", JSON.stringify(updatedSessions));
    setErrorMsg(null);
  };

  const handleClearChat = () => {
    stopSpeaking();
    const config = LANGUAGES[currentLanguage];
    const initialGreet = [
      {
        id: "greet_" + Date.now(),
        role: "model",
        text: config.greeting,
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(initialGreet);
    localStorage.setItem("smart_fuel_chat_history", JSON.stringify(initialGreet));
    setActiveSessionId(null);
    setErrorMsg(null);
  };

  const handleLoadSession = (session: PinnedSession) => {
    stopSpeaking();
    setMessages(session.messages);
    setActiveSessionId(session.id);
    setShowHistory(false);
    setErrorMsg(null);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = pinnedSessions.filter(s => s.id !== sessionId);
    setPinnedSessions(updated);
    localStorage.setItem("pinned_fuel_chats", JSON.stringify(updated));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      handleClearChat();
    }
  };

  // Load custom multilingual greeting if there are no existing custom messages
  useEffect(() => {
    if (messages.length <= 1) {
      const config = LANGUAGES[currentLanguage];
      setMessages([
        {
          id: "greet_" + Date.now(),
          role: "model",
          text: config.greeting,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [currentLanguage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          setVoiceCommandHistory((prev) => {
            const updated = [transcript, ...prev.filter(item => item !== transcript)].slice(0, 10);
            localStorage.setItem("voice_command_history", JSON.stringify(updated));
            return updated;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setErrorMsg("Microphone access is blocked in this window. Check browser permissions.");
        } else if (event.error === "aborted") {
          // Normal stop/abort; do not show error
          setErrorMsg(null);
        } else {
          setErrorMsg(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Text-To-Speech (TTS) Speak Out Functionality
  const speakMessage = (text: string, langCode?: SupportedLanguage) => {
    if (!voicePlaybackEnabled || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // Stop any currently playing audio

    const detected = langCode || detectLanguageOfText(text, currentLanguage);
    const voices = window.speechSynthesis.getVoices();

    let finalLocale = "en-US";
    let targetTTSLang: "hi" | "en" = "en";

    // Playback Hindi, Urdu, or Roman Urdu using Hindi TTS engine as requested
    if (detected === "hi" || detected === "ur" || detected === "roman") {
      targetTTSLang = "hi";
      finalLocale = "hi-IN";
    } else if (detected === "ar") {
      finalLocale = "ar-SA";
    } else {
      targetTTSLang = "en";
      finalLocale = "en-US";
    }

    const { voice: selectedVoice } = selectBestVoice(voices, targetTTSLang === "hi" ? "hi" : "en");

    let preparedText = text;

    if (targetTTSLang === "hi") {
      preparedText = prepareTextForTTS(text, "hi", currency);
      // If using the Hindi voice, transliterate any Urdu script characters to Devanagari for perfect phonetic playback
      if (/[\u0600-\u06FF]/.test(preparedText)) {
        preparedText = transliterateUrduToDevanagari(preparedText);
      }
    } else if (detected === "ar") {
      preparedText = text
        .replace(/[*#`_]/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .trim();
    } else {
      preparedText = text
        .replace(/[*#`_]/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "")
        .trim();
    }

    const utterance = new SpeechSynthesisUtterance(preparedText);
    utterance.lang = finalLocale;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Natural speaking parameters matching driving HUD for premium male accent
    utterance.rate = 0.90; // Natural, slightly slower speaking pace for high clarity and premium output
    utterance.pitch = 0.95; // Slightly deeper male/boy pitch for professional tone

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      if (e.error === "interrupted" || e.error === "canceled") {
        setIsSpeaking(false);
        return;
      }
      console.error("Speech playback error:", e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Start or Stop Speech Recognition
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMsg("Voice typing is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Failed to stop voice recognition:", e);
      }
      setIsListening(false);
    } else {
      stopSpeaking();
      recognitionRef.current.lang = LANGUAGES[currentLanguage].inputLocale;
      try {
        recognitionRef.current.start();
      } catch (e: any) {
        console.error("Failed to start voice recognition:", e);
        if (e.name === "InvalidStateError" || e.message?.includes("already started")) {
          setIsListening(true);
          setErrorMsg(null);
        } else {
          setErrorMsg(`Failed to start: ${e.message || e}`);
        }
      }
    }
  };

  // Send message to Express server proxy
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    stopSpeaking();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    }
    setErrorMsg(null);

    // Auto-enable voice synthesis if the user explicitly asks the assistant to speak/talk back
    const lowercaseMsg = textToSend.toLowerCase();
    const isVoiceRequest = [
      "bol kar", "bol kr", "bol ke", "bol k ", "bolay", "bolen", "sunao", "awaz", 
      "voice", "speak", "talk", "audio", "mujy bol", "mujhe bol", "batao bol", 
      "bol kar batao", "bolo", "bol ke batao", "bol kr batao", "bol kr sunao", "bol kar sunao"
    ].some(trigger => lowercaseMsg.includes(trigger));

    if (isVoiceRequest) {
      setVoicePlaybackEnabled(true);
    }

    // Auto-detect user input language and update UI language setting if enabled
    let detectedLang = currentLanguage;
    if (autoDetectLanguage) {
      const isArabicScript = /[\u0600-\u06FF]/.test(textToSend);
      const isHindiScript = /[\u0900-\u097F]/.test(textToSend);

      if (isArabicScript) {
        if (currentLanguage !== "ar" && currentLanguage !== "ur") {
          detectedLang = detectLanguageOfText(textToSend, currentLanguage);
        }
      } else if (isHindiScript) {
        if (currentLanguage !== "hi") {
          detectedLang = "hi";
        }
      } else {
        // Text is in Latin/English characters
        // If currentLanguage is 'roman' or 'en', keep it. If it was 'ur', 'ar', or 'hi' but they typed in English, detect it.
        if (currentLanguage !== "en" && currentLanguage !== "roman") {
          detectedLang = detectLanguageOfText(textToSend, currentLanguage);
        }
      }

      onLanguageChange(detectedLang);
    }

    const userMessage: ChatMessage = {
      id: "user_" + Date.now(),
      role: "user",
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Package conversation logs, vehicle details, and past fuel history to serve as "Memory context"
      const payload = {
        message: textToSend,
        language: detectedLang,
        history: messages.slice(-10).map((m) => ({ role: m.role, text: m.text })),
        vehicleProfile: activeVehicle
          ? {
              name: activeVehicle.name,
              type: activeVehicle.type,
              fuelType: activeVehicle.fuelType,
              engineSize: activeVehicle.engineSize,
              unit: activeVehicle.odometerUnit,
            }
          : null,
        fuelLogs: fuelLogs
          .filter((l) => l.vehicleId === activeVehicle?.id)
          .slice(-5)
          .map((l) => ({
            date: l.date,
            odometer: l.odometer,
            fuelFilled: l.fuelFilled,
            totalCost: l.totalCost,
            mileage: l.mileage,
          })),
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with the Assistant server. Please check connection.");
      }

      const data = await response.json();

      if (data.status === "error") {
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        id: "ai_" + Date.now(),
        role: "model",
        text: data.reply,
        speechText: data.speechText || data.reply,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Auto-read response out loud if enabled or if requested via voice command
      setTimeout(() => {
        if (voicePlaybackEnabled || isVoiceRequest) {
          speakMessage(data.speechText || data.reply, data.resolvedSpeechLang || data.resolvedLanguage || detectedLang);
        }
      }, 300);

    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Chat fetch request aborted successfully.");
        return; // Handled gracefully by handleCancelGeneration
      }
      console.error("Chat Error:", err);
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-violet-500/15 rounded-2xl p-5 shadow-2xl h-full flex flex-col min-h-[520px] max-h-[680px] relative overflow-hidden">
      {/* Top Professional Glowing Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-600 to-indigo-600 opacity-90" />

      {/* Assistant Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/25 flex items-center justify-center text-white relative shadow-inner">
            <Sparkles size={18} className="text-violet-400 animate-pulse" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-violet-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
            </span>
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wider uppercase">AI Fuel Expert</h2>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              <span className="text-green-400 animate-pulse">System Online</span>
              <span className="text-slate-700">•</span>
              <span className="text-violet-400">Gemini 1.5 Flash</span>
            </div>
          </div>
        </div>

        {/* Configurations: Language selector + Voice Out toggle + Pin/Clear controls */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* History Button (Folder / Saved Chats) */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-xl transition border text-xs cursor-pointer ${
              showHistory
                ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200"
            }`}
            title="Saved Chats History"
          >
            <History size={13} />
          </button>

          {/* Pin Chat Button */}
          <button
            onClick={handlePinChat}
            className={`p-1.5 rounded-xl transition border text-xs cursor-pointer ${
              activeSessionId
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200"
            }`}
            title={activeSessionId ? "Chat Pinned & Saved!" : "Pin / Save Chat"}
          >
            <Pin size={13} className={activeSessionId ? "fill-green-400/20" : ""} />
          </button>

          {/* New Conversation Unit Button */}
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-xl transition border text-xs cursor-pointer bg-slate-950 text-violet-400 border-violet-500/20 hover:bg-violet-600/10 hover:text-violet-200"
            title="Start New Conversation Unit"
          >
            <Plus size={13} />
          </button>

          {/* Clear Chat Button */}
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-xl transition border text-xs cursor-pointer bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-red-400 hover:border-red-500/20"
            title="Clear Current Chat"
          >
            <Trash2 size={13} />
          </button>



          {/* Auto-detect Language Setting Button */}
          <button
            onClick={() => {
              const nextVal = !autoDetectLanguage;
              setAutoDetectLanguage(nextVal);
              localStorage.setItem("assistant_auto_detect_lang", String(nextVal));
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition border text-xs font-semibold cursor-pointer ${
              autoDetectLanguage
                ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/10"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
            }`}
            title={autoDetectLanguage ? "Automatic Language Detection is ON" : "Automatic Language Detection is OFF"}
          >
            <Compass size={13} className={autoDetectLanguage ? "animate-spin" : ""} />
            <span className="text-[10px] hidden sm:inline">Auto</span>
          </button>

          {/* Selector */}
          <select
            value={currentLanguage}
            onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            className="text-xs px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-medium text-slate-300 focus:ring-2 focus:ring-violet-500/50 focus:outline-none"
          >
            {Object.values(LANGUAGES).map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-300">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Tab Sub Panel Navigation Bar */}
      <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/60 mb-3 shrink-0">
        <button
          onClick={() => { setActivePanel("chat"); setShowHistory(false); }}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider ${
            activePanel === "chat" && !showHistory
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <MessageSquare size={11} />
          <span>Chat</span>
        </button>
        <button
          onClick={() => { setActivePanel("tools"); setShowHistory(false); }}
          className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider ${
            activePanel === "tools" && !showHistory
              ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <Wrench size={11} />
          <span>AI Tools Suite</span>
        </button>

      </div>

      {/* Suggestion Chips - Only shown in Chat tab when not showing saved sessions */}
      {activePanel === "chat" && !showHistory && (
        <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-none shrink-0 border-b border-slate-800/40 mb-3 select-none">
          {SUGGESTIONS[currentLanguage].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              disabled={loading}
              className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 whitespace-nowrap font-medium transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              💡 {chip}
            </button>
          ))}
        </div>
      )}

      {showHistory ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 border border-slate-800/80 rounded-2xl p-4 my-1">
          <div className="flex items-center justify-between mb-3 shrink-0 border-b border-slate-800/60 pb-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              📌 Saved Conversations
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-1 rounded-lg hover:bg-slate-850 hover:text-slate-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>

          {pinnedSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <span className="text-2xl mb-2">📌</span>
              <p className="text-xs text-slate-500 font-medium">No saved conversations yet.</p>
              <p className="text-[10px] text-slate-600 max-w-[200px] mt-1 leading-normal">
                Chat with the AI first, then click the 📌 Pin button above to save your record!
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {pinnedSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleLoadSession(session)}
                  className={`p-3 rounded-xl border transition text-left cursor-pointer flex items-center justify-between gap-3 ${
                    activeSessionId === session.id
                      ? "bg-indigo-600/15 border-indigo-500/40 hover:bg-indigo-600/20"
                      : "bg-slate-900 border-slate-850 hover:border-slate-800 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{session.title}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {session.messages.length} messages • {new Date(session.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800/85 rounded transition cursor-pointer"
                      title="Delete Saved Session"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activePanel === "tools" ? (
        /* AI Tools suite viewport */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/40 border border-slate-800/65 rounded-2xl p-4 my-1">
          {/* Sub Tab selection inside Tools */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800/50 mb-3 shrink-0">
            <button
              onClick={() => setActiveTool("converter")}
              className={`flex-1 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                activeTool === "converter" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              📐 Converter
            </button>
            <button
              onClick={() => setActiveTool("predictor")}
              className={`flex-1 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                activeTool === "predictor" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              ⚡ AI Predictor
            </button>
            <button
              onClick={() => setActiveTool("diagnostic")}
              className={`flex-1 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                activeTool === "diagnostic" ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/10" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              🩺 Diagnostic
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 text-left">
            {activeTool === "converter" && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Scale size={13} className="text-indigo-400" />
                  <span className="text-xs font-bold text-slate-300">Unit Converter & History Logs</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Conversion Type</label>
                    <select
                      value={convertType}
                      onChange={(e) => setConvertType(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-indigo-500/40"
                    >
                      <option value="l_to_gal">Liters to Gallons (US)</option>
                      <option value="gal_to_l">Gallons (US) to Liters</option>
                      <option value="km_to_mi">Kilometers to Miles</option>
                      <option value="mi_to_km">Miles to Kilometers</option>
                      <option value="kml_to_mpg">Km/L to MPG (US)</option>
                      <option value="mpg_to_kml">MPG (US) to Km/L</option>
                      <option value="pkr_to_usd">{currency} to USD</option>
                      <option value="usd_to_pkr">USD to {currency}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Enter Value</label>
                    <input
                      type="number"
                      value={convertVal}
                      onChange={(e) => setConvertVal(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-indigo-500/40"
                    />
                  </div>
                </div>

                {convertResult && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-indigo-500/15 text-center flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-400 font-mono">{convertResult}</span>
                    <button
                      onClick={handleSaveConversion}
                      className="text-[9px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-1 rounded transition cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={10} /> Save Log
                    </button>
                  </div>
                )}

                {/* Conversion History Section */}
                <div className="pt-2">
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2 mb-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Saved Conversions Log</span>
                    {convertHistory.length > 0 && (
                      <button
                        onClick={handleClearConversionHistory}
                        className="text-[8px] text-red-400 hover:underline uppercase font-bold"
                      >
                        Clear History
                      </button>
                    )}
                  </div>

                  {convertHistory.length === 0 ? (
                    <p className="text-[10px] text-slate-600 italic text-center p-2">No conversions saved yet.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                      {convertHistory.map((log) => (
                        <div key={log.id} className="bg-slate-950/60 p-2 rounded-lg border border-slate-850 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-medium text-slate-300 font-mono truncate">{log.result}</span>
                          <button
                            onClick={() => handleDiscussConversionWithAI(log.result)}
                            className="text-[8px] bg-slate-900 hover:bg-indigo-950 hover:text-indigo-300 text-slate-400 px-1.5 py-0.5 rounded transition uppercase font-bold cursor-pointer shrink-0"
                            title="Discuss conversion context with Gemini AI"
                          >
                            💬 Ask AI
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTool === "predictor" && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Zap size={13} className="text-amber-400" />
                  <span className="text-xs font-bold text-slate-300 font-sans">AI Fuel Consumption Predictor</span>
                </div>

                <div className="space-y-2.5">
                  {/* Cruising Speed */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Cruising Speed</span>
                      <span className="text-indigo-400 font-bold">{predictorSpeed} Km/H</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="140"
                      value={predictorSpeed}
                      onChange={(e) => setPredictorSpeed(parseInt(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-900"
                    />
                  </div>

                  {/* AC and Passengers */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1 bg-slate-950 p-2 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Air Conditioner</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={predictorAc}
                          onChange={(e) => setPredictorAc(e.target.checked)}
                          className="rounded text-indigo-500 focus:ring-0 bg-slate-900 border-slate-800"
                        />
                        <span className="text-[11px] text-slate-300 font-bold">{predictorAc ? "❄️ ON (-10%)" : "🔌 OFF (0%)"}</span>
                      </label>
                    </div>

                    <div className="space-y-1 bg-slate-950 p-2 rounded-xl border border-slate-850">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Load (Passengers)</span>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 font-bold">{predictorPassengers} Persons</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setPredictorPassengers(prev => Math.max(1, prev - 1))}
                            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-white px-1.5 rounded"
                          >
                            -
                          </button>
                          <button
                            onClick={() => setPredictorPassengers(prev => Math.min(5, prev + 1))}
                            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-white px-1.5 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Driving Style */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Throttle Input Style</label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
                      {["gentle", "moderate", "aggressive"].map((style) => (
                        <button
                          key={style}
                          onClick={() => setPredictorStyle(style as any)}
                          className={`py-1 text-[9px] font-bold rounded uppercase cursor-pointer transition ${
                            predictorStyle === style
                              ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/10"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Predictor calculations outcome */}
                {(() => {
                  let penalty = 0;
                  if (predictorAc) penalty += 10;
                  penalty += (predictorPassengers - 1) * 2;
                  
                  if (predictorSpeed < 50) penalty += 8;
                  else if (predictorSpeed > 100) penalty += (predictorSpeed - 100) * 0.4;

                  if (predictorStyle === "moderate") penalty += 10;
                  else if (predictorStyle === "aggressive") penalty += 25;

                  const finalScore = Math.max(30, 100 - penalty);
                  const activeVehicleName = activeVehicle ? activeVehicle.name : "your vehicle";

                  return (
                    <div className="bg-slate-950 p-3 rounded-2xl border border-indigo-500/15 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold">Optimization Efficiency Score:</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          finalScore > 80 ? "bg-green-500/10 text-green-400" : finalScore > 50 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {finalScore.toFixed(0)}% Optimal
                        </span>
                      </div>

                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${finalScore}%` }}
                          className={`h-full transition-all duration-300 ${
                            finalScore > 80 ? "bg-green-500" : finalScore > 50 ? "bg-amber-500" : "bg-red-500"
                          }`}
                        />
                      </div>

                      <p className="text-[10px] text-slate-400 leading-normal">
                        🚨 AI Estimate: Operating at <strong>{predictorSpeed} Km/h</strong> with AC <strong>{predictorAc ? "ON" : "OFF"}</strong> and <strong>{predictorStyle}</strong> throttle inputs will cause a <strong>{penalty.toFixed(0)}% drop</strong> in fuel economy on {activeVehicleName}.
                      </p>

                      <button
                        onClick={() => {
                          setActivePanel("chat");
                          handleSendMessage(`I want to consult you on my predictor configs. I cruise at ${predictorSpeed} Km/h with AC ${predictorAc ? "ON" : "OFF"}, carrying ${predictorPassengers} passengers, and my driving style is ${predictorStyle}. Give me custom optimizations.`);
                        }}
                        className="w-full mt-1.5 text-center bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold py-1.5 rounded-lg transition uppercase tracking-wider cursor-pointer"
                      >
                        💬 Verify driving style with AI
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTool === "diagnostic" && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Wrench size={13} className="text-red-400" />
                  <span className="text-xs font-bold text-slate-300">AI Diagnostics Assistant Checklist</span>
                </div>

                <p className="text-[9px] text-slate-500 leading-normal italic">
                  Check symptoms your active vehicle is showing to calculate instant troubleshooting checklists.
                </p>

                <div className="space-y-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                  {Object.keys(diagnosticIssues).map((key) => (
                    <label key={key} className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer py-0.5 hover:text-slate-200">
                      <input
                        type="checkbox"
                        checked={diagnosticIssues[key]}
                        onChange={(e) => setDiagnosticIssues(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded text-indigo-500 focus:ring-0 bg-slate-900 border-slate-800"
                      />
                      <span className="font-semibold text-[11px] capitalize">
                        {key.replace("_", " ")}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Instant diagnostic evaluation outcome */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide">🔬 Remediations:</span>
                  
                  {Object.values(diagnosticIssues).every(v => !v) ? (
                    <p className="text-[10px] text-slate-600 italic">No symptoms selected. Click checkmarks above!</p>
                  ) : (
                    <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-1">
                      {diagnosticIssues.low_mileage && <li>Check spark plugs, clean the dirty air filter, and inspect oxygen sensors.</li>}
                      {diagnosticIssues.black_smoke && <li>Rich fuel-air mixture. Clean fuel injectors and check Mass Airflow (MAF) sensor immediately.</li>}
                      {diagnosticIssues.rough_idle && <li>Dirty throttle body or clogged idle air control valve. Spark plugs could be fouled.</li>}
                      {diagnosticIssues.hard_start && <li>Weak battery, failing fuel pump, or bad engine starter relay. Check spark coil pack.</li>}
                      {diagnosticIssues.clutch_slip && <li>Worn out clutch pressure plate or incorrect cable play alignment. Needs immediate shop service.</li>}
                    </ul>
                  )}

                  <button
                    onClick={() => {
                      const selectedSymptoms = Object.keys(diagnosticIssues)
                        .filter(key => diagnosticIssues[key])
                        .map(key => key.replace("_", " "));
                      if (selectedSymptoms.length === 0) return;
                      setActivePanel("chat");
                      handleSendMessage(`My vehicle has these issues: [${selectedSymptoms.join(", ")}]. Provide me with an advanced step-by-step diagnostic and maintenance solution checklist.`);
                    }}
                    disabled={Object.values(diagnosticIssues).every(v => !v)}
                    className="w-full mt-1.5 text-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[9px] font-bold py-1.5 rounded-lg transition uppercase tracking-wider cursor-pointer"
                  >
                    🩺 Discuss diagnostic list with AI
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activePanel === "voicelog" ? (
        /* Voice log viewport */
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 border border-slate-800/80 rounded-2xl p-4 my-1">
          <div className="flex items-center justify-between mb-3 shrink-0 border-b border-slate-800/60 pb-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              🎙️ Spoken Commands History Log
            </h3>
            {voiceCommandHistory.length > 0 && (
              <button
                onClick={() => {
                  setVoiceCommandHistory([]);
                  localStorage.removeItem("voice_command_history");
                }}
                className="text-[8px] text-red-400 hover:underline uppercase font-bold cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          {voiceCommandHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <span className="text-2xl mb-2">🎙️</span>
              <p className="text-xs text-slate-500 font-medium">No recorded voice logs yet.</p>
              <p className="text-[10px] text-slate-600 max-w-[200px] mt-1 leading-normal">
                Click the microphone icon below, speak a command, and your speech log will be saved here!
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800 text-left">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Click any voice log to re-submit it:</span>
              {voiceCommandHistory.map((phrase, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActivePanel("chat");
                    handleSendMessage(phrase);
                  }}
                  className="p-2.5 rounded-xl border border-slate-850 hover:border-slate-800 bg-slate-900 hover:bg-slate-850 transition text-left cursor-pointer flex items-center justify-between gap-2 group"
                >
                  <span className="text-xs font-medium text-slate-300 italic truncate flex-1">" {phrase} "</span>
                  <span className="text-[8px] bg-violet-600/10 text-violet-400 border border-violet-500/10 font-bold rounded px-1.5 py-0.5 uppercase tracking-wide group-hover:bg-violet-600 group-hover:text-white transition">
                    Run
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Messages Feed (the default view) */
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 mb-3 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((msg) => {
            const isModel = msg.role === "model";
            return (
              <div key={msg.id} className={`flex ${isModel ? "justify-start" : "justify-end"} items-start gap-2 group`}>
                {isModel && (
                  <div className="w-6 h-6 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-[10px] shrink-0 font-bold">
                    💚
                  </div>
                )}
                <div
                  className={`p-3 max-w-[85%] rounded-2xl text-xs leading-relaxed shadow-md relative ${
                    isModel
                      ? "bg-slate-950 text-slate-200 border border-slate-800/80 rounded-tl-none whitespace-pre-line"
                      : "bg-violet-600 text-white font-medium rounded-tr-none"
                  }`}
                >
                  {msg.text}

                  {/* Individual delete & voice playback button group */}
                  {isModel ? (
                    <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex justify-start items-center gap-2">
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 text-slate-600 hover:text-red-400 hover:bg-slate-900 rounded transition flex items-center gap-1 text-[9px] font-bold cursor-pointer"
                        title="Remove Message"
                      >
                        <Trash2 size={10} /> DELETE
                      </button>
                    </div>
                  ) : (
                    /* User message action options (like delete) on hover */
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-red-400 hover:bg-slate-950 rounded transition cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Delete accidental prompt"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-[10px] shrink-0 font-bold">
                ⏳
              </div>
              <div className="bg-slate-950 text-slate-400 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-xs flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce delay-200"></span>
                  <span className="italic text-[10px] font-medium text-slate-500">Gemini logic analyzing...</span>
                </div>
                <button
                  onClick={handleCancelGeneration}
                  className="mr-auto text-[9px] bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 px-2 py-0.5 rounded transition font-bold uppercase cursor-pointer"
                >
                  Cancel Prompt
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs flex gap-2 items-start font-medium leading-relaxed">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-400" />
              <div>{errorMsg}</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input box + dictation buttons */}
      <div className="shrink-0 border-t border-slate-800/60 pt-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={LANGUAGES[currentLanguage].placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setActivePanel("chat");
                handleSendMessage(input);
              }
            }}
            disabled={loading}
            className="flex-1 text-xs px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/50 focus:outline-none focus:bg-slate-950 text-slate-100 font-medium placeholder-slate-600"
          />

          <button
            onClick={() => {
              setActivePanel("chat");
              handleSendMessage(input);
            }}
            disabled={loading || !input.trim()}
            className="p-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition shadow-md cursor-pointer disabled:opacity-50"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
