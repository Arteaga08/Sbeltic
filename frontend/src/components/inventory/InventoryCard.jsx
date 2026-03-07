import { CaretRight } from "@phosphor-icons/react";
import StatusBadge from "./StatusBadge";

const InventoryCard = ({ product }) => {
  const {
    name,
    currentStock,
    unit,
    category,
    salePrice,
    isLowStock,
    hasExpiringBatch,
  } = product;

  // Validamos si es insumo médico para ocultar el precio de venta
  const isMedical = category?.type === "INSUMO";

  return (
    <div className="relative p-5 transition-all bg-white border border-slate-200 rounded-2xl hover:shadow-xl hover:border-indigo-300 group">
      {/* Indicadores de Alerta (Semáforo) */}
      <div className="absolute top-4 right-4 z-10">
        <StatusBadge
          isLowStock={isLowStock}
          hasExpiringBatch={hasExpiringBatch}
        />
      </div>

      <div className="flex flex-col h-full mt-2">
        <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">
          {category?.name || "Sin Categoría"}
        </span>

        <h3 className="mt-1 text-lg font-bold text-slate-800 group-hover:text-indigo-600 line-clamp-2">
          {name}
        </h3>

        <div className="flex items-end justify-between pt-6 mt-auto">
          <div>
            <p className="text-sm text-slate-500">Stock disponible</p>
            <p
              className={`text-2xl font-black ${isLowStock ? "text-rose-600" : "text-slate-900"}`}
            >
              {currentStock}{" "}
              <span className="text-sm font-medium text-slate-400 uppercase">
                {unit}
              </span>
            </p>
          </div>

          {!isMedical && (
            <div className="text-right">
              <p className="text-sm text-slate-500">Precio Venta</p>
              <p className="text-xl font-bold text-emerald-600">
                ${salePrice?.toLocaleString("es-MX") || "0"}
              </p>
            </div>
          )}
        </div>

        {/* Botón de acción */}
        <button className="flex items-center justify-center w-full gap-2 py-2 mt-5 text-sm font-bold transition-colors bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white">
          Ver Detalles
          <CaretRight weight="bold" />
        </button>
      </div>
    </div>
  );
};

export default InventoryCard;
