"use client";

import { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import AppointmentPDF from "./AppointmentPDF";

const STATUS_CONFIG = {
  PENDING: { label: "Pendiente", active: "bg-amber-400 text-white", dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmada", active: "bg-emerald-500 text-white", dot: "bg-emerald-500" },
  IN_PROGRESS: { label: "En curso", active: "bg-blue-500 text-white", dot: "bg-blue-500" },
  COMPLETED: { label: "Completada", active: "bg-teal-600 text-white", dot: "bg-teal-600" },
  CANCELLED: { label: "Cancelada", active: "bg-rose-500 text-white", dot: "bg-rose-500" },
  NO_SHOW: { label: "No asistió", active: "bg-slate-400 text-white", dot: "bg-slate-400" },
};

const TABS = ["Paciente", "Insumos", "Finanzas"];

const API = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  if (typeof window !== "undefined") return localStorage.getItem("sbeltic_token");
  return null;
}

export default function SuperModal({ appointment, isOpen, onClose, onSave, onCancelAppointment }) {
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState({});
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [supplySearch, setSupplySearch] = useState("");
  const [supplyResults, setSupplyResults] = useState([]);
  const [showSupplyDropdown, setShowSupplyDropdown] = useState(false);
  const [supplyType, setSupplyType] = useState("INSUMO");

  // Inicializar form cuando abre
  useEffect(() => {
    if (appointment && isOpen) {
      setForm({
        status: appointment.status,
        originalQuote: appointment.originalQuote || 0,
        consumedSupplies: appointment.consumedSupplies || [],
        consultationRecord: appointment.consultationRecord || {},
      });
      setCouponCode("");
      setCouponPreview(null);
      setCouponError("");
      setActiveTab(0);
      setSupplyType("INSUMO");
    }
  }, [appointment, isOpen]);

  // Buscar productos para insumos
  useEffect(() => {
    if (!supplySearch.trim()) {
      setSupplyResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/products?search=${encodeURIComponent(supplySearch)}&type=${supplyType}`,
          { headers: { Authorization: `Bearer ${getToken()}` } },
        );
        const data = await res.json();
        setSupplyResults(data.data?.slice(0, 6) || []);
        setShowSupplyDropdown(true);
      } catch {
        setSupplyResults([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [supplySearch, supplyType]);

  if (!isOpen || !appointment) return null;

  const patient = appointment.patientId || {};
  const doctor = appointment.doctorId || {};
  const apptTime = new Date(appointment.appointmentDate).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const apptDate = new Date(appointment.appointmentDate).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  const finalAmount =
    (form.originalQuote || 0) - (couponPreview?.discount || 0);

  // Validar cupón
  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    try {
      const res = await fetch(`${API}/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          patientId: patient._id,
          amount: form.originalQuote || 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const coupon = data.data;
        const discount =
          coupon.discountType === "PERCENTAGE"
            ? (form.originalQuote || 0) * (coupon.discountValue / 100)
            : coupon.discountValue;
        setCouponPreview({ code: coupon.code, discount, discountValue: coupon.discountValue, discountType: coupon.discountType });
      } else {
        setCouponError(data.message || "Cupón no válido");
        setCouponPreview(null);
      }
    } catch {
      setCouponError("Error al validar el cupón");
    }
  };

  // Guardar cambios
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        status: form.status,
        originalQuote: form.originalQuote,
        consumedSupplies: form.consumedSupplies,
        consultationRecord: form.consultationRecord,
        ...(couponPreview && { couponCode: couponPreview.code }),
      };

      const res = await fetch(`${API}/appointments/${appointment._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        onSave?.(data.data);
        onClose();
      } else {
        alert(data.message || "Error al guardar");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancelar cita
  const handleCancel = async () => {
    if (!confirm("¿Estás seguro de cancelar esta cita?")) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`${API}/appointments/${appointment._id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        onCancelAppointment?.(data.data?.appointment || appointment);
        onClose();
      } else {
        alert(data.message || "Error al cancelar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setIsCancelling(false);
    }
  };

  // Agregar insumo
  const addSupply = (product) => {
    const exists = form.consumedSupplies.find(
      (s) => String(s.productId) === String(product._id),
    );
    if (!exists) {
      setForm((f) => ({
        ...f,
        consumedSupplies: [
          ...f.consumedSupplies,
          { productId: product._id, productName: product.name, quantity: 1 },
        ],
      }));
    }
    setSupplySearch("");
    setShowSupplyDropdown(false);
  };

  const updateSupplyQty = (idx, qty) => {
    setForm((f) => {
      const supplies = [...f.consumedSupplies];
      supplies[idx] = { ...supplies[idx], quantity: Math.max(1, Number(qty)) };
      return { ...f, consumedSupplies: supplies };
    });
  };

  const removeSupply = (idx) => {
    setForm((f) => ({
      ...f,
      consumedSupplies: f.consumedSupplies.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-2xl rounded-t-4xl md:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] md:max-h-[88vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {apptDate} · {apptTime} · {appointment.roomId?.replace("_", " ")}
            </p>
            <h2 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
              {patient.name || "Paciente"}
            </h2>
            <p className="text-sm text-slate-500">{appointment.treatmentName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-colors text-slate-400 text-lg font-bold shrink-0 ml-4"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0 px-6">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-colors
                ${activeTab === i
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* TAB 0: Paciente */}
          {activeTab === 0 && (
            <div className="space-y-5">
              {/* Info paciente */}
              <div className="bg-slate-50 rounded-3xl p-4 space-y-1">
                <p className="text-lg font-black text-slate-900">{patient.name || "—"}</p>
                <p className="text-sm text-slate-500">{patient.phone || "Sin teléfono"}</p>
                <p className="text-sm text-slate-500">{patient.email || "Sin email"}</p>
              </div>

              {/* Info de la cita */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Tratamiento</p>
                  <p className="font-bold text-slate-800 text-sm">{appointment.treatmentName || "—"}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Doctor</p>
                  <p className="font-bold text-slate-800 text-sm">{doctor.name || "—"}</p>
                </div>
              </div>

              {/* Selector de estado */}
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Estado de la cita</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm((f) => ({ ...f, status: key }))}
                      className={`py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wide transition-all
                        ${form.status === key ? cfg.active : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón PDF */}
              <PDFDownloadLink
                document={<AppointmentPDF appointment={appointment} form={form} />}
                fileName={`Cita_${(patient.name || "Paciente").replace(/\s+/g, "_")}_${apptDate.replace(/[\s,]/g, "-")}.pdf`}
                className="block w-full"
              >
                {({ loading }) => (
                  <button
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black uppercase
                      text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📄</span>
                    {loading ? "Generando PDF..." : "Descargar Historial Médico PDF"}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          )}

          {/* TAB 1: Insumos */}
          {activeTab === 1 && (
            <div className="space-y-4">
              {/* Toggle Médico / Retail */}
              <div className="flex gap-2 bg-slate-100 rounded-xl p-1">
                {["INSUMO", "RETAIL"].map((type) => (
                  <button
                    key={type}
                    onClick={() => { setSupplyType(type); setSupplySearch(""); setSupplyResults([]); }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all
                      ${supplyType === type ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {type === "INSUMO" ? "Médico" : "Retail"}
                  </button>
                ))}
              </div>

              {/* Buscar insumo */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar insumo por nombre..."
                  value={supplySearch}
                  onChange={(e) => setSupplySearch(e.target.value)}
                  onFocus={() => supplyResults.length > 0 && setShowSupplyDropdown(true)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-teal-400"
                />
                {showSupplyDropdown && supplyResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg z-10 overflow-hidden">
                    {supplyResults.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => addSupply(p)}
                        className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-slate-50 flex justify-between items-center"
                      >
                        <span>{p.name}</span>
                        <span className="text-xs text-slate-400">Stock: {p.totalStock ?? "—"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lista de insumos */}
              {form.consumedSupplies?.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-3xl mb-2">📦</p>
                  <p className="text-sm font-bold">Sin insumos registrados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {form.consumedSupplies.map((supply, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <p className="font-bold text-sm text-slate-800 flex-1">
                        {supply.productName || supply.productId}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="1"
                          value={supply.quantity}
                          onChange={(e) => updateSupplyQty(idx, e.target.value)}
                          className="w-16 p-2 border border-slate-200 rounded-xl text-center font-black text-sm focus:outline-none focus:border-teal-400"
                        />
                        <button
                          onClick={() => removeSupply(idx)}
                          className="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Finanzas */}
          {activeTab === 2 && (
            <div className="space-y-5">
              {/* Notas */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                  Notas de la consulta
                </label>
                <textarea
                  rows={3}
                  value={form.consultationRecord?.reasonForVisit || ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      consultationRecord: {
                        ...f.consultationRecord,
                        reasonForVisit: e.target.value,
                      },
                    }))
                  }
                  placeholder="Observaciones, diagnóstico, indicaciones..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm resize-none focus:outline-none focus:border-teal-400"
                />
              </div>

              {/* Desglose financiero */}
              <div className="bg-slate-50 rounded-3xl p-5 space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400">Resumen Financiero</p>

                {/* Cotización */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-600">Cotización original</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      value={form.originalQuote || 0}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, originalQuote: Number(e.target.value) }))
                      }
                      className="w-28 py-1.5 px-3 border border-slate-200 rounded-xl text-right font-black text-sm focus:outline-none focus:border-teal-400 bg-white"
                    />
                  </div>
                </div>

                {/* Cupón */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                    Código de cupón
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponPreview(null);
                        setCouponError("");
                      }}
                      placeholder="CODIGO-CUPON"
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black uppercase focus:outline-none focus:border-teal-400"
                    />
                    <button
                      onClick={handleValidateCoupon}
                      className="px-5 py-2.5 bg-teal-500 text-white rounded-xl text-xs font-black uppercase hover:bg-teal-600 transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-rose-500 font-bold mt-1">{couponError}</p>
                  )}
                  {couponPreview && (
                    <div className="flex justify-between mt-2 text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2">
                      <span className="text-xs font-bold">
                        Cupón {couponPreview.code} (
                        {couponPreview.discountType === "PERCENTAGE"
                          ? `${couponPreview.discountValue}%`
                          : `$${couponPreview.discountValue}`}
                        )
                      </span>
                      <span className="text-xs font-black">-${couponPreview.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-sm font-black uppercase text-slate-700">Total Final</span>
                  <span className="text-3xl font-black text-teal-600">
                    ${Math.max(0, finalAmount).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Botón guardar */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-slate-900 text-white font-black uppercase rounded-2xl
                  hover:bg-teal-600 transition-colors text-sm tracking-widest disabled:opacity-50"
              >
                {isSaving
                  ? "Guardando..."
                  : form.status === "COMPLETED"
                    ? "Finalizar y cobrar"
                    : "Guardar cambios"}
              </button>

              {/* Cancelar cita */}
              {!["COMPLETED", "CANCELLED"].includes(form.status) && (
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="w-full py-3 border-2 border-rose-200 text-rose-400 font-black uppercase
                    rounded-2xl text-xs hover:bg-rose-50 hover:border-rose-300 hover:text-rose-500 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? "Cancelando..." : "Cancelar esta cita"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer fijo (solo Tab 0 y Tab 1 muestran botón rápido de guardar) */}
        {activeTab !== 2 && (
          <div className="px-6 py-4 border-t border-slate-100 shrink-0">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3.5 bg-slate-900 text-white font-black uppercase rounded-2xl
                hover:bg-teal-600 transition-colors text-xs tracking-widest disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
