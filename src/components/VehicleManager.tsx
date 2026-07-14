import React, { useState } from "react";
import { Vehicle, VehicleType, FuelType, OdometerUnit } from "../types";
import { Plus, Car, Bike, Truck, HelpCircle, Trash2, Gauge, Flame, Info, Sparkles, Edit3 } from "lucide-react";

interface VehicleManagerProps {
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  onAddVehicle: (vehicle: Vehicle) => void;
  onSelectVehicle: (id: string) => void;
  onDeleteVehicle: (id: string) => void;
  onUpdateVehicle?: (vehicle: Vehicle) => void;
}

const VEHICLE_ICONS: Record<VehicleType, any> = {
  Car: Car,
  Motorcycle: Bike,
  "Rickshaw/Auto": Car, // fallback to Car
  "Truck/Van": Truck,
  Other: HelpCircle,
};

export const GRADIENTS = [
  { name: "Neon Purple", value: "from-indigo-500 to-purple-500" },
  { name: "Sunset Orange", value: "from-rose-500 to-orange-500" },
  { name: "Ocean Blue", value: "from-sky-400 to-blue-600" },
  { name: "Eco Green", value: "from-emerald-400 to-teal-600" },
  { name: "Gold Bright", value: "from-amber-400 to-yellow-500" },
  { name: "Cherry Pink", value: "from-pink-500 to-rose-600" },
  { name: "Stealth Slate", value: "from-slate-600 to-slate-800" },
];

export const EMOJIS = [
  "🚗", "🚙", "🏎️", "🏍️", "🛺", "🚚", "🚜", "⚡", "🔥", "🌿", "⭐", "🦖", "🛸", "🤖", "🦊", "🦁"
];

export function getVehicleAvatarInfo(v: Vehicle) {
  if (!v.avatar) {
    // Fallback based on type
    let defaultEmoji = "🚗";
    let defaultGradient = "from-indigo-500 to-purple-500";
    if (v.type === "Motorcycle") {
      defaultEmoji = "🏍️";
      defaultGradient = "from-fuchsia-500 to-pink-500";
    } else if (v.type === "Rickshaw/Auto") {
      defaultEmoji = "🛺";
      defaultGradient = "from-yellow-400 to-amber-600";
    } else if (v.type === "Truck/Van") {
      defaultEmoji = "🚚";
      defaultGradient = "from-slate-600 to-slate-800";
    } else if (v.type === "Other") {
      defaultEmoji = "⚙️";
      defaultGradient = "from-sky-500 to-blue-600";
    }
    return { gradient: defaultGradient, emoji: defaultEmoji };
  }
  const parts = v.avatar.split("|");
  const gradient = parts[0] || "from-slate-700 to-slate-800";
  const emoji = parts[1] || "🚗";
  return { gradient, emoji };
}

