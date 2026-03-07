import { useState, useEffect } from "react";

const CategoryFilter = ({ onCategoryChange, activeCategory, type }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Le pedimos al backend las categorías según su tipo (RETAIL o INSUMO)
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("sbeltic_token"); // 🔑 Obtenemos el token
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/categories?type=${type}`,
          {
            headers: { Authorization: `Bearer ${token}` }, // 🛡️ Pasamos la seguridad
          },
        );

        const data = await response.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error("Error cargando categorías:", error);
      }
    };

    fetchCategories();
  }, [type]);

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onCategoryChange("all")}
        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
          activeCategory === "all"
            ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
            : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
        }`}
      >
        TODOS
      </button>

      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => onCategoryChange(cat._id)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
            activeCategory === cat._id
              ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
              : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
          }`}
        >
          {cat.name.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
