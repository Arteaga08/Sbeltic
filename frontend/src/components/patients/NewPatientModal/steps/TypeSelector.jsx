"use client";
import {
  Sparkle,
  Syringe,
  ClipboardText,
  Heartbeat,
  Gear,
  IdentificationCard,
} from "@phosphor-icons/react";

const options = [
  {
    id: "SPA",
    label: "Spa / Retail",
    icon: Sparkle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    id: "INJECTION",
    label: "Inyectables",
    icon: Syringe,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    id: "LEAD",
    label: "Cotización",
    icon: ClipboardText,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "SURGERY",
    label: "Cirugía",
    icon: Heartbeat,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    id: "POST_OP",
    label: "Post-Op",
    icon: IdentificationCard,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "OTHER",
    label: "Otros / Staff",
    icon: Gear,
    color: "text-slate-500",
    bg: "bg-slate-50",
  },
];

const TypeSelector = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className={`flex flex-col items-center p-6 rounded-4xl border-2 transition-all group ${
              selected === opt.id
                ? `${opt.bg} border-indigo-200 shadow-inner`
                : "bg-white border-slate-50 hover:border-slate-100 shadow-sm"
            }`}
          >
            <div
              className={`p-4 rounded-2xl mb-4 ${opt.bg} ${opt.color} group-hover:scale-110 transition-transform`}
            >
              <Icon size={32} weight="bold" />
            </div>
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${selected === opt.id ? opt.color : "text-slate-500"}`}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default TypeSelector;
