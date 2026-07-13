import React, { useState, useEffect, useRef } from "react";
import { Vehicle, FuelEntry, SupportedLanguage } from "./types";
import VehicleManager from "./components/VehicleManager";
import FuelLogsManager from "./components/FuelLogsManager";
import FuelAnalytics from "./components/FuelAnalytics";
import AIFuelAssistant from "./components/AIFuelAssistant";
import AndroidIntegrationGuide from "./components/AndroidIntegrationGuide";
import { SmartFeatures } from "./components/SmartFeatures";
import CheapFuelFinder from "./components/CheapFuelFinder";
import { Car, Settings, BarChart3, MessageSquare, Flame, HelpCircle, FileText, Smartphone, MapPin, Wrench, ShieldAlert, Bluetooth, Calculator, AlertTriangle, ShieldCheck, PlayCircle, Sparkles, Download, Upload, Wifi, WifiOff, Database, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Theme Toggle State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem("assistant_theme") as 'dark' | 'light') || "dark";
  });

  useEffect(() => {
    localStorage.setItem("assistant_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  // State loaders from localStorage
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem("assistant_vehicles");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(() => {
    return localStorage.getItem("assistant_active_vehicle_id") || null;
  });

  const [fuelLogs, setFuelLogs] = useState<FuelEntry[]>(() => {
    const saved = localStorage.getItem("assistant_fuel_logs");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>("roman");
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "assistant" | "map" | "tools" | "integration" | "about">("dashboard");
  const [activeSubTab, setActiveSubTab] = useState<"obd" | "maintenance" | "theft" | "troubleshoot" | "handsfree" | "bento" | "budget">("bento");
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem("assistant_currency") || "PKR";
  });

  // Notification center & inactivity simulation states
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [simulatedInactivity, setSimulatedInactivity] = useState(false);

  // Offline Mode States
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const isOffline = !isOnline || simulateOffline;

  // Slider arrow indicators state
  const [arrowsVisible, setArrowsVisible] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateArrows = () => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const handleNavScroll = () => {
    // Hide arrows instantly when scrolling/sliding
    setArrowsVisible(false);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Show them again after scroll action stops (600ms delay)
    scrollTimeoutRef.current = setTimeout(() => {
      updateArrows();
      setArrowsVisible(true);
    }, 600);
  };

  // Ref and scrolling handler for the horizontal navigation slider
  const navRef = useRef<HTMLDivElement>(null);
  const slideNavigation = (direction: "left" | "right") => {
    // When arrow button clicked, hide arrows immediately
    setArrowsVisible(false);
    if (navRef.current) {
      const scrollAmount = 180;
      navRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial calculation and listener for slider boundaries
    setTimeout(updateArrows, 200);
    window.addEventListener("resize", updateArrows);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", updateArrows);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Data Export & Import Handlers
  const exportLogsToCSV = () => {
    if (fuelLogs.length === 0) {
      alert("No fuel logs recorded to export. (ایکسپورٹ کے لیے کوئی پٹرول لاگز موجود نہیں ہیں)");
      return;
    }
    const headers = "Date,Vehicle,Odometer,Fuel Filled (L),Price Per Liter,Total Cost,Notes,Mileage\n";
    const rows = fuelLogs.map(log => {
      const v = vehicles.find(veh => veh.id === log.vehicleId);
      const vehicleName = v ? v.name : log.vehicleId;
      return `"${log.date}","${vehicleName}",${log.odometer},${log.fuelFilled},${log.pricePerUnit},${log.totalCost},"${(log.notes || '').replace(/"/g, '""')}",${log.mileage || ''}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ai_fuel_logs_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBackupJSON = () => {
    const dataStr = JSON.stringify({ vehicles, fuelLogs, currency, version: "2.5.0", timestamp: Date.now() }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ai_fuel_assistant_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data.vehicles) && Array.isArray(data.fuelLogs)) {
          setVehicles(data.vehicles);
          setFuelLogs(data.fuelLogs);
          if (data.currency) setCurrency(data.currency);
          alert("🎉 Backup imported successfully! All vehicle profiles and refuel logs synchronized. (بیک اپ کامیابی کے ساتھ بحال ہو گیا ہے)");
        } else {
          alert("Invalid backup file structure. Please upload a valid AI Fuel Assistant backup JSON. (بیک اپ فائل کا فارمیٹ درست نہیں ہے)");
        }
      } catch (err) {
        alert("Error parsing backup JSON file. (فائل پڑھنے میں غلطی پیش آئی)");
      }
    };
    reader.readAsText(file);
  };

  // Splash Screen States
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);
  const [splashProgress, setSplashProgress] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 90); // Smooth increments to reach 100% in ~9 seconds

    const fadeTimeout = setTimeout(() => {
      setFadeSplash(true);
    }, 9300);

    const removeTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 10000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, []);

  const navigateToFeature = (tab: "dashboard" | "analytics" | "assistant" | "map" | "tools" | "integration" | "about", subTab?: "obd" | "maintenance" | "theft" | "troubleshoot" | "handsfree" | "bento" | "budget") => {
    setActiveTab(tab);
    if (subTab) {
      setActiveSubTab(subTab);
    }
    // Scroll to top of page/container for smooth transition
    const mainFrame = document.querySelector("main");
    if (mainFrame) {
      mainFrame.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("assistant_vehicles", JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    if (activeVehicleId) {
      localStorage.setItem("assistant_active_vehicle_id", activeVehicleId);
    } else {
      localStorage.removeItem("assistant_active_vehicle_id");
    }
  }, [activeVehicleId]);

  useEffect(() => {
    localStorage.setItem("assistant_fuel_logs", JSON.stringify(fuelLogs));
  }, [fuelLogs]);

  useEffect(() => {
    localStorage.setItem("assistant_currency", currency);
  }, [currency]);

  // Check and update last active time
  const [isInactive, setIsInactive] = useState(false);

  useEffect(() => {
    const lastActive = localStorage.getItem("assistant_last_active_time");
    const now = Date.now();
    if (lastActive) {
      const diffDays = (now - Number(lastActive)) / (1000 * 60 * 60 * 24);
      if (diffDays >= 2) {
        setIsInactive(true);
      }
    }
    localStorage.setItem("assistant_last_active_time", now.toString());
  }, []);

  // Dynamically calculate wear status
  const currentOdometer = fuelLogs.length > 0 ? Math.max(...fuelLogs.map(log => log.odometer)) : 125000;
  
  // Read maintenance logs
  const oilM = Number(localStorage.getItem("maint_oil_mileage") || "120000");
  const plugsM = Number(localStorage.getItem("maint_plugs_mileage") || "125000");
  const brakesM = Number(localStorage.getItem("maint_brakes_mileage") || "118000");
  const tyresM = Number(localStorage.getItem("maint_tyres_mileage") || "100000");

  const oilDist = currentOdometer - oilM;
  const plugsDist = currentOdometer - plugsM;
  const brakesDist = currentOdometer - brakesM;
  const tyresDist = currentOdometer - tyresM;

  const oilW = Math.min(100, Math.max(0, (oilDist / 5000) * 100));
  const plugsW = Math.min(100, Math.max(0, (plugsDist / 20000) * 100));
  const brakesW = Math.min(100, Math.max(0, (brakesDist / 30000) * 100));
  const tyresW = Math.min(100, Math.max(0, (tyresDist / 50000) * 100));

  interface AppNotification {
    id: string;
    type: "maintenance" | "refuel" | "inactivity" | "system";
    title: string;
    titleUr: string;
    desc: string;
    descUr: string;
    severity: "low" | "medium" | "high";
    actionLabel?: string;
    actionTab?: "dashboard" | "analytics" | "assistant" | "map" | "tools" | "integration" | "about";
    actionSubTab?: "obd" | "maintenance" | "theft" | "troubleshoot" | "handsfree" | "bento" | "budget";
  }

  const activeNotifications = React.useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];

    // 1. Inactivity Notification
    if (isInactive || simulatedInactivity) {
      list.push({
        id: "inactive-alert",
        type: "inactivity",
        title: "App Inactivity Reminder",
        titleUr: "ایپ غیر فعالیت کی یاد دہانی",
        desc: "You haven't used the app in 3 days! Open the app offline to log fuel and keep your mileage optimized.",
        descUr: "آپ نے 3 دن سے ایپ استعمال نہیں کی! پٹرول لاگ کرنے اور مائلیج کو بہتر رکھنے کے لیے ایپ آف لائن بھی استعمال کریں۔",
        severity: "medium",
        actionLabel: "Log Fuel Now",
        actionTab: "dashboard"
      });
    }

    // 2. Refuel Notifications
    if (fuelLogs.length === 0) {
      list.push({
        id: "no-logs-alert",
        type: "refuel",
        title: "First Fuel Entry Required",
        titleUr: "پہلا پٹرول اندراج ضروری ہے",
        desc: "Please log your first fuel refill entry to start tracking mileage and diagnostics.",
        descUr: "مائلیج اور ڈائیگنوسٹکس کو ٹریک کرنا شروع کرنے کے لیے براہ کرم اپنی پہلی فیول اینٹری درج کریں۔",
        severity: "high",
        actionLabel: "Add Refuel Log",
        actionTab: "dashboard"
      });
    } else {
      // Check last refuel date
      const sortedLogs = [...fuelLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastLog = sortedLogs[0];
      const daysSinceLastLog = (Date.now() - new Date(lastLog.date).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastLog > 5) {
        list.push({
          id: "refuel-time-alert",
          type: "refuel",
          title: "⛽ Refuel Entry Reminder",
          titleUr: "⛽ ریفول اندراج کی یاد دہانی",
          desc: `Your last fuel log was ${Math.round(daysSinceLastLog)} days ago. Don't forget to record new fuel refill logs!`,
          descUr: `آپ کا آخری فیول لاگ ${Math.round(daysSinceLastLog)} دن پہلے تھا۔ نیا پٹرول بھروانے پر اینٹری درج کرنا نہ بھولیں!`,
          severity: "medium",
          actionLabel: "Record Fuel",
          actionTab: "dashboard"
        });
      }

      // Check distance since last refuel if we have multiple logs
      if (fuelLogs.length > 1) {
        const lastOdoVal = lastLog.odometer;
        const currentOdoVal = currentOdometer;
        const distTraveled = currentOdoVal - lastOdoVal;
        if (distTraveled > 350) {
          list.push({
            id: "refuel-distance-alert",
            type: "refuel",
            title: "⚠️ High Distance Refuel Alert",
            titleUr: "⚠️ زیادہ فاصلہ ریفول الرٹ",
            desc: `You have driven ${distTraveled} km since your last fuel log. Enter your latest refuel to update mileage stats.`,
            descUr: `آپ اپنے آخری فیول لاگ کے بعد سے ${distTraveled} کلومیٹر چل چکے ہیں۔ مائلیج اپ ڈیٹ کرنے کے لیے تازہ ترین اینٹری درج کریں۔`,
            severity: "medium",
            actionLabel: "Record Fuel",
            actionTab: "dashboard"
          });
        }
      }
    }

    // 3. Maintenance Notifications
    if (oilW > 85) {
      list.push({
        id: "maint-oil-alert",
        type: "maintenance",
        title: "Engine Oil Exhausted Alert",
        titleUr: "انجن آئل ختم ہونے کا الرٹ",
        desc: `Engine oil wear is at ${Math.round(oilW)}%. Please change oil immediately to protect engine from friction damage.`,
        descUr: `انجن آئل کی لائف ${Math.round(oilW)}% ختم ہو چکی ہے۔ رگڑ اور خرابی سے بچنے کے لیے براہ کرم فوری آئل تبدیل کریں۔`,
        severity: "high",
        actionLabel: "View Maintenance",
        actionTab: "tools",
        actionSubTab: "maintenance"
      });
    } else if (oilW > 70) {
      list.push({
        id: "maint-oil-warning",
        type: "maintenance",
        title: "Engine Oil Change Upcoming",
        titleUr: "انجن آئل تبدیلی قریب ہے",
        desc: `Engine oil wear is at ${Math.round(oilW)}%. Plan a service soon. Only ${Math.max(0, 5000 - oilDist)} km remaining.`,
        descUr: `انجن آئل کی لائف ${Math.round(oilW)}% ختم ہو چکی ہے۔ سروس کی منصوبہ بندی کریں۔ صرف ${Math.max(0, 5000 - oilDist)} کلومیٹر باقی ہیں۔`,
        severity: "low",
        actionLabel: "View Maintenance",
        actionTab: "tools",
        actionSubTab: "maintenance"
      });
    }

    if (plugsW > 85) {
      list.push({
        id: "maint-plugs-alert",
        type: "maintenance",
        title: "Spark Plugs Tuning Required",
        titleUr: "سپارک پلگ اور ٹیوننگ ضروری ہے",
        desc: `Spark plugs wear is at ${Math.round(plugsW)}%. Poor plugs decrease mileage up to 20%. Please clean or replace.`,
        descUr: `کمزور سپارک پلگ مائلیج کو 20% تک کم کرتے ہیں۔ براہ کرم سپارک پلگ کی صفائی یا ٹیوننگ کروائیں۔`,
        severity: "high",
        actionLabel: "View Maintenance",
        actionTab: "tools",
        actionSubTab: "maintenance"
      });
    }

    if (brakesW > 85) {
      list.push({
        id: "maint-brakes-alert",
        type: "maintenance",
        title: "Brake Pads Exhausted Alert",
        titleUr: "بریک پیڈز ختم ہونے کا الرٹ",
        desc: `Brake wear is at ${Math.round(brakesW)}%. Critically low brakes compromise braking safety. Replace soon.`,
        descUr: `بریک پیڈز ${Math.round(brakesW)}% ختم ہو چکے ہیں۔ کمزور بریک ڈرائیونگ کی حفاظت کو متاثر کرتی ہے۔`,
        severity: "high",
        actionLabel: "View Maintenance",
        actionTab: "tools",
        actionSubTab: "maintenance"
      });
    }

    if (tyresW > 85) {
      list.push({
        id: "maint-tyres-alert",
        type: "maintenance",
        title: "Tyre Alignment Alert",
        titleUr: "ٹائر الائنمنٹ الرٹ",
        desc: `Tyre mileage limit is at ${Math.round(tyresW)}% (${tyresDist.toLocaleString()} km used). Rotate or replace tyres.`,
        descUr: `ٹائر کی حد ${Math.round(tyresW)}% ختم ہو چکی ہے۔ ٹائروں کو تبدیل کریں یا الائنمنٹ درست کروائیں۔`,
        severity: "medium",
        actionLabel: "View Maintenance",
        actionTab: "tools",
        actionSubTab: "maintenance"
      });
    }

    return list;
  }, [isInactive, simulatedInactivity, fuelLogs, currentOdometer, oilDist, oilW, plugsDist, plugsW, brakesDist, brakesW, tyresDist, tyresW]);

  // Handle vehicle state alterations
  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles((prev) => [...prev, newVehicle]);
    if (!activeVehicleId) {
      setActiveVehicleId(newVehicle.id);
    }
  };

  const handleSelectVehicle = (id: string) => {
    setActiveVehicleId(id);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setFuelLogs((prev) => prev.filter((log) => log.vehicleId !== id));
    if (activeVehicleId === id) {
      const remaining = vehicles.filter((v) => v.id !== id);
      setActiveVehicleId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Handle fuel logs state alterations
  const handleAddLog = (newLog: FuelEntry) => {
    setFuelLogs((prev) => [...prev, newLog]);
  };

  const handleDeleteLog = (id: string) => {
    setFuelLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || null;

  // Custom component for the new About Us screen
  const AboutUsView = () => (
    <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-6 shadow-2xl shadow-black/30">
      <div className="flex items-center gap-4 border-b border-white/[0.08] pb-5">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 border border-indigo-500/50">
          <HelpCircle size={22} />
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-white tracking-tight">About Rao Developers</h2>
          <p className="text-xs text-slate-400">Application architecture & authorship details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/[0.06] space-y-2">
          <span className="text-[13px] uppercase font-semibold tracking-wider text-indigo-400">
            DEVELOPMENT HOUSE
          </span>
          <h3 className="text-base font-bold text-slate-100">Rao Developers</h3>
          <p className="text-[15px] text-slate-400 leading-relaxed font-normal">
            Crafting high-fidelity, data-driven full-stack experiences and state-of-the-art mobile and web solutions. Specialized in AI agent architectures, speech synthesis algorithms, and real-time telematics.
          </p>
        </div>

        <div className="bg-slate-950/60 p-5 rounded-2xl border border-white/[0.06] space-y-2">
          <span className="text-[13px] uppercase font-semibold tracking-wider text-indigo-400">
            VERSION DETAILS
          </span>
          <h3 className="text-base font-bold text-slate-100">Release v2.5.0</h3>
          <p className="text-[15px] text-slate-400 leading-relaxed font-normal">
            Integrated with advanced Google Maps geolocation tracker API, real-time vehicle simulation suites, and high-fidelity server-side Gemini multilingual speech intelligence.
          </p>
        </div>
      </div>

      <div className="bg-indigo-600/5 p-5 rounded-2xl border border-indigo-500/25 space-y-2">
        <h4 className="text-[13px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={16} /> Smart Fuel Assistant Philosophy
        </h4>
        <p className="text-[15px] text-slate-300 leading-relaxed font-normal">
          Our system is designed to provide seamless cloud-scale diagnostics, fuel economy optimization metrics, and continuous real-time telemetry analytics. We empower vehicle owners to take full control of fuel expenses, identify cheap refueling avenues via GPS integration, and track maintenance requirements through our smart interactive interface.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Animated Splash Screen */}
      {showSplash && (
        <div 
          className={`fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-between p-8 text-center transition-all duration-700 select-none overflow-hidden ${
            fadeSplash ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
          }`}
        >
          {/* Decorative glowing ambient blurs */}
          <div className="absolute -left-20 -top-20 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] animate-pulse"></div>
          <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[100px] animate-pulse"></div>

          {/* Top subtle badge */}
          <div className="pt-6 relative z-10">
            <span className="text-[10px] uppercase font-black tracking-[0.25em] bg-indigo-500/15 text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-500/30 shadow-lg shadow-indigo-500/5">
              🚀 Smart Telematics Ecosystem
            </span>
          </div>

          {/* Center Brand and Logo Block */}
          <div className="flex flex-col items-center justify-center space-y-6 relative z-10 max-w-md">
            {/* Super Glow Animated App Logo */}
            <div className="relative group">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-600 opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative w-24 h-24 rounded-[1.75rem] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl overflow-hidden group-hover:border-indigo-500/50 transition-all duration-300">
                <svg className="w-16 h-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {/* Outer glowing dash ring */}
                  <circle cx="12" cy="12" r="9" stroke="url(#fuel-grad)" strokeWidth="1.2" strokeDasharray="3 3" className="animate-[spin_30s_linear_infinite]" />
                  {/* Neural nodes */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" stroke="url(#fuel-grad)" d="M12 3v2M12 19v2M3 12h2M19 12h2" className="opacity-60" />
                  {/* Fuel droplet outline & semi-transparent glow */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    stroke="url(#fuel-grad)"
                    fill="url(#droplet-grad)"
                    d="M12 2.5C12 2.5 6 9 6 13.5C6 16.8137 8.68629 19.5 12 19.5C15.3137 19.5 18 16.8137 18 13.5C18 9 12 2.5 12 2.5Z"
                  />
                  {/* White lightning core */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    stroke="#ffffff"
                    fill="#ffffff"
                    d="M11.5 9.5L9.5 13.5H12.5L11.5 17.5L14.5 12.5H11.5L11.5 9.5Z"
                    className="drop-shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-pulse"
                  />
                  <defs>
                    <linearGradient id="fuel-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="droplet-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(99, 102, 241, 0.35)" />
                      <stop offset="100%" stopColor="rgba(168, 85, 247, 0.05)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              {/* Sparkles around logo */}
              <Sparkles className="absolute -top-3 -right-3 text-yellow-400 w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
              <Flame className="absolute -bottom-2 -left-2 text-indigo-400 w-5 h-5 animate-pulse" />
            </div>

            {/* Application Title */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                AI Fuel Assistant
              </h1>
              <p className="text-xs text-indigo-300 font-bold tracking-widest uppercase">
                Multilingual Voice Companion & Diagnostic Suite
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed mt-2">
                Simulating live OBD-II diagnostics, wear trackers, cheap fuel station finder, and intelligent speech recognition systems.
              </p>
            </div>
          </div>

          {/* Bottom section: Loading Progress & Attribution */}
          <div className="w-full max-w-sm space-y-6 pb-6 relative z-10">
            {/* Custom Glowing Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-wider">
                <span>INITIALIZING ENGINE SYSTEM...</span>
                <span>{splashProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 p-[1px]">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-100 ease-out shadow-lg shadow-indigo-500/50"
                  style={{ width: `${splashProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Developer Attribution & Bypass Skip Trigger */}
            <div className="flex flex-col items-center gap-3">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                  System Architecture
                </p>
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mt-0.5">
                  ⚡ Powered by Rao Developers
                </p>
              </div>

              {/* Direct Skip Bypass Button */}
              <button
                onClick={() => {
                  setFadeSplash(true);
                  setTimeout(() => {
                    setShowSplash(false);
                  }, 700);
                }}
                className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800/80 text-[10px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Skip Launch Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Top App Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-900 px-4 sm:px-6 py-3.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          {/* Mobile-friendly launcher icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-base shadow-lg shadow-indigo-600/30 shrink-0">
            ⚡
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-100 tracking-wider uppercase flex items-center gap-1">
              AI Fuel Assistant
            </h1>
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">
              BY RAO DEVELOPERS
            </p>
          </div>
        </div>

        {/* Action Tray: Connection Badge & Interactive Notification Bell */}
        <div className="flex items-center gap-3">
          {/* Connection Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-850">
            <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`}></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {isOffline ? "Offline Mode" : "Online Mode"}
            </span>
          </div>

          {/* Light / Dark Theme Switch */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white transition cursor-pointer active:scale-95 flex items-center justify-center"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={16} className="text-amber-400 animate-pulse" /> : <Moon size={16} className="text-blue-500 animate-pulse" />}
          </button>

          {/* Interactive Notification Bell */}
          <button
            onClick={() => setShowNotificationDrawer(true)}
            className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white transition cursor-pointer active:scale-95"
            title="View Active Alerts"
          >
            <ShieldAlert size={16} className={activeNotifications.length > 0 ? "text-amber-400 animate-bounce" : ""} />
            {activeNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 animate-pulse">
                {activeNotifications.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Slide-out Notification Center Drawer */}
      <AnimatePresence>
        {showNotificationDrawer && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationDrawer(false)}
              className="absolute inset-0 bg-black"
            />
            
            {/* Drawer sheet content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl z-10"
            >
              {/* Header block */}
              <div className="p-4 sm:p-5 border-b border-slate-850 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-indigo-400 w-5 h-5" />
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                      Notification Center
                    </h3>
                    <p className="text-[9px] text-slate-400 uppercase font-semibold">Active alerts, wear states & reminders</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationDrawer(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Close [ بند کریں ]
                </button>
              </div>

              {/* Body block */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* On-demand Simulation utility for QA review and verification */}
                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-2">
                  <span className="text-[8px] uppercase font-bold tracking-widest bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/25">
                    🧪 Quality Assurance Simulation Panel
                  </span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Test the offline inactivity reminder instantly on-demand without waiting for 3 days:
                  </p>
                  <button
                    onClick={() => setSimulatedInactivity(!simulatedInactivity)}
                    className={`w-full py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      simulatedInactivity
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-slate-950 hover:bg-slate-850 text-slate-300 border-slate-850"
                    }`}
                  >
                    {simulatedInactivity ? "⏹ Reset Simulation" : "⚡ Simulate 3 Days Inactivity"}
                  </button>
                </div>

                {activeNotifications.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 space-y-2">
                    <span className="text-2xl">🎉</span>
                    <p className="text-xs font-bold text-slate-300">All Systems Nominal!</p>
                    <p className="text-[10px] text-slate-500 leading-normal max-w-xs">
                      Your vehicle is fully refueled, maintenance levels are clean, and there are no active alerts. Drive safe!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3.5 rounded-2xl border flex flex-col gap-2.5 transition-all shadow-md ${
                          notif.severity === "high"
                            ? "bg-red-500/5 border-red-500/15 text-red-200"
                            : notif.severity === "medium"
                            ? "bg-amber-500/5 border-amber-500/15 text-amber-200"
                            : "bg-indigo-500/5 border-indigo-500/15 text-slate-200"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wide">
                              {notif.title}
                            </span>
                            <span
                              className={`text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded ${
                                notif.severity === "high"
                                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                                  : notif.severity === "medium"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              }`}
                            >
                              {notif.severity}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-300 leading-normal">
                            {notif.desc}
                          </p>
                          
                          <p className="text-xs text-indigo-300 font-medium leading-relaxed border-t border-slate-800/40 pt-1.5 font-sans">
                            {notif.descUr}
                          </p>
                        </div>

                        {notif.actionLabel && (
                          <button
                            onClick={() => {
                              setShowNotificationDrawer(false);
                              navigateToFeature(notif.actionTab!, notif.actionSubTab);
                            }}
                            className={`py-1.5 rounded-xl text-xs font-bold transition cursor-pointer self-start px-4 flex items-center gap-1.5 ${
                              notif.severity === "high"
                                ? "bg-red-600 hover:bg-red-500 text-white"
                                : notif.severity === "medium"
                                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                            }`}
                          >
                            <span>{notif.actionLabel}</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side Navigation Sidebar - Desktop Only */}
        <aside className="hidden lg:flex w-full lg:w-72 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-850 flex-col justify-between shrink-0 p-5 lg:sticky lg:top-0 lg:h-screen z-40">
          <div className="space-y-6">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/30 shrink-0">
                ⚡
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 tracking-wider uppercase">
                  AI FUEL HUB
                </h1>
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest">v2.5.0 • Live GPS</p>
              </div>
            </div>

            {/* Streamlined Desktop Navigation Container */}
            <div className="select-none py-1 w-full">
              {/* Navigation links (Clean Vertical Stack for Desktop) */}
              <nav className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "dashboard"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <Car size={18} />
                  <span>Dashboard & Logs</span>
                </button>

                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "analytics"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <BarChart3 size={18} />
                  <span>Fuel Analytics</span>
                </button>

                <button
                  onClick={() => setActiveTab("assistant")}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap relative ${
                    activeTab === "assistant"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <MessageSquare size={18} />
                  <span>AI Fuel Expert</span>
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
                </button>

                <button
                  onClick={() => setActiveTab("map")}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "map"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <MapPin size={18} />
                  <span>Cheap Fuel Finder</span>
                </button>

                <button
                  onClick={() => setActiveTab("tools")}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "tools"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <Flame size={18} />
                  <span>Smart Tools Suite</span>
                </button>

                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === "about"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <HelpCircle size={18} />
                  <span>About Us</span>
                </button>
              </nav>
            </div>

            {/* Offline Optimization Indicator & Sidebar Connection Status */}
            <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 shadow-xl shadow-black/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] uppercase font-semibold tracking-wider text-slate-400">
                  Connection Status
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isOffline ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`}></span>
                  <span>{isOffline ? "Offline" : "Online"}</span>
                </span>
              </div>

              {/* Offline Warning Banner */}
              <div className="text-[13px] leading-relaxed text-slate-300">
                {isOffline ? (
                  <p className="font-semibold text-amber-400/90 leading-snug">
                    ⚠️ Offline Optimization Mode Active! Refuels are recorded locally in secure database cache.
                  </p>
                ) : (
                  <p className="text-slate-400 leading-snug">
                    Connected to cloud networks. Voice translation & API maps fully operational.
                  </p>
                )}
              </div>

              {/* Force Simulate Offline Toggle Switch */}
              <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-white/[0.08] select-none">
                <span className="text-xs font-semibold text-slate-400">Simulate Offline Mode</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={simulateOffline}
                    onChange={(e) => setSimulateOffline(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${simulateOffline ? "bg-indigo-600" : "bg-slate-800"}`}>
                    <div className={`w-5 h-5 bg-slate-100 rounded-full transition-transform duration-200 transform ${simulateOffline ? "translate-x-5" : "translate-x-1"} mt-0.5 shadow-md`}></div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Sidebar Footer branding */}
          <div className="hidden lg:block pt-5 border-t border-slate-850 text-[11px] text-slate-500 font-medium">
            <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Rao Developers</p>
            <p>Version v2.5.0 Release</p>
            <p className="mt-2 text-[10px] text-slate-600">© {new Date().getFullYear()} All rights reserved.</p>
          </div>
        </aside>

        {/* Right Side Content Frame */}
        <main className="flex-1 flex flex-col justify-between p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 w-full max-w-6xl mx-auto lg:h-screen lg:overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-6"
            >
            
            {activeTab === "dashboard" && (
              <>
                {/* Introduction Card with Bento Style */}
                <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 text-slate-100 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.35)] space-y-4">
                  <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
                  <div className="max-w-xl space-y-3 relative z-10">
                    <span className="text-[13px] uppercase font-semibold tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
                      Bento Fuel Optimization Hub
                    </span>
                    <h2 className="text-[20px] font-bold tracking-tight text-white">
                      Log, Optimize, and Track Your Drive
                    </h2>
                    <p className="text-[15px] text-slate-300 leading-relaxed font-normal">
                      Register your vehicle profiles, log daily petrol refills, and query our smart AI voice assistant in Roman Urdu, Urdu, or English to optimize vehicle performance and minimize fuel expenses!
                    </p>
                  </div>

                  {/* Global Currency Setting */}
                  <div className="pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
                    <div className="space-y-0.5">
                      <span className="text-[13px] text-indigo-400 font-semibold uppercase tracking-wider block">Global Currency Setting</span>
                      <p className="text-xs text-slate-400">Set fuel refuels, budgets, and cost metrics in your currency.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={["PKR", "USD", "INR", "EUR", "AED", "SAR", "GBP"].includes(currency) ? currency : "custom"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== "custom") {
                            setCurrency(val);
                          } else {
                            const customVal = prompt("Enter your custom currency symbol or code (e.g. CAD, AUD, QR, ৳):");
                            if (customVal) {
                              setCurrency(customVal.trim().toUpperCase());
                            }
                          }
                        }}
                        className="bg-slate-950 border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                      >
                        <option value="PKR">PKR (₨)</option>
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="AED">AED (د.إ)</option>
                        <option value="SAR">SAR (ر.س)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="custom">Custom...</option>
                      </select>

                      {!["PKR", "USD", "INR", "EUR", "AED", "SAR", "GBP"].includes(currency) && (
                        <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-black px-2.5 py-1.5 rounded-xl font-mono">
                          {currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>



                {/* Advanced Data Control & Offline Center */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Offline Mode Logic Card */}
                  <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Wifi size={80} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                        {isOffline ? <WifiOff size={18} /> : <Wifi size={18} />}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                          Offline-First Smart Sync <span>(آف لائن موڈ)</span>
                        </h3>
                        <p className="text-[10px] text-slate-400">Offline-first local database tracking suite</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[15px] text-slate-300 leading-relaxed font-normal">
                        Driving through tunnels or remote roads? Our state-of-the-art offline mode caches your metrics, OBD-II telemetry, and fuel logs securely in local device storage.
                      </p>

                      <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-white/[0.06] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">Sync Status:</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isOffline ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"}`}>
                            {isOffline ? "Saved Locally (لوکل محفوظ)" : "Cloud Ready (آن لائن)"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 italic leading-snug">
                          {isOffline 
                            ? "All modifications are queued locally and remain fully preserved even after browser reloads." 
                            : "Standard online mode. Speech synthesizer and location maps are fully armed."}
                        </p>
                      </div>

                      {/* Force toggle */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-slate-400">Simulate Offline Mode (آف لائن موڈ)</span>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={simulateOffline}
                            onChange={(e) => setSimulateOffline(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className={`w-9 h-5 rounded-full transition-colors duration-300 peer-focus:outline-none ${simulateOffline ? "bg-amber-500" : "bg-slate-800"}`}>
                            <div className={`w-4 h-4 bg-slate-950 rounded-full transition-transform duration-200 transform p-[2px] ${simulateOffline ? "translate-x-4.5" : "translate-x-0.5"} mt-0.5`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Data Control Center Card */}
                  <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Database size={80} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                        <Database size={18} />
                      </div>
                      <div>
                        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                          Data Control Center <span>(ڈیٹا کنٹرول سینٹر)</span>
                        </h3>
                        <p className="text-[10px] text-slate-400">Manage, export, and import your telemetry backups</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[15px] text-slate-300 leading-relaxed font-normal">
                        Total data ownership! Export all registered vehicle profiles and fuel refilling transactions to a portable spreadsheet CSV or JSON backup database.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={exportLogsToCSV}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-950 hover:bg-slate-800 border border-white/[0.08] rounded-xl text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <Download size={13} className="text-indigo-400" />
                          <span>Export Logs (CSV)</span>
                        </button>
                        <button
                          onClick={exportBackupJSON}
                          className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                        >
                          <Download size={13} />
                          <span>Save Backup (JSON)</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-white/[0.08]">
                        <label className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition shadow-lg shadow-indigo-600/10">
                          <Upload size={13} />
                          <span>Restore Database Backup (JSON)</span>
                          <input
                            type="file"
                            accept="application/json"
                            onChange={importBackupJSON}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Management Profile */}
                <VehicleManager
                  vehicles={vehicles}
                  activeVehicleId={activeVehicleId}
                  onAddVehicle={handleAddVehicle}
                  onSelectVehicle={handleSelectVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                />

                {/* Fuel Refilling Entry logs */}
                <FuelLogsManager
                  activeVehicle={activeVehicle}
                  logs={fuelLogs}
                  onAddLog={handleAddLog}
                  onDeleteLog={handleDeleteLog}
                  currency={currency}
                />
              </>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Performance Analytics</h2>
                  <p className="text-xs text-slate-400">Deep mathematical insights into your driving economy & price changes</p>
                </div>
                <FuelAnalytics activeVehicle={activeVehicle} logs={fuelLogs} currency={currency} />
              </div>
            )}

            {activeTab === "assistant" && (
              <div className="space-y-4 max-w-4xl mx-auto">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Multilingual AI Fuel Expert</h2>
                  <p className="text-xs text-slate-400">Ask questions using voice or text in English, Urdu, or Roman Urdu</p>
                </div>
                <div className="min-h-[580px]">
                  <AIFuelAssistant
                    activeVehicle={activeVehicle}
                    fuelLogs={fuelLogs}
                    currentLanguage={currentLanguage}
                    onLanguageChange={setCurrentLanguage}
                    currency={currency}
                  />
                </div>
              </div>
            )}

            {activeTab === "map" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Cheap Fuel Finder</h2>
                  <p className="text-xs text-slate-400">Compare real-time rates of nearby stations using interactive maps</p>
                </div>
                <CheapFuelFinder activeVehicle={activeVehicle} currency={currency} />
              </div>
            )}

            {activeTab === "tools" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Smart Tools Suite</h2>
                  <p className="text-xs text-slate-400">Diagnostic systems, Anti-Theft configurations, and budget calculators</p>
                </div>
                <SmartFeatures
                  activeVehicle={activeVehicle}
                  logs={fuelLogs}
                  currentLanguage={currentLanguage}
                  currency={currency}
                  activeSubTab={activeSubTab}
                  onSubTabChange={setActiveSubTab}
                />
              </div>
            )}

            {activeTab === "integration" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">Android Testing & SDK Guide</h2>
                  <p className="text-xs text-slate-400">Technical documentation on integrating OBD telemetry endpoints inside Android apps</p>
                </div>
                <AndroidIntegrationGuide />
              </div>
            )}

            {activeTab === "about" && (
              <AboutUsView />
            )}

          </motion.div>
         </AnimatePresence>

          {/* Universal Footer with Rao Developers Credit & Powered by Tag */}
          <footer className="mt-12 pt-6 border-t border-slate-900 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-500 font-medium">
            <p className="text-xs font-bold text-indigo-400 animate-pulse uppercase tracking-widest bg-indigo-500/5 px-4 py-1.5 rounded-full border border-indigo-500/10">
              ⚡ Powered by Rao Developers
            </p>
            <p>© {new Date().getFullYear()} AI Fuel Assistant.</p>
          </footer>
        </main>

        {/* Sticky Bottom Navigation Bar for Mobile & Tablets (MD3 Segmented Style) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-white/[0.08] px-3 py-2 flex items-center justify-around shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="flex flex-col items-center gap-1.5 py-1 flex-1 text-center cursor-pointer select-none"
          >
            <div className={`px-4 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/50"
                : "border border-white/[0.05] text-slate-400 hover:text-slate-300 bg-slate-900/30"
            }`}>
              <Car size={16} />
            </div>
            <span className={`text-[10px] font-bold tracking-wide transition-colors ${
              activeTab === "dashboard" ? "text-indigo-400" : "text-slate-500"
            }`}>Logs</span>
          </button>
          
          <button
            onClick={() => setActiveTab("analytics")}
            className="flex flex-col items-center gap-1.5 py-1 flex-1 text-center cursor-pointer select-none"
          >
            <div className={`px-4 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === "analytics"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/50"
                : "border border-white/[0.05] text-slate-400 hover:text-slate-300 bg-slate-900/30"
            }`}>
              <BarChart3 size={16} />
            </div>
            <span className={`text-[10px] font-bold tracking-wide transition-colors ${
              activeTab === "analytics" ? "text-indigo-400" : "text-slate-500"
            }`}>Stats</span>
          </button>
          
          <button
            onClick={() => setActiveTab("assistant")}
            className="flex flex-col items-center gap-1.5 py-1 flex-1 text-center cursor-pointer select-none relative"
          >
            <div className={`px-4 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === "assistant"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/50"
                : "border border-white/[0.05] text-slate-400 hover:text-slate-300 bg-slate-900/30"
            }`}>
              <MessageSquare size={16} />
            </div>
            <span className={`text-[10px] font-bold tracking-wide transition-colors ${
              activeTab === "assistant" ? "text-indigo-400" : "text-slate-500"
            }`}>AI CoPilot</span>
            <span className="absolute right-4 top-1 w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></span>
          </button>
          
          <button
            onClick={() => setActiveTab("tools")}
            className="flex flex-col items-center gap-1.5 py-1 flex-1 text-center cursor-pointer select-none"
          >
            <div className={`px-4 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === "tools"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/50"
                : "border border-white/[0.05] text-slate-400 hover:text-slate-300 bg-slate-900/30"
            }`}>
              <Flame size={16} />
            </div>
            <span className={`text-[10px] font-bold tracking-wide transition-colors ${
              activeTab === "tools" ? "text-indigo-400" : "text-slate-500"
            }`}>Suite</span>
          </button>

          <button
            onClick={() => setActiveTab("map")}
            className="flex flex-col items-center gap-1.5 py-1 flex-1 text-center cursor-pointer select-none"
          >
            <div className={`px-4 py-1.5 rounded-full transition-all duration-200 flex items-center justify-center ${
              activeTab === "map"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/50"
                : "border border-white/[0.05] text-slate-400 hover:text-slate-300 bg-slate-900/30"
            }`}>
              <MapPin size={16} />
            </div>
            <span className={`text-[10px] font-bold tracking-wide transition-colors ${
              activeTab === "map" ? "text-indigo-400" : "text-slate-500"
            }`}>GPS Finder</span>
          </button>
        </div>
      </div>
    </div>
  );
}
