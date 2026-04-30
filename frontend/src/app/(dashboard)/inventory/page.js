"use client";
import { useState, useEffect, useCallback } from "react";
import { FirstAidKit, Tote, ArrowLeft, Plus, Tag } from "@phosphor-icons/react";
import { toast } from "sonner";

import UrgentAlerts from "@/components/inventory/UrgentAlerts";
import InventoryWidget from "@/components/inventory/InventoryWidget";
import NewProductModal from "@/components/modal/NewProductModal";
import CategoryManagerModal from "@/components/modal/CategoryManagerModal";
import EditProductModal from "@/components/modal/EditProductModal";
import ProductDetailsDrawer from "@/components/inventory/ProductDetailsDrawer";

export default function InventoryPage() {
  const [currentView, setCurrentView] = useState("HUB");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
        setSelectedProduct(null);
        fetchProducts();
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

  if (currentView === "HUB") {
    return (
      <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 md:mb-12">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold italic uppercase text-slate-900 leading-none">
              INVENTARIO
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              PANEL CENTRAL DE SBELTIC
            </p>
          </div>
        </header>

        <div className="w-full max-w-full overflow-hidden mb-6">
          <UrgentAlerts products={products} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
          {/* Tarjeta Insumos */}
          <button
            onClick={() => setCurrentView("INSUMO")}
            className="flex flex-col items-center p-4 md:p-8 text-center bg-white rounded-2xl md:rounded-4xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all border border-transparent hover:border-indigo-50 active:scale-95 w-full"
          >
            <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
              <FirstAidKit size={32} weight="fill" />
            </div>
            <h3 className="text-sm md:text-lg font-black italic text-slate-800 uppercase tracking-tight leading-tight">
              INSUMOS MÉDICOS
            </h3>
            <p className="mt-1 md:mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              {medicalCount} REGISTROS
            </p>
          </button>

          {/* Tarjeta Retail */}
          <button
            onClick={() => setCurrentView("RETAIL")}
            className="flex flex-col items-center p-4 md:p-8 text-center bg-white rounded-2xl md:rounded-4xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all border border-transparent hover:border-emerald-50 active:scale-95 w-full"
          >
            <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 mb-3 md:mb-4 bg-emerald-50 rounded-2xl text-emerald-500 shrink-0">
              <Tote size={32} weight="fill" />
            </div>
            <h3 className="text-sm md:text-lg font-black italic text-slate-800 uppercase tracking-tight leading-tight">
              PRODUCTOS VENTA
            </h3>
            <p className="mt-1 md:mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              {retailCount} REGISTROS
            </p>
          </button>
        </div>
      </div>
    );
  }

  const isMedical = currentView === "INSUMO";
  const viewProducts = products.filter((p) => p.category?.type === currentView);

  return (
    <div className="space-y-6 p-4 md:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden animate-in slide-in-from-right-8 duration-300">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-4 w-full">
          <button
            onClick={() => setCurrentView("HUB")}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} weight="bold" /> Volver al Hub
          </button>
          <div className="w-full">
            <h2
              className={`text-4xl md:text-5xl font-extrabold italic uppercase leading-none ${isMedical ? "text-indigo-900" : "text-emerald-900"}`}
            >
              {isMedical ? "Insumos" : "Retail"}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              Gestión específica de {isMedical ? "clínica" : "ventas"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
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

      <div className="w-full max-w-full">
        <InventoryWidget
          title={`Catálogo de ${isMedical ? "Insumos" : "Venta"}`}
          icon={isMedical ? FirstAidKit : Tote}
          type={currentView}
          products={viewProducts}
          onProductClick={(product) => setSelectedProduct(product)}
        />
      </div>

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
        }}
      />
    </div>
  );
}
