"use client";
import { useState } from "react";
import {
  CalendarBlank,
  Tag,
  Trash,
  WhatsappLogo,
  Copy,
  Check,
  UserCircle,
  HandCoins,
  ChartLineUp,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import CouponStatsModal from "../modals/CouponStatsModal";

const ReferralCard = ({ campaign, onRefresh }) => {
  const {
    _id,
    code,
    name,
    description,
    discountType,
    discountValue,
    usedCount,
    maxRedemptions,
    expiresAt,
    isActive,
    referralConfig,
  } = campaign;

  const owner = referralConfig?.ownerId; // poblado con { name, phone }

  const [copied, setCopied] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const usagePercentage = Math.min((usedCount / maxRedemptions) * 100, 100);
  const displayDiscount =
    discountType === "PERCENTAGE" ? `${discountValue}%` : `$${discountValue}`;
  const displayReward =
    referralConfig?.rewardType === "FIXED_AMOUNT"
      ? `$${referralConfig?.rewardValue}`
      : `${referralConfig?.rewardValue ?? 10}%`;

  const expiresDate = expiresAt ? new Date(expiresAt) : null;
  const daysLeft =
    expiresDate && !isNaN(expiresDate.getTime())
      ? Math.ceil((expiresDate - new Date()) / (1000 * 60 * 60 * 24))
      : null;
  const daysColor =
    daysLeft === null
      ? "text-slate-400"
      : daysLeft <= 3
        ? "text-rose-500"
        : daysLeft <= 7
          ? "text-amber-500"
          : "text-slate-400";

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Código copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!owner?.phone) {
      toast.error("El dueño no tiene un número registrado");
      return;
    }
    const firstName = owner.name ? owner.name.split(" ")[0] : "Hola";
    const message =
      `Hola ${firstName}, este es tu cupón de referido de Sbeltic \n\n` +
      `Código: *${code}* (${displayDiscount} de descuento)\n` +
      `${description || ""}\n\n` +
      `Compártelo con quien quieras. Cuando lo usen en su cita, tú recibes una recompensa\n` +
      `(Cupon valido al momento de pagar en caja)`;
    window.open(
      `https://wa.me/${owner.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const handleTrashClick = async () => {
    if (isActive) {
      if (!confirm("¿Deseas pausar este referido?")) return;
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/coupons/${_id}/deactivate`,
          { method: "PATCH" },
        );
        if (res.ok) {
          toast.success("Referido pausado");
          if (onRefresh) onRefresh();
        }
      } catch {
        toast.error("Error al pausar");
      }
    } else {
      if (!confirm("¿Eliminar este referido permanentemente?")) return;
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/coupons/${_id}`,
          { method: "DELETE" },
        );
        if (res.ok) {
          toast.success("Referido eliminado");
          if (onRefresh) onRefresh();
        }
      } catch {
        toast.error("Error al eliminar");
      }
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
            {isActive ? "Activo" : "Pausado"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatsOpen(true)}
            className="text-slate-300 hover:text-indigo-500 transition-colors"
            title="Ver estadísticas"
          >
            <ChartLineUp size={20} weight="bold" />
          </button>
          {isActive && (
            <button
              onClick={handleSendWhatsApp}
              className="text-slate-300 hover:text-emerald-500 transition-colors"
              title="Enviar al dueño por WhatsApp"
            >
              <WhatsappLogo size={20} weight="bold" />
            </button>
          )}
          <button
            onClick={handleTrashClick}
            className="text-slate-300 hover:text-rose-500 transition-colors"
            title={isActive ? "Pausar referido" : "Eliminar permanentemente"}
          >
            <Trash size={20} weight="bold" />
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="space-y-1 mb-6">
        {name && (
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {name}
          </p>
        )}
        <h4 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">
          {code}
        </h4>
        {description && (
          <p className="text-xs font-medium text-slate-500 leading-snug pt-1">
            {description}
          </p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <Tag size={14} weight="fill" className="text-purple-600" />
          <p className="text-purple-600 font-black text-xs uppercase tracking-widest">
            {displayDiscount} OFF
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <HandCoins size={12} weight="fill" className="text-emerald-500" />
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
            Premio dueño: {displayReward}
          </span>
        </div>
        {owner?.name && (
          <div className="flex items-center gap-1.5 mt-1">
            <UserCircle size={12} weight="fill" className="text-slate-500" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Dueño: {owner.name}
            </span>
          </div>
        )}
      </div>

      {/* MÉTRICAS DE CANJE */}
      <div className="space-y-2.5 mb-6">
        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span>
            Canjes: {usedCount} / {maxRedemptions}
          </span>
          <span>{Math.round(usagePercentage)}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              usagePercentage > 85 ? "bg-amber-500" : "bg-purple-600"
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>

      {/* PIE: VIGENCIA + COPIAR */}
      <div className="flex items-center justify-between pt-5 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <CalendarBlank size={16} weight="bold" className="text-slate-300" />
          <span className={`text-[9px] font-black uppercase tracking-widest ${daysColor}`}>
            {daysLeft === null ? "Sin fecha" : daysLeft > 0 ? `${daysLeft}d restantes` : "Vencido"}
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
          {copied ? "Copiado" : "Código"}
        </button>
      </div>

      <CouponStatsModal
        isOpen={statsOpen}
        coupon={campaign}
        onClose={() => setStatsOpen(false)}
      />
    </div>
  );
};

export default ReferralCard;
