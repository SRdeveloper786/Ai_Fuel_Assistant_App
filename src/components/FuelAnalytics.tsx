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
  
  const logsWithMileage = activeLogs.filter((log) => log.mileage !== undefined);
  const avgMileage =
    logsWithMileage.length > 0
      ? parseFloat((logsWithMileage.reduce((sum, log) => sum + (log.mileage || 0), 0) / logsWithMileage.length).toFixed(2))
      : null;

  const odometerUnit = activeVehicle?.odometerUnit || "Km";
  const efficiencyUnit = odometerUnit === "Km" ? "Km/L" : "MPG";

  // Chart data formatting
  const chartData = activeLogs.map((log) => ({
    date: new Date(log.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    cost: log.totalCost,
    price: log.pricePerUnit,
    mileage: log.mileage || 0,
    liters: log.fuelFilled,
  }));

  if (!activeVehicle || activeLogs.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-2 shadow-xl">
        <BarChart3 size={24} className="text-slate-600 mx-auto" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Analytics & Insights</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Graphical analysis will appear here once you select a vehicle and log your fuel refill entries.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 space-y-6 shadow-xl">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Analytics & Insights</h2>
        <p className="text-xs text-slate-500">Live stats of fuel consumption and prices</p>
      </div>

      {/* Grid of basic key stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <TrendingUp size={12} className="text-indigo-400" /> Avg Efficiency
          </div>
          <div className="mt-1.5 text-base font-bold text-slate-100 font-mono">
            {avgMileage ? (
              <span>
                {avgMileage} <span className="text-xs font-semibold text-indigo-400">{efficiencyUnit}</span>
              </span>
            ) : (
              <span className="text-xs font-normal text-slate-600 italic">2 entries req.</span>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <DollarSign size={12} className="text-indigo-400" /> Total Cost
          </div>
          <div className="mt-1.5 text-base font-bold text-slate-100 font-mono">
            {totalCost.toLocaleString(undefined, { maximumFractionDigits: 1 })}{" "}
            <span className="text-xs font-semibold text-slate-500">{currency}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
            <Droplets size={12} className="text-indigo-400" /> Total Fuel
          </div>
          <div className="mt-1.5 text-base font-bold text-slate-100 font-mono">
            {totalLiters.toFixed(1)} <span className="text-xs font-semibold text-slate-500 font-mono">L</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Mileage trend (if available) */}
      {logsWithMileage.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
            <span>Fuel Efficiency Trend ({efficiencyUnit})</span>
          </div>
          <div className="h-44 w-full bg-slate-950 rounded-2xl p-2 border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.filter((d) => d.mileage > 0)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc", fontSize: "11px" }}
                />
                <Line
                  type="monotone"
                  dataKey="mileage"
                  name="Efficiency"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#6366f1" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart 2: Refill Cost distribution */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
          <span>Refueling Expenses ({currency})</span>
        </div>
        <div className="h-44 w-full bg-slate-950 rounded-2xl p-2 border border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: "12px", color: "#f8fafc", fontSize: "11px" }}
              />
              <Bar dataKey="cost" name="Expense" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-3 flex gap-2.5 text-xs text-indigo-200 leading-relaxed">
        <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
        <p>
          Your vehicle efficiency is affected by gear shifts, engine tuning, tyre pressures, and fuel type. Try asking the <strong>AI Assistant</strong> on the right for troubleshooting tips!
        </p>
      </div>
    </div>
  );
}
