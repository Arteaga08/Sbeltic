import { WarningCircle, Calendar } from "@phosphor-icons/react";

const StatusBadge = ({ isLowStock, hasExpiringBatch }) => {
  if (!isLowStock && !hasExpiringBatch) return null;

  return (
    <div className="flex gap-2">
      {isLowStock && (
        <span className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-bold text-rose-600 bg-rose-100 rounded-full animate-pulse shadow-sm shadow-rose-200">
          <WarningCircle size={16} weight="bold" />
          STOCK BAJO
        </span>
      )}
      {hasExpiringBatch && (
        <span className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-100 rounded-full shadow-sm shadow-amber-200">
          <Calendar size={16} weight="bold" />
          CADUCIDAD
        </span>
      )}
    </div>
  );
};

export default StatusBadge;
