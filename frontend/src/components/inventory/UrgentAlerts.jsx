import { Warning } from "@phosphor-icons/react";

const UrgentAlerts = ({ products }) => {
  // Filtramos solo los que tienen alertas activas
  const alerts = products.filter((p) => p.isLowStock || p.hasExpiringBatch);

  if (alerts.length === 0) return null;

  return (
    <div className="p-4 mb-8 border bg-rose-50 border-rose-100 rounded-3xl">
      <div className="flex items-center gap-2 px-2 mb-4 text-rose-700">
        <Warning size={24} weight="bold" />
        <h2 className="font-black tracking-tighter uppercase">
          Atención Inmediata
        </h2>
      </div>

      <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide">
        {alerts.map((product) => (
          <div
            key={product._id}
            className="min-w-70 p-4 bg-white rounded-2xl shadow-sm border border-rose-100"
          >
            <p className="text-xs font-bold uppercase text-rose-500">
              {product.category?.name}
            </p>
            <h4 className="font-bold truncate text-slate-800">
              {product.name}
            </h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-slate-500">
                {product.currentStock} {product.unit}
              </span>
              <span className="text-[10px] px-2 py-1 bg-rose-600 text-white font-black rounded-lg uppercase shadow-sm shadow-rose-200">
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