export default function VehicleManager({
  vehicles,
  activeVehicleId,
  onAddVehicle,
  onSelectVehicle,
  onDeleteVehicle,
  onUpdateVehicle,
}: VehicleManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<VehicleType>("Car");
  const [fuelType, setFuelType] = useState<FuelType>("Petrol");
  const [engineSize, setEngineSize] = useState("");
  const [odometerUnit, setOdometerUnit] = useState<OdometerUnit>("Km");
  
  // Avatar Selection states
  const [selectedGradient, setSelectedGradient] = useState("from-indigo-500 to-purple-500");
  const [selectedEmoji, setSelectedEmoji] = useState("🚗");

  // Handle changing type to update default emoji avatar
  const handleTypeChange = (newType: VehicleType) => {
    setType(newType);
    let matchedEmoji = "🚗";
    if (newType === "Motorcycle") matchedEmoji = "🏍️";
    else if (newType === "Rickshaw/Auto") matchedEmoji = "🛺";
    else if (newType === "Truck/Van") matchedEmoji = "🚚";
    else if (newType === "Other") matchedEmoji = "⚙️";
    setSelectedEmoji(matchedEmoji);
  };

  const handleEditClick = (v: Vehicle) => {
    setEditingVehicleId(v.id);
    setName(v.name);
    setType(v.type);
    setFuelType(v.fuelType);
    setEngineSize(v.engineSize);
    setOdometerUnit(v.odometerUnit);
    
    const { gradient, emoji } = getVehicleAvatarInfo(v);
    setSelectedGradient(gradient);
    setSelectedEmoji(emoji);
    
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingVehicleId(null);
    setName("");
    setEngineSize("");
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const avatarString = `${selectedGradient}|${selectedEmoji}`;

    if (editingVehicleId) {
      if (onUpdateVehicle) {
        onUpdateVehicle({
          id: editingVehicleId,
          name: name.trim(),
          type,
          fuelType,
          engineSize: engineSize.trim() || "1500cc",
          odometerUnit,
          createdAt: new Date().toISOString(),
          avatar: avatarString,
        });
      }
    } else {
      const newVehicle: Vehicle = {
        id: "v_" + Date.now(),
        name: name.trim(),
        type,
        fuelType,
        engineSize: engineSize.trim() || "1500cc",
        odometerUnit,
        createdAt: new Date().toISOString(),
        avatar: avatarString,
      };
      onAddVehicle(newVehicle);
    }

    // Reset states
    setName("");
    setEngineSize("");
    setEditingVehicleId(null);
    setShowForm(false);
  };

  return (
    <div className="bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">Vehicles Profile</h2>
          <p className="text-xs text-slate-500">Manage your active fleet and custom avatars</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setEditingVehicleId(null);
              setName("");
              setEngineSize("");
              setSelectedEmoji("🚗");
              setSelectedGradient("from-indigo-500 to-purple-500");
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus size={14} /> Add Vehicle
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-4 mb-4 space-y-4 transition">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {editingVehicleId ? "Edit Vehicle Profile" : "New Vehicle Profile"}
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Vehicle Name / Model</label>
              <input
                type="text"
                placeholder="e.g. Honda Civic, Suzuki 125, Rickshaw"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Vehicle Type</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as VehicleType)}
                className="w-full text-xs px-2 py-2 bg-slate-900 border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 cursor-pointer"
              >
                <option value="Car" className="bg-slate-900">Car</option>
                <option value="Motorcycle" className="bg-slate-900">Motorcycle</option>
                <option value="Rickshaw/Auto" className="bg-slate-900">Rickshaw/Auto</option>
                <option value="Truck/Van" className="bg-slate-900">Truck/Van</option>
                <option value="Other" className="bg-slate-900">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full text-xs px-2 py-2 bg-slate-900 border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 cursor-pointer"
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
                className="w-full text-xs px-3 py-2 bg-slate-900 border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Odometer Unit</label>
              <select
                value={odometerUnit}
                onChange={(e) => setOdometerUnit(e.target.value as OdometerUnit)}
                className="w-full text-xs px-2 py-2 bg-slate-900 border border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-100 cursor-pointer"
              >
                <option value="Km" className="bg-slate-900">Kilometers (Km)</option>
                <option value="Miles" className="bg-slate-900">Miles</option>
              </select>
            </div>
          </div>

          {/* Personalized Avatar Creator / Selector */}
          <div className="border-t border-white/[0.06] pt-3.5 space-y-3">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Configure Vehicle Avatar</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/40 p-3 rounded-xl border border-white/[0.04]">
              {/* Avatar Live Preview */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedGradient} text-white flex items-center justify-center text-3xl shadow-lg shadow-black/30 transition-all duration-300`}>
                  {selectedEmoji}
                </div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-1">Live Preview</span>
              </div>

              {/* Selector Panels */}
              <div className="flex-1 space-y-2.5 w-full">
                {/* 1. Gradient Background Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Background Theme</span>
                  <div className="flex flex-wrap gap-1.5">
                    {GRADIENTS.map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setSelectedGradient(g.value)}
                        className={`w-5 h-5 rounded-full bg-gradient-to-br ${g.value} border transition-all ${
                          selectedGradient === g.value
                            ? "border-white ring-2 ring-indigo-500 scale-110"
                            : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                        title={g.name}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Emoji Icon Selector */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avatar Icon / Emoji</span>
                  <div className="flex flex-wrap gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setSelectedEmoji(e)}
                        className={`w-6 h-6 text-sm rounded flex items-center justify-center transition-all ${
                          selectedEmoji === e
                            ? "bg-indigo-600/30 text-white border border-indigo-500/50 scale-110"
                            : "hover:bg-slate-800 text-slate-400 hover:text-slate-100"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs font-medium px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs font-semibold px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer"
            >
              {editingVehicleId ? "Update Profile" : "Save Profile"}
            </button>
          </div>
        </form>
      )}

      {vehicles.length === 0 ? (
        <div className="bg-slate-950 border border-dashed border-white/[0.08] rounded-xl p-6 text-center space-y-2">
          <Info size={18} className="text-slate-500 mx-auto" />
          <p className="text-xs text-slate-300 font-medium">No vehicles registered yet.</p>
          <p className="text-[11px] text-slate-500">Please add a vehicle profile to calculate correct fuel efficiency average.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.map((v) => {
            const isActive = v.id === activeVehicleId;
            const { gradient, emoji } = getVehicleAvatarInfo(v);
            return (
              <div
                key={v.id}
                onClick={() => onSelectVehicle(v.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isActive
                    ? "bg-indigo-600/10 border-indigo-500/40 hover:bg-indigo-600/15"
                    : "bg-slate-950/40 hover:bg-slate-900/40 border-white/[0.06]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Dynamic Gradient Avatar with Emoji */}
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center text-lg shadow-md shrink-0 transition duration-300`}>
                    {emoji}
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
                      <span className="flex items-center gap-1">
                        <Flame size={10} className="text-orange-400" /> {v.fuelType}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Gauge size={10} className="text-slate-500" /> {v.engineSize}
                      </span>
                      <span>•</span>
                      <span>{v.odometerUnit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(v);
                    }}
                    className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition"
                    title="Edit Profile"
                  >
                    <Edit3 size={13} />
                  </button>
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
