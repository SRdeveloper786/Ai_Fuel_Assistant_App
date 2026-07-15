import React, { useState, useEffect } from "react";
import { Search, MapPin, ShieldAlert, Phone, Copy, Check, Navigation, AlertTriangle, HelpCircle, Activity, Shield, X } from "lucide-react";
import { HELPLINES, Helpline } from "../data/emergencyHelplines";
import { triggerHaptic } from "../lib/haptics";

export const EmergencyHelplines: React.FC = () => {
  const [search, setSearch] = useState("");
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [detectedCountryName, setDetectedCountryName] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "local">("local");
  const [showDisclosure, setShowDisclosure] = useState(false);

  // Detect location on load. We must NEVER call GPS automatically on mount
  // to prevent Google Play violations. We use standard silent IP geolocation instead.
  useEffect(() => {
    const isAccepted = localStorage.getItem("location_disclosure_accepted") === "true";
    if (isAccepted) {
      detectLocation(true);
    } else {
      detectLocationByIP();
    }
  }, []);

  const detectLocationByIP = async () => {
    setLoadingLocation(true);
    try {
      const ipRes = await fetch("https://ipapi.co/json/");
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData.country_code) {
          setDetectedCode(ipData.country_code.toUpperCase());
          setDetectedCountryName(ipData.country_name || null);
          setActiveTab("local");
        }
      }
    } catch (err) {
      console.warn("Silent IP Geolocation load failed:", err);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleButtonClick = () => {
    // ALWAYS display the prominent location disclosure popup first to obtain explicit consent,
    // ensuring strict compliance with Google Play Store Safety policies.
    setShowDisclosure(true);
  };

  const handleAcceptDisclosure = () => {
    localStorage.setItem("location_disclosure_accepted", "true");
    setShowDisclosure(false);
    detectLocation(true);
  };

  const handleDenyDisclosure = () => {
    setShowDisclosure(false);
    detectLocationByIP();
  };

  const detectLocation = async (forceGPS = false) => {
    setLoadingLocation(true);
    let resolved = false;

    // 1. Try GPS geolocation with OpenStreetMap reverse geocoding if authorized
    if (forceGPS && navigator.geolocation) {
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const { latitude, longitude } = position.coords;
                // Use keyless OSM Nominatim API
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                if (res.ok) {
                  const data = await res.json();
                  const countryCode = data.address?.country_code?.toUpperCase();
                  const countryName = data.address?.country;
                  if (countryCode) {
                    setDetectedCode(countryCode);
                    setDetectedCountryName(countryName || null);
                    resolved = true;
                  }
                }
              } catch (e) {
                console.warn("GPS reverse geocoding failed, trying IP fallback...", e);
              }
              resolve();
            },
            (error) => {
              console.warn("GPS access denied or failed, trying IP fallback...", error);
              resolve();
            },
            { timeout: 5000 }
          );
        });
      } catch (e) {
        console.warn("GPS flow error:", e);
      }
    }

    // 2. If GPS didn't resolve country code, fallback to IP Geolocation
    if (!resolved) {
      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData.country_code) {
            setDetectedCode(ipData.country_code.toUpperCase());
            setDetectedCountryName(ipData.country_name || null);
            resolved = true;
          }
        }
      } catch (err) {
        console.warn("IP Geolocation fallback failed:", err);
      }
    }

    setLoadingLocation(false);
    // If we detected a local country, default the tab to 'local'
    if (resolved) {
      setActiveTab("local");
    } else {
      setActiveTab("all");
    }
  };

  const handleCopy = (num: string, label: string) => {
    // Strip annotations out for dialing (e.g. "130 (Motorway Police)" -> "130")
    const cleanNum = num.split("(")[0].trim();
    navigator.clipboard.writeText(cleanNum);
    setCopiedText(`${label}:${cleanNum}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const cleanDial = (num: string) => {
    return num.split("(")[0].trim().replace(/\s+/g, "");
  };

  // Find local helpline if detected
  const localHelpline = HELPLINES.find((h) => h.code === detectedCode);

  // Filter list
  const filteredHelplines = HELPLINES.filter((h) => {
    const term = search.toLowerCase();
    return (
      h.country.toLowerCase().includes(term) ||
      h.code.toLowerCase().includes(term) ||
      h.police.includes(term) ||
      h.ambulance.includes(term) ||
      h.fire.includes(term) ||
      (h.roadside && h.roadside.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="text-rose-500 animate-pulse" size={20} />
            Global Emergency Helplines
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Official road, safety, and medical emergency numbers worldwide.
          </p>
        </div>

        <button
          onClick={handleButtonClick}
          disabled={loadingLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold border border-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {loadingLocation ? (
            <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Navigation size={13} className="text-indigo-400 animate-bounce" />
          )}
          {loadingLocation ? "Locating..." : "Auto-Detect Location"}
        </button>
      </div>

      {/* Detected Banner */}
      {detectedCode && localHelpline && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-extrabold flex items-center gap-1">
                <MapPin size={10} /> Auto-Detected Country
              </div>
              <h4 className="text-white font-bold text-base mt-0.5">
                {localHelpline.country}
              </h4>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab("local");
                setSearch("");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "local"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/50"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Show Local
            </button>
          </div>
        </div>
      )}

      {/* Mode Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex p-0.5 bg-slate-950 rounded-lg border border-slate-800/80 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("local")}
            disabled={!detectedCode}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer disabled:opacity-40 ${
              activeTab === "local"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Local Contacts
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Countries ({HELPLINES.length})
          </button>
        </div>

        <div className="flex-1 flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
          <Search className="text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search country, number, or helpline..."
            className="bg-transparent text-white text-xs w-full outline-none placeholder:text-slate-600"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-slate-500 hover:text-slate-300 text-[10px] font-bold"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Helplines List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
        {(activeTab === "local" && localHelpline ? [localHelpline] : filteredHelplines).map((h) => {
          const isUserLocal = h.code === detectedCode;
          return (
            <div
              key={h.code}
              className={`group bg-slate-950 p-4 rounded-xl border transition-all ${
                isUserLocal
                  ? "border-emerald-500/30 shadow-md shadow-emerald-950/20"
                  : "border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getCountryFlag(h.code)}</span>
                  <div>
                    <h4 className="text-white font-bold text-sm leading-tight flex items-center gap-1.5">
                      {h.country}
                      {isUserLocal && (
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-0.5">
                          <Activity size={8} /> Current Location
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                      ISO Code: {h.code}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {/* Police Row */}
                <div className="flex items-center justify-between p-2 bg-slate-900/60 rounded-lg border border-slate-800/40 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500">
                      <ShieldAlert size={14} />
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">Police Emergency</div>
                      <div className="text-xs font-extrabold text-white">{h.police}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(h.police, `${h.code}-police`)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Copy Number"
                    >
                      {copiedText === `${h.code}-police:${cleanDial(h.police)}` ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                    <a
                      href={`tel:${cleanDial(h.police)}`}
                      onClick={() => triggerHaptic('heavy')}
                      className="p-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer"
                      title="Call Now"
                    >
                      <Phone size={12} />
                    </a>
                  </div>
                </div>

                {/* Ambulance Row */}
                <div className="flex items-center justify-between p-2 bg-slate-900/60 rounded-lg border border-slate-800/40 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                      <Activity size={14} />
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">Medical / Ambulance</div>
                      <div className="text-xs font-extrabold text-white">{h.ambulance}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(h.ambulance, `${h.code}-ambulance`)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Copy Number"
                    >
                      {copiedText === `${h.code}-ambulance:${cleanDial(h.ambulance)}` ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                    <a
                      href={`tel:${cleanDial(h.ambulance)}`}
                      onClick={() => triggerHaptic('heavy')}
                      className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer"
                      title="Call Now"
                    >
                      <Phone size={12} />
                    </a>
                  </div>
                </div>

                {/* Fire Row */}
                <div className="flex items-center justify-between p-2 bg-slate-900/60 rounded-lg border border-slate-800/40 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-500">
                      <AlertTriangle size={14} />
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase">Fire Brigade</div>
                      <div className="text-xs font-extrabold text-white">{h.fire}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(h.fire, `${h.code}-fire`)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                      title="Copy Number"
                    >
                      {copiedText === `${h.code}-fire:${cleanDial(h.fire)}` ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                    <a
                      href={`tel:${cleanDial(h.fire)}`}
                      onClick={() => triggerHaptic('heavy')}
                      className="p-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white transition-all cursor-pointer"
                      title="Call Now"
                    >
                      <Phone size={12} />
                    </a>
                  </div>
                </div>

                {/* Roadside Assistance Row */}
                {h.roadside && (
                  <div className="flex items-center justify-between p-2 bg-slate-900/60 rounded-lg border border-indigo-500/20 hover:bg-slate-900 transition-colors">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                        <Navigation size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] text-indigo-400 uppercase font-bold">Motorway & Highway Help</div>
                        <div className="text-xs font-extrabold text-white truncate max-w-[140px] sm:max-w-none" title={h.roadside}>
                          {h.roadside}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleCopy(h.roadside!, `${h.code}-roadside`)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Copy Number"
                      >
                        {copiedText === `${h.code}-roadside:${cleanDial(h.roadside)}` ? (
                          <Check size={12} className="text-emerald-400" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                      <a
                        href={`tel:${cleanDial(h.roadside)}`}
                        onClick={() => triggerHaptic('heavy')}
                        className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                        title="Call Now"
                      >
                        <Phone size={12} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredHelplines.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 bg-slate-950 rounded-xl border border-dashed border-slate-800">
            <HelpCircle className="mx-auto text-slate-600 mb-2" size={32} />
            <h5 className="text-slate-400 font-bold text-sm">No Countries Found</h5>
            <p className="text-xs text-slate-500 mt-1">
              Try searching with a different keyword or country name.
            </p>
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-500 text-center bg-slate-950/40 py-2 px-4 rounded-lg">
        🚨 **Emergency Advisory:** This data is retrieved offline from local databases and verified online. Please stay alert on roadways and use official local telecom services when signal is weak.
      </div>

      {/* Prominent Location Disclosure Modal (Google Play Console Policy Compliant) */}
      {showDisclosure && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Shield size={20} className="animate-pulse" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-white">Location Access Prominent Disclosure</h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Google Play Safety & Privacy Policy</p>
              </div>
              <button 
                onClick={() => setShowDisclosure(false)}
                className="p-1 rounded bg-slate-950 text-slate-500 hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="text-slate-300 text-xs space-y-2.5 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
              <p>
                Smart Vehicle & Fuel Assistant requests access to your device's **precise GPS Location** for the following purpose:
              </p>
              <div className="flex items-start gap-2 bg-indigo-950/20 border border-indigo-500/10 p-2 rounded-lg text-[11px] text-indigo-300">
                <MapPin size={14} className="shrink-0 mt-0.5 text-indigo-400" />
                <span>
                  <strong>Emergency Number Auto-Detection:</strong> To detect your current country and instantly list local emergency numbers (Police, Ambulance, Fire, Roadside Assistance) in case of a roadway breakdown or medical situation.
                </span>
              </div>
              <ul className="list-disc pl-4 text-[11px] text-slate-400 space-y-1">
                <li>This app processes your location coordinates transiently in active memory.</li>
                <li>Your coordinates are **never** stored on our remote servers, tracked in the background, or shared with third parties.</li>
                <li>You can decline this access; the app will fall back to safe IP-based location estimation.</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end text-xs pt-1">
              <button
                onClick={handleDenyDisclosure}
                className="px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold transition cursor-pointer"
              >
                Use IP Fallback
              </button>
              <button
                onClick={handleAcceptDisclosure}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-950 transition cursor-pointer"
              >
                Agree & Authorize GPS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple utility to return unicode country emoji flag
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) =>  127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return "🌍";
  }
}
