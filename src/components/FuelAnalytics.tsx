import React from "react";
import { FuelEntry, Vehicle } from "../types";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Award, Droplets, DollarSign, BarChart3, Info } from "lucide-react";

interface FuelAnalyticsProps {
  activeVehicle: Vehicle | null;
  logs: FuelEntry[];
  currency?: string;
}

export default function FuelAnalytics({ activeVehicle, logs, currency = "PKR" }: FuelAnalyticsProps) {
  // Filter logs for active vehicle and sort by date
  const activeLogs = logs
    .filter((log) => log.vehicleId === activeVehicle?.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculations
  const totalCost = activeLogs.reduce((sum, log) => sum + log.totalCost, 0);
  const totalLiters = activeLogs.reduce((sum, log) => sum + log.fuelFilled, 0);
  
  const logsWithEfficiency = activeLogs.filter((log) => log.efficiency !== undefined);
  const avgEfficiency =
    logsWithEfficiency.length > 0
      ? parseFloat((logsWithEfficiency.reduce((sum, log) => sum + (log.efficiency || 0), 0) / logsWithEfficiency.length).toFixed(2))
      : null;

  const odometerUnit = activeVehicle?.odometerUnit || "Km";
  const efficiencyUnit = odometerUnit === "Km" ? "Km/L" : "MPG";

  // Chart data formatting
  const chartData = activeLogs.map((log) => ({
    date: new Date(log.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    cost: log.totalCost,
    price: log.pricePerUnit,
    efficiency: log.efficiency || 0,
    liters: log.fuelFilled,
  }));

  if (!activeVehicle || activeLogs.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-emerald-500/15 rounded-2xl p-6 text-center space-y-3 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl"></div>
        <BarChart3 size={24} className="text-emerald-500/50 mx-auto" />
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-emerald-400">Analytics & Insights</h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Graphical analysis will appear here once you select a vehicle and log your fuel refill entries.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-emerald-500/15 rounded-2xl p-5 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Top Emerald glow accent */}
      <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl"></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Eco-Performance Analytics
          </h2>
          <p className="text-xs text-slate-500">Live statistics of fuel efficiency and expense trends</p>
        </div>
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold font-mono">
          {efficiencyUnit}
        </div>
      </div>

      {/* Grid of basic key stats with Emerald Theme */}
      <div className="grid grid-cols-3 gap-3 relative z-10">
        <div className="p-3 bg-slate-950/60 border border-emerald-500/10 hover:border-emerald-500/20 rounded-xl transition duration-300">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
            <TrendingUp size={11} className="text-emerald-400" /> Avg Efficiency
          </div>
          <div className="mt-1.5 text-base font-bold text-slate-100 font-mono flex items-baseline gap-1">
            {avgEfficiency ? (
              <>
                <span className="text-emerald-400">{avgEfficiency}</span>
                <span className="text-[10px] font-semibold text-slate-400">{efficiencyUnit}</span>
              </>
            ) : (
              <span className="text-[10px] font-normal text-slate-500 italic">2 logs req.</span>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-emerald-500/10 hover:border-emerald-500/20 rounded-xl transition duration-300">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
            <DollarSign size={11} className="text-emerald-400" /> Total Cost
          </div>
          <div className="mt-1.5 text-base font-bold text-slate-100 font-mono flex items-baseline gap-1">
            <span className="text-emerald-400">
              {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">{currency}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-emerald-500/10 hover:border-emerald-500/20 rounded-xl transition duration-300">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
            <Droplets size={11} className="text-emerald-400" /> Total Fuel
          </div>
          <div className="mt-1.5 text-base font-bold text-slate-100 font-mono flex items-baseline gap-1">
            <span className="text-emerald-400">{totalLiters.toFixed(0)}</span>
            <span className="text-[10px] font-semibold text-slate-400">L</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Efficiency trend (if available) with Emerald Theme */}
      {logsWithEfficiency.length > 0 && (
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
            <span>Fuel Efficiency Trend ({efficiencyUnit})</span>
          </div>
          <div className="h-44 w-full bg-slate-950/60 rounded-xl p-2 border border-emerald-500/10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.filter((d) => d.efficiency > 0)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#111827" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#020617", border: "1px solid #10b98130", borderRadius: "8px", color: "#f8fafc", fontSize: "11px" }}
                />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  name="Efficiency"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart 2: Refill Cost distribution with Emerald Theme */}
      <div className="space-y-2 relative z-10">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
          <span>Refueling Expenses ({currency})</span>
        </div>
        <div className="h-44 w-full bg-slate-950/60 rounded-xl p-2 border border-emerald-500/10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#111827" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#6b7280" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#020617", border: "1px solid #10b98130", borderRadius: "8px", color: "#f8fafc", fontSize: "11px" }}
              />
              <Bar dataKey="cost" name="Expense" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

        <div className="bg-emerald-950 border border-emerald-500/50 rounded-xl p-4 flex gap-3 text-xs text-emerald-100 leading-relaxed relative z-10 shadow-lg shadow-emerald-900/50">
          <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <p>
            Your vehicle efficiency is affected by gear shifts, engine tuning, tyre pressures, and fuel type. Try asking the <strong className="text-emerald-300">AI Assistant</strong> for eco-friendly troubleshooting tips!
          </p>
        </div>
    </div>
  );
}
