"use client";
import { useState, useEffect } from "react";
import { FirstAidKit, Tote } from "@phosphor-icons/react";
import { toast } from "sonner";

// Ajusta las rutas de importación según tu estructura de carpetas
import InventoryHeader from "@/components/inventory/InventoryHeader";
import UrgentAlerts from "@/components/inventory/UrgentAlerts";
import InventoryWidget from "@/components/inventory/InventoryWidget";

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Cargar productos desde el backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("sbeltic_token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();

        if (data.success) {
          setProducts(data.data);
          // No ponemos toast de éxito aquí para no saturar al entrar a la página
        } else {
          toast.error(data.message || "Error al cargar productos");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error de conexión con el servidor"); // 🔥 Feedback visual
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 2. Buscador en tiempo real
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 3. Separación de Widgets
  const medicalProducts = filteredProducts.filter(
    (p) => p.category?.type === "INSUMO",
  );
  const retailProducts = filteredProducts.filter(
    (p) => p.category?.type === "RETAIL",
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 rounded-full border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-white md:p-8">
      {/* Cabecera y Buscador */}
      <InventoryHeader
        onSearch={setSearchTerm}
        onAdd={() => console.log("Abrir modal de nuevo producto")}
      />

      {/* Alertas Críticas (Aparece solo si es necesario) */}
      <UrgentAlerts products={products} />

      {/* Grid de Widgets */}
      <div className="grid grid-cols-1 gap-8">
        {/* Widget 1: Insumos Médicos */}
        <InventoryWidget
          title="Insumos Médicos"
          icon={FirstAidKit}
          type="INSUMO"
          products={medicalProducts}
        />

        {/* Widget 2: Productos Comerciales */}
        <InventoryWidget
          title="Productos Comerciales"
          icon={Tote}
          type="RETAIL"
          products={retailProducts}
        />
      </div>
    </div>
  );
}
