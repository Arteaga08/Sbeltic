"use client";

import { Package } from "@phosphor-icons/react";

export default function CriticalStockWidget({ products }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-rose-500 rounded-full" />
          <h3 className="text-[9px] font-black uppercase tracking-widest text-rose-500">
            Stock Crítico
          </h3>
        </div>
        {products.length > 0 && (
          <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
            {products.length}
          </span>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
            <Package size={24} weight="bold" className="text-emerald-400" />
          </div>
          <p className="text-xs font-bold text-slate-400">Todo en orden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.slice(0, 6).map((product) => (
            <div
              key={product._id}
              className="flex items-center gap-3 p-2.5 bg-rose-50 rounded-2xl"
            >
              <div className="w-8 h-8 bg-rose-200 rounded-xl flex items-center justify-center shrink-0">
                <Package size={14} weight="bold" className="text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-xs text-slate-800 truncate">
                  {product.name}
                </p>
                <p className="text-[9px] text-slate-400">
                  Mín: {product.minStockAlert} {product.unit || "uds"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-rose-600 leading-none">
                  {product.currentStock}
                </p>
                <p className="text-[8px] text-slate-400">{product.unit || "uds"}</p>
              </div>
            </div>
          ))}
          {products.length > 6 && (
            <p className="text-center text-[9px] font-bold text-slate-400 pt-1">
              +{products.length - 6} más
            </p>
          )}
        </div>
      )}
    </div>
  );
}
