import React, { useState, useEffect, useRef } from "react";
import { Vehicle, FuelEntry, SupportedLanguage } from "./types";
import VehicleManager, { getVehicleAvatarInfo } from "./components/VehicleManager";
import FuelLogsManager from "./components/FuelLogsManager";
import FuelAnalytics from "./components/FuelAnalytics";
import AIFuelAssistant from "./components/AIFuelAssistant";
import AndroidIntegrationGuide from "./components/AndroidIntegrationGuide";
import { SmartFeatures } from "./components/SmartFeatures";
import CheapFuelFinder from "./components/CheapFuelFinder";
import { Car, Settings, BarChart3, MessageSquare, Flame, HelpCircle, FileText, Trash2, Smartphone, MapPin, Wrench, ShieldAlert, Bluetooth, Calculator, AlertTriangle, ShieldCheck, PlayCircle, Sparkles, Download, Upload, Wifi, WifiOff, Database, ChevronLeft, ChevronRight, Sun, Moon, Sunset, MoreVertical, Menu, Share2, Info, Shield, Check, Copy, ExternalLink, Scale, X, TrendingUp, TrendingDown, Lightbulb, Award, Activity } from "lucide-react";
import { triggerHaptic } from "./lib/haptics";
import { LegalModal } from "./components/LegalModal";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, AreaChart, Area } from "recharts";

// Simple approximate sunrise/sunset calculation (returns decimal hours)
function getSunriseSunset(latitude: number, longitude: number, date: Date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  
  const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (284 + day));
  const decRad = (declination * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;
  
  const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
  
  let hourAngle = 6; 
  if (cosHourAngle >= -1 && cosHourAngle <= 1) {
    hourAngle = (Math.acos(cosHourAngle) * 180) / Math.PI / 15;
  }
  
  const timezoneOffset = -date.getTimezoneOffset() / 60;
  const solarNoon = 12 - (longitude / 15) + timezoneOffset;
  
  const sunrise = solarNoon - hourAngle;
  const sunset = solarNoon + hourAngle;
  
  return { sunrise, sunset };
}

