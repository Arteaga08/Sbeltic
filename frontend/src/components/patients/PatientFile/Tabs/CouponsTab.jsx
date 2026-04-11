"use client";
import { useState } from "react";
import {
  Tag,
  CalendarBlank,
  Copy,
  Check,
  Gift,
  Users,
  Sun,
  ShoppingCart,
  Cake,
  Wrench,
} from "@phosphor-icons/react";
import { toast } from "sonner";

const TYPE_CONFIG = {
  WELCOME: { label: "Bienvenida", icon: Gift, color: "bg-indigo-50 text-indigo-600" },
  REFERRAL: { label: "Referido", icon: Users, color: "bg-purple-50 text-purple-600" },
  SEASONAL: { label: "Temporada", icon: Sun, color: "bg-amber-50 text-amber-600" },
  CLEARANCE: { label: "Liquidacion", icon: ShoppingCart, color: "bg-rose-50 text-rose-600" },
  BIRTHDAY: { label: "Cumpleanos", icon: Cake, color: "bg-pink-50 text-pink-600" },
  MAINTENANCE: { label: "Mantenimiento", icon: Wrench, color: "bg-emerald-50 text-emerald-600" },
};

const CouponCard = ({ coupon }) => {
  const [copied, setCopied] = useState(false);

  const {
    code,
    type,
    discountType,
    discountValue,
    usedCount = 0,
    maxRedemptions = 1,
    expiresAt,
    isActive,
    applicableCategory,
    minPurchase,
  } = coupon;

  const now = new Date();
  const expired = new Date(expiresAt) < now;
  const exhausted = usedCount >= maxRedemptions;
  const isUsable = isActive && !expired && !exhausted;

  const displayDiscount =
    discountType === "PERCENTAGE" ? `${discountValue}%` : `$${discountValue}`;

  const daysLeft = Math.ceil(
    (new Date(expiresAt) - now) / (1000 * 60 * 60 * 24)
  );
  const daysColor =
    daysLeft <= 0
      ? "text-rose-500"
      : daysLeft <= 3
        ? "text-rose-500"
        : daysLeft <= 7
          ? "text-amber-500"
          : "text-slate-400";

  const typeInfo = TYPE_CONFIG[type] || TYPE_CONFIG.WELCOME;
  const TypeIcon = typeInfo.icon;

  const statusConfig = isUsable
    ? { label: "Disponible", bg: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" }
    : expired
      ? { label: "Vencido", bg: "bg-rose-50 text-rose-600", dot: "bg-rose-500" }
      : exhausted
        ? { label: "Agotado", bg: "bg-slate-100 text-slate-500", dot: "bg-slate-400" }
        : { label: "Inactivo", bg: "bg-slate-100 text-slate-500", dot: "bg-slate-400" };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Codigo copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-white border-2 ${isUsable ? "border-slate-50" : "border-slate-100 opacity-70"} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all`}
    >
      {/* STATUS + TIPO */}
      <div className="flex justify-between items-start mb-6">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig.bg}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isUsable ? "animate-pulse" : ""} ${statusConfig.dot}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">
            {statusConfig.label}
          </span>
        </div>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${typeInfo.color}`}>
          <TypeIcon size={12} weight="fill" />
          <span className="text-[8px] font-black uppercase tracking-widest">
            {typeInfo.label}
          </span>
        </div>
      </div>

      {/* CODIGO + DESCUENTO */}
      <div className="space-y-1 mb-6">
        <h4 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">
          {code}
        </h4>
        <div className="flex items-center gap-2">
          <Tag size={14} weight="fill" className="text-indigo-600" />
          <p className="text-indigo-600 font-black text-xs uppercase tracking-widest">
            {displayDiscount} OFF
          </p>
        </div>
      </div>

      {/* RESTRICCIONES */}
      {(applicableCategory || minPurchase > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {applicableCategory && (
            <span className="text-[8px] font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 uppercase tracking-widest">
              Solo {applicableCategory}
            </span>
          )}
          {minPurchase > 0 && (
            <span className="text-[8px] font-black px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 uppercase tracking-widest">
              Min. ${minPurchase}
            </span>
          )}
        </div>
      )}

      {/* METRICAS */}
      <div className="space-y-2.5 mb-6">
        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span>Canjes: {usedCount} / {maxRedemptions}</span>
          <span>{Math.round(Math.min((usedCount / maxRedemptions) * 100, 100))}%</span>
        </div>
        <div className="w-full h-2 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              usedCount / maxRedemptions > 0.85 ? "bg-amber-500" : "bg-indigo-600"
            }`}
            style={{ width: `${Math.min((usedCount / maxRedemptions) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* PIE: VIGENCIA + COPIAR */}
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

const CouponsTab = ({ patient }) => {
  const coupons = patient?.walletCoupons || [];

  const activeCoupons = coupons.filter((c) => {
    const now = new Date();
    return c.isActive && new Date(c.expiresAt) > now && c.usedCount < c.maxRedemptions;
  });
  const inactiveCoupons = coupons.filter((c) => !activeCoupons.includes(c));

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* HEADER */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black italic uppercase text-slate-900 tracking-tight">
              Cartera de Cupones
            </h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {coupons.length} {coupons.length === 1 ? "cupon" : "cupones"} en cartera
              {activeCoupons.length > 0 && ` • ${activeCoupons.length} disponibles`}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50">
            <Tag size={14} weight="fill" className="text-indigo-600" />
            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
              Wallet
            </span>
          </div>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className="py-20 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
          <Tag size={32} weight="thin" className="text-slate-200 mx-auto mb-3" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Aun no hay cupones en la cartera
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* CUPONES DISPONIBLES */}
          {activeCoupons.length > 0 && (
            <div className="space-y-4">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                Disponibles ({activeCoupons.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeCoupons.map((coupon) => (
                  <CouponCard key={coupon._id} coupon={coupon} />
                ))}
              </div>
            </div>
          )}

          {/* CUPONES VENCIDOS / AGOTADOS */}
          {inactiveCoupons.length > 0 && (
            <div className="space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Vencidos / Agotados ({inactiveCoupons.length})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inactiveCoupons.map((coupon) => (
                  <CouponCard key={coupon._id} coupon={coupon} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponsTab;
