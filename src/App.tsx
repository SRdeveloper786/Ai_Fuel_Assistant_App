import React, { useState, useEffect, useRef } from "react";
import { Vehicle, FuelEntry, SupportedLanguage } from "./types";
import VehicleManager from "./components/VehicleManager";
import FuelLogsManager from "./components/FuelLogsManager";
import FuelAnalytics from "./components/FuelAnalytics";
import AIFuelAssistant from "./components/AIFuelAssistant";
import AndroidIntegrationGuide from "./components/AndroidIntegrationGuide";
import { SmartFeatures } from "./components/SmartFeatures";
import CheapFuelFinder from "./components/CheapFuelFinder";
import { Car, Settings, BarChart3, MessageSquare, Flame, HelpCircle, FileText, Smartphone, MapPin, Wrench, ShieldAlert, Bluetooth, Calculator, AlertTriangle, ShieldCheck, PlayCircle, Sparkles, Download, Upload, Wifi, WifiOff, Database, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
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
        return prev + 5;
      });
    }, 80);

    const fadeTimeout = setTimeout(() => {
      setFadeSplash(true);
    }, 2000);

    const removeTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 2700);

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
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
          ℹ️
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">About Rao Developers</h2>
          <p className="text-xs text-slate-400">Application architecture & authorship details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <span className="text-[9px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
            DEVELOPMENT HOUSE
          </span>
          <h3 className="text-base font-bold text-slate-100">Rao Developers</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Crafting high-fidelity, data-driven full-stack experiences and state-of-the-art mobile and web solutions. Specialized in AI agent architectures, speech synthesis algorithms, and real-time telematics.
          </p>
        </div>

        <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <span className="text-[9px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
            VERSION DETAILS
          </span>
          <h3 className="text-base font-bold text-slate-100">Release v2.5.0</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Integrated with advanced Google Maps geolocation tracker API, real-time vehicle simulation suites, and high-fidelity server-side Gemini multilingual speech intelligence.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-950/20 via-slate-950 to-slate-950 p-5 rounded-2xl border border-indigo-500/10 space-y-2">
        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
          🚀 Smart Fuel Assistant Philosophy
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
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
              <div className="relative w-24 h-24 rounded-[1.75rem] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
                <span className="text-5xl animate-bounce" style={{ animationDuration: '3s' }}>⚡</span>
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

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Side Navigation Sidebar */}
        <aside className="w-full lg:w-72 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-850 flex flex-col justify-between shrink-0 p-5 lg:sticky lg:top-0 lg:h-screen z-40">
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

            {/* Sliding Navigation Container */}
            <div className="relative group/nav overflow-hidden select-none pb-2 lg:pb-0">
              {/* Left Slider Arrow - Visible conditionally with smooth fade-out and fade-in */}
              <button
                onClick={() => slideNavigation("left")}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center border border-indigo-500 shadow-lg lg:hidden cursor-pointer active:scale-95 transition-all duration-300 ${
                  arrowsVisible && showLeftArrow
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-75 pointer-events-none"
                }`}
                title="Slide Left"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Right Slider Arrow - Visible conditionally with smooth fade-out and fade-in */}
              <button
                onClick={() => slideNavigation("right")}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center border border-indigo-500 shadow-lg lg:hidden cursor-pointer active:scale-95 transition-all duration-300 ${
                  arrowsVisible && showRightArrow
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-75 pointer-events-none"
                }`}
                title="Slide Right"
              >
                <ChevronRight size={16} />
              </button>

              {/* Navigation links (Slider Track) */}
              <nav 
                ref={navRef}
                onScroll={handleNavScroll}
                className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1.5 lg:pb-0 scrollbar-none border-b border-slate-850 lg:border-b-0 px-8 lg:px-0 scroll-smooth"
              >
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "dashboard"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                  }`}
                >
                  <Car size={15} />
                  <span>Dashboard & Logs</span>
                </button>

                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "analytics"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                  }`}
                >
                  <BarChart3 size={15} />
                  <span>Fuel Analytics</span>
                </button>

                <button
                  onClick={() => setActiveTab("assistant")}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 relative ${
                    activeTab === "assistant"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                  }`}
                >
                  <MessageSquare size={15} />
                  <span>AI Fuel Expert</span>
                  <span className="absolute right-2 top-2.5 w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                </button>

                <button
                  onClick={() => setActiveTab("map")}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "map"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                  }`}
                >
                  <MapPin size={15} />
                  <span>Cheap Fuel Finder</span>
                </button>

                <button
                  onClick={() => setActiveTab("tools")}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "tools"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                  }`}
                >
                  <Flame size={15} />
                  <span>Smart Tools Suite</span>
                </button>

                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "about"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
                  }`}
                >
                  <HelpCircle size={15} />
                  <span>About Us</span>
                </button>
              </nav>

              {/* Slider Track Sub-text cue (Mobile Only) */}
              <div className="flex lg:hidden items-center justify-between mt-1 px-1.5 text-[8px] text-indigo-400/80 font-bold uppercase tracking-wider">
                <span>← SWIPE TAB TRACK</span>
                <span className="animate-pulse">MORE FEATURES AVAILABLE →</span>
              </div>
            </div>

            {/* Offline Optimization Indicator & Sidebar Connection Status */}
            <div className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                  Connection Status
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isOffline ? "bg-amber-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`}></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {isOffline ? "Offline" : "Online"}
                  </span>
                </div>
              </div>

              {/* Offline Warning Banner */}
              <div className="text-[10px] bg-slate-900 border border-slate-800 rounded-lg p-2 leading-relaxed text-slate-400">
                {isOffline ? (
                  <p className="font-semibold text-amber-300/90 leading-snug">
                    ⚠️ Offline Optimization Mode Active! (آف لائن موڈ فعال ہے). Refuels are recorded locally in secure database cache.
                  </p>
                ) : (
                  <p className="text-slate-500 leading-snug">
                    Connected to cloud networks. Voice translation & API maps fully operational.
                  </p>
                )}
              </div>

              {/* Force Simulate Offline Toggle Switch */}
              <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-slate-850/60 select-none">
                <span className="text-[10px] font-bold text-slate-400">Simulate Offline Mode</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={simulateOffline}
                    onChange={(e) => setSimulateOffline(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-8 h-4 rounded-full transition-colors duration-200 ${simulateOffline ? "bg-amber-500" : "bg-slate-800"}`}>
                    <div className={`w-3.5 h-3.5 bg-slate-950 rounded-full transition-transform duration-200 transform p-[2px] ${simulateOffline ? "translate-x-4" : "translate-x-0.5"}`}></div>
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
        <main className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto lg:h-screen lg:overflow-y-auto">
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
                <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 text-slate-100 relative overflow-hidden shadow-2xl space-y-5">
                  <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
                  <div className="absolute right-6 bottom-6 opacity-5 font-bold text-7xl select-none">🚗</div>
                  <div className="max-w-xl space-y-3.5 relative z-10">
                    <span className="text-[9px] uppercase font-bold tracking-widest bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-xl border border-indigo-500/20">
                      Bento Fuel Optimization Hub
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                      Log, Optimize, and Track Your Drive
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      Register your vehicle profiles, log daily petrol refills, and query our smart AI voice assistant in Roman Urdu, Urdu, or English to optimize vehicle performance and minimize fuel expenses!
                    </p>
                  </div>

                  {/* Global Currency Setting */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Global Currency Setting</span>
                      <p className="text-[11px] text-slate-400">Set fuel refuels, budgets, and cost metrics in your currency.</p>
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
                        className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold focus:outline-indigo-500/50 cursor-pointer"
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
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Wifi size={80} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-3">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                        {isOffline ? <WifiOff size={18} /> : <Wifi size={18} />}
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                          📶 Offline-First Smart Sync <span>(آف لائن موڈ)</span>
                        </h3>
                        <p className="text-[10px] text-slate-400">Offline-first local database tracking suite</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Driving through tunnels or remote roads? Our state-of-the-art offline mode caches your metrics, OBD-II telemetry, and fuel logs securely in local device storage.
                      </p>

                      <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-850 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sync Status:</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${isOffline ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"}`}>
                            {isOffline ? "Saved Locally (لوکل محفوظ)" : "Cloud Ready (آن لائن)"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic leading-snug">
                          {isOffline 
                            ? "All modifications are queued locally and remain fully preserved even after browser reloads." 
                            : "Standard online mode. Speech synthesizer and location maps are fully armed."}
                        </p>
                      </div>

                      {/* Force toggle */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-slate-400">Simulate Offline Mode (آف لائن موڈ)</span>
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
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Database size={80} className="text-indigo-400" />
                    </div>
                    <div className="flex items-center gap-2.5 border-b border-slate-800/60 pb-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                        <Database size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
                          📦 Data Control Center <span>(ڈیٹا کنٹرول سینٹر)</span>
                        </h3>
                        <p className="text-[10px] text-slate-400">Manage, export, and import your telemetry backups</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Total data ownership! Export all registered vehicle profiles and fuel refilling transactions to a portable spreadsheet CSV or JSON backup database.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={exportLogsToCSV}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
                        >
                          <Download size={13} className="text-indigo-400" />
                          <span>Export Logs (CSV)</span>
                        </button>
                        <button
                          onClick={exportBackupJSON}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 rounded-xl text-xs font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                        >
                          <Download size={13} />
                          <span>Save Backup (JSON)</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-800/60">
                        <label className="flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer transition shadow-lg shadow-indigo-600/10">
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

                {/* Interactive Smart Features Directory & Guidelines */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-indigo-400 w-5 h-5 animate-pulse" />
                      <h3 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                        📋 Feature Directory & Guidelines (استعمال کی مکمل رہنمائی)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Explore our fully simulated smart utility modules! Click a card below to read the comprehensive **English, Urdu, and Roman Urdu testing instructions**, and instantly open the live feature.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OBD CARD */}
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${expandedGuideId === "obd" ? "bg-slate-950 border-indigo-500/50" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-750"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                            <Bluetooth size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">🔌 OBD-II Bluetooth Diagnostics</h4>
                            <p className="text-[10px] text-slate-400 italic">انجن کی لائیو اسپیڈ اور کارکردگی کی اسکرین</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                              Simulates ELM327 adapter tracking. Run real-time ECU trouble code scans.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedGuideId(expandedGuideId === "obd" ? null : "obd")}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline shrink-0 cursor-pointer"
                        >
                          {expandedGuideId === "obd" ? "Hide Guide" : "View Guide"}
                        </button>
                      </div>

                      {expandedGuideId === "obd" && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px] leading-relaxed">
                          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                            <p className="font-bold text-slate-300 uppercase tracking-wide text-[9px] text-indigo-400">📋 Multilingual Description (تفصیل):</p>
                            <p className="text-slate-300"><strong>English:</strong> Pair your virtual OBD-II sensor to view live dials and read fault codes.</p>
                            <p className="text-slate-400"><strong>Roman Urdu:</strong> Adapter active karein taake engine parameters aur check engine faults scan ho sakein.</p>
                            <p className="text-slate-400"><strong>Urdu:</strong> لائیو اسپیڈ اور انجن کی حالت معلوم کرنے اور انجن کے مسائل اسکین کرنے کے لیے۔</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-indigo-400 text-[9px] uppercase tracking-wide">💡 Step-By-Step Test Steps (ٹیسٹنگ کا طریقہ):</p>
                            <ol className="list-decimal list-inside text-slate-400 space-y-1 pl-1">
                              <li>Click <strong>Launch OBD Feature</strong> below.</li>
                              <li>Press the purple <strong>"Pair OBD-II Adapter"</strong> button to run the live simulator.</li>
                              <li>Watch the dynamic telemetry metrics (RPM, Speed, Volts) update in real-time.</li>
                              <li>Click <strong>"Scan For Fault Codes (DTC)"</strong> to see active check engine alarms in Urdu and English.</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigateToFeature("tools", "obd")}
                        className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <PlayCircle size={12} />
                        <span>Launch OBD Feature</span>
                      </button>
                    </div>

                    {/* MAINTENANCE CARD */}
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${expandedGuideId === "maint" ? "bg-slate-950 border-indigo-500/50" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-750"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                            <Wrench size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">🔧 Predictive Maintenance Tracker</h4>
                            <p className="text-[10px] text-slate-400 italic">گاڑی کے پرزوں کی عمر اور تبدیلی کا ٹریکر</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                              Track wear status of Engine Oil, Spark Plugs, Brakes, and Tyres.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedGuideId(expandedGuideId === "maint" ? null : "maint")}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline shrink-0 cursor-pointer"
                        >
                          {expandedGuideId === "maint" ? "Hide Guide" : "View Guide"}
                        </button>
                      </div>

                      {expandedGuideId === "maint" && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px] leading-relaxed">
                          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                            <p className="font-bold text-slate-300 uppercase tracking-wide text-[9px] text-indigo-400">📋 Multilingual Description (تفصیل):</p>
                            <p className="text-slate-300"><strong>English:</strong> Set service mileage to compute live part fatigue status and get alerts.</p>
                            <p className="text-slate-400"><strong>Roman Urdu:</strong> Mobil oil aur plugs tabdeeli ka mileage likhein taake system wear and tear calculate kare.</p>
                            <p className="text-slate-400"><strong>Urdu:</strong> آئل اور اسپارک پلگ کی آخری تبدیلی کا کلو میٹر لکھیں تا کہ لائیو ہیلتھ معلوم ہوسکے۔</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-indigo-400 text-[9px] uppercase tracking-wide">💡 Step-By-Step Test Steps (ٹیسٹنگ کا طریقہ):</p>
                            <ol className="list-decimal list-inside text-slate-400 space-y-1 pl-1">
                              <li>Click <strong>Launch Maintenance</strong> below.</li>
                              <li>Click the <strong>"Update Maintenance Log"</strong> button to reveal the service forms.</li>
                              <li>Enter custom odometer numbers for Oil, Plugs, or Brakes (e.g., 120,000 km) and click Save.</li>
                              <li>The progress bars will instantly recalculate part wear levels and display km remaining.</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigateToFeature("tools", "maintenance")}
                        className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <PlayCircle size={12} />
                        <span>Launch Maintenance</span>
                      </button>
                    </div>

                    {/* BUDGET CARD */}
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${expandedGuideId === "budget" ? "bg-slate-950 border-indigo-500/50" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-750"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                            <Calculator size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">📊 Smart Budget Planner & Alerts</h4>
                            <p className="text-[10px] text-slate-400 italic">پٹرول بجٹ پلانر اور خودکار الارم سسٹم</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                              Monitor monthly fuel spending limits with automated warnings.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedGuideId(expandedGuideId === "budget" ? null : "budget")}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline shrink-0 cursor-pointer"
                        >
                          {expandedGuideId === "budget" ? "Hide Guide" : "View Guide"}
                        </button>
                      </div>

                      {expandedGuideId === "budget" && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px] leading-relaxed">
                          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                            <p className="font-bold text-slate-300 uppercase tracking-wide text-[9px] text-indigo-400">📋 Multilingual Description (تفصیل):</p>
                            <p className="text-slate-300"><strong>English:</strong> Allocate monthly spending limits and trigger alerts if costs exceed limits.</p>
                            <p className="text-slate-400"><strong>Roman Urdu:</strong> Apna monthly budget set karein aur limits break hone par alerts receive karein.</p>
                            <p className="text-slate-400"><strong>Urdu:</strong> پٹرول کا ماہانہ بجٹ مقرر کریں اور حد سے بڑھنے پر فورا الرٹس حاصل کریں۔</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-indigo-400 text-[9px] uppercase tracking-wide">💡 Step-By-Step Test Steps (ٹیسٹنگ کا طریقہ):</p>
                            <ol className="list-decimal list-inside text-slate-400 space-y-1 pl-1">
                              <li>Click <strong>Launch Budget Planner</strong> below.</li>
                              <li>Modify the Monthly Budget (e.g., 20,000 PKR) and Threshold (e.g., 80%).</li>
                              <li>Now, return to the Dashboard and log a high fuel refilling cost (e.g. 19,000 PKR).</li>
                              <li>Go to the <strong>Bento Analytics</strong> sub-tab inside Tools Suite; you'll see critical visual gauges and warnings!</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigateToFeature("tools", "budget")}
                        className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <PlayCircle size={12} />
                        <span>Launch Budget Planner</span>
                      </button>
                    </div>

                    {/* THEFT CARD */}
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${expandedGuideId === "theft" ? "bg-slate-950 border-indigo-500/50" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-750"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                            <ShieldAlert size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">🛡️ Fuel Theft & Leak Parking Guard</h4>
                            <p className="text-[10px] text-slate-400 italic">پٹرول چوری اور پائپ لیک پروٹیکشن الارم</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                              Triggers live voice alarms if parked fuel sensor levels drop rapidly.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedGuideId(expandedGuideId === "theft" ? null : "theft")}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline shrink-0 cursor-pointer"
                        >
                          {expandedGuideId === "theft" ? "Hide Guide" : "View Guide"}
                        </button>
                      </div>

                      {expandedGuideId === "theft" && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px] leading-relaxed">
                          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                            <p className="font-bold text-slate-300 uppercase tracking-wide text-[9px] text-indigo-400">📋 Multilingual Description (تفصیل):</p>
                            <p className="text-slate-300"><strong>English:</strong> Security mode that monitors sudden siphoning and initiates loud warning alarms.</p>
                            <p className="text-slate-400"><strong>Roman Urdu:</strong> Guard mode active karein. Fuel level achanak girne par chori ka alarm bajega.</p>
                            <p className="text-slate-400"><strong>Urdu:</strong> پارکنگ کے دوران گارڈ فعال کریں۔ پٹرول چوری یا پائپ لیک پر الارم بجے گا۔</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-indigo-400 text-[9px] uppercase tracking-wide">💡 Step-By-Step Test Steps (ٹیسٹنگ کا طریقہ):</p>
                            <ol className="list-decimal list-inside text-slate-400 space-y-1 pl-1">
                              <li>Click <strong>Launch Guard Mode</strong> below.</li>
                              <li>Toggle the green <strong>"Armed & Guarding"</strong> switch to turn the security system on.</li>
                              <li>A virtual float sensor dial will display and continuously scan.</li>
                              <li>Keep the screen open; random background theft attempts will trigger siren audio loops!</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigateToFeature("tools", "theft")}
                        className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <PlayCircle size={12} />
                        <span>Launch Guard Mode</span>
                      </button>
                    </div>

                    {/* MAP CARD */}
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${expandedGuideId === "map" ? "bg-slate-950 border-indigo-500/50" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-750"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                            <MapPin size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">📍 Nearest Cheap Fuel Finder Map</h4>
                            <p className="text-[10px] text-slate-400 italic">سستے ترین پٹرول پمپ کی تلاش کا لائیو نقشہ</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                              Find, compare, and navigate to cheapest petrol pumps nearby.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedGuideId(expandedGuideId === "map" ? null : "map")}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline shrink-0 cursor-pointer"
                        >
                          {expandedGuideId === "map" ? "Hide Guide" : "View Guide"}
                        </button>
                      </div>

                      {expandedGuideId === "map" && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px] leading-relaxed">
                          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                            <p className="font-bold text-slate-300 uppercase tracking-wide text-[9px] text-indigo-400">📋 Multilingual Description (تفصیل):</p>
                            <p className="text-slate-300"><strong>English:</strong> High-fidelity maps to locate stations and get audio routing directives.</p>
                            <p className="text-slate-400"><strong>Roman Urdu:</strong> GPS ya cities me se pumps select karein, cheaper prices compare karein aur route chalain.</p>
                            <p className="text-slate-400"><strong>Urdu:</strong> لائیو لوکیشن سے سستے ترین پٹرول پمپس تلاش کریں، قیمتوں کا موازنہ کریں اور راستہ دیکھیں۔</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-indigo-400 text-[9px] uppercase tracking-wide">💡 Step-By-Step Test Steps (ٹیسٹنگ کا طریقہ):</p>
                            <ol className="list-decimal list-inside text-slate-400 space-y-1 pl-1">
                              <li>Click <strong>Launch Fuel Finder Map</strong> below.</li>
                              <li>Select a preset city area or press the <strong>"Detect Location"</strong> GPS button to sync with your actual GPS.</li>
                              <li>Toggle <strong>"Cheapest"</strong> to sort and highlight the station with the lowest rate.</li>
                              <li>Click <strong>"Start Navigation"</strong> to plot a dynamic path and trigger browser spoken audio route voice.</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigateToFeature("map")}
                        className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <PlayCircle size={12} />
                        <span>Launch Fuel Finder Map</span>
                      </button>
                    </div>

                    {/* DRIVING HUD CARD */}
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${expandedGuideId === "hud" ? "bg-slate-950 border-indigo-500/50" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-750"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                            <MessageSquare size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">🎙️ Voice Driving HUD Mode</h4>
                            <p className="text-[10px] text-slate-400 italic">آواز کے اشاروں سے گاڑی کنٹرول کرنے کی اسکرین</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                              Interact with voice commands while driving without hands.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedGuideId(expandedGuideId === "hud" ? null : "hud")}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline shrink-0 cursor-pointer"
                        >
                          {expandedGuideId === "hud" ? "Hide Guide" : "View Guide"}
                        </button>
                      </div>

                      {expandedGuideId === "hud" && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px] leading-relaxed">
                          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                            <p className="font-bold text-slate-300 uppercase tracking-wide text-[9px] text-indigo-400">📋 Multilingual Description (تفصیل):</p>
                            <p className="text-slate-300"><strong>English:</strong> Voice-activated telematics. Speak parameters and hear synthesized voice readouts.</p>
                            <p className="text-slate-400"><strong>Roman Urdu:</strong> Mic on karke bolain, system car parameters ko Urdu ya English me boley ga.</p>
                            <p className="text-slate-400"><strong>Urdu:</strong> ڈرائیونگ کے دوران مائیک فعال کر کے آواز کے اشاروں سے گاڑی کنٹرول کریں۔</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-indigo-400 text-[9px] uppercase tracking-wide">💡 Step-By-Step Test Steps (ٹیسٹنگ کا طریقہ):</p>
                            <ol className="list-decimal list-inside text-slate-400 space-y-1 pl-1">
                              <li>Click <strong>Launch Driving HUD</strong> below.</li>
                              <li>Pick your active spoken language preference (English or Urdu).</li>
                              <li>Click the purple <strong>Microphone Button</strong> and grant browser microphone permission.</li>
                              <li>Say clearly: <strong>"status"</strong> or <strong>"average"</strong> or <strong>"faults"</strong> to receive real-time synthesized voice feedback!</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigateToFeature("tools", "handsfree")}
                        className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <PlayCircle size={12} />
                        <span>Launch Driving HUD</span>
                      </button>
                    </div>

                    {/* ABOUT US CARD */}
                    <div className={`p-4 rounded-2xl border transition-all duration-300 ${expandedGuideId === "about" ? "bg-slate-950 border-indigo-500/50" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-750"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 mt-0.5">
                            <HelpCircle size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">ℹ️ About Us & Rao Developers</h4>
                            <p className="text-[10px] text-slate-400 italic">رائو ڈیولپرز اور ڈویلپمنٹ ہاؤس کی معلومات</p>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal font-medium">
                              Authorship credentials, system specifications, and build version notes.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedGuideId(expandedGuideId === "about" ? null : "about")}
                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline shrink-0 cursor-pointer"
                        >
                          {expandedGuideId === "about" ? "Hide Guide" : "View Guide"}
                        </button>
                      </div>

                      {expandedGuideId === "about" && (
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5 text-[11px] leading-relaxed">
                          <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40">
                            <p className="font-bold text-slate-300 uppercase tracking-wide text-[9px] text-indigo-400">📋 Multilingual Description (تفصیل):</p>
                            <p className="text-slate-300"><strong>English:</strong> Information regarding our development team credentials and build information.</p>
                            <p className="text-slate-400"><strong>Roman Urdu:</strong> Rao Developers credentials, system architecture, aur v2.5.0 details.</p>
                            <p className="text-slate-400"><strong>Urdu:</strong> رائو ڈیولپرز اور ایپلی کیشن کے ریلیز ورژن کی تفصیلات۔</p>
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-indigo-400 text-[9px] uppercase tracking-wide">💡 Step-By-Step Test Steps (ٹیسٹنگ کا طریقہ):</p>
                            <ol className="list-decimal list-inside text-slate-400 space-y-1 pl-1">
                              <li>Click <strong>Open About Us View</strong> below.</li>
                              <li>Inspect development house history, build version details, and our operational philosophy.</li>
                            </ol>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => navigateToFeature("about")}
                        className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <PlayCircle size={12} />
                        <span>Open About Us View</span>
                      </button>
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
            <p className="text-[10px] text-slate-600">Supports Speech synthesis (TTS) & audio dictation natively in modern browsers.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
