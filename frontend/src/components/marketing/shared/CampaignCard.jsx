"use client";
import { useState } from "react";
import { CalendarBlank, Tag, Trash, WhatsappLogo } from "@phosphor-icons/react";
import { toast } from "sonner";

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
    whatsappMessageTemplate,
    schedule,
  } = campaign;

  const [showWA, setShowWA] = useState(false);
  const [copied, setCopied] = useState(false);

  // Barra de progreso de canjes
  const usagePercentage = Math.min((usedCount / maxRedemptions) * 100, 100);

  // Formato de descuento
  const displayDiscount =
    discountType === "PERCENTAGE" ? `${discountValue}%` : `$${discountValue}`;

  // Días restantes hasta vencimiento
  const daysLeft = Math.ceil(
    (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24),
  );
  const daysColor =
    daysLeft <= 3 ? "text-rose-500" : daysLeft <= 7 ? "text-amber-500" : "text-slate-400";

  // Mensaje WA con código insertado
  const resolvedMessage = (whatsappMessageTemplate || "")
    .replace(/{{nombre}}/g, "[Nombre]")
    .replace(/{{codigo}}/g, code)
    .replace(
      /{{descuento}}/g,
      discountType === "PERCENTAGE" ? `${discountValue}%` : `$${discountValue}`,
    );

  const handleCopy = () => {
    navigator.clipboard.writeText(resolvedMessage);
    setCopied(true);
    toast.success("Mensaje copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeactivate = async () => {
    if (!confirm("¿Deseas pausar esta campaña?")) return;
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coupons/${_id}/deactivate`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        toast.success("Campaña pausada");
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
      {/* 🟢 ESTATUS Y ACCIONES */}
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

      {/* 🏷️ INFO DE CAMPAÑA */}
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

        {/* Badge de próximo envío programado */}
        {schedule?.nextSendAt && (
          <div className="flex items-center gap-1.5 mt-2">
            <Clock size={12} className="text-indigo-400" />
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
              Próx. envío: {new Date(schedule.nextSendAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* 📊 MÉTRICAS DE CANJE */}
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

      {/* 📅 PIE: VIGENCIA + WA */}
      <div className="flex items-center justify-between pt-5 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <CalendarBlank size={16} weight="bold" className="text-slate-300" />
          <span className={`text-[9px] font-black uppercase tracking-widest ${daysColor}`}>
            {daysLeft > 0 ? `${daysLeft}d restantes` : "Vencido"}
          </span>
        </div>

        {/* Botón WhatsApp — abre el template */}
        <div className="relative">
          <button
            onClick={() => setShowWA(!showWA)}
            className={`p-2 rounded-lg transition-colors ${showWA ? "bg-emerald-100 text-emerald-700" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
          >
            <WhatsappLogo size={18} weight="fill" />
          </button>

          {showWA && (
            <div
              className="absolute bottom-12 right-0 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl p-4 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Template WhatsApp
              </p>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 whitespace-pre-wrap mb-3">
                {resolvedMessage || "Sin mensaje configurado"}
              </p>
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors"
              >
                {copied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                {copied ? "Copiado" : "Copiar mensaje"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cierra el dropdown WA al hacer clic afuera */}
      {showWA && (
        <div className="fixed inset-0 z-9" onClick={() => setShowWA(false)} />
      )}
    </div>
  );
};

export default CampaignCard;
