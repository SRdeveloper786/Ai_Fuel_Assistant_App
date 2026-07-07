import React, { useState } from "react";
import { FuelEntry, Vehicle } from "../types";
import { Calendar, Gauge, Beaker, DollarSign, Plus, Trash2, HelpCircle, FileText } from "lucide-react";

interface FuelLogsManagerProps {
  activeVehicle: Vehicle | null;
  logs: FuelEntry[];
  onAddLog: (log: FuelEntry) => void;
  onDeleteLog: (id: string) => void;
  currency?: string;
}

export default function FuelLogsManager({
  activeVehicle,
  logs,
  onAddLog,
  onDeleteLog,
  currency = "PKR",
}: FuelLogsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [odometer, setOdometer] = useState("");
  const [fuelFilled, setFuelFilled] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrSuccessMessage, setOcrSuccessMessage] = useState<string | null>(null);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    setError(null);
    setOcrSuccessMessage(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const resultBase64 = reader.result as string;
        const base64Data = resultBase64.split(",")[1];
        const mimeType = file.type || "image/jpeg";

        try {
          const res = await fetch("/api/ocr-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64Data, mimeType }),
          });

          const json = await res.json();
          if (json.success && json.data) {
            const parsed = json.data;
            if (parsed.date) setDate(parsed.date);
            if (parsed.fuelFilled) setFuelFilled(parsed.fuelFilled.toString());
            if (parsed.pricePerUnit) setPricePerUnit(parsed.pricePerUnit.toString());
            if (parsed.totalCost) {
              setTotalCost(parsed.totalCost.toString());
            } else if (parsed.fuelFilled && parsed.pricePerUnit) {
              setTotalCost((parsed.fuelFilled * parsed.pricePerUnit).toFixed(2));
            }
            if (parsed.stationName) {
              setNotes(`Scanned: ${parsed.stationName}`);
            } else {
              setNotes("Scanned Fuel Receipt");
            }
            setOcrSuccessMessage("📸 Receipt parsed successfully! Verify fields below.");
          } else {
            setError(json.error || "Failed to parse receipt. Please fill details manually.");
          }
        } catch (apiErr: any) {
          setError("API Error: Unable to reach OCR service. Try filling manually.");
        } finally {
          setIsScanning(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read image file.");
        setIsScanning(false);
      };
    } catch (err: any) {
      setError("An unexpected error occurred.");
      setIsScanning(false);
    }
  };

  // Filter logs for the active vehicle
  const activeVehicleLogs = logs
    .filter((log) => log.vehicleId === activeVehicle?.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Handle live calculation of total cost
  const handleFuelFilledChange = (val: string) => {
    setFuelFilled(val);
    if (val && pricePerUnit) {
      setTotalCost((parseFloat(val) * parseFloat(pricePerUnit)).toFixed(2));
    }
  };

  const handlePriceChange = (val: string) => {
    setPricePerUnit(val);
    if (val && fuelFilled) {
      setTotalCost((parseFloat(fuelFilled) * parseFloat(val)).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!activeVehicle) {
      setError("Please select or add a vehicle profile first.");
      return;
    }

    const odoNum = parseFloat(odometer);
    const fuelNum = parseFloat(fuelFilled);
    const priceNum = parseFloat(pricePerUnit);
    const costNum = parseFloat(totalCost) || fuelNum * priceNum;

    if (isNaN(odoNum) || odoNum <= 0) {
      setError("Please enter a valid odometer reading.");
      return;
    }

    if (isNaN(fuelNum) || fuelNum <= 0) {
      setError("Please enter a valid amount of fuel filled.");
      return;
    }

    // Odometer validation against last entry
    const lastEntry = activeVehicleLogs[activeVehicleLogs.length - 1];
    if (lastEntry && odoNum <= lastEntry.odometer) {
      setError(`New odometer reading must be higher than the previous entry of ${lastEntry.odometer} ${activeVehicle.odometerUnit}.`);
      return;
    }

    // Dynamic mileage calculation (real average!)
    // Formula: (Current Odometer - Last Odometer) / Fuel Filled this time
    let calculatedMileage: number | undefined = undefined;
    if (lastEntry) {
      const odoDifference = odoNum - lastEntry.odometer;
      calculatedMileage = parseFloat((odoDifference / fuelNum).toFixed(2));
    }

    const newLog: FuelEntry = {
      id: "log_" + Date.now(),
      vehicleId: activeVehicle.id,
      date,
      odometer: odoNum,
      fuelFilled: fuelNum,
      pricePerUnit: priceNum,
      totalCost: costNum,
      mileage: calculatedMileage,
      notes: notes.trim(),
    };

    onAddLog(newLog);
    setOdometer("");
    setFuelFilled("");
    setPricePerUnit("");
    setTotalCost("");
    setNotes("");
    setShowForm(false);
  };

  if (!activeVehicle) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3 shadow-xl">
        <Gauge size={24} className="text-slate-600 mx-auto" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Fuel & Refill Log</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You must create and select a vehicle profile above to start recording fuel logs and calculating fuel averages.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Fuel Logs ({activeVehicle.name})</h2>
          <p className="text-xs text-slate-500">Log fills to calculate true average efficiency</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setError(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus size={14} /> Log Refuel
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4 space-y-3 transition">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Fuel Entry</h3>
            {activeVehicleLogs.length === 0 && (
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded px-1.5 py-0.5 font-mono">
                First Log: Base Odometer
              </span>
            )}
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* OCR Upload Zone */}
          <div className="border border-dashed border-slate-800 rounded-xl p-3 bg-slate-900/40 text-center space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} className="text-indigo-400" /> Smart Receipt OCR Scanner
              </span>
              <span className="text-[9px] text-slate-500 font-medium">Quick Auto-fill</span>
            </div>
            
            {isScanning ? (
              <div className="py-4 flex flex-col items-center justify-center space-y-2">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[11px] text-slate-400 font-medium animate-pulse">Gemini AI analyzing receipt details...</p>
              </div>
            ) : (
              <label className="block cursor-pointer py-3 hover:bg-slate-900/80 rounded-lg transition border border-transparent hover:border-slate-800">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
                <Plus size={16} className="mx-auto text-slate-500 mb-1" />
                <p className="text-[11px] font-semibold text-slate-300">Upload Fuel Receipt Image</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Drag & drop or click to parse & pre-fill fields instantly</p>
              </label>
            )}
            
            {ocrSuccessMessage && (
              <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 font-semibold">
                {ocrSuccessMessage}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Odometer ({activeVehicle.odometerUnit})
              </label>
              <input
                type="number"
                placeholder={
                  activeVehicleLogs.length > 0
                    ? `Must be > ${activeVehicleLogs[activeVehicleLogs.length - 1].odometer}`
                    : "Current Odometer, e.g. 15400"
                }
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fuel Filled (Liters)</label>
              <input
                type="number"
                step="any"
                placeholder="Liters filled, e.g. 45"
                value={fuelFilled}
                onChange={(e) => handleFuelFilledChange(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Price Per Liter</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 268 or 3.2"
                value={pricePerUnit}
                onChange={(e) => handlePriceChange(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Total Cost</label>
              <input
                type="number"
                step="any"
                placeholder="Calculated automatically"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-lg text-indigo-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
              <input
                type="text"
                placeholder="e.g. Shell, Motorway travel"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-medium px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs font-semibold px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer"
            >
              Log Entry
            </button>
          </div>
        </form>
      )}

      {/* Explainer tooltip info */}
      {activeVehicleLogs.length === 1 && (
        <div className="bg-indigo-950/50 text-indigo-300 border border-indigo-500/20 rounded-2xl p-3 text-xs flex gap-2.5 items-start mb-4">
          <HelpCircle size={15} className="shrink-0 mt-0.5 text-indigo-400" />
          <p className="leading-relaxed">
            <strong>First entry recorded!</strong> To calculate fuel efficiency, you need to add at least <strong>one more entry</strong>. On your next refill, enter the new odometer and liters. The system will automatically compute your vehicle's Km/Liter.
          </p>
        </div>
      )}

      {activeVehicleLogs.length === 0 ? (
        <div className="bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <Calendar size={20} className="text-slate-500 mx-auto" />
          <p className="text-xs text-slate-300 font-medium">No fuel records logged yet.</p>
          <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
            Click "Log Refuel" above to enter your current odometer reading and liters filled when you visit a fuel station.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 font-bold">Date</th>
                <th className="py-2.5 font-bold text-right">Odometer</th>
                <th className="py-2.5 font-bold text-right">Refuel</th>
                <th className="py-2.5 font-bold text-right">Cost</th>
                <th className="py-2.5 font-bold text-right text-indigo-400 font-semibold">Efficiency</th>
                <th className="py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[...activeVehicleLogs].reverse().map((log) => (
                <tr key={log.id} className="hover:bg-slate-950/30 transition">
                  <td className="py-3 font-medium text-slate-200">
                    <div>{log.date}</div>
                    {log.notes && <div className="text-[10px] text-slate-500 font-normal">{log.notes}</div>}
                  </td>
                  <td className="py-3 text-right text-slate-400 font-mono">
                    {log.odometer} <span className="text-[10px]">{activeVehicle.odometerUnit}</span>
                  </td>
                  <td className="py-3 text-right text-slate-400 font-mono">
                    {log.fuelFilled} <span className="text-[10px]">L</span>
                  </td>
                  <td className="py-3 text-right text-slate-200 font-bold">
                    {log.totalCost.toFixed(1)} <span className="text-[10px] text-slate-500">{currency}</span>
                  </td>
                  <td className="py-3 text-right text-indigo-400 font-bold font-mono">
                    {log.mileage ? (
                      <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded px-1.5 py-0.5">
                        {log.mileage} {activeVehicle.odometerUnit === "Km" ? "Km/L" : "MPG"}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px] font-normal italic">Pending...</span>
                    )}
                  </td>
                  <td className="py-3 text-right pl-2">
                    <button
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1 text-slate-600 hover:text-red-400 transition"
                      title="Delete Entry"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
