import { Warning } from "@phosphor-icons/react";

const UrgentAlerts = ({ products }) => {
  // Filtramos solo los que tienen alertas activas
  const alerts = products.filter((p) => p.isLowStock || p.hasExpiringBatch);

  if (alerts.length === 0) return null;

  return (
    <div className="p-4 mb-8 border bg-rose-50 border-rose-100 rounded-3xl w-full overflow-hidden">
      <div className="flex items-center gap-2 px-2 mb-4 text-rose-700">
        <Warning size={24} weight="bold" />
        <h2 className="font-black tracking-tighter uppercase">
          Atención Inmediata
        </h2>
      </div>

      {/* Móvil: stack vertical compacto, sin scroll horizontal */}
      <div className="flex flex-col gap-2 sm:hidden">
        {alerts.map((product) => (
          <div
            key={product._id}
            className="flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-rose-100"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase text-rose-500 truncate">
                {product.category?.name}
              </p>
              <h4 className="font-bold text-sm truncate text-slate-800">
                {product.name}
              </h4>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {product.currentStock} {product.unit}
              </span>
            </div>
            <span className="shrink-0 text-[10px] px-2 py-1 bg-rose-600 text-white font-black rounded-lg uppercase shadow-sm shadow-rose-200 whitespace-nowrap">
              {product.isLowStock ? "Stock Crítico" : "Caducidad"}
            </span>
          </div>
        ))}
      </div>

      {/* sm+: carrusel snap-scroll horizontal */}
      <div className="hidden sm:flex gap-3 pb-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory w-full">
        {alerts.map((product) => (
          <div
            key={product._id}
            className="w-auto min-w-65 shrink-0 snap-start p-4 bg-white rounded-2xl shadow-sm border border-rose-100"
          >
            <p className="text-xs font-bold uppercase text-rose-500 truncate">
              {product.category?.name}
            </p>
            <h4 className="font-bold truncate text-slate-800">
              {product.name}
            </h4>
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className="text-sm font-medium text-slate-500 whitespace-nowrap">
                {product.currentStock} {product.unit}
              </span>
              <span className="text-[10px] px-2 py-1 bg-rose-600 text-white font-black rounded-lg uppercase shadow-sm shadow-rose-200 whitespace-nowrap">
                {product.isLowStock ? "Stock Crítico" : "Caducidad"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UrgentAlerts;
