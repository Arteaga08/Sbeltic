import { MagnifyingGlass, Plus } from "@phosphor-icons/react";

const InventoryHeader = ({ onSearch, onAdd }) => {
  return (
    <header className="flex flex-col items-center text-center gap-8 mb-12 md:flex-row md:items-end md:justify-between md:text-left">
      <div className="space-y-2">
        <h2 className="text-4xl md:text-5xl font-extrabold italic uppercase text-slate-900 leading-none">
          Inventario
        </h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Control de insumos y retail Sbeltic
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row w-full md:w-auto">
        {/* Buscador */}
        <div className="relative w-full group sm:w-auto">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"
            size={18}
            weight="bold"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            className="w-full py-2.5 pl-10 pr-4 text-sm transition-all bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Botón Nuevo */}
        <button
          onClick={onAdd}
          className="flex items-center justify-center w-full gap-2 px-6 py-3 text-sm font-bold text-white transition-all bg-indigo-600 shadow-lg rounded-xl hover:bg-indigo-700 shadow-indigo-200 active:scale-95 sm:w-auto"
        >
          <Plus size={18} weight="bold" />
          <span className="uppercase tracking-wider">Nuevo Producto</span>
        </button>
      </div>
    </header>
  );
};

export default InventoryHeader;
