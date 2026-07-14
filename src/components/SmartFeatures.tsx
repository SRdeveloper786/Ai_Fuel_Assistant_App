import React, { useState, useEffect, useRef } from "react";
import { Vehicle, FuelEntry } from "../types";
import {
  Activity,
  Shield,
  ShieldAlert,
  Cpu,
  Wrench,
  Smartphone,
  Volume2,
  VolumeX,
  Search,
  Car,
  HelpCircle,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Bluetooth,
  Play,
  Square,
  Mic,
  MicOff,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  ChevronRight,
  Flame,
  FileText,
  Sparkles
} from "lucide-react";

interface SmartFeaturesProps {
  activeVehicle: Vehicle | null;
  logs: FuelEntry[];
  currentLanguage: "en" | "ur" | "roman" | "hi" | "ar";
  currency?: string;
  activeSubTab?: "obd" | "maintenance" | "theft" | "troubleshoot" | "handsfree" | "bento" | "budget";
  onSubTabChange?: (tab: "obd" | "maintenance" | "theft" | "troubleshoot" | "handsfree" | "bento" | "budget") => void;
}

// Diagnostic Trouble Codes (DTCs)
interface OBDCode {
  code: string;
  descriptionEn: string;
  descriptionUr: string;
  severity: "low" | "medium" | "high";
  possibleCausesEn: string;
  possibleCausesUr: string;
}

const OBD_DTC_DATABASE: OBDCode[] = [
  {
    code: "P0171",
    descriptionEn: "System Too Lean (Bank 1)",
    descriptionUr: "Fuel mixture me hawa zyada hai, ya fuel leakage/pressure kam hai.",
    severity: "medium",
    possibleCausesEn: "Vacuum leak, weak fuel pump, faulty MAF sensor, dirty fuel injectors.",
    possibleCausesUr: "Vacuum leak, kamzoor fuel pump, kharab air sensor, ya gande injectors."
  },
  {
    code: "P0300",
    descriptionEn: "Random/Multiple Cylinder Misfire Detected",
    descriptionUr: "Engine misfiring ho rahi hai, plugs ya coils weak hain.",
    severity: "high",
    possibleCausesEn: "Worn spark plugs, failing ignition coils, low cylinder compression.",
    possibleCausesUr: "Spark plugs kharab hain, coils weak hain, ya engine compression kam hai."
  },
  {
    code: "P0420",
    descriptionEn: "Catalyst System Efficiency Below Threshold (Bank 1)",
    descriptionUr: "Catalytic converter ki performance theek nahi hai, choke ho sakta hai.",
    severity: "low",
    possibleCausesEn: "Clogged catalytic converter, faulty oxygen sensor, exhaust leak.",
    possibleCausesUr: "Catalytic converter block hai, oxygen sensor kharab hai, exhaust leak."
  },
  {
    code: "P0115",
    descriptionEn: "Engine Coolant Temperature Circuit Malfunction",
    descriptionUr: "Engine coolant temperature sensor kharab hai, gari overheat ho sakti hai.",
    severity: "high",
    possibleCausesEn: "Failed ECT sensor, low coolant level, thermostat stuck closed.",
    possibleCausesUr: "Temp sensor kharab hai, coolant kam hai, thermostat valve block hai."
  },
  {
    code: "P0201",
    descriptionEn: "Injector Circuit Malfunction - Cylinder 1",
    descriptionUr: "Cylinder 1 ke injector circuit me electrical masla hai.",
    severity: "medium",
    possibleCausesEn: "Wiring harness damage, faulty fuel injector, bad ECM connection.",
    possibleCausesUr: "Injector ki wiring damage hai, injector kharab hai, ECM connection loose hai."
  }
];

// Offline Troubleshooting Advice
interface TroubleshootIssue {
  titleEn: string;
  titleUr: string;
  symptomsEn: string;
  symptomsUr: string;
  causesEn: string[];
  causesUr: string[];
  solutionsEn: string[];
  solutionsUr: string[];
}

const OFFLINE_DIAGNOSTICS: TroubleshootIssue[] = [
  {
    titleEn: "Engine Overheating (Gari Overheat Hona)",
    titleUr: "Engine Overheat Hona - Radiator ya Thermostat valve ka masla.",
    symptomsEn: "Temperature gauge shows red, steam from under hood, coolant boiling.",
    symptomsUr: "Temp gauge red line pr, hood se bhaanp nikalna, radiator coolant ka ubalna.",
    causesEn: [
      "Low engine coolant level",
      "Stuck thermostat valve",
      "Radiator fan not working",
      "Leaking water pump"
    ],
    causesUr: [
      "Coolant level kam hona",
      "Thermostat valve band reh jana",
      "Radiator fan ka na chalna",
      "Water pump leak hona"
    ],
    solutionsEn: [
      "Do not open radiator cap immediately! Let engine cool down first.",
      "Check coolant level in reservoir tank and refill when cool.",
      "Inspect radiator fan fuse and wiring harness.",
      "Replace thermostat valve if stuck closed."
    ],
    solutionsUr: [
      "Gari ko foran band karein, radiator cap foran mat kholein!",
      "Engine thanda hone pr coolant level check karein aur refill karein.",
      "Radiator fan ka fuse aur wiring check karein.",
      "Thermostat valve stuck hai to use badlein."
    ]
  },
  {
    titleEn: "Black Smoke from Exhaust (Kala Dhuan)",
    titleUr: "Kala Dhuan - Fuel air ratio kharab, fuel bohot zyada chal raha hai.",
    symptomsEn: "Dark black smoke from exhaust pipe, heavy fuel smell, sluggish pickup.",
    symptomsUr: "Exhaust pipe se kala dhuan nikalna, fuel ki smell ana, pickup kam hona.",
    causesEn: [
      "Dirty or clogged air filter",
      "Faulty/leaking fuel injectors",
      "Bad oxygen sensor sending wrong signal",
      "Excessive fuel pressure"
    ],
    causesUr: [
      "Air filter ganda ya block hona",
      "Fuel injectors ka leak ya kharab hona",
      "Oxygen sensor kharab hona jo galat signals bhej raha ho",
      "Fuel pressure regulator ka failure"
    ],
    solutionsEn: [
      "Inspect and replace the air filter.",
      "Clean or service fuel injectors.",
      "Check oxygen sensor data (O2 levels) using OBD scanner and replace if needed.",
      "Clean catalytic converter using fuel additive."
    ],
    solutionsUr: [
      "Air filter ko check karein aur ganda hone pr badlein.",
      "Injectors ki nozzle cleaning ya service karwayein.",
      "Oxygen sensor diagnostic check karein aur badlein.",
      "Catalytic cleaner additive fuel tank me dalain."
    ]
  },
  {
    titleEn: "Engine Vibrating / Misfiring (Engine Ka Kampna)",
    titleUr: "Engine Ka Kampna - Cylinder misfire ya ignition coil failure.",
    symptomsEn: "Rough idling, check engine light flashing, loss of power when accelerating.",
    symptomsUr: "Idling pr engine ka thartharana, check engine light ka chalna, pickup kam hona.",
    causesEn: [
      "Worn out spark plugs",
      "Weak or cracked ignition coils",
      "Clogged fuel filter",
      "Vacuum leak in intake manifold"
    ],
    causesUr: [
      "Spark plugs ghis jana ya carbon jama hona",
      "Ignition coils weak ya crack hona",
      "Fuel filter block hona",
      "Intake manifold me vacuum leak hona"
    ],
    solutionsEn: [
      "Replace spark plugs (recommend copper every 20k km, iridium every 80k km).",
      "Swap ignition coils to identify the failing unit.",
      "Check intake pipe for vacuum leaks or cracks.",
      "Use premium fuel once to clear minor engine carbon."
    ],
    solutionsUr: [
      "Spark plugs badlein (iridium plug 80k km chalte hain).",
      "Ignition coil diagnose karwayein aur defective badlein.",
      "Hawa ki pipe (intake) check karein kahin se leak to nahi.",
      "Fuel system saaf karne k liye high-octane additive use karein."
    ]
  }
];

