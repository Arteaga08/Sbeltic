"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  PencilSimple,
  Trash,
  Package,
  Flask,
  Archive,
  WarningCircle,
  Hash,
  QrCode,
  DownloadSimple,
  CurrencyDollar,
  Plus,
  Calendar,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

import NewBatchModal from "@/components/modal/NewBatchModal";

const ProductDetailsDrawer = ({
  isOpen,
  onClose,
  product,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const qrRef = useRef();

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      // 🌟 FIX: Rompemos la caché de Next.js agregando timestamp y cache: 'no-store'
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/batches?productId=${product._id}&t=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await res.json();
      if (data.success) setBatches(data.data);
    } catch (error) {
      toast.error("Error al cargar lotes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product?._id) {
      fetchBatches();
    }
  }, [isOpen, product]);

  const totalInitialQuantity = batches.reduce(
    (acc, b) => acc + (b.initialQuantity || 0),
    0,
  );

  // 🌟 LÓGICA: Encontrar la fecha de caducidad más cercana entre los lotes activos
  const closestExpiry = useMemo(() => {
    const activeBatches = batches.filter(
      (b) => b.status === "AVAILABLE" && b.expiryDate,
    );
    if (activeBatches.length === 0) return null;
    return activeBatches.sort(
      (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate),
    )[0].expiryDate;
  }, [batches]);

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector("canvas");
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `QR_${product.sku}.png`;
    link.click();
    toast.success("QR Descargado");
  };

  if (!product) return null;

  return (
    <>
      <div
        className={`fixed inset-0 w-screen h-screen z-9998 bg-slate-900/50 backdrop-blur-md transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 z-9999 w-full md:w-125 bg-white shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Package size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-indigo-500 uppercase">
                {product.category?.name || "Categoría"}
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase italic leading-tight mt-1">
                {product.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-rose-500"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pb-32 space-y-8 scrollbar-hide">
          <div className="flex gap-3">
            <button
              onClick={() => onEdit(product)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-indigo-50 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-600 hover:text-white transition-all text-xs uppercase tracking-widest"
            >
              <PencilSimple size={18} weight="bold" /> Editar
            </button>
            <button
              onClick={() => onDelete(product)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-600 hover:text-white transition-all text-xs uppercase tracking-widest"
            >
              <Trash size={18} weight="bold" /> Desactivar
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-sm space-y-6">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-50 pb-3 text-center">
              Información General
            </h3>

            <div className="grid grid-cols-2 gap-y-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Marca
                </p>
                <p className="font-bold text-slate-800 mt-1 uppercase italic text-lg">
                  {product.brand || "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  SKU / Código
                </p>
                <p className="font-bold text-indigo-600 mt-1 lowercase italic flex justify-end items-center gap-1">
                  <Hash size={12} weight="bold" /> {product.sku}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-widest">
                  <Flask size={12} /> Presentación
                </p>
                <p className="font-black text-slate-800 mt-1 text-xl tracking-tighter italic">
                  {product.amount}{" "}
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {product.unit}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-end gap-1 tracking-widest">
                  <Archive size={12} /> Stock Físico
                </p>
                <div className="flex items-baseline justify-end gap-1 mt-1">
                  <span
                    className={`text-3xl font-black ${product.currentStock <= product.minStockAlert ? "text-rose-600" : "text-emerald-600"}`}
                  >
                    {product.currentStock}
                  </span>
                  <span className="text-slate-300 font-medium text-2xl">/</span>
                  <span className="text-lg font-bold text-slate-400">
                    {totalInitialQuantity || product.currentStock}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 tracking-widest">
                  <CurrencyDollar
                    size={14}
                    weight="bold"
                    className="text-emerald-500"
                  />{" "}
                  Precio Venta
                </p>
                <p className="font-black text-emerald-600 mt-1 text-2xl tracking-tighter italic">
                  ${product.salePrice?.toLocaleString("es-MX") || "0"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-end gap-1 tracking-widest">
                  <WarningCircle
                    size={14}
                    weight="bold"
                    className="text-amber-500"
                  />{" "}
                  Mínimo Stock
                </p>
                <p className="font-bold text-slate-800 mt-1 text-lg italic">
                  {product.minStockAlert}{" "}
                  <span className="text-[10px] text-slate-400 uppercase tracking-tighter">
                    uds
                  </span>
                </p>
              </div>

              {/* 🌟 NUEVA FILA: CADUCIDAD MÁS CERCANA */}
              <div className="col-span-2 border-t border-slate-50 pt-6 mt-2">
                <div className="flex items-center justify-between bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                      <Calendar size={20} weight="duotone" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                        Próxima Caducidad
                      </p>
                      <p className="font-black text-rose-600 text-lg italic leading-none mt-1">
                        {closestExpiry
                          ? new Date(closestExpiry).toLocaleDateString(
                              "es-MX",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "Sin lotes próximos"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 p-8 bg-slate-50 rounded-4xl border border-slate-100 mt-4">
              <div
                ref={qrRef}
                className="p-4 bg-white border border-slate-200 rounded-3xl shadow-inner"
              >
                <QRCodeCanvas value={product.sku} size={140} />
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-2">
                  <QrCode size={16} weight="bold" /> QR Identificador
                </p>
                <button
                  onClick={downloadQR}
                  className="mt-3 flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <DownloadSimple size={14} weight="bold" /> Descargar PNG
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE LOTES */}
          <div>
            <div className="flex items-center justify-between border-b border-indigo-50 pb-3 mb-5">
              <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]">
                Desglose de Lotes Activos
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
              >
                <Plus size={12} weight="bold" /> Ingresar Lote
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : batches.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-4xl border-2 border-dashed border-slate-100">
                <Archive size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No hay lotes registrados
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {batches.map((batch) => (
                  <div
                    key={batch._id}
                    className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all shadow-sm group"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        Lote:{" "}
                        <span className="text-indigo-600">
                          {batch.batchNumber || "SN"}
                        </span>
                      </p>
                      <p className="font-black text-slate-800 text-xl flex items-baseline gap-1">
                        {batch.currentQuantity}
                        <span className="text-slate-300 font-medium text-lg">
                          /
                        </span>
                        <span className="text-sm text-slate-400 font-bold">
                          {batch.initialQuantity}
                        </span>
                      </p>
                      {/* 🌟 NUEVO: FECHA DE INGRESO (AUDITORÍA) */}
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        Ingreso:{" "}
                        {batch.createdAt
                          ? new Date(batch.createdAt).toLocaleDateString(
                              "es-MX",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">
                        Vigente
                      </span>
                      {/* 🌟 MODIFICADO: ETIQUETA DE CADUCIDAD CLARA */}
                      <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                        Caduca:{" "}
                        {batch.expiryDate
                          ? new Date(batch.expiryDate).toLocaleDateString(
                              "es-MX",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "Sin caducidad"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <NewBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        productId={product?._id}
        onRefresh={() => {
          fetchBatches();
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};

export default ProductDetailsDrawer;
