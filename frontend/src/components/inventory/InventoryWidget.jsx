"use client";
import { useState } from "react";
import InventoryCard from "./InventoryCard";
import CategoryFilter from "./CategoryFilter";

// 1. Agregamos onProductClick a las props
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
    <div className="p-4 sm:p-6 border bg-slate-50/50 rounded-3xl border-slate-200">
      {/* Cabecera del Widget */}
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="p-2 text-white bg-indigo-600 rounded-lg shadow-md shadow-indigo-200 shrink-0">
            <Icon size={24} weight="fill" />
          </div>
        )}
        <h2 className="flex-1 text-lg font-black tracking-tight uppercase sm:text-xl text-slate-800">
          {title}
        </h2>
        <span className="px-3 py-1 ml-auto text-xs font-bold text-slate-500 bg-slate-200 rounded-full shrink-0 whitespace-nowrap">
          {displayedProducts.length} Items
        </span>
      </div>

      <CategoryFilter
        type={type}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedProducts.map((product) => (
          /* 2. Envolvemos la tarjeta con el evento onClick */
          <div
            key={product._id}
            onClick={() => onProductClick(product)}
            className="cursor-pointer active:scale-[0.98] transition-transform"
          >
            <InventoryCard product={product} />
          </div>
        ))}

        {/* Estado Vacío */}
        {displayedProducts.length === 0 && (
          <div className="py-10 text-center border-2 border-dashed col-span-full border-slate-200 rounded-2xl">
            <p className="font-medium text-slate-400">
              No hay productos para mostrar en esta sección.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryWidget;
