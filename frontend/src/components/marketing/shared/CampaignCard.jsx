"use client";
import { useState } from "react";
import {
  CalendarBlank,
  Tag,
  Trash,
  WhatsappLogo,
  Clock,
  Copy,
  Check,
} from "@phosphor-icons/react";
import { toast } from "sonner";

const TEMPLATE_LABELS = {
  sbeltic_bienvenida: "Bienvenida",
  sbeltic_referidos: "Referidos",
  sbeltic_mantenimiento: "Mantenimiento",
  sbeltic_cumple: "Cumpleanos",
  sbeltic_promo_mensual: "Promo Mensual",
  sbeltic_liquidacion: "Liquidacion",
};

const CampaignCard = ({ campaign, onRefresh }) => {
  const {
    _id,
    code,
    discountType,
    discountValue,
    usedCount,
    maxRedemptions,
    expiresAt,
    isActive,
    whatsappTemplateName,
    schedule,
    type,
  } = campaign;

  const [showWA, setShowWA] = useState(false);
  const [copied, setCopied] = useState(false);

  const usagePercentage = Math.min((usedCount / maxRedemptions) * 100, 100);

  const displayDiscount =
    discountType === "PERCENTAGE" ? `${discountValue}%` : `$${discountValue}`;

  const daysLeft = Math.ceil(
    (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24),
  );
  const daysColor =
    daysLeft <= 3 ? "text-rose-500" : daysLeft <= 7 ? "text-amber-500" : "text-slate-400";

  const templateLabel = TEMPLATE_LABELS[whatsappTemplateName] || whatsappTemplateName || "Sin plantilla";

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Codigo copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeactivate = async () => {
    if (!confirm("Deseas pausar esta campana?")) return;
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coupons/${_id}/deactivate`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        toast.success("Campana pausada");
        if (onRefresh) onRefresh();
      }
    } catch {
      toast.error("Error al desactivar");
    }
  };

  return (
    <div
      className={`bg-white border-2 ${isActive ? "border-slate-50" : "border-rose-100 opacity-80"} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative group`}
    >
      {/* ESTATUS Y ACCIONES */}
      <div className="flex justify-between items-start mb-6">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            isActive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${isActive ? "bg-emerald-500" : "bg-rose-500"}`}
          />
          <span className="text-[8px] font-black uppercase tracking-widest">
            {isActive ? "En Curso" : "Finalizada"}
          </span>
        </div>

        <button
          onClick={handleDeactivate}
          className="text-slate-300 hover:text-rose-500 transition-colors"
        >
          <Trash size={20} weight="bold" />
        </button>
      </div>

      {/* INFO DE CAMPANA */}
      <div className="space-y-1 mb-8">
        <h4 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">
          {code}
        </h4>
        <div className="flex items-center gap-2">
          <Tag size={14} weight="fill" className="text-indigo-600" />
          <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">
            {displayDiscount} OFF
          </p>
        </div>

        {/* Badge de plantilla */}
        <div className="flex items-center gap-1.5 mt-2">
          <WhatsappLogo size={12} weight="fill" className="text-emerald-500" />
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
            {templateLabel}
          </span>
        </div>

        {/* Badge de proximo envio programado */}
        {schedule?.nextSendAt && (
          <div className="flex items-center gap-1.5 mt-1">
            <Clock size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
              Prox. envio: {new Date(schedule.nextSendAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* METRICAS DE CANJE */}
      <div className="space-y-2.5 mb-8">
        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span>
            Canjes: {usedCount} / {maxRedemptions}
          </span>
          <span>{Math.round(usagePercentage)}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              usagePercentage > 85 ? "bg-amber-500" : "bg-indigo-600"
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>

      {/* PIE: VIGENCIA + COPIAR CODIGO */}
      <div className="flex items-center justify-between pt-5 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <CalendarBlank size={16} weight="bold" className="text-slate-300" />
          <span className={`text-[9px] font-black uppercase tracking-widest ${daysColor}`}>
            {daysLeft > 0 ? `${daysLeft}d restantes` : "Vencido"}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-[9px] font-black uppercase tracking-widest ${
            copied
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-50 text-slate-500 hover:bg-slate-100"
          }`}
        >
          {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
          {copied ? "Copiado" : "Codigo"}
        </button>
      </div>
    </div>
  );
};

export default CampaignCard;