const URDU_TO_DEVANAGARI_CHAR_MAP: Record<string, string> = {
  "ا": "अ", "آ": "आ", "ب": "ब", "پ": "प", "ت": "त", "ٹ": "ट", "ث": "स", "ج": "ज", "چ": "च",
  "ح": "ह", "خ": "ख", "د": "द", "ڈ": "ड", "ذ": "ज़", "ر": "र", "ڑ": "ड़", "ز": "ज़", "ژ": "झ",
  "س": "स", "श": "श", "ص": "स", "ض": "ज़", "ط": "त", "ظ": "ज़", "ع": "अ", "غ": "ग", "ف": "फ़",
  "ق": "क़", "ک": "क", "گ": "ग", "ل": "ल", "م": "म", "ن": "न", "ں": "ँ", "و": "व", "ہ": "ह",
  "ھ": "ह", "ی": "य", "ے": "े", "ۂ": "ह", "ء": "अ", "ۃ": "त"
};

function transliterateUrduToDevanagari(urduText: string): string {
  let result = "";
  for (let i = 0; i < urduText.length; i++) {
    const char = urduText[i];
    result += URDU_TO_DEVANAGARI_CHAR_MAP[char] || char;
  }
  return result;
}

export function SmartFeatures({ 
  activeVehicle, 
  logs, 
  currentLanguage, 
  currency = "PKR",
  activeSubTab: controlledSubTab,
  onSubTabChange
}: SmartFeaturesProps) {
  // Features interactive state
  const [localSubTab, setLocalSubTab] = useState<"obd" | "maintenance" | "theft" | "troubleshoot" | "handsfree" | "bento" | "budget">("bento");

  const activeSubTab = controlledSubTab !== undefined ? controlledSubTab : localSubTab;
  const setActiveSubTab = (tab: "obd" | "maintenance" | "theft" | "troubleshoot" | "handsfree" | "bento" | "budget") => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setLocalSubTab(tab);
    }
  };

  // Smart Budget Planner States
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    return Number(localStorage.getItem("smart_monthly_budget") || "25000");
  });
  const [alertThreshold, setAlertThreshold] = useState(() => {
    return Number(localStorage.getItem("smart_alert_threshold") || "80");
  });
  const [priceThreshold, setPriceThreshold] = useState(() => {
    return Number(localStorage.getItem("smart_price_threshold") || "280");
  });

  // OBD Simulation States
  const [obdConnected, setObdConnected] = useState(false);
  const [obdConnecting, setObdConnecting] = useState(false);
  const [obdData, setObdData] = useState({
    rpm: 0,
    temp: 82,
    speed: 0,
    throttle: 15,
    o2Sensor: 0.45,
    voltage: 13.8,
  });
  const [scannedCodes, setScannedCodes] = useState<OBDCode[]>([]);
  const [isScanningCodes, setIsScanningCodes] = useState(false);
  const obdIntervalRef = useRef<any>(null);

  // Theft/Leakage Monitor States
  const [parkingGuardActive, setParkingGuardActive] = useState(false);
  const [motionData, setMotionData] = useState({ x: 0, y: 0, z: 0, maxForce: 0 });
  const [bluetoothError, setBluetoothError] = useState<string | null>(null);
  const [fuelTheftLog, setFuelTheftLog] = useState<{ id: string; time: string; type: "leak" | "theft" | "refill" | "normal"; desc: string; amount: string }[]>([
    { id: "1", time: "July 04, 2026 11:30 PM", type: "normal", desc: "Parking Guard activated. Secure baseline established.", amount: "35.2L" },
  ]);
  const [theftWarning, setTheftWarning] = useState(false);

  // Offline Diagnostics States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<TroubleshootIssue | null>(null);

  // Hands-free Voice mode states
  const [handsFreeActive, setHandsFreeActive] = useState(false);
  const [speechOutput, setSpeechOutput] = useState("");
  const [voiceCommandActive, setVoiceCommandActive] = useState(false);
  const [heardCommand, setHeardCommand] = useState("");
  const [drivingHubLang, setDrivingHubLang] = useState<"en" | "hi">("en");
  const [showGuidelines, setShowGuidelines] = useState(true);
  const recognitionRef = useRef<any>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        if (window.speechSynthesis) {
          window.speechSynthesis.onvoiceschanged = null;
        }
      };
    }
  }, []);

  // Maintenance Logging form
  const [lastOilChangeMileage, setLastOilChangeMileage] = useState(() => {
    return Number(localStorage.getItem("maint_oil_mileage") || "120000");
  });
  const [lastPlugsChangeMileage, setLastPlugsChangeMileage] = useState(() => {
    return Number(localStorage.getItem("maint_plugs_mileage") || "125000");
  });
  const [lastBrakeChangeMileage, setLastBrakeChangeMileage] = useState(() => {
    return Number(localStorage.getItem("maint_brakes_mileage") || "118000");
  });
  const [lastTyreChangeMileage, setLastTyreChangeMileage] = useState(() => {
    return Number(localStorage.getItem("maint_tyres_mileage") || "100000");
  });
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [tempOil, setTempOil] = useState(lastOilChangeMileage.toString());
  const [tempPlugs, setTempPlugs] = useState(lastPlugsChangeMileage.toString());
  const [tempBrakes, setTempBrakes] = useState(lastBrakeChangeMileage.toString());
  const [tempTyres, setTempTyres] = useState(lastTyreChangeMileage.toString());

  // Local state persistence for maintenance milestones
  const saveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const oil = Number(tempOil) || 0;
    const plugs = Number(tempPlugs) || 0;
    const brakes = Number(tempBrakes) || 0;
    const tyres = Number(tempTyres) || 0;

    setLastOilChangeMileage(oil);
    setLastPlugsChangeMileage(plugs);
    setLastBrakeChangeMileage(brakes);
    setLastTyreChangeMileage(tyres);

    localStorage.setItem("maint_oil_mileage", oil.toString());
    localStorage.setItem("maint_plugs_mileage", plugs.toString());
    localStorage.setItem("maint_brakes_mileage", brakes.toString());
    localStorage.setItem("maint_tyres_mileage", tyres.toString());

    setShowMaintForm(false);
  };

  // Fuel Logs Calculations for Expense Analytics
  const totalCostOfFuel = logs.reduce((sum, log) => sum + log.totalCost, 0);
  const totalLitersRefilled = logs.reduce((sum, log) => sum + log.fuelFilled, 0);
  
  // Calculate average efficiency
  let calculatedAverageMileage = 0;
  if (logs.length > 1) {
    const sortedLogs = [...logs].sort((a, b) => a.odometer - b.odometer);
    const minOdo = sortedLogs[0].odometer;
    const maxOdo = sortedLogs[sortedLogs.length - 1].odometer;
    const totalDistance = maxOdo - minOdo;
    const totalFilledExceptFirst = sortedLogs.slice(1).reduce((sum, log) => sum + log.fuelFilled, 0);
    if (totalFilledExceptFirst > 0) {
      calculatedAverageMileage = totalDistance / totalFilledExceptFirst;
    }
  }

  // Get current odometer
  const currentOdometer = logs.length > 0 ? Math.max(...logs.map(log => log.odometer)) : 125000;

  // Maintenance Part Wear Calculations
  // Thresholds: Oil (5000km), Plugs (20000km), Brakes (30000km), Tyres (50000km)
  const oilDistance = currentOdometer - lastOilChangeMileage;
  const plugsDistance = currentOdometer - lastPlugsChangeMileage;
  const brakesDistance = currentOdometer - lastBrakeChangeMileage;
  const tyresDistance = currentOdometer - lastTyreChangeMileage;

  const oilWear = Math.min(100, Math.max(0, (oilDistance / 5000) * 100));
  const plugsWear = Math.min(100, Math.max(0, (plugsDistance / 20000) * 100));
  const brakesWear = Math.min(100, Math.max(0, (brakesDistance / 30000) * 100));
  const tyresWear = Math.min(100, Math.max(0, (tyresDistance / 50000) * 100));

  // Anomaly engine simulation
  useEffect(() => {
    if (obdConnected) {
      obdIntervalRef.current = setInterval(() => {
        setObdData(prev => {
          const isAccelerating = Math.random() > 0.5;
          let targetRpm = isAccelerating ? Math.floor(Math.random() * 1500) + 1800 : Math.floor(Math.random() * 600) + 800;
          let targetSpeed = isAccelerating ? Math.floor(targetRpm / 35) + 30 : Math.floor(targetRpm / 40) + 10;
          let targetTemp = 85 + Math.floor(Math.sin(Date.now() / 10000) * 5);
          let targetO2 = Math.min(0.9, Math.max(0.1, prev.o2Sensor + (Math.random() - 0.5) * 0.1));
          
          return {
            rpm: targetRpm,
            temp: targetTemp,
            speed: targetSpeed,
            throttle: isAccelerating ? 35 + Math.floor(Math.random() * 20) : 12 + Math.floor(Math.random() * 5),
            o2Sensor: Number(targetO2.toFixed(2)),
            voltage: Number((13.6 + Math.random() * 0.4).toFixed(1))
          };
        });
      }, 1000);
    } else {
      clearInterval(obdIntervalRef.current);
      setObdData({ rpm: 0, temp: 82, speed: 0, throttle: 15, o2Sensor: 0.45, voltage: 13.8 });
    }
    return () => clearInterval(obdIntervalRef.current);
  }, [obdConnected]);

  // Connect OBD-II simulator
  const handleConnectObd = () => {
    if (obdConnected) {
      setObdConnected(false);
      setScannedCodes([]);
      return;
    }
    setObdConnecting(true);
    setTimeout(() => {
      setObdConnecting(false);
      setObdConnected(true);
    }, 1500);
  };

  // Scan for DTC codes
  const handleScanCodes = () => {
    setIsScanningCodes(true);
    setTimeout(() => {
      // Pick 0, 1 or 2 troubleshooting codes based on wear factors
      const errors: OBDCode[] = [];
      if (oilWear > 80 || plugsWear > 80) {
        errors.push(OBD_DTC_DATABASE[1]); // P0300 cylinder misfire
      }
      if (calculatedAverageMileage > 0 && calculatedAverageMileage < 8) {
        errors.push(OBD_DTC_DATABASE[0]); // P0171 system too lean
      }
      if (Math.random() > 0.6 && errors.length === 0) {
        errors.push(OBD_DTC_DATABASE[2]); // P0420 catalyst efficiency
      }
      setScannedCodes(errors);
      setIsScanningCodes(false);
    }, 2000);
  };

  // Toggle Parking Guard Mode (Fuel Theft Monitor)
  useEffect(() => {
    let monitorTimer: any = null;
    if (parkingGuardActive) {
      setFuelTheftLog(prev => [
        { id: Date.now().toString(), time: new Date().toLocaleTimeString(), type: "normal", desc: "Parking Guard Armed. Fuel level sensor stabilized.", amount: "Active" },
        ...prev
      ]);

      // Simulate a random monitoring loop
      monitorTimer = setInterval(() => {
        const check = Math.random();
        if (check > 0.93) {
          // Trigger a fake Fuel Siphon warning!
          setTheftWarning(true);
          const siphonedLiters = (3 + Math.random() * 4).toFixed(1);
          setFuelTheftLog(prev => [
            {
              id: Date.now().toString(),
              time: new Date().toLocaleTimeString(),
              type: "theft",
              desc: "🚨 CRITICAL WARNING: Sudden fuel drop detected! Possible siphoning or tank puncture.",
              amount: `-${siphonedLiters}L`
            },
            ...prev
          ]);
          // Speak warning out loud if TTS is active
          speakVoice("Alert! Sudden fuel level drop detected! Possible siphoning or tank puncture.");
        } else if (check > 0.85) {
          // Small microscopic leak simulation
          setFuelTheftLog(prev => [
            {
              id: Date.now().toString(),
              time: new Date().toLocaleTimeString(),
              type: "leak",
              desc: "⚠️ Micro-evaporative vapor leakage or slow drip detected in pressurized line.",
              amount: "-0.15L"
            },
            ...prev
          ]);
        }
      }, 8000);
    } else {
      setTheftWarning(false);
    }
    return () => clearInterval(monitorTimer);
  }, [parkingGuardActive]);

  const speakVoice = (text: string, langCode?: "en" | "hi") => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const activeLang = langCode || drivingHubLang;
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    
    // Core helper to find a clear, natural male/boy voice for a language code prefix
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

    let bcpTag = "en-US";
    let selectedVoice: SpeechSynthesisVoice | null = null;
    let preparedText = text;
    
    if (activeLang === "hi") {
      // 1. Look for Hindi male voice
      const hindiMale = findMaleVoice("hi");
      if (hindiMale) {
        selectedVoice = hindiMale;
        bcpTag = "hi-IN";
      } else {
        // 2. Fallback to English male voice
        selectedVoice = findMaleVoice("en");
        bcpTag = "en-US";
      }
    } else {
      // English
      selectedVoice = findMaleVoice("en");
      bcpTag = "en-US";
    }

    const utterance = new SpeechSynthesisUtterance(preparedText);
    utterance.lang = bcpTag;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Natural speaking parameters
    utterance.rate = 0.90; // Natural, slightly slower speaking pace for high clarity and premium output
    utterance.pitch = 0.95; // Slightly deeper male/boy pitch for professional tone
    
    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition engine for Driving Mode
  useEffect(() => {
    if (handsFreeActive) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechOutput("Speech recognition is not supported in this browser.");
        return;
      }
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = false;
      
      // Set recognition language based on drivingHubLang
      let bcpTag = "en-US";
      if (drivingHubLang === "hi") bcpTag = "hi-IN";
      
      recog.lang = bcpTag;

      recog.onstart = () => {
        setVoiceCommandActive(true);
        let guidanceText = "Listening... Try saying: 'check diagnostics', 'car status', or 'fuel levels'";
        if (drivingHubLang === "hi") {
          guidanceText = "सुन रहा हूँ... बोलिए: 'status', 'gadi ki halat', या 'average efficiency'";
        }
        setSpeechOutput(guidanceText);
      };

      recog.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        setHeardCommand(transcript);
        handleHandsFreeCommand(transcript);
      };

      recog.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setVoiceCommandActive(false);
      };

      recog.onend = () => {
        setVoiceCommandActive(false);
      };

      recognitionRef.current = recog;
      recog.start();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setVoiceCommandActive(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [handsFreeActive, drivingHubLang]);

  const handleHandsFreeCommand = (command: string) => {
    let reply = "";
    
    // Detect matched command category across English, Roman Urdu, Urdu, Hindi, Arabic
    const isStatus = 
      command.includes("status") || 
      command.includes("gari") || 
      command.includes("gadi") || 
      command.includes("halat") || 
      command.includes("sayara") || 
      command.includes("sayyara") ||
      command.includes("حالة") ||
      command.includes("سيارة") ||
      command.includes("गाड़ी") ||
      command.includes("स्थिति");

    const isFaults = 
      command.includes("diagnostic") || 
      command.includes("fault") || 
      command.includes("check") || 
      command.includes("engine") || 
      command.includes("kharab") || 
      command.includes("masla") || 
      command.includes("fahs") || 
      command.includes("tashkhis") || 
      command.includes("mushkila") ||
      command.includes("فحص") ||
      command.includes("تشخيص") ||
      command.includes("مشكلة") ||
      command.includes("ख़राब") ||
      command.includes("गड़बड़");

    const isFuel = 
      command.includes("fuel") || 
      command.includes("average") || 
      command.includes("efficiency") || 
      command.includes("efficiency") || 
      command.includes("petrol") || 
      command.includes("milej") || 
      command.includes("kharch") || 
      command.includes("waqud") ||
      command.includes("وقود") ||
      command.includes("بترول") ||
      command.includes("औसत") ||
      command.includes("ईंधन");

    const isTheft = 
      command.includes("theft") || 
      command.includes("secure") || 
      command.includes("parking") || 
      command.includes("guard") || 
      command.includes("chori") || 
      command.includes("sariqa") || 
      command.includes("haris") ||
      command.includes("حارس") ||
      command.includes("سرقة") ||
      command.includes("चोरी") ||
      command.includes("सुरक्षा");

    const isHello = 
      command.includes("hello") || 
      command.includes("hi") || 
      command.includes("salam") || 
      command.includes("namaste") || 
      command.includes("ahlan") || 
      command.includes("marhaban") ||
      command.includes("مرحبا") ||
      command.includes("سلام") ||
      command.includes("नमस्ते");

    const activeVehicleName = activeVehicle?.name || "Gari";

    // Standard replies based on the SELECTED drivingHubLang
    if (drivingHubLang === "hi") {
      if (isStatus) {
        reply = `आपकी सक्रिय गाड़ी ${activeVehicleName} है। इंजन के सभी पैरामीटर और वोल्टेज बिल्कुल ठीक हैं।`;
      } else if (isFaults) {
        const errorCount = scannedCodes.length;
        reply = errorCount === 0 
          ? "आपकी गाड़ी में कोई गड़बड़ी नहीं मिली। इंजन पूरी तरह सुरक्षित है!" 
          : `इंजन में ${errorCount} त्रुटियां मिली हैं, जिसमें फ़ॉल्ट कोड ${scannedCodes[0].code} शामिल है। कृपया जल्द सर्विस करवाएं।`;
      } else if (isFuel) {
        reply = calculatedAverageMileage > 0 
          ? `आपकी गाड़ी का औसत माइलेज ${calculatedAverageMileage.toFixed(1)} किलोमीटर प्रति लीटर है।` 
          : "अभी तक कोई रिफिल दर्ज नहीं है जिससे माइलेज की गणना की जा सके।";
      } else if (isTheft) {
        reply = parkingGuardActive 
          ? "चोरी रोधी गार्ड चालू है और आपकी गाड़ी पार्किंग में पूरी तरह सुरक्षित है।"
          : "गार्ड अभी बंद है। आप इसे स्मार्ट फीचर्स पैनल से चालू कर सकते हैं।";
      } else if (isHello) {
        reply = "नमस्ते! मैं आपका डिजिटल को-पायलट हूँ। गाड़ी की स्थिति या खराबी की जाँच करने के लिए मुझसे बात करें।";
      } else {
        reply = "मुझे आपकी बात समझ नहीं आई। कृपया: 'status', 'gadi ki halat', 'petrol', या 'chori' के बारे में पूछें।";
      }
    } else {
      // Default to English
      if (isStatus) {
        reply = `Your active vehicle is ${activeVehicleName}. Current engine metrics and voltage are nominal at 13.8 volts.`;
      } else if (isFaults) {
        const errorCount = scannedCodes.length;
        reply = errorCount === 0 
          ? "No diagnostic trouble codes detected on your engine. All green!" 
          : `OBD sensor scans show ${errorCount} active trouble codes, including code ${scannedCodes[0].code}. Please service soon.`;
      } else if (isFuel) {
        reply = calculatedAverageMileage > 0 
          ? `Your calculated average efficiency is ${calculatedAverageMileage.toFixed(1)} kilometers per liter.` 
          : "No fuel refills logged yet to calculate actual efficiency. Please enter a refill log first.";
      } else if (isTheft) {
        reply = parkingGuardActive 
          ? "Parking Guard is currently armed and actively monitoring fuel pressure sensors. Vehicle is fully secure."
          : "Parking Guard is currently disarmed. You can turn on secure parking in the smart features panel.";
      } else if (isHello) {
        reply = "Hello! I am your hands-free digital co-pilot. Tell me to check diagnostics or status while you drive.";
      } else {
        reply = "I heard you, but I didn't recognize that instruction. Try saying: 'check diagnostics', 'car status', or 'average efficiency'.";
      }
    }

    setSpeechOutput(reply);
    speakVoice(reply, drivingHubLang);
  };

  // Offline Diagnostics Filtered Search
  const filteredIssues = OFFLINE_DIAGNOSTICS.filter(
    issue =>
      issue.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.titleUr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.symptomsEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900/60 border border-blue-500/15 rounded-2xl p-5 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Top Blue glow accent */}
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl"></div>
      
      {/* Dynamic Sub-header Navigation */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Cpu className="text-blue-400 w-5 h-5 animate-pulse" />
          <h2 className="text-[13px] font-semibold text-slate-100 tracking-tight uppercase">
            Advanced Smart Engine Suite
          </h2>
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition flex items-center gap-1 font-bold cursor-pointer"
          >
            <HelpCircle size={11} />
            {showGuidelines ? "Hide User Guide" : "Show User Guide"}
          </button>
        </div>
        
        {/* Module Switcher Buttons */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setActiveSubTab("bento")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "bento" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Bento Analytics
          </button>
          <button
            onClick={() => setActiveSubTab("obd")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "obd" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            OBD-II Bluetooth
          </button>
          <button
            onClick={() => setActiveSubTab("maintenance")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "maintenance" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Maintenance
          </button>
          <button
            onClick={() => setActiveSubTab("theft")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "theft" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Guard Mode
          </button>
          <button
            onClick={() => setActiveSubTab("troubleshoot")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "troubleshoot" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Offline Fixes
          </button>

          <button
            onClick={() => setActiveSubTab("budget")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeSubTab === "budget" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Budget Planner
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE MULTILINGUAL USER TESTING GUIDELINES PANEL */}
      {showGuidelines && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/20 border border-blue-500/15 rounded-2xl p-4 space-y-3 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>💡 Smart Tools Testing Guide & Guidelines</span>
              <span className="text-slate-500 font-medium font-sans">|</span>
              <span className="text-[10px] text-blue-400 font-bold font-sans">Instructions for Testing</span>
            </h3>
            <button
              onClick={() => setShowGuidelines(false)}
              className="text-[10px] text-red-500 hover:text-red-400 font-bold transition cursor-pointer bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded hover:bg-red-500/20"
            >
              [ Dismiss Guide ]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Guide 1: Bento */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-1">
              <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                <span>📊</span> Bento Analytics & Estimator
              </p>
              <p className="text-[10px] text-slate-400 leading-normal">
                <strong>How to use:</strong> Add new fuel entries using the top form to see real-time fuel budgets and costs per KM. Use the built-in estimator card below to compute trip fuel and {currency} expenses instantly.
              </p>
            </div>

            {/* Guide 2: OBD */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-1">
              <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                <span>🔌</span> OBD-II Bluetooth Telemetry
              </p>
              <p className="text-[10px] text-slate-400 leading-normal">
                <strong>How to use:</strong> Click <strong>"Pair OBD-II Adapter"</strong> to activate simulated RPM, speed, and coolant logs. Click <strong>"Scan For Faults"</strong> to read hardware trouble codes (DTCs).
              </p>
            </div>

            {/* Guide 3: Maintenance */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-1">
              <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                <span>🔧</span> Predictive Maintenance Log
              </p>
              <p className="text-[10px] text-slate-400 leading-normal">
                <strong>How to use:</strong> Click <strong>"Update Maintenance Log"</strong> and type in the odometer reading when you last changed engine oil, spark plugs, brakes, or tyres to compute exact live wear status.
              </p>
            </div>

            {/* Guide 4: Guard Mode */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-1">
              <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                <span>🛡️</span> Fuel Theft & Leak Guard
              </p>
              <p className="text-[10px] text-slate-400 leading-normal">
                <strong>How to use:</strong> Toggle <strong>"Armed & Guarding"</strong>. Every 8 seconds, background threads simulate float level readings and alert you instantly with alerts if any fuel drop is detected.
              </p>
            </div>

            {/* Guide 5: Offline Fixes */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-1">
              <p className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                <span>📚</span> Offline Troubleshooting
              </p>
              <p className="text-[10px] text-slate-400 leading-normal">
                <strong>How to use:</strong> Use the search bar to find emergency advice. Type words like <strong>"overheat"</strong>, <strong>"smoke"</strong>, or <strong>"vibrating"</strong> for instant solutions.
              </p>
            </div>


          </div>
        </div>
      )}

      {/* RENDER ACTIVE MODULE */}

      {/* 1. BENTO ANALYTICS VIEW */}
      {activeSubTab === "bento" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Bento Cell 1: Budget Health */}
            <div className="bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 p-4 rounded-2xl border border-indigo-500/20 flex flex-col justify-between relative overflow-hidden h-[135px] shadow-[0_8px_30px_rgba(99,102,241,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Refill Budget</span>
                <DollarSign size={15} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-100">{currency} {totalCostOfFuel.toLocaleString()}</p>
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (totalCostOfFuel / 25000) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-[9px] text-slate-500 mt-1 font-medium">Limit set to {currency} 25,000</p>
              </div>
            </div>

            {/* Bento Cell 2: Cost Per Kilometer */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 p-4 rounded-2xl border border-emerald-500/20 flex flex-col justify-between relative overflow-hidden h-[135px] shadow-[0_8px_30px_rgba(16,185,129,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cost Efficiency</span>
                <TrendingUp size={15} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-100">
                  {calculatedAverageMileage > 0 
                    ? `${currency} ${(280 / calculatedAverageMileage).toFixed(1)} / km` 
                    : "No Data"}
                </p>
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                  <span>● Calculated from refills</span>
                </p>
                <p className="text-[9px] text-slate-500 mt-1 font-medium">Based on {currency} 280/Liter</p>
              </div>
            </div>

            {/* Bento Cell 3: Live Fuel Stats */}
            <div className="bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-950 p-4 rounded-2xl border border-amber-500/20 flex flex-col justify-between relative overflow-hidden h-[135px] shadow-[0_8px_30px_rgba(245,158,11,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetry Vol.</span>
                <Activity size={15} className="text-amber-400 animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-100">{totalLitersRefilled.toFixed(1)} Liters</p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                  Avg: {calculatedAverageMileage > 0 ? `${calculatedAverageMileage.toFixed(1)} km/l` : "0.0 km/l"}
                </p>
                <p className="text-[9px] text-slate-500 mt-1 font-medium">Total logged refills count: {logs.length}</p>
              </div>
            </div>
          </div>

          {/* Quick Interactive Mileage Estimator Card */}
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase">
              🧮 Smart Distance & Trip Cost Estimator
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Trip Distance (km)</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  defaultValue={100}
                  id="trip_dist_calc"
                  onChange={() => {
                    const d = Number((document.getElementById("trip_dist_calc") as HTMLInputElement)?.value || 100);
                    const avg = calculatedAverageMileage > 0 ? calculatedAverageMileage : 12;
                    const liters = d / avg;
                    const cost = liters * 280;
                    const lNode = document.getElementById("trip_liters_result");
                    const cNode = document.getElementById("trip_cost_result");
                    if (lNode) lNode.innerText = `${liters.toFixed(1)} Liters`;
                    if (cNode) cNode.innerText = `${currency} ${Math.round(cost).toLocaleString()}`;
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 mt-1"
                />
              </div>
              <div className="flex flex-col justify-center bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                <p className="text-[9px] text-slate-500 uppercase font-bold">Estimated Cost & Vol</p>
                <p className="text-xs font-bold text-slate-200 mt-1" id="trip_liters_result">8.3 Liters</p>
                <p className="text-xs font-extrabold text-emerald-400" id="trip_cost_result">{currency} 2,333</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. OBD-II BLUETOOTH SCANNER INTERACTIVE SIMULATOR */}
      {activeSubTab === "obd" && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Bluetooth size={14} className={obdConnected ? "text-indigo-400 animate-ping" : "text-slate-600"} />
                  OBD-II Bluetooth Adapter Mode
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Connect ELM327 interface to read engine registers</p>
              </div>
              <button
                onClick={handleConnectObd}
                disabled={obdConnecting}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1.5 ${
                  obdConnected
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                {obdConnecting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> Pairing...
                  </>
                ) : obdConnected ? (
                  "Disconnect Adapter"
                ) : (
                  "Pair OBD-II Adapter"
                )}
              </button>
            </div>

            {/* Diagnostic Readings Interface */}
            {obdConnected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="bg-gradient-to-br from-indigo-950/25 via-slate-900 to-slate-950 p-3 rounded-xl border border-indigo-500/25 text-center shadow-[0_4px_12px_rgba(99,102,241,0.05)]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Engine Speed</p>
                    <p className="text-sm font-black text-indigo-400 mt-1 font-mono">{obdData.rpm} RPM</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-950/25 via-slate-900 to-slate-950 p-3 rounded-xl border border-orange-500/25 text-center shadow-[0_4px_12px_rgba(249,115,22,0.05)]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Coolant Temp</p>
                    <p className="text-sm font-black text-orange-400 mt-1 font-mono">{obdData.temp}°C</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-950/25 via-slate-900 to-slate-950 p-3 rounded-xl border border-emerald-500/25 text-center shadow-[0_4px_12px_rgba(16,185,129,0.05)]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Vehicle Speed</p>
                    <p className="text-sm font-black text-emerald-400 mt-1 font-mono">{obdData.speed} km/h</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-950/25 via-slate-900 to-slate-950 p-3 rounded-xl border border-yellow-500/25 text-center shadow-[0_4px_12px_rgba(234,179,8,0.05)]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Throttle pos.</p>
                    <p className="text-sm font-black text-yellow-400 mt-1 font-mono">{obdData.throttle}%</p>
                  </div>
                  <div className="bg-gradient-to-br from-sky-950/25 via-slate-900 to-slate-950 p-3 rounded-xl border border-sky-500/25 text-center shadow-[0_4px_12px_rgba(14,165,233,0.05)]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Oxygen Sensor</p>
                    <p className="text-sm font-black text-sky-400 mt-1 font-mono">{obdData.o2Sensor} V</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-950/25 via-slate-900 to-slate-950 p-3 rounded-xl border border-pink-500/25 text-center shadow-[0_4px_12px_rgba(236,72,153,0.05)]">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Battery Voltage</p>
                    <p className="text-sm font-black text-pink-400 mt-1 font-mono">{obdData.voltage} V</p>
                  </div>
                </div>

                {/* Live Diagnostic Trouble Code Scanner */}
                <div className="border-t border-slate-850 pt-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-300">ECU Diagnostic Trouble Codes (DTC)</h4>
                      <p className="text-[9px] text-slate-500 font-medium">Read hardware diagnostic codes instantly</p>
                    </div>
                    <button
                      onClick={handleScanCodes}
                      disabled={isScanningCodes}
                      className="px-2.5 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 cursor-pointer"
                    >
                      {isScanningCodes ? "Querying ECU..." : "Scan For Faults"}
                    </button>
                  </div>

                  {isScanningCodes ? (
                    <div className="flex items-center justify-center gap-2 p-4 bg-slate-900 rounded-xl border border-slate-850">
                      <RefreshCw className="animate-spin text-indigo-400" size={15} />
                      <span className="text-xs text-slate-400 font-medium font-mono">Interrogating sensor array via Bluetooth...</span>
                    </div>
                  ) : scannedCodes.length === 0 ? (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 size={14} />
                      <span>All Engine Control Unit variables nominal. No trouble codes detected.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scannedCodes.map((dtc, index) => (
                        <div key={index} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-red-400 font-mono tracking-wide">{dtc.code}</span>
                            <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-bold ${
                              dtc.severity === "high" ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                            }`}>
                              {dtc.severity} severity
                            </span>
                          </div>
                          <p className="font-bold text-slate-200 mt-0.5">{dtc.descriptionEn}</p>
                          <p className="text-[11px] text-slate-400 italic">{dtc.descriptionUr}</p>
                          <div className="pt-1 text-[10px] text-slate-500 leading-normal">
                            <span className="font-semibold text-slate-400">Possible Causes:</span> {dtc.possibleCausesEn}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-2 bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl">
                <Bluetooth className="mx-auto text-slate-600 animate-pulse" size={30} />
                <p className="text-xs text-slate-400 font-bold">Bluetooth OBD-II Disconnected</p>
                <p className="text-[10px] text-slate-500 max-w-sm mx-auto leading-normal">
                  Pair your ELM327 Bluetooth device using the button above to view live engine RPM, coolant temperatures, throttle angles, and clear check engine codes.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SMART PREDICTIVE MAINTENANCE TRACKER */}
      {activeSubTab === "maintenance" && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-200">Wear Status & Part Lifespan Tracker</h3>
                <p className="text-[10px] text-slate-500 font-medium">Predictive algorithm based on efficiency and wear coefficients</p>
              </div>
              <button
                onClick={() => setShowMaintForm(!showMaintForm)}
                className="px-2.5 py-1 text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 rounded-lg hover:bg-indigo-500/25 cursor-pointer"
              >
                {showMaintForm ? "Close Form" : "Update Maintenance Log"}
              </button>
            </div>

            {/* Service Log Form */}
            {showMaintForm && (
              <form onSubmit={saveMaintenance} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">Update Last Service Milestones</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Last Engine Oil Change (km)</label>
                    <input
                      type="number"
                      value={tempOil}
                      onChange={e => setTempOil(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Last Spark Plugs Change (km)</label>
                    <input
                      type="number"
                      value={tempPlugs}
                      onChange={e => setTempPlugs(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Last Brake Pads Change (km)</label>
                    <input
                      type="number"
                      value={tempBrakes}
                      onChange={e => setTempBrakes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Last Tyres Installed (km)</label>
                    <input
                      type="number"
                      value={tempTyres}
                      onChange={e => setTempTyres(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition cursor-pointer"
                >
                  Save Service Record
                </button>
              </form>
            )}

            {/* Progress Bars for Part Wear */}
            <div className="space-y-3.5">
              {/* Part 1: Engine Oil */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Engine Oil (Mobil Oil)</span>
                  <span className={oilWear > 80 ? "text-red-400" : oilWear > 60 ? "text-amber-400" : "text-emerald-400"}>
                    {Math.round(oilWear)}% Exhausted
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      oilWear > 80 ? "bg-red-500" : oilWear > 60 ? "bg-amber-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${oilWear}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                  <span>Last: {lastOilChangeMileage.toLocaleString()} km</span>
                  <span>Interval: 5,000 km</span>
                  <span>{Math.max(0, 5000 - oilDistance)} km remaining</span>
                </div>
              </div>

              {/* Part 2: Spark Plugs */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Spark Plugs / Tuning</span>
                  <span className={plugsWear > 80 ? "text-red-400" : plugsWear > 60 ? "text-amber-400" : "text-emerald-400"}>
                    {Math.round(plugsWear)}% Exhausted
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      plugsWear > 80 ? "bg-red-500" : plugsWear > 60 ? "bg-amber-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${plugsWear}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                  <span>Last: {lastPlugsChangeMileage.toLocaleString()} km</span>
                  <span>Interval: 20,000 km</span>
                  <span>{Math.max(0, 20000 - plugsDistance)} km remaining</span>
                </div>
              </div>

              {/* Part 3: Brake Pads */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Brake Pads / Calipers</span>
                  <span className={brakesWear > 80 ? "text-red-400" : brakesWear > 60 ? "text-amber-400" : "text-emerald-400"}>
                    {Math.round(brakesWear)}% Exhausted
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      brakesWear > 80 ? "bg-red-500" : brakesWear > 60 ? "bg-amber-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${brakesWear}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                  <span>Last: {lastBrakeChangeMileage.toLocaleString()} km</span>
                  <span>Interval: 30,000 km</span>
                  <span>{Math.max(0, 30000 - brakesDistance)} km remaining</span>
                </div>
              </div>

              {/* Part 4: Tyres */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-300">Tyres Alignment / Wear</span>
                  <span className={tyresWear > 80 ? "text-red-400" : tyresWear > 60 ? "text-amber-400" : "text-emerald-400"}>
                    {Math.round(tyresWear)}% Exhausted
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      tyresWear > 80 ? "bg-red-500" : tyresWear > 60 ? "bg-amber-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${tyresWear}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                  <span>Last: {lastTyreChangeMileage.toLocaleString()} km</span>
                  <span>Interval: 50,000 km</span>
                  <span>{Math.max(0, 50000 - tyresDistance)} km remaining</span>
                </div>
              </div>
            </div>

            {/* Smart Advice Panel */}
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-2 text-xs leading-normal">
              <Wrench size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-slate-300">
                <span className="font-bold text-slate-200">AI Predictive Insights:</span>{" "}
                {oilWear > 85
                  ? "Your Engine Oil is critically exhausted! Delaying an oil change can result in piston friction and severe fuel efficiency drops."
                  : plugsWear > 80
                  ? "Spark plugs require tuning. Dirty plugs reduce engine compression causing unburnt fuel to exit the exhaust."
                  : "All parameters healthy. Keep logs up to date to get highly precise, proactive wear updates."}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FUEL THEFT & LEAKAGE MONITOR */}
      {activeSubTab === "theft" && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Shield size={14} className={parkingGuardActive ? "text-emerald-400 animate-pulse" : "text-slate-600"} />
                  Fuel Theft & Leak Guard
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Monitors electronic fuel float sensor anomalies when parked</p>
              </div>
              <button
                onClick={() => setParkingGuardActive(!parkingGuardActive)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  parkingGuardActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                    : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-850"
                }`}
              >
                {parkingGuardActive ? "🛡️ Armed & Guarding" : "Disarmed (Turn On)"}
              </button>
            </div>

            {/* Alarm Visualizer Banner */}
            {theftWarning && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2.5 text-xs animate-bounce">
                <ShieldAlert size={18} className="shrink-0 mt-0.5 text-red-400 animate-pulse" />
                <div>
                  <p className="font-extrabold text-red-200 uppercase tracking-wide">SUDDEN LOSS DETECTED!</p>
                  <p className="mt-0.5 font-medium leading-relaxed">
                    Sensor reported sudden pressure drop (-5.2L) in pressurized circuit while stationary. Potential theft or active fuel line rupture.
                  </p>
                </div>
              </div>
            )}

            {/* Graphic Sensor Simulation */}
            <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                <span>Fuel Reservoir pressure</span>
                <span className={parkingGuardActive ? "text-emerald-400" : "text-slate-500"}>
                  {parkingGuardActive ? "● ONLINE" : "● OFFLINE"}
                </span>
              </div>
              
              <div className="h-10 bg-slate-950 rounded border border-slate-800 flex items-center justify-around overflow-hidden relative">
                {/* Simulated Graph Lines */}
                <div className="absolute inset-0 flex items-end justify-between px-2 opacity-30">
                  <div className="w-1.5 bg-indigo-500 rounded-t h-4 animate-pulse"></div>
                  <div className="w-1.5 bg-indigo-500 rounded-t h-6 animate-pulse delay-75"></div>
                  <div className="w-1.5 bg-indigo-500 rounded-t h-5 animate-pulse delay-100"></div>
                  <div className="w-1.5 bg-indigo-500 rounded-t h-7 animate-pulse delay-150"></div>
                  <div className="w-1.5 bg-indigo-500 rounded-t h-3 animate-pulse delay-200"></div>
                  <div className="w-1.5 bg-indigo-500 rounded-t h-5 animate-pulse delay-100"></div>
                  <div className="w-1.5 bg-indigo-500 rounded-t h-6 animate-pulse delay-300"></div>
                </div>
                <div className="z-10 text-[11px] font-mono font-bold text-slate-300">
                  {parkingGuardActive ? "Float Level: 35.2L (Stable)" : "Turn on Parking Guard to start telemetry"}
                </div>
              </div>
            </div>

            {/* Monitoring Activity Log */}
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guard Security Log</h4>
              <div className="bg-slate-900 border border-slate-850 rounded-xl p-2.5 h-[110px] overflow-y-auto space-y-2 font-mono scrollbar-thin scrollbar-thumb-slate-800">
                {fuelTheftLog.map((log) => (
                  <div key={log.id} className="text-[10px] flex items-start justify-between gap-3 border-b border-slate-850/50 pb-1.5">
                    <div className="min-w-0">
                      <p className="text-slate-500 font-medium">{log.time}</p>
                      <p className={`mt-0.5 leading-relaxed ${
                        log.type === "theft" ? "text-red-400 font-bold" : log.type === "leak" ? "text-amber-400" : "text-slate-400"
                      }`}>
                        {log.desc}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold font-mono shrink-0 ${
                      log.type === "theft" ? "text-red-400" : log.type === "leak" ? "text-amber-400" : "text-slate-500"
                    }`}>
                      {log.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. OFFLINE AI TROUBLESHOOTING MANUAL */}
      {activeSubTab === "troubleshoot" && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200">Offline Diagnostic manual (Urdu & English)</h3>
              <p className="text-[10px] text-slate-500 font-medium">Instantly searchable maintenance advice without active internet connection</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={13} />
              <input
                type="text"
                placeholder="Search troubleshooting... (e.g., Overheat, Kala dhuan, Smoke, Plugs)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Search Results */}
            {selectedIssue ? (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-850 space-y-3 relative">
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="absolute right-3 top-3 text-[10px] font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Back
                </button>
                <h4 className="text-xs font-bold text-indigo-400 pr-12">{selectedIssue.titleEn}</h4>
                
                <div className="space-y-1">
                  <p className="text-[10px] text-indigo-300 font-bold uppercase">Symptoms / Alamaat:</p>
                  <p className="text-xs text-slate-200 leading-normal">{selectedIssue.symptomsEn}</p>
                  <p className="text-[11px] text-slate-400 italic font-medium leading-relaxed">{selectedIssue.symptomsUr}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-amber-400 font-bold uppercase">Probable Causes:</p>
                    <ul className="list-disc pl-4 text-[11px] text-slate-300 space-y-1">
                      {selectedIssue.causesEn.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Roman Urdu Wajahat:</p>
                    <ul className="list-disc pl-4 text-[10px] text-slate-400 italic space-y-1">
                      {selectedIssue.causesUr.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase">Solutions / Hal:</p>
                    <ul className="list-decimal pl-4 text-[11px] text-slate-200 space-y-1 font-medium">
                      {selectedIssue.solutionsEn.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">Roman Urdu Hal:</p>
                    <ul className="list-decimal pl-4 text-[10px] text-slate-400 italic space-y-1">
                      {selectedIssue.solutionsUr.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
                {filteredIssues.map((issue, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedIssue(issue)}
                    className="p-3 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{issue.titleEn}</p>
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-sm mt-0.5">{issue.titleUr}</p>
                    </div>
                    <ChevronRight size={13} className="text-slate-500" />
                  </div>
                ))}
                {filteredIssues.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No offline guide found matching "{searchQuery}". Try searching for 'smoke', 'vibrating', or 'overheating'.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}



      {/* 7. SMART BUDGET PLANNER & REAL-TIME ALERT SYSTEM */}
      {activeSubTab === "budget" && (
        <div className="space-y-4 text-left">
          <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  💰 Smart Budget & Alerts Configurator
                </h3>
                <p className="text-xs text-slate-400">Configure parameters to trigger real-time vehicle alerts</p>
              </div>
              <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            </div>

            {/* Config Forms */}
            <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Monthly Fuel Limit ({currency})</label>
                <input
                  type="number"
                  value={monthlyBudget}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setMonthlyBudget(val);
                    localStorage.setItem("smart_monthly_budget", val.toString());
                  }}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-bold font-mono focus:outline-indigo-500"
                />
                <span className="text-[9px] text-slate-500 leading-normal block">Warnings fire when you exceed threshold budget.</span>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Warning Threshold % ({alertThreshold}%)</label>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={alertThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAlertThreshold(val);
                    localStorage.setItem("smart_alert_threshold", val.toString());
                  }}
                  className="w-full accent-indigo-500 cursor-pointer mt-2"
                />
                <span className="text-[9px] text-slate-500 leading-normal block">Triggers caution notification at {alertThreshold}% limit.</span>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Price per unit Cap ({currency})</label>
                <input
                  type="number"
                  value={priceThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setPriceThreshold(val);
                    localStorage.setItem("smart_price_threshold", val.toString());
                  }}
                  className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-bold font-mono focus:outline-indigo-500"
                />
                <span className="text-[9px] text-slate-500 leading-normal block">Fires alarm if station charges more than limit.</span>
              </div>
            </form>
          </div>

          {/* Active Real-time Alert terminal list */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
              🚨 Active Safety & Budget Monitor Alerts
            </h4>

            <div className="space-y-3">
              {/* Alert Logic Checkers */}
              {(() => {
                const alerts: React.ReactNode[] = [];
                const percentSpent = monthlyBudget > 0 ? (totalCostOfFuel / monthlyBudget) * 100 : 0;

                // 1. Critical Budget Alert
                if (totalCostOfFuel > monthlyBudget) {
                  alerts.push(
                    <div key="budget-critical" className="bg-red-500/10 border-2 border-red-500/20 p-4 rounded-xl flex items-start gap-3.5">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping mt-1 shrink-0"></div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-red-400 uppercase tracking-wide">🚨 CRITICAL: Monthly Fuel Budget Exceeded!</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Your total refuel spending of <strong>{currency} {totalCostOfFuel.toLocaleString()}</strong> has exceeded your target monthly threshold limit of <strong>{currency} {monthlyBudget.toLocaleString()}</strong>. Consider consolidating trips or using public transport.
                        </p>
                      </div>
                    </div>
                  );
                } 
                // 2. Warning Budget Alert
                else if (percentSpent >= alertThreshold) {
                  alerts.push(
                    <div key="budget-warning" className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3.5">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse mt-1 shrink-0"></div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">⚠️ WARNING: Approaching Fuel Budget Limit</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          You have consumed <strong>{percentSpent.toFixed(0)}%</strong> of your monthly fuel budget limit (<strong>{currency} {totalCostOfFuel.toLocaleString()}</strong> spent out of <strong>{currency} {monthlyBudget.toLocaleString()}</strong>). Try driving conservatively!
                        </p>
                      </div>
                    </div>
                  );
                }

                // 3. Price Threshold Cap Exceeded Alert
                const highPriceLogs = logs.filter(log => log.pricePerUnit > priceThreshold);
                if (highPriceLogs.length > 0) {
                  alerts.push(
                    <div key="price-cap" className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3.5">
                      <div className="p-1 bg-amber-500/15 text-amber-400 rounded-lg shrink-0 mt-0.5">
                        <AlertTriangle size={14} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">⛽ PRICE SPIKE ALERT: Fuel Unit Rate Exceeded Cap</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          We found <strong>{highPriceLogs.length} fuel logs</strong> where the refill rate of <strong>{currency} {Math.max(...highPriceLogs.map(l => l.pricePerUnit))}</strong> exceeded your configured price alert threshold of <strong>{currency} {priceThreshold}</strong>. Check our <strong>Cheap Fuel Finder</strong> to find nearby stations!
                        </p>
                      </div>
                    </div>
                  );
                }

                // 4. Low Fuel Efficiency Anomaly Alert
                if (calculatedAverageMileage > 0 && calculatedAverageMileage < 10) {
                  alerts.push(
                    <div key="efficiency-anomaly" className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-start gap-3.5">
                      <div className="p-1 bg-indigo-500/15 text-indigo-400 rounded-lg shrink-0 mt-0.5">
                        <TrendingUp size={14} className="rotate-180" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">📉 EFFICIENCY ANOMALY: Low Engine Efficiency Detected</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Your active vehicle's average fuel efficiency of <strong>{calculatedAverageMileage.toFixed(1)} Km/L</strong> is below peak target efficiency. Check spark plugs, tyre pressure, or clean the air filter to save up to 15% on monthly fuel expenses.
                        </p>
                      </div>
                    </div>
                  );
                }

                // 5. Theft Warning (Siphoning Alert)
                if (theftWarning) {
                  alerts.push(
                    <div key="theft-warning" className="bg-red-500/10 border-2 border-red-500/20 p-4 rounded-xl flex items-start gap-3.5 animate-bounce">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping mt-1 shrink-0"></div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-red-400 uppercase tracking-wide">🚨 SECURITY BREACH: Sudden Fuel Level Drop Detected!</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Our active <strong>Parking Guard Mode</strong> detected an abrupt, anomalous drop in fuel tank levels while parked. Possible fuel siphoning theft or gas tank leak. Check your vehicle immediately!
                        </p>
                      </div>
                    </div>
                  );
                }

                // Render placeholder if all is good
                if (alerts.length === 0) {
                  return (
                    <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
                      <CheckCircle2 size={24} className="text-emerald-500 mx-auto" />
                      <p className="text-xs text-slate-200 font-bold uppercase tracking-wider">All Systems Clear</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Your vehicle spending, fuel rates, and mechanical efficiencies are completely within normal parameters. No active alerts present!
                      </p>
                    </div>
                  );
                }

                return alerts;
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
