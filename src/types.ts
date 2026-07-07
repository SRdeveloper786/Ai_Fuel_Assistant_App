export type VehicleType = "Car" | "Motorcycle" | "Rickshaw/Auto" | "Truck/Van" | "Other";
export type FuelType = "Petrol" | "Diesel" | "CNG" | "LPG" | "Electric";
export type OdometerUnit = "Km" | "Miles";

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  fuelType: FuelType;
  engineSize: string; // e.g. "1300cc", "70cc"
  odometerUnit: OdometerUnit;
  createdAt: string;
}

export interface FuelEntry {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  fuelFilled: number; // liters or gallons
  pricePerUnit: number;
  totalCost: number;
  mileage?: number; // calculated efficiency (Km/L or MPG)
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  speechText?: string;
  timestamp: string;
}

export type SupportedLanguage = "en" | "ur" | "roman" | "hi" | "ar";

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  flag: string;
  greeting: string;
  placeholder: string;
  speechLocale: string;
  inputLocale: string;
}

export const LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: "en",
    name: "English",
    flag: "🇺🇸",
    greeting: "Hello! I am your AI Fuel Assistant. How can I help you optimize your efficiency today?",
    placeholder: "Ask about fuel consumption, low efficiency fixes...",
    speechLocale: "en-US",
    inputLocale: "en-US",
  },
  ur: {
    code: "ur",
    name: "Urdu (اردو)",
    flag: "🇵🇰",
    greeting: "السلام علیکم! میں آپ کا اے آئی فیول اسسٹنٹ ہوں۔ آج میں آپ کی گاڑی کی فیول کارکردگی (Efficiency) بہتر بنانے میں کیسے مدد کر سکتا ہوں؟",
    placeholder: "فیول کارکردگی بہتر کرنے کے طریقے، فیول ریکارڈ کے بارے میں پوچھیں...",
    speechLocale: "hi-IN",
    inputLocale: "ur-PK",
  },
  roman: {
    code: "roman",
    name: "Roman Urdu",
    flag: "✍️",
    greeting: "Assalam-o-Alaikum! Main aapka AI Fuel Assistant hoon. Aaj aapki gari ki efficiency aur average theek karne me kya madad karu?",
    placeholder: "Efficiency kaise theek karein, average barhane ke tips...",
    speechLocale: "hi-IN", // fallback TTS in Hindi accent
    inputLocale: "ur-PK",
  },
  hi: {
    code: "hi",
    name: "Hindi (हिंदी)",
    flag: "🇮🇳",
    greeting: "नमस्ते! मैं आपका एआई फ्यूल असिस्टेंट हूँ। आज मैं आपके वाहन की दक्षता (Efficiency) बेहतर बनाने में कैसे मदद कर सकता हूँ?",
    placeholder: "दक्षता कैसे बढ़ाएं, फ्यूल रिकॉर्ड के बारे में पूछें...",
    speechLocale: "hi-IN",
    inputLocale: "hi-IN",
  },
  ar: {
    code: "ar",
    name: "Arabic (العربية)",
    flag: "🇸🇦",
    greeting: "مرحباً! أنا مساعد الوقود الذكي الخاص بك. كيف يمكنني مساعدتك في تحسين كفاءة استهلاك الوقود اليوم؟",
    placeholder: "اسأل عن استهلاك الوقود، تحسين الكفاءة، أو الأعطال...",
    speechLocale: "ar-SA",
    inputLocale: "ar-SA",
  },
};
