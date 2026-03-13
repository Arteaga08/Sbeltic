import { WarningCircle, Calendar, Prohibit } from "@phosphor-icons/react";

const StatusBadge = ({ isLowStock, hasExpiringBatch, isExpired }) => {
  // Si no hay ninguna alerta, no renderizamos nada
  if (!isLowStock && !hasExpiringBatch && !isExpired) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
      {/* 🔴 ESTADO: YA CADUCÓ (CRÍTICO) */}
      {isExpired && (
        <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-black text-white bg-rose-600 rounded-full shadow-lg shadow-rose-200 animate-bounce">
          <Prohibit size={14} weight="bold" />
          CADUCADO
        </span>
      )}

      {/* ⚠️ ESTADO: PRÓXIMO A VENCER (PREVENTIVO) */}
      {hasExpiringBatch && !isExpired && (
        <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full shadow-sm">
          <Calendar size={14} weight="bold" />
          PRÓX. VENCER
        </span>
      )}

      {/* 📉 ESTADO: STOCK BAJO */}
      {isLowStock && (
        <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-full animate-pulse">
          <WarningCircle size={14} weight="bold" />
          STOCK BAJO
        </span>
      )}
    </div>
  );
};

export default StatusBadge;
