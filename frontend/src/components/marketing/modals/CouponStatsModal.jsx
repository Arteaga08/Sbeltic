"use client";
import { useState, useEffect } from "react";
import {
  X,
  ChartLineUp,
  UserCircle,
  PaperPlaneTilt,
  Ticket,
  CalendarBlank,
} from "@phosphor-icons/react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useScrollLock } from "@/hooks/useScrollLock";

const API = process.env.NEXT_PUBLIC_API_URL;

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const CouponStatsModal = ({ isOpen, coupon, onClose }) => {
  useScrollLock(isOpen);
  const [data, setData] = useState(coupon || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !coupon?._id) return;
    let active = true;
    setData(coupon); // muestra lo que ya tenemos mientras carga el detalle
    setLoading(true);
    (async () => {
      try {
        const res = await fetchWithAuth(`${API}/coupons/${coupon._id}`);
        const json = await res.json();
        const detail = json.data ?? json;
        if (active && detail?._id) setData(detail);
      } catch {
        /* se queda con los datos básicos del card */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, coupon?._id, coupon]);

  if (!isOpen || !coupon) return null;

  const {
    code,
    name,
    description,
    type,
    usedCount = 0,
    maxRedemptions = 1,
    expiresAt,
    createdAt,
    usedBy = [],
    sentTo = [],
  } = data || {};

  const pct = Math.round(Math.min((usedCount / maxRedemptions) * 100, 100));

  return (
    <div className="fixed inset-0 z-10010 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ChartLineUp size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase italic">
                {code}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {name || description || "Estadísticas del cupón"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X size={20} weight="bold" className="text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-hide">
          {/* MÉTRICAS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Canjes
              </p>
              <p className="text-2xl font-black text-indigo-600 leading-none">
                {usedCount}
                <span className="text-sm text-slate-400">/{maxRedemptions}</span>
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Utilización
              </p>
              <p className="text-2xl font-black text-emerald-600 leading-none">{pct}%</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Creado
              </p>
              <p className="text-xs font-black text-slate-600">{formatDate(createdAt)}</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Vence
              </p>
              <p className="text-xs font-black text-slate-600">{formatDate(expiresAt)}</p>
            </div>
          </div>

          {type && (
            <div className="flex items-center gap-1.5">
              <Ticket size={12} weight="fill" className="text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Tipo: {type}
              </span>
            </div>
          )}

          {/* QUIÉN LO USÓ */}
          <div>
            <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-100 pb-2 mb-3 flex items-center gap-2">
              <UserCircle size={14} weight="fill" /> Quién lo usó ({usedBy.length})
            </h3>
            {usedBy.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 italic py-4 text-center">
                {loading ? "Cargando..." : "Aún no se ha canjeado"}
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-hide">
                {usedBy.map((u, i) => (
                  <div
                    key={u._id || i}
                    className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate">
                        {u.patientId?.name || "Paciente eliminado"}
                      </p>
                      {u.patientId?.phone && (
                        <p className="text-[10px] text-slate-400">{u.patientId.phone}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                      <CalendarBlank size={12} weight="bold" />
                      <span className="text-[10px] font-bold">{formatDate(u.usedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ENVIADO A (campañas WhatsApp) */}
          {sentTo.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase text-emerald-600 tracking-widest border-b border-emerald-100 pb-2 mb-3 flex items-center gap-2">
                <PaperPlaneTilt size={14} weight="fill" /> Enviado a ({sentTo.length})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-hide">
                {sentTo.map((s, i) => (
                  <div
                    key={s._id || i}
                    className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2"
                  >
                    <p className="text-sm font-bold text-slate-700 truncate">
                      {s.patientId?.name || "Paciente eliminado"}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {formatDate(s.sentAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponStatsModal;
