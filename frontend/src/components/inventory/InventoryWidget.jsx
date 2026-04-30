"use client";
import { useState } from "react";
import InventoryCard from "./InventoryCard";
import CategoryFilter from "./CategoryFilter";

const InventoryWidget = ({
  title,
  products,
  icon: Icon,
  type,
  onProductClick,
}) => {
  const [activeCategory, setActiveCategory] = useState("all");

  const displayedProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category?._id === activeCategory);

  return (
    <div className="p-3 sm:p-6 border bg-slate-50/50 rounded-2xl sm:rounded-3xl border-slate-200 w-full max-w-full overflow-hidden">
      {/* Cabecera del Widget */}
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="p-2 text-white bg-indigo-600 rounded-lg shadow-md shadow-indigo-200 shrink-0">
            <Icon size={24} weight="fill" />
          </div>
        )}
        {/* 🔥 truncate asegura que un título largo no rompa la pantalla */}
        <h2 className="flex-1 text-base font-black tracking-tight uppercase sm:text-xl text-slate-800 truncate">
          {title}
        </h2>
        <span className="px-3 py-1 ml-auto text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-200 rounded-full shrink-0 whitespace-nowrap">
          {displayedProducts.length} Items
        </span>
      </div>

      {/* 🔥 Envolvemos el CategoryFilter en caso de que sea una fila larga de botones */}
      <div className="w-full overflow-x-auto scrollbar-hide pb-2 mb-4">
        <CategoryFilter
          type={type}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
        {displayedProducts.map((product) => (
          <div
            key={product._id}
            onClick={() => onProductClick(product)}
            className="cursor-pointer active:scale-[0.98] transition-transform min-w-0"
          >
            <InventoryCard product={product} />
          </div>
        ))}

        {/* Estado Vacío */}
        {displayedProducts.length === 0 && (
          <div className="py-10 text-center border-2 border-dashed col-span-full border-slate-200 rounded-2xl w-full">
            <p className="font-medium text-slate-400 text-sm">
              No hay productos para mostrar en esta sección.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryWidget;
