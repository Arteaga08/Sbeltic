import { useState } from "react";
import InventoryCard from "./InventoryCard";
import CategoryFilter from "./CategoryFilter";

const InventoryWidget = ({ title, products, icon: Icon, type }) => {
  const [activeCategory, setActiveCategory] = useState("all");

  // Filtrado local: Solo muestra los productos de la categoría seleccionada
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
        {/* Agregamos flex-1 para que el título ocupe el espacio disponible sin empujar demás */}
        <h2 className="flex-1 text-lg font-black tracking-tight uppercase sm:text-xl text-slate-800">
          {title}
        </h2>
        {/* Aquí está la magia: shrink-0 y whitespace-nowrap */}
        <span className="px-3 py-1 ml-auto text-xs font-bold text-slate-500 bg-slate-200 rounded-full shrink-0 whitespace-nowrap">
          {displayedProducts.length} Items
        </span>
      </div>

      {/* Filtro Dinámico (Pide las categorías según el type: RETAIL o INSUMO) */}
      <CategoryFilter
        type={type}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayedProducts.map((product) => (
          <InventoryCard key={product._id} product={product} />
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
