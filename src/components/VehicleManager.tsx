import React, { useState } from "react";
import { Vehicle, VehicleType, FuelType, OdometerUnit } from "../types";
import { Plus, Car, Trash2, CheckCircle2, Gauge, Zap, Flame, Info } from "lucide-react";

interface VehicleManagerProps {
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  onAddVehicle: (vehicle: Vehicle) => void;
  onSelectVehicle: (id: string) => void;
  onDeleteVehicle: (id: string) => void;
}

const VEHICLE_ICONS: Record<VehicleType, any> = {
  Car: Car,
  Motorcycle: Car, // we can render customized icon or use standard
  "Rickshaw/Auto": Car,
  "Truck/Van": Car,
  Other: Car,
};

export default function VehicleManager({
  vehicles,
  activeVehicleId,
  onAddVehicle,
  onSelectVehicle,
  onDeleteVehicle,
}: VehicleManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<VehicleType>("Car");
  const [fuelType, setFuelType] = useState<FuelType>("Petrol");
  const [engineSize, setEngineSize] = useState("");
  const [odometerUnit, setOdometerUnit] = useState<OdometerUnit>("Km");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newVehicle: Vehicle = {
      id: "v_" + Date.now(),
      name: name.trim(),
      type,
      fuelType,
      engineSize: engineSize.trim() || "1500cc",
      odometerUnit,
      createdAt: new Date().toISOString(),
    };

    onAddVehicle(newVehicle);
    setName("");
    setEngineSize("");
    setShowForm(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Vehicles Profile</h2>
          <p className="text-xs text-slate-500">Manage your active fleet</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus size={14} /> Add Vehicle
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4 space-y-3 transition">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Vehicle Profile</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Vehicle Name / Model</label>
              <input
                type="text"
                placeholder="e.g. Honda Civic, Suzuki 125, Rickshaw"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Vehicle Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as VehicleType)}
                className="w-full text-xs px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100"
              >
                <option value="Car" className="bg-slate-900">🚗 Car</option>
                <option value="Motorcycle" className="bg-slate-900">🏍️ Motorcycle</option>
                <option value="Rickshaw/Auto" className="bg-slate-900">🛺 Rickshaw/Auto</option>
                <option value="Truck/Van" className="bg-slate-900">🚚 Truck/Van</option>
                <option value="Other" className="bg-slate-900">⚙️ Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full text-xs px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100"
              >
                <option value="Petrol" className="bg-slate-900">Petrol</option>
                <option value="Diesel" className="bg-slate-900">Diesel</option>
                <option value="CNG" className="bg-slate-900">CNG</option>
                <option value="LPG" className="bg-slate-900">LPG</option>
                <option value="Electric" className="bg-slate-900">Electric</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Engine Size (cc/kW)</label>
              <input
                type="text"
                placeholder="e.g. 1300cc, 70cc"
                value={engineSize}
                onChange={(e) => setEngineSize(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Odometer Unit</label>
              <select
                value={odometerUnit}
                onChange={(e) => setOdometerUnit(e.target.value as OdometerUnit)}
                className="w-full text-xs px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg focus:outline-indigo-500/50 text-slate-100"
              >
                <option value="Km" className="bg-slate-900">Kilometers (Km)</option>
                <option value="Miles" className="bg-slate-900">Miles</option>
              </select>
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
              Save Profile
            </button>
          </div>
        </form>
      )}

      {vehicles.length === 0 ? (
        <div className="bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2">
          <Info size={18} className="text-slate-500 mx-auto" />
          <p className="text-xs text-slate-300 font-medium">No vehicles registered yet.</p>
          <p className="text-[11px] text-slate-500">Please add a vehicle profile to calculate correct fuel efficiency average.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.map((v) => {
            const isActive = v.id === activeVehicleId;
            return (
              <div
                key={v.id}
                onClick={() => onSelectVehicle(v.id)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  isActive
                    ? "bg-indigo-600/10 border-indigo-500/40 hover:bg-indigo-600/15"
                    : "bg-slate-950 hover:bg-slate-900/50 border-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isActive ? "bg-indigo-600/20 text-indigo-400" : "bg-slate-900 text-slate-400"}`}>
                    <span className="text-sm">
                      {v.type === "Motorcycle" ? "🏍️" : v.type === "Rickshaw/Auto" ? "🛺" : v.type === "Truck/Van" ? "🚚" : "🚗"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {v.name}
                      {isActive && (
                        <span className="inline-flex items-center text-[10px] bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-0.5">
                        <Flame size={10} className="text-orange-400" /> {v.fuelType}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Gauge size={10} className="text-slate-500" /> {v.engineSize}
                      </span>
                      <span>•</span>
                      <span>{v.odometerUnit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteVehicle(v.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition"
                    title="Delete Vehicle"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
