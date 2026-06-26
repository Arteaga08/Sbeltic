"use client";
import { useState } from "react";
import MonthSelector from "@/components/finance/MonthSelector";
import AdminFinanceDashboard from "@/components/finance/AdminFinanceDashboard";
import AppointmentsFinanceWidget from "@/components/finance/AppointmentsFinanceWidget";

const ADMIN_TABS = [
  { id: "citas", label: "Citas" },
  { id: "colaboradores", label: "Colaboradores" },
];

export default function FinanzasPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState("colaboradores");

  return (
    <div className="space-y-10 p-4 md:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-extrabold italic uppercase text-slate-900 leading-none">
            Finanzas
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-label">
            {activeTab === "citas" ? "Cobrado por cita" : "Comisiones por colaborador"}
          </p>
        </div>
        {activeTab === "colaboradores" && (
          <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        )}
      </header>

      {/* Toggle Citas | Colaboradores */}
      <div className="flex gap-2 max-w-md">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-colors ${
              activeTab === tab.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "colaboradores" ? (
        <AdminFinanceDashboard month={month} year={year} />
      ) : (
        <AppointmentsFinanceWidget />
      )}
    </div>
  );
}
