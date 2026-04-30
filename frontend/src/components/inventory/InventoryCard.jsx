import {
  CaretRight,
  Flask,
  Archive,
  Hash,
  Calendar,
} from "@phosphor-icons/react";
import StatusBadge from "./StatusBadge";

const InventoryCard = ({ product }) => {
  const {
    name,
    sku,
    brand,
    amount,
    currentStock,
    unit,
    category,
    salePrice,
    isLowStock,
    hasExpiringBatch,
    expiryDate, // Asumimos que el backend puede enviar la fecha más próxima aquí
    nextExpiryDate,
  } = product;

  const isMedical = category?.type === "INSUMO";
  const displayExpiry = expiryDate || nextExpiryDate;

  return (
    <div className="relative flex flex-col h-full p-3 md:p-5 transition-all bg-white border border-slate-200 rounded-3xl hover:shadow-xl hover:shadow-indigo-100/50 hover:border-indigo-300 group">
      <div className="absolute z-10 top-4 right-4">
        <StatusBadge
          isLowStock={isLowStock}
          hasExpiringBatch={hasExpiringBatch}
        />
      </div>

      <div className="flex flex-col grow mt-2">
        {/* IDENTIFICACIÓN: CATEGORÍA, MARCA Y SKU */}
        <div className="flex items-center flex-wrap gap-2 text-[10px] font-black tracking-widest text-indigo-500 uppercase mb-1">
          <span>{category?.name || "Sin Categoría"}</span>
          {brand && (
            <>
              <span className="w-1 h-1 bg-indigo-300 rounded-full"></span>
              <span className="text-slate-400">{brand}</span>
            </>
          )}
          {sku && (
            <>
              <span className="w-1 h-1 bg-indigo-300 rounded-full"></span>
              <span className="flex items-center gap-1 text-slate-400">
                <Hash size={10} weight="bold" />
                {sku}
              </span>
            </>
          )}
        </div>

        <h3 className="text-sm sm:text-lg font-bold leading-tight text-slate-800 group-hover:text-indigo-600 line-clamp-2 pr-10 sm:pr-14">
          {name}
        </h3>

        {/* 🌟 FILA DE PRESENTACIÓN Y CADUCIDAD */}
        <div className="flex items-center gap-2 mt-3">
          {amount && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg">
              <Flask size={12} weight="bold" className="text-slate-400" />
              {amount}
            </span>
          )}

          {displayExpiry && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg border border-rose-100">
              <Calendar size={12} weight="bold" />
              {new Date(displayExpiry).toLocaleDateString("es-MX", {
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 md:gap-4 pt-3 mt-auto border-t border-slate-100">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Archive size={12} /> Stock Físico
            </p>
            <p
              className={`text-lg md:text-2xl font-black flex items-baseline gap-1 ${isLowStock ? "text-rose-600" : "text-slate-900"}`}
            >
              {currentStock}
              <span className="text-slate-300 font-medium mx-0.5">/</span>
              <span className="text-sm text-slate-400 font-bold">
                {product.totalStock || currentStock}
              </span>
            </p>
          </div>

          <div className="text-right border-l border-slate-100 pl-2 md:pl-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Precio Venta
            </p>
            <p className="text-sm md:text-xl font-bold text-emerald-600 truncate">
              ${salePrice?.toLocaleString("es-MX") || "0"}
            </p>
          </div>
        </div>

        <button className="flex items-center justify-center w-full gap-2 py-2 md:py-3 mt-3 md:mt-5 text-sm font-bold transition-all bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white">
          Ver Lotes y Detalles
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
};

export default InventoryCard;