export default function App() {
  // Theme Toggle State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem("assistant_theme") as 'dark' | 'light') || "dark";
  });

  const [autoThemeMode, setAutoThemeMode] = useState<boolean>(() => {
    return localStorage.getItem("assistant_auto_theme") === "true";
  });

  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [showLocationDisclosure, setShowLocationDisclosure] = useState<boolean>(false);

  const handleAcceptLocationDisclosure = () => {
    localStorage.setItem("location_disclosure_accepted", "true");
    setShowLocationDisclosure(false);
    setAutoThemeMode(true);
    localStorage.setItem("assistant_auto_theme", "true");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          localStorage.setItem("user_lat", latitude.toString());
          localStorage.setItem("user_lng", longitude.toString());
        },
        (err) => console.log("GPS prompt declined for theme sync:", err)
      );
    }
  };

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(() => {
    const lat = localStorage.getItem("user_lat");
    const lng = localStorage.getItem("user_lng");
    if (lat && lng) {
      return { lat: Number(lat), lng: Number(lng) };
    }
    return null;
  });

  // Track if user was prompted for geolocation once to prevent endless requests
  const geolocationRequested = useRef(false);

  useEffect(() => {
    localStorage.setItem("assistant_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  // Handle auto theme detection based on local time and sun position
  useEffect(() => {
    if (!autoThemeMode) return;

    const runAutoThemeCheck = () => {
      const now = new Date();
      const lat = userLocation?.lat ?? 30.3753; // Pakistan/South Asia default
      const lng = userLocation?.lng ?? 69.3451;

      const { sunrise, sunset } = getSunriseSunset(lat, lng, now);
      const currentDecimalHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

      // Wrap-around checks in solar calculation decimal boundaries
      let isDay = currentDecimalHour >= sunrise && currentDecimalHour < sunset;
      
      // If polar values or edge cases are out of range, default to standard hour checks
      if (isNaN(sunrise) || isNaN(sunset)) {
        isDay = now.getHours() >= 6 && now.getHours() < 18;
      }

      setTheme(isDay ? "light" : "dark");
    };

    runAutoThemeCheck();
    const interval = setInterval(runAutoThemeCheck, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [autoThemeMode, userLocation]);

  // Request geolocation once if auto mode is enabled and coords are missing
  useEffect(() => {
    if (autoThemeMode && !userLocation && !geolocationRequested.current) {
      const isAccepted = localStorage.getItem("location_disclosure_accepted") === "true";
      if (!isAccepted) {
        console.log("Auto-Theme mode requires location access. GPS request skipped until user accepts disclosure.");
        return;
      }
      geolocationRequested.current = true;
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            localStorage.setItem("user_lat", latitude.toString());
            localStorage.setItem("user_lng", longitude.toString());
          },
          (err) => {
            console.log("GPS prompt declined for theme sync, using default system timezone baseline:", err);
          }
        );
      }
    }
  }, [autoThemeMode, userLocation]);

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

  // Daily Fuel Economy Goal State
  const [fuelGoal, setFuelGoal] = useState<number>(() => {
    const saved = localStorage.getItem("assistant_fuel_goal");
    return saved ? parseFloat(saved) : 15.0;
  });
  const [showChartDemo, setShowChartDemo] = useState(false);

  // Top-Right Dropdown Menu & Modal states
  const [showMenu, setShowMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDPAModal, setShowDPAModal] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [deletionConfirmed, setDeletionConfirmed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("assistant_fuel_goal", fuelGoal.toString());
  }, [fuelGoal]);

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
    const headers = "Date,Vehicle,Odometer,Fuel Filled (L),Price Per Liter,Total Cost,Notes,Efficiency\n";
    const rows = fuelLogs.map(log => {
      const v = vehicles.find(veh => veh.id === log.vehicleId);
      const vehicleName = v ? v.name : log.vehicleId;
      return `"${log.date}","${vehicleName}",${log.odometer},${log.fuelFilled},${log.pricePerUnit},${log.totalCost},"${(log.notes || '').replace(/"/g, '""')}",${log.efficiency || ''}`;
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

    if (autoThemeMode) {
      const lat = userLocation?.lat ?? 30.3753;
      const lng = userLocation?.lng ?? 69.3451;
      const { sunrise, sunset } = getSunriseSunset(lat, lng);
      
      const formatTime = (decimalHour: number) => {
        const hrs = Math.floor(decimalHour);
        const mins = Math.round((decimalHour - hrs) * 60);
        const ampm = hrs >= 12 ? "PM" : "AM";
        const displayHrs = hrs % 12 || 12;
        return `${displayHrs}:${mins.toString().padStart(2, "0")} ${ampm}`;
      };

      list.push({
        id: "auto-theme-active",
        type: "system",
        title: "Sunrise/Sunset Solar Sync",
        titleUr: "طلوع و غروب آفتاب ہم آہنگی",
        desc: `Theme dynamically matches local solar times. Today's Sunrise: ${formatTime(sunrise)} | Sunset: ${formatTime(sunset)} (${userLocation ? "GPS coordinates locked" : "System timezone fallback"}).`,
        descUr: `تھیم خود بخود سورج کے نکلنے اور غروب ہونے کے مطابق چلے گی۔ طلوع: ${formatTime(sunrise)} | غروب: ${formatTime(sunset)}۔`,
        severity: "low"
      });
    }

    return list;
  }, [isInactive, simulatedInactivity, fuelLogs, currentOdometer, oilDist, oilW, plugsDist, plugsW, brakesDist, brakesW, tyresDist, tyresW, autoThemeMode, userLocation]);

  // Handle vehicle state alterations
  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles((prev) => [...prev, newVehicle]);
    if (!activeVehicleId) {
      setActiveVehicleId(newVehicle.id);
    }
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles((prev) => prev.map((v) => v.id === updatedVehicle.id ? updatedVehicle : v));
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

  // Dynamic average efficiency calculation for the goal tracking
  const activeLogsForGoal = fuelLogs.filter((log) => log.vehicleId === activeVehicleId);
  const goalLogsWithEfficiency = activeLogsForGoal.filter((log) => log.efficiency !== undefined && log.efficiency > 0);
  const avgEfficiencyForGoal =
    goalLogsWithEfficiency.length > 0
      ? parseFloat((goalLogsWithEfficiency.reduce((sum, log) => sum + (log.efficiency || 0), 0) / goalLogsWithEfficiency.length).toFixed(2))
      : null;

  // Chronologically sort logs with efficiency for trend mapping
  const chronologicallySortedLogs = [...goalLogsWithEfficiency].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Generate chart data mapping trends against the target goal
  const goalComparisonChartData = chronologicallySortedLogs.map((log, idx) => {
    const d = new Date(log.date);
    const dateLabel = isNaN(d.getTime())
      ? `Log #${idx + 1}`
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    
    return {
      name: dateLabel,
      efficiency: parseFloat((log.efficiency || 0).toFixed(1)),
      targetGoal: fuelGoal,
      difference: parseFloat(((log.efficiency || 0) - fuelGoal).toFixed(1)),
      notes: log.notes || "",
    };
  });

  // Calculate dynamic driver insights based on logs and notes
  const getDrivingBehaviorInsights = () => {
    if (goalLogsWithEfficiency.length === 0) return null;

    const efficiencies = goalLogsWithEfficiency.map(l => l.efficiency || 0);
    const maxEff = Math.max(...efficiencies);
    const minEff = Math.min(...efficiencies);
    
    const bestLog = goalLogsWithEfficiency.find(l => l.efficiency === maxEff);
    const worstLog = goalLogsWithEfficiency.find(l => l.efficiency === minEff);

    const aboveGoalCount = goalLogsWithEfficiency.filter(l => (l.efficiency || 0) >= fuelGoal).length;
    const percentAboveGoal = Math.round((aboveGoalCount / goalLogsWithEfficiency.length) * 100);

    // Scan notes for keywords to identify behavioral impact
    const notesInsights: string[] = [];
    goalLogsWithEfficiency.forEach(log => {
      const note = (log.notes || "").toLowerCase();
      if (note.includes("highway") || note.includes("motorway") || note.includes("cruise") || note.includes("long") || note.includes("speed")) {
        if (!notesInsights.some(i => i.startsWith("🛣️"))) {
          notesInsights.push("🛣️ Highway Cruise: Steady speed cruising and minimal gear-shifting recorded. Highway miles typically improve engine efficiency by 20% to 30%!");
        }
      }
      if (note.includes("city") || note.includes("traffic") || note.includes("rush") || note.includes("jam") || note.includes("signal")) {
        if (!notesInsights.some(i => i.startsWith("🚦"))) {
          notesInsights.push("🚦 City Congestion: Stop-and-go driving patterns and heavy idling drain fuel reserves. Try smooth throttle application and coasting up to stop lights.");
        }
      }
      if (note.includes("ac") || note.includes("a/c") || note.includes("aircon") || note.includes("cool")) {
        if (!notesInsights.some(i => i.startsWith("❄️"))) {
          notesInsights.push("❄️ A/C Overhead: Climate control usage adds extra mechanical load on the engine. If driving at low speeds, try drawing ventilation from side vents instead.");
        }
      }
      if (note.includes("tyre") || note.includes("tire") || note.includes("pressure") || note.includes("air")) {
        if (!notesInsights.some(i => i.startsWith("🛞"))) {
          notesInsights.push("🛞 Proper Inflation: Checked or optimal tyre pressures keep rolling resistance low, improving efficiency by up to 3%.");
        }
      }
      if (note.includes("service") || note.includes("tuning") || note.includes("oil") || note.includes("filter")) {
        if (!notesInsights.some(i => i.startsWith("🔧"))) {
          notesInsights.push("🔧 Scheduled Tuning: Clean air filters and fresh motor oil ensure a perfect stoichiometric air-fuel mixture, keeping combustion highly efficient.");
        }
      }
    });

    return {
      bestLog,
      worstLog,
      percentAboveGoal,
      notesInsights
    };
  };

  const driverInsights = getDrivingBehaviorInsights();

  // Mock comparison trend data representing typical driving behaviors for preview
  const mockGoalComparisonData = [
    { name: "Mon", efficiency: parseFloat((fuelGoal * 0.82).toFixed(1)), targetGoal: fuelGoal, difference: parseFloat((fuelGoal * -0.18).toFixed(1)), notes: "Heavy city traffic, rapid acceleration" },
    { name: "Tue", efficiency: parseFloat((fuelGoal * 1.08).toFixed(1)), targetGoal: fuelGoal, difference: parseFloat((fuelGoal * 0.08).toFixed(1)), notes: "Highway cruising, stable speed" },
    { name: "Wed", efficiency: parseFloat((fuelGoal * 0.94).toFixed(1)), targetGoal: fuelGoal, difference: parseFloat((fuelGoal * -0.06).toFixed(1)), notes: "Mixed city commute, climate control on" },
    { name: "Thu", efficiency: parseFloat((fuelGoal * 0.88).toFixed(1)), targetGoal: fuelGoal, difference: parseFloat((fuelGoal * -0.12).toFixed(1)), notes: "Sudden deceleration, traffic signals" },
    { name: "Fri", efficiency: parseFloat((fuelGoal * 1.15).toFixed(1)), targetGoal: fuelGoal, difference: parseFloat((fuelGoal * 0.15).toFixed(1)), notes: "Gentle Eco driving, steady throttle" },
  ];

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
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Active Vehicle Mini Badge */}
          {activeVehicle && (
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 p-1 pr-2.5 rounded-full select-none">
              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getVehicleAvatarInfo(activeVehicle).gradient} text-white flex items-center justify-center text-[10px] shadow-sm shrink-0`}>
                {getVehicleAvatarInfo(activeVehicle).emoji}
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider truncate max-w-[80px] sm:max-w-[120px]">{activeVehicle.name}</span>
            </div>
          )}

          {/* Connection Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-850">
            <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? "bg-amber-400" : "bg-emerald-500 animate-pulse"}`}></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {isOffline ? "Offline Mode" : "Online Mode"}
            </span>
          </div>

          {/* Sunrise / Sunset Sync Toggle */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              const nextVal = !autoThemeMode;
              if (nextVal) {
                const isAccepted = localStorage.getItem("location_disclosure_accepted") === "true";
                if (!isAccepted) {
                  setShowLocationDisclosure(true);
                  return;
                }
                setAutoThemeMode(true);
                localStorage.setItem("assistant_auto_theme", "true");
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      const { latitude, longitude } = pos.coords;
                      setUserLocation({ lat: latitude, lng: longitude });
                      localStorage.setItem("user_lat", latitude.toString());
                      localStorage.setItem("user_lng", longitude.toString());
                    },
                    (err) => console.log("GPS prompt declined for theme sync:", err)
                  );
                }
              } else {
                setAutoThemeMode(false);
                localStorage.setItem("assistant_auto_theme", "false");
              }
            }}
            className={`p-2 rounded-xl border transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 ${
              autoThemeMode 
                ? "bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]" 
                : "bg-slate-900 border-slate-850 text-slate-400 hover:text-white"
            }`}
            title={autoThemeMode ? "Disable Sunrise/Sunset Auto Theme Sync" : "Enable Sunrise/Sunset Auto Theme Sync"}
          >
            <Sunset size={16} className={autoThemeMode ? "animate-pulse text-blue-400" : ""} />
            <span className="hidden md:inline text-[9px] font-bold uppercase tracking-wider">
              {autoThemeMode ? "Solar Auto: On" : "Solar Auto"}
            </span>
          </button>

          {/* Light / Dark Theme Switch */}
          <button
            onClick={() => {
              triggerHaptic('medium');
              setTheme(theme === "dark" ? "light" : "dark");
              if (autoThemeMode) {
                setAutoThemeMode(false);
                localStorage.setItem("assistant_auto_theme", "false");
              }
            }}
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

          {/* Menu Dropdown Button & Options */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-850 text-slate-300 hover:text-white transition cursor-pointer active:scale-95 flex items-center justify-center"
              title="Menu Options"
              id="top-right-menu-btn"
            >
              <MoreVertical size={16} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-950 border border-slate-800 shadow-xl overflow-hidden z-[110]"
                  id="top-right-menu-dropdown"
                >
                  <div className="p-2.5 border-b border-slate-900 bg-slate-900/40">
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400">AI Fuel Assistant</p>
                    <p className="text-[8px] text-slate-500 font-mono mt-0.5">Version 2.4.0 (Aesthetic Sync)</p>
                  </div>
                  <div className="p-1 flex flex-col gap-0.5">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowAboutModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-lg transition cursor-pointer"
                      id="menu-item-about"
                    >
                      <Info size={14} className="text-blue-400" />
                      <span>About Us</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowShareModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-lg transition cursor-pointer"
                      id="menu-item-share"
                    >
                      <Share2 size={14} className="text-green-400" />
                      <span>Share App</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowTermsModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-lg transition cursor-pointer"
                      id="menu-item-terms"
                    >
                      <Scale size={14} className="text-amber-400" />
                      <span>Terms & Conditions</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowPrivacyModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-lg transition cursor-pointer"
                      id="menu-item-privacy"
                    >
                      <Shield size={14} className="text-purple-400" />
                      <span>Privacy Policy</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDPAModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-lg transition cursor-pointer"
                      id="menu-item-dpa"
                    >
                      <FileText size={14} className="text-sky-400" />
                      <span>Data Processing (DPA)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeletionModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:text-white hover:bg-slate-900/80 rounded-lg transition cursor-pointer"
                      id="menu-item-delete"
                    >
                      <Trash2 size={14} className="text-red-400" />
                      <span>Request Data Deletion</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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

            {/* Active Vehicle Sidebar Profile Card */}
            {activeVehicle && (
              <div className="bg-slate-950/80 border border-white/[0.06] rounded-2xl p-3 flex items-center gap-3 shadow-inner transition-all hover:border-white/[0.1]">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getVehicleAvatarInfo(activeVehicle).gradient} text-white flex items-center justify-center text-lg shadow shrink-0`}>
                  {getVehicleAvatarInfo(activeVehicle).emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-extrabold text-slate-200 truncate block uppercase tracking-wider">{activeVehicle.name}</span>
                  <span className="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block"></span>
                    Active Profile
                  </span>
                </div>
              </div>
            )}

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
                {/* 🚗 Personalized Active Vehicle Profile Summary Banner */}
                {activeVehicle && (
                  <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden shadow-lg shadow-black/20">
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-indigo-500/5 blur-2xl"></div>
                    <div className="flex items-center gap-3.5 relative z-10">
                      {/* Avatar with customized background gradient and emoji icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getVehicleAvatarInfo(activeVehicle).gradient} text-white flex items-center justify-center text-2xl shadow-lg shadow-black/20 shrink-0`}>
                        {getVehicleAvatarInfo(activeVehicle).emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-black text-white uppercase tracking-wider">{activeVehicle.name}</h2>
                          <span className="inline-flex items-center text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Active Fleet Profile
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold">
                          <span className="bg-slate-950 px-2 py-0.5 rounded-lg border border-white/[0.05] flex items-center gap-1 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                            {activeVehicle.fuelType}
                          </span>
                          <span className="bg-slate-950 px-2 py-0.5 rounded-lg border border-white/[0.05] flex items-center gap-1 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            {activeVehicle.engineSize}
                          </span>
                          <span className="bg-slate-950 px-2 py-0.5 rounded-lg border border-white/[0.05] flex items-center gap-1 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            {activeVehicle.odometerUnit} Unit
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Compact real-time analytics */}
                    <div className="flex gap-4 items-center shrink-0 border-t sm:border-t-0 sm:border-l border-white/[0.08] pt-3 sm:pt-0 sm:pl-5 relative z-10">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Avg Efficiency</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-extrabold font-mono text-white">{avgEfficiencyForGoal !== null ? avgEfficiencyForGoal : "N/A"}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">{activeVehicle.odometerUnit === "Km" ? "Km/L" : "MPG"}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Odo Logs</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-extrabold font-mono text-white">{activeLogsForGoal.length}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">entries</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visual Progress: Daily Fuel Economy Goal */}
                <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 text-slate-100 relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.35)] space-y-5">
                  <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl"></div>
                  
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                        <Flame size={20} className="text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                          Daily Fuel Economy Goal
                        </h3>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Track and optimize your vehicle's fuel efficiency against your target</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Compact Global Currency Setting */}
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-white/[0.08] p-1 rounded-xl shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1.5">Currency:</span>
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
                          className="bg-slate-900 border border-white/[0.05] rounded-lg px-2 py-1 text-[11px] text-slate-200 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
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
                          <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-black px-2 py-1 rounded-lg font-mono">
                            {currency}
                          </span>
                        )}
                      </div>

                      {/* Target Setting Input Controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">Set Goal:</span>
                        <div className="flex items-center bg-slate-950 border border-white/[0.08] rounded-xl overflow-hidden p-0.5">
                          <button
                            onClick={() => setFuelGoal(prev => Math.max(1, parseFloat((prev - 0.5).toFixed(1))))}
                            className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-900 font-bold text-xs transition cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step="0.1"
                            value={fuelGoal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                setFuelGoal(val);
                              }
                            }}
                            className="w-14 bg-transparent text-center text-xs font-bold font-mono text-slate-100 focus:outline-none"
                          />
                          <button
                            onClick={() => setFuelGoal(prev => parseFloat((prev + 0.5).toFixed(1)))}
                            className="px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-900 font-bold text-xs transition cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-bold font-mono text-indigo-400">
                          {activeVehicle ? (activeVehicle.odometerUnit === "Km" ? "Km/L" : "MPG") : "Km/L"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Display */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center pb-1">
                    {/* Progress Numbers */}
                    <div className="space-y-1.5">
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Goal Progress Details</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-white">
                          {avgEfficiencyForGoal !== null ? avgEfficiencyForGoal : "0"}
                        </span>
                        <span className="text-xs text-slate-400 font-medium uppercase">
                          Current / {fuelGoal} {activeVehicle ? (activeVehicle.odometerUnit === "Km" ? "Km/L" : "MPG") : "Km/L"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        {activeVehicle ? (
                          <>
                            <div className={`w-5 h-5 rounded bg-gradient-to-br ${getVehicleAvatarInfo(activeVehicle).gradient} text-white flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0`}>
                              {getVehicleAvatarInfo(activeVehicle).emoji}
                            </div>
                            <span className="text-[11px] text-slate-300">
                              Currently tracking: <strong className="text-white font-bold">{activeVehicle.name}</strong>
                            </span>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            No active vehicle selected. Register a profile below!
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar Visual */}
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider">Completion Metrics</span>
                        <span className="font-mono font-bold text-indigo-400 text-sm">
                          {avgEfficiencyForGoal !== null 
                            ? `${Math.min(100, Math.round((avgEfficiencyForGoal / fuelGoal) * 100))}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/[0.08] p-[1px]">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500 shadow-lg shadow-indigo-500/20"
                          style={{
                            width: `${avgEfficiencyForGoal !== null ? Math.min(100, Math.round((avgEfficiencyForGoal / fuelGoal) * 100)) : 0}%`
                          }}
                        ></div>
                      </div>
                      
                      {/* Interactive dynamic motivational text */}
                      <p className="text-xs text-slate-300 italic leading-snug">
                        {avgEfficiencyForGoal === null ? (
                          <span>Please add at least one refuel log with calculated efficiency to track progress.</span>
                        ) : avgEfficiencyForGoal >= fuelGoal ? (
                          <span className="text-emerald-400 font-semibold">🎉 Goal Met! Excellent eco-friendly driving habits. Keep it up!</span>
                        ) : (
                          <span>
                            You need <strong className="text-indigo-300 font-mono font-bold">{(fuelGoal - avgEfficiencyForGoal).toFixed(1)}</strong> more units to reach your goal. Smooth acceleration and maintaining stable speeds will help!
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* COMPONENT SEGMENT: Comparison Chart Mapping Efficiency Trends */}
                  <div className="border-t border-white/[0.05] pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                          <Activity size={13} className="text-indigo-400 animate-pulse" />
                          Behavioral Efficiency vs Target Goal Trend
                        </h4>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                          Comparing drive patterns, environmental triggers, and notes against your benchmark
                        </p>
                      </div>

                      {/* Mode selection buttons */}
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-white/[0.08] p-1 rounded-xl shrink-0 self-start sm:self-center">
                        <button
                          onClick={() => setShowChartDemo(false)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            !showChartDemo
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Live Data
                        </button>
                        <button
                          onClick={() => setShowChartDemo(true)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                            showChartDemo
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Simulator
                        </button>
                      </div>
                    </div>

                    {/* Chart Container */}
                    {(() => {
                      const isDemoMode = showChartDemo;
                      const activeData = isDemoMode ? mockGoalComparisonData : goalComparisonChartData;
                      const currentUnit = activeVehicle ? (activeVehicle.odometerUnit === "Km" ? "Km/L" : "MPG") : "Km/L";

                      return (
                        <div className="space-y-4">
                          {isDemoMode && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300 leading-normal flex gap-2.5 items-start">
                              <Lightbulb size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-semibold block text-white mb-0.5">Interactive Behavior Simulator</strong>
                                Showing simulated behavior curves (traffic jams vs steady cruising). Log at least one refuel entry with computed efficiency for your active vehicle below to unlock your live trend comparison!
                              </div>
                            </div>
                          )}

                          {!isDemoMode && goalLogsWithEfficiency.length === 0 && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300 leading-normal flex gap-2.5 items-start">
                              <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-semibold block text-white mb-0.5">Live Data Trend Active</strong>
                                No fuel logs with calculated efficiency are available yet for the active vehicle profile. Log at least one fuel refill entry in the "Fuel Logs Manager" section below with odometer and fuel quantity details to start plotting your real-world driving efficiency!
                              </div>
                            </div>
                          )}

                          {/* Recharts Comparison Area */}
                          <div className="h-52 w-full bg-slate-950/40 border border-white/[0.04] rounded-2xl p-3">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={activeData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis 
                                  dataKey="name" 
                                  tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 500 }} 
                                  tickLine={false} 
                                  axisLine={false} 
                                />
                                <YAxis 
                                  tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 500 }} 
                                  tickLine={false} 
                                  axisLine={false} 
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      const isAbove = data.efficiency >= data.targetGoal;
                                      return (
                                        <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl space-y-1.5 max-w-[240px] text-left">
                                          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{data.name}</div>
                                          <div className="flex items-baseline gap-1.5">
                                            <span className="text-base font-extrabold text-white font-mono">{data.efficiency}</span>
                                            <span className="text-[10px] font-semibold text-slate-400">{currentUnit}</span>
                                          </div>
                                          <div className="text-[11px] font-semibold flex items-center gap-1 font-mono">
                                            {isAbove ? (
                                              <span className="text-emerald-400 flex items-center gap-0.5">
                                                <TrendingUp size={12} /> +{data.difference} units above target
                                              </span>
                                            ) : (
                                              <span className="text-rose-400 flex items-center gap-0.5 font-mono">
                                                <TrendingDown size={12} /> {data.difference} units below target
                                              </span>
                                            )}
                                          </div>
                                          {data.notes && (
                                            <div className="text-[10px] text-slate-300 border-t border-white/[0.08] pt-1.5 mt-1.5 leading-normal italic bg-slate-900/50 p-1.5 rounded-lg">
                                              "{data.notes}"
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <ReferenceLine 
                                  y={fuelGoal} 
                                  stroke="#818cf8" 
                                  strokeWidth={1.5}
                                  strokeDasharray="4 4" 
                                  label={{ value: `Goal Benchmark (${fuelGoal})`, fill: '#818cf8', fontSize: 9, fontWeight: 'bold', position: 'top', dy: -5 }} 
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="efficiency" 
                                  stroke="#6366f1" 
                                  strokeWidth={3} 
                                  fillOpacity={1} 
                                  fill="url(#efficiencyGradient)"
                                  dot={{ r: 4, stroke: '#0f172a', strokeWidth: 2, fill: '#818cf8' }} 
                                  activeDot={{ r: 6, stroke: '#0f172a', strokeWidth: 2 }} 
                                  name="Efficiency" 
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Detailed Granular Insights Block */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                            {/* Stats & Compliance */}
                            <div className="bg-slate-950/40 border border-white/[0.04] p-4 rounded-xl flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Goal Compliance Rate</span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black text-indigo-400 font-mono">
                                    {isDemoMode ? "60%" : `${driverInsights?.percentAboveGoal || 0}%`}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase">Efficiency Compliance</span>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-normal">
                                {isDemoMode ? (
                                  "During simulated runs, stable throttle habits and cruise control achieved target compliance 60% of the time."
                                ) : (
                                  `Your driving habits match or exceed your fuel savings goals on ${driverInsights?.percentAboveGoal || 0}% of all recorded refill cycles.`
                                )}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-white/[0.03]">
                                <Award size={13} className="text-yellow-500" />
                                <span>
                                  {isDemoMode ? (
                                    "Tip: Cruising preserves engine torque."
                                  ) : (
                                    (driverInsights?.percentAboveGoal || 0) >= 75 
                                      ? "Excellent eco-driver! Keep maintaining low engine RPMs."
                                      : "Accelerate gently and shift early to increase compliance."
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Behavior & Event Insights */}
                            <div className="bg-slate-950/40 border border-white/[0.04] p-4 rounded-xl space-y-3 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Granular Driving Behaviors</span>
                                <div className="space-y-2 mt-2">
                                  {isDemoMode ? (
                                    <>
                                      <div className="text-[11px] text-slate-300 flex items-start gap-2">
                                        <span className="shrink-0">🛣️</span>
                                        <span><strong>Highway Cruise:</strong> Stable highway cruises increase your efficiency by up to 25%.</span>
                                      </div>
                                      <div className="text-[11px] text-slate-300 flex items-start gap-2">
                                        <span className="shrink-0">🚦</span>
                                        <span><strong>City Traffic:</strong> Stop-and-go city traffic lowers average mileage due to heavy idling.</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {driverInsights?.notesInsights && driverInsights.notesInsights.length > 0 ? (
                                        driverInsights.notesInsights.slice(0, 2).map((insight, idx) => (
                                          <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-2 leading-normal">
                                            <span>{insight}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-[11px] text-slate-400 italic flex items-center gap-2">
                                          <Lightbulb size={13} className="text-indigo-400 shrink-0" />
                                          Add descriptive notes (e.g. "highway", "city traffic", "AC off") to your refuel logs to unlock personalized behavior correlation cards!
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Best log benchmark */}
                              {!isDemoMode && driverInsights?.bestLog && (
                                <div className="border-t border-white/[0.04] pt-2 text-[10px] text-slate-400 flex items-center justify-between">
                                  <span>Best Efficiency Log:</span>
                                  <span className="font-mono font-bold text-emerald-400">
                                    {driverInsights.bestLog.efficiency} {currentUnit} ({new Date(driverInsights.bestLog.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
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
                  onUpdateVehicle={handleUpdateVehicle}
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
                  onAddLog={handleAddLog}
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

      {/* Dynamic Overlays / Modals */}
      <AnimatePresence>
        {/* About Us Modal */}
        {showAboutModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAboutModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                    <Info size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">About AI Fuel Assistant</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Core mission & details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 text-slate-300 text-xs leading-relaxed max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-800">
                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Our Vision</h4>
                  <p className="font-normal text-slate-300">
                    AI Fuel Assistant is built to promote fuel economy and clean combustion tracking. We render state-of-the-art interactive vehicle telemetry calculations, smart range logs, and diagnostic simulations to help drivers minimize environmental footprint and maximize mileage efficiency.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Engineering Excellence</h4>
                  <p className="font-normal text-slate-300">
                    This utility integrates standard non-intrusive APIs, reactive layouts, real-time local mathematical conversions, and secure storage compliance standards.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-4 flex justify-end">
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Share App Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                    <Share2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">Share App</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Invite others to optimize fuel</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4 text-center">
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Share this application with friends and family to help them optimize their vehicles' efficiency, find cheap fuel stations, and run diagnostic simulated OBD scans!
                </p>

                <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-2xl flex items-center gap-2 mt-4">
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 bg-transparent text-slate-300 text-[10px] outline-none font-mono px-2 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopiedShareLink(true);
                      setTimeout(() => setCopiedShareLink(false), 2000);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                      copiedShareLink 
                        ? "bg-green-600/20 border border-green-500/40 text-green-400" 
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    {copiedShareLink ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedShareLink ? "Copied" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-6 flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Terms & Conditions Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                    <Scale size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">Terms of Service</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Google Play Console Compliant Agreement</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 text-slate-300 text-xs leading-relaxed max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-800">
                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">1. Acceptance of Terms</h4>
                  <p className="font-normal text-slate-300">
                    By downloading, installing, or using the AI Fuel Assistant mobile application, you agree to comply with and be bound by these Terms of Service. These terms satisfy all developer distribution requirements mandated by standard App Store guidelines. If you do not agree to these terms, you must not access or use the application.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">2. Scope & Disclaimer of Simulated Features</h4>
                  <p className="font-normal text-slate-300">
                    The OBD-II diagnostics, engine performance curves, and digital sensor updates provided in this app are virtual simulation tools designed for educational, mathematical modeling, and recreational purposes only. This app does not write to, override, or alter your vehicle's physical engine control unit (ECU). Users must rely on official certified vehicle repair centers for physical hardware servicing.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">3. Location and Data Accuracy</h4>
                  <p className="font-normal text-slate-300">
                    Calculations of sunrise/sunset, location maps, and estimated local fuel station rates are provided for convenience as reference estimates. Fuel pricing fluctuates continuously based on regional vendors. Always verify actual local prices, road conditions, and traffic safety guidelines before driving.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">4. User Safety & Lawful Driving</h4>
                  <p className="font-normal text-slate-300">
                    Do not interact with the application or input data while operating a moving vehicle. Always obey local traffic laws, and use hands-free mechanisms or pull over safely to log your fuel fills.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">5. No Warranty & Limitation of Liability</h4>
                  <p className="font-normal text-slate-300">
                    This application is provided on an "as-is" and "as-available" basis without warranties of any kind. We disclaim all liability for any vehicular deviations, log miscalculations, or decisions made using app recommendations.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-4 flex justify-end">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Accept Terms
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Privacy Policy Modal */}
        {showPrivacyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivacyModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/30 rounded-xl flex items-center justify-center text-indigo-400">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">Privacy Policy</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Google Play Console Compliant Privacy Charter</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 text-slate-300 text-xs leading-relaxed max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-800">
                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">1. Data Storage & Privacy Protection</h4>
                  <p className="font-normal text-slate-300">
                    We value your privacy. All log records, fuel entry calculations, odometer settings, and virtual vehicle parameters are stored exclusively in your device's secure local sandbox (via browser localStorage). No server-side relational databases collect, log, sell, or monetize your individual telemetry data.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">2. GPS Geolocation Transparency (Google Play Compliant)</h4>
                  <p className="font-normal text-slate-300">
                    When accessing the solar sync, local emergency helplines lookup, or cheap fuel finder features, the app requests native device geolocation coordinates. These coordinates are processed entirely on-device and transiently in active memory. They are used exclusively inside the active session context to calculate local sunrise/sunset times, locate fuel stations, and automatically detect your current country for roadside emergency listings. Your location is NEVER collected in the background, never stored on remote servers, and never shared with third-party analytical SDKs or advertising networks.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">3. Voice Input Processing</h4>
                  <p className="font-normal text-slate-300">
                    Voice inputs requested through the speech processing module are transcribed using standard browser Web Speech APIs. No raw voice clips, microphone recordings, or transcripts are compiled, archived, or transmitted to external storage servers.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">4. AI Processing Safety</h4>
                  <p className="font-normal text-slate-300">
                    Chat queries dispatched to the virtual AI Assistant are proxied securely server-side through highly guarded inference frameworks. No personally identifiable information (PII) is included in requests, ensuring complete compliance with global consumer privacy regulations.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">5. Children's Privacy (COPPA Compliance)</h4>
                  <p className="font-normal text-slate-300">
                    This application is fully compliant with the Children's Online Privacy Protection Act (COPPA) and does not intentionally target, collect, or retain any personal information from children under the age of 13.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">6. Device Permissions & Safe Usage Guarantee (Google Play Compliant)</h4>
                  <p className="font-normal text-slate-300">
                    This application may request device permissions such as GPS Location (Coarse & Fine), Bluetooth (for OBD-II links), and the Microphone (for voice commands). These permissions are accessed strictly to provide the functional utilities of the application on your direct request. We guarantee that no sensors, telemetry logs, or local data are ever accessed for illegal surveillance, unauthorized background monitoring, or malicious purposes. All data remains strictly under user control. We fully comply with the Google Play Developer Distribution Agreement and Safety Policy.
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-indigo-500/30 p-4 rounded-2xl space-y-3">
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={12} /> 7. GDPR & Google Play Console Data Rights
                  </h4>
                  <p className="font-normal text-slate-300">
                    Under the General Data Protection Regulation (GDPR) and Google Play Safety Standards, you possess explicit rights regarding your data. Since this application uses a <strong>local-first</strong> offline sandbox, we provide integrated tools to view our Data Processing Addendum (DPA) and request instant deletion of all stored data.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={() => {
                        setShowPrivacyModal(false);
                        setShowDPAModal(true);
                      }}
                      className="px-3 py-2 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/20 text-[11px] font-bold text-indigo-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <FileText size={12} />
                      View Data Processing Addendum (DPA)
                    </button>
                    <button
                      onClick={() => {
                        setShowPrivacyModal(false);
                        setShowDeletionModal(true);
                      }}
                      className="px-3 py-2 bg-red-950/30 hover:bg-red-900/20 border border-red-500/10 text-[11px] font-bold text-red-300 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={12} />
                      Request Data Deletion
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-4 flex justify-end">
                <button
                  onClick={() => setShowPrivacyModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Data Processing Addendum (DPA) Modal */}
        {showDPAModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDPAModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-600/10 border border-sky-500/30 rounded-xl flex items-center justify-center text-sky-400">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-wider">Data Processing Addendum</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">GDPR Art. 28 & Google Play Safety Accord</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDPAModal(false)}
                  className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1 text-slate-300 text-xs leading-relaxed max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-800">
                <p className="text-[11px] text-slate-400 leading-normal">
                  This Data Processing Addendum ("DPA") supplements the Privacy Policy and sets forth the terms governing the processing of personal and vehicle telemetry data in connection with the <strong>Smart Vehicle & Fuel Assistant</strong> application, in strict alignment with Article 28 of the General Data Protection Regulation (GDPR) and Google Play Console developer requirements.
                </p>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">1. Role Determinations (GDPR Article 4)</h4>
                  <p className="font-normal text-slate-300">
                    <strong>User as Data Controller:</strong> You (the vehicle owner/operator) retain full, absolute, and exclusive controller-level authority over your vehicle profiles, daily fuel logs, GPS coordinates, and cost indices.<br />
                    <strong>Application as Data Processor:</strong> The application functions strictly as an interactive processing engine on your local sandbox, executing computations (e.g. mileage averages, maintenance milestone calculations) entirely on-device and on your demand. No remote servers ever assume possession or controller-level stewardship of your operational records.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">2. Scope of Processing & Local Storage Sandbox</h4>
                  <p className="font-normal text-slate-300">
                    All personal data—including odometer metrics, fuel prices, coordinates for sun-synchronization, and AI chat sessions—is processed transiently in active application memory or stored persistently within the isolated client-side sandbox via secure browser <code>localStorage</code>. No telemetry data is transmitted to, cached on, or processed by remote central databases or third-party analytical trackers.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">3. Technical & Organizational Safety Measures (GDPR Article 32)</h4>
                  <p className="font-normal text-slate-300">
                    The processor implements industry-standard local sandboxing policies. Access is strictly isolated within the device's system boundaries, ensuring data cannot be read by other web entities. Voice processing relies exclusively on authorized local Web Speech interfaces, and AI chat queries are passed through highly-secure proxy frameworks with zero Personally Identifiable Information (PII) attached.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">4. Sub-processors Declaration</h4>
                  <p className="font-normal text-slate-300">
                    No third-party sub-processors have access to your raw vehicle files, telemetry logs, or location markers. For mapping utilities (Google Maps API), location coordinate resolution is requested transiently on-client; coordinates are never saved on external map servers.
                  </p>
                </div>

                <div className="bg-slate-950/50 border border-slate-850/60 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[11px] font-bold text-sky-400 uppercase tracking-widest">5. Data Subject Rights & Immediate Erasure Guarantee</h4>
                  <p className="font-normal text-slate-300">
                    In absolute compliance with Articles 15 (Access), 16 (Rectification), and 17 (Erasure / "Right to be Forgotten") of the GDPR, the application guarantees that you can instantly inspect, modify, or permanently delete all your data at any time via the <strong>Request Data Deletion</strong> wizard. Since the processor holds no database records, this erasure permanently voids all local sandbox configurations, leaving zero residues.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 mt-4 flex justify-between items-center text-[10px] text-slate-400">
                <span>Updated: July 2026</span>
                <button
                  onClick={() => setShowDPAModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Request Data Deletion Modal */}
        {showDeletionModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeletingData) {
                  setShowDeletionModal(false);
                  setDeletionConfirmed(false);
                }
              }}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden z-10"
            >
              {!deletionConfirmed ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-600/10 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                      <Trash2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-wider">Data Erasure Portal</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">GDPR Article 17 "Right to be Forgotten" & Google Play Policy</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-850/40">
                    <p>
                      Because this app runs on a <strong>Local-First Architecture</strong>, none of your details are stored on external server databases. This means your data is fully under your custody!
                    </p>
                    <p className="text-amber-400 font-bold">
                      ⚠️ Triggering deletion will permanently and irreversibly wipe all local storage sandbox files. This includes:
                    </p>
                    <ul className="space-y-1.5 pl-2 text-[11px] text-slate-400">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        All Vehicle Profiles and Odometer configurations
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Complete Fuel and Expense history logs
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Specific Maintenance milestones (Oil, Plugs, Brakes, Tyres)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        AI chat histories, pinned boards, and voice command logs
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Saved Location disclosures and cache settings
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-2 justify-end text-xs pt-1">
                    <button
                      disabled={isDeletingData}
                      onClick={() => setShowDeletionModal(false)}
                      className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isDeletingData}
                      onClick={() => {
                        setIsDeletingData(true);
                        setTimeout(() => {
                          localStorage.clear();
                          setIsDeletingData(false);
                          setDeletionConfirmed(true);
                        }, 1200);
                      }}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold shadow-lg shadow-red-950 transition cursor-pointer flex items-center gap-2"
                    >
                      {isDeletingData ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Erasing Sandbox...
                        </>
                      ) : (
                        "Permanently Erase All My Data"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 bg-green-600/10 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 mx-auto mb-2 animate-bounce">
                    <Check size={24} />
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">Data Wiped Successfully</h3>
                  <div className="text-xs text-slate-300 bg-slate-950/40 p-4 rounded-xl border border-slate-850/40 max-w-sm mx-auto leading-relaxed">
                    <p>
                      All client-side sandbox files, logs, settings, and cached vehicle indicators have been **fully deleted** from your device in strict compliance with GDPR Art. 17 and Google Play safety standards.
                    </p>
                    <p className="mt-2 text-indigo-300 font-medium">
                      The application will now reload to re-initialize a completely clean, empty sandbox.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDeletionModal(false);
                      setDeletionConfirmed(false);
                      window.location.reload();
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-950"
                  >
                    Complete & Restart App
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App-level Prominent Location Disclosure Modal (Google Play Policy Compliant) */}
      {showLocationDisclosure && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Shield size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-white">Location Access Prominent Disclosure</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Google Play Safety & Privacy Policy</p>
              </div>
              <button 
                onClick={() => setShowLocationDisclosure(false)}
                className="p-1 rounded bg-slate-950 text-slate-500 hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="text-slate-300 text-xs space-y-2.5 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
              <p>
                Smart Vehicle & Fuel Assistant requests access to your device's <strong>precise GPS Location</strong> for the following purpose:
              </p>
              <div className="flex items-start gap-2 bg-indigo-950/20 border border-indigo-500/10 p-2 rounded-lg text-[11px] text-indigo-300">
                <MapPin size={14} className="shrink-0 mt-0.5 text-indigo-400" />
                <span>
                  <strong>Sunrise & Sunset Auto Theme Sync:</strong> To calculate precise solar times based on your latitude and longitude, allowing automatic theme switching from light to dark at local sunset.
                </span>
              </div>
              <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1">
                <li>This app processes your location coordinates transiently in active memory.</li>
                <li>Your coordinates are <strong>never</strong> stored on our remote servers, tracked in the background, or shared with third parties.</li>
                <li>You can decline this access; the app will default to standard manual theme selection.</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end text-xs pt-1">
              <button
                onClick={() => setShowLocationDisclosure(false)}
                className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptLocationDisclosure}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-950 transition cursor-pointer"
              >
                Agree & Enable GPS Sync
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy and Terms Link */}
      <div className="fixed bottom-4 right-4 z-[100] text-[10px] text-slate-600 bg-slate-950/50 p-2 rounded-lg backdrop-blur">
        <button onClick={() => setShowLegalModal(true)} className="hover:text-indigo-400 transition cursor-pointer">
          Privacy Policy & Terms
        </button>
      </div>
      {showLegalModal && <LegalModal onClose={() => setShowLegalModal(false)} />}
    </div>
  );
}
