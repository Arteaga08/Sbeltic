"use client";
import { useState, useEffect, useCallback } from "react";
import {
  FirstAidKit,
  Tote,
  ArrowLeft,
  Plus,
  Tag,
  Archive,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import UrgentAlerts from "@/components/inventory/UrgentAlerts";
import InventoryWidget from "@/components/inventory/InventoryWidget";
import NewProductModal from "@/components/modal/NewProductModal";
import CategoryManagerModal from "@/components/modal/CategoryManagerModal";
import EditProductModal from "@/components/modal/EditProductModal";

// 🔥 AGREGAMOS LA IMPORTACIÓN DEL NUEVO COMPONENTE
import ProductDetailsDrawer from "@/components/inventory/ProductDetailsDrawer";

export default function InventoryPage() {
  // Estados de Vista y Datos
  const [currentView, setCurrentView] = useState("HUB"); // 'HUB', 'INSUMO', 'RETAIL'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de Modales y Drawer
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // 🔥 ESTADO PARA EL DRAWER DE DETALLES
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Carga centralizada de productos
  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem("sbeltic_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error(data.message || "Error al cargar productos");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (productToDisable) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de desactivar "${productToDisable.name}"?\nYa no aparecerá en el catálogo activo.`,
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("sbeltic_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${productToDisable._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Producto desactivado exitosamente");
        setSelectedProduct(null); // Cierra el Drawer
        fetchProducts(); // Recarga la lista para que desaparezca
      } else {
        toast.error(data.message || "Error al desactivar el producto");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 rounded-full border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const medicalCount = products.filter(
    (p) => p.category?.type === "INSUMO",
  ).length;
  const retailCount = products.filter(
    (p) => p.category?.type === "RETAIL",
  ).length;

  // ==========================================
  // VISTA 1: EL HUB PRINCIPAL
  // ==========================================
  if (currentView === "HUB") {
    return (
      <div className="space-y-10 p-4 md:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
        <header className="space-y-2 text-center md:text-left mb-8">
          <h2 className="text-4xl md:text-5xl font-extrabold italic uppercase text-slate-900 leading-none">
            Inventario
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Panel Central de Sbeltic
          </p>
        </header>

        <UrgentAlerts products={products} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta Insumos Médicos */}
          <button
            onClick={() => setCurrentView("INSUMO")}
            className="group relative flex flex-col p-8 text-left transition-all bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 transition-transform bg-indigo-50 rounded-full group-hover:scale-150 duration-500"></div>
            <div className="relative z-10 p-4 mb-6 text-white bg-indigo-600 rounded-2xl w-fit shadow-lg shadow-indigo-200">
              <FirstAidKit size={32} weight="duotone" />
            </div>
            <h3 className="relative z-10 text-2xl font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
              Insumos Médicos
            </h3>
            <p className="relative z-10 mt-2 font-medium text-slate-500">
              Material clínico, toxinas, rellenos y consumibles de cabina.
            </p>
            <div className="relative z-10 mt-8">
              <span className="px-4 py-2 text-sm font-bold text-indigo-700 bg-indigo-100 rounded-full">
                {medicalCount} Registros
              </span>
            </div>
          </button>

          {/* Tarjeta Retail */}
          <button
            onClick={() => setCurrentView("RETAIL")}
            className="group relative flex flex-col p-8 text-left transition-all bg-white border-2 border-slate-100 rounded-3xl hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-100 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 transition-transform bg-emerald-50 rounded-full group-hover:scale-150 duration-500"></div>
            <div className="relative z-10 p-4 mb-6 text-white bg-emerald-500 rounded-2xl w-fit shadow-lg shadow-emerald-200">
              <Tote size={32} weight="duotone" />
            </div>
            <h3 className="relative z-10 text-2xl font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
              Productos Venta
            </h3>
            <p className="relative z-10 mt-2 font-medium text-slate-500">
              Skincare, tratamientos de apoyo en casa y retail para pacientes.
            </p>
            <div className="relative z-10 mt-8">
              <span className="px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-100 rounded-full">
                {retailCount} Registros
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: DETALLE (INSUMO O RETAIL)
  // ==========================================
  const isMedical = currentView === "INSUMO";
  const viewProducts = products.filter((p) => p.category?.type === currentView);

  return (
    <div className="space-y-8 p-4 md:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden animate-in slide-in-from-right-8 duration-300">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4">
          <button
            onClick={() => setCurrentView("HUB")}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} weight="bold" /> Volver al Hub
          </button>
          <div>
            <h2
              className={`text-4xl md:text-5xl font-extrabold italic uppercase leading-none ${isMedical ? "text-indigo-900" : "text-emerald-900"}`}
            >
              {isMedical ? "Insumos" : "Retail"}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
              Gestión específica de {isMedical ? "clínica" : "ventas"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-bold text-slate-600 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all sm:w-auto shadow-sm"
          >
            <Tag size={18} weight="bold" />
            <span className="uppercase tracking-wider">Categorías</span>
          </button>

          <button
            onClick={() => setIsProductModalOpen(true)}
            className={`flex items-center justify-center w-full gap-2 px-6 py-2.5 text-sm font-bold text-white shadow-lg rounded-xl transition-all active:scale-95 sm:w-auto ${isMedical ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"}`}
          >
            <Plus size={18} weight="bold" />
            <span className="uppercase tracking-wider">Nuevo Producto</span>
          </button>
        </div>
      </header>

      {/* 🔥 LE PASAMOS LA FUNCIÓN ONPRODUCTCLICK AL WIDGET */}
      <InventoryWidget
        title={`Catálogo de ${isMedical ? "Insumos" : "Venta"}`}
        icon={isMedical ? FirstAidKit : Tote}
        type={currentView}
        products={viewProducts}
        onProductClick={(product) => setSelectedProduct(product)}
      />

      {/* Modales Compartidos */}
      <NewProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onRefresh={fetchProducts}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        type={currentView}
      />

      {/* 🔥 AGREGAMOS EL DRAWER AL FINAL (Invisible hasta que se selecciona algo) */}

      <ProductDetailsDrawer
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
        onEdit={(prod) => {
          setSelectedProduct(null);
          setProductToEdit(prod);
        }}
        onDelete={handleDeleteProduct}
        onRefresh={fetchProducts}
      />
      <EditProductModal
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        product={productToEdit}
        onRefresh={() => {
          fetchProducts();
          // Opcional: si quieres re-abrir el drawer con los datos frescos
          // setSelectedProduct(productToEdit);
        }}
      />
    </div>
  );
}
