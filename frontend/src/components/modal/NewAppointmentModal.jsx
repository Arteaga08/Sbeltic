"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { WhatsappLogo } from "@phosphor-icons/react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import FormError from "@/components/ui/FormError";
import { useScrollLock } from "@/hooks/useScrollLock";

import { useTreatmentCategories } from "@/context/TreatmentCategoriesContext";
import { getCategoryById } from "@/lib/treatmentCategories";

const API = process.env.NEXT_PUBLIC_API_URL;

const ROOM_LABELS = {
  CABINA_1: "Cabina 1",
  CABINA_2: "Cabina 2",
  CABINA_3: "Cabina 3",
  SPA: "Spa",
  CONSULTORIO: "Consultorio",
  QUIROFANO: "Quirófano",
};

// Normaliza un teléfono para wa.me: solo dígitos y, si son 10 (México sin lada),
// antepone la lada 52.
function toWhatsAppPhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `52${digits}`;
  return digits;
}

const normalize = (s) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function formatDuration(mins) {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function NewAppointmentModal({ isOpen, onClose, onSave }) {
  useScrollLock(isOpen);
  const categories = useTreatmentCategories();
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    patientPhone: "",
    newPatientName: "",
    newPatientPhone: "",
    newPatientEmail: "",
    doctorId: "",
    roomId: "CABINA_1",
    date: new Date().toLocaleDateString("en-CA"),
    time: "10:00",
    treatmentId: "",
    treatmentName: "",
    durationHours: 0,
    durationMinutes: 30,
    isPriority: false,
    isUrgent: false,
    notes: "",
    sendWhatsAppConfirmation: true,
  });

  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsNewPatient(false);
      setSelectedCategory(categories[0]?.id ?? null);
      setPatientSearch("");
      setShowPatientDropdown(false);
      setFormError("");
      setFormData({
        patientId: "",
        patientName: "",
        patientPhone: "",
        newPatientName: "",
        newPatientPhone: "",
        newPatientEmail: "",
        doctorId: "",
        roomId: "CABINA_1",
        date: new Date().toLocaleDateString("en-CA"),
        time: "10:00",
        treatmentId: "",
        treatmentName: "",
        durationHours: 0,
        durationMinutes: 30,
        isPriority: false,
        isUrgent: false,
        notes: "",
        sendWhatsAppConfirmation: true,
      });
      fetchRealData();
    }
  }, [isOpen]);

  // Cuando las categorías carguen y el modal esté abierto sin categoría seleccionada, seleccionar la primera
  useEffect(() => {
    if (isOpen && !selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, isOpen]);

  // Al cambiar categoría, limpiar tratamiento seleccionado
  useEffect(() => {
    setFormData((prev) => ({ ...prev, treatmentId: "", treatmentName: "" }));
  }, [selectedCategory]);

  const loadPatients = async (search = "") => {
    try {
      const jsonHeaders = { "Content-Type": "application/json" };
      const url = `${API}/patients?limit=500${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      const res = await fetchWithAuth(url, { headers: jsonHeaders });
      const dataP = await res.json();
      const rawP =
        dataP.data?.patients ?? dataP.data ?? dataP.patients ?? dataP;
      setPatients(Array.isArray(rawP) ? rawP : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRealData = async () => {
    setLoadingData(true);
    try {
      const jsonHeaders = { "Content-Type": "application/json" };

      const [resS, resT] = await Promise.all([
        fetchWithAuth(`${API}/users/staff`, { headers: jsonHeaders }),
        fetchWithAuth(`${API}/treatments?limit=200`, { headers: jsonHeaders }),
      ]);
      const [dataS, dataT] = await Promise.all([resS.json(), resT.json()]);

      const rawS = dataS.data ?? dataS.users ?? dataS;
      setStaff(Array.isArray(rawS) ? rawS : []);

      const rawT = dataT.data?.results ?? dataT.data ?? dataT.results ?? dataT;
      setTreatments(
        Array.isArray(rawT) ? rawT.filter((t) => t.isActive !== false) : [],
      );

      await loadPatients();
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos. Intenta reingresar.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const term = patientSearch.trim();
    const timer = setTimeout(() => {
      if (term.length >= 2) {
        loadPatients(term);
      } else if (term.length === 0) {
        loadPatients();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, isOpen]);

  if (!isOpen) return null;

  const term = normalize(patientSearch);
  const digits = patientSearch.replace(/\D/g, "");
  const filteredPatients = patients.filter((p) => {
    const phoneDigits = (p.phone || "").replace(/\D/g, "");
    return (
      normalize(p.name).includes(term) ||
      normalize(p.email || "").includes(term) ||
      (digits.length >= 3 && phoneDigits.includes(digits))
    );
  });

  // Tratamientos de la categoría activa
  const categoryTreatments = treatments.filter(
    (t) => t.category?.toUpperCase() === selectedCategory,
  );

  const handleTreatmentSelect = (treatmentId) => {
    const t = treatments.find((t) => t._id === treatmentId);
    if (!t) {
      setFormData((f) => ({ ...f, treatmentId: "", treatmentName: "" }));
      return;
    }
    const dur = t.estimatedDuration || 30;
    setFormData((f) => ({
      ...f,
      treatmentId: t._id,
      treatmentName: t.name,
      durationHours: Math.floor(dur / 60),
      durationMinutes: dur % 60,
    }));
  };

  const durationTotal =
    Number(formData.durationHours) * 60 + Number(formData.durationMinutes);

  // Arma el mensaje de confirmación pre-armado con los datos de la cita.
  const buildConfirmationMessage = () => {
    const fullName = isNewPatient ? formData.newPatientName : formData.patientName;
    const firstName = (fullName || "").trim().split(" ")[0] || "Paciente";
    const readableDate = new Date(`${formData.date}T${formData.time}:00`).toLocaleDateString(
      "es-MX",
      { weekday: "long", day: "numeric", month: "long" },
    );
    const doctorName =
      staff.find((u) => u._id === formData.doctorId)?.name || "nuestro equipo";
    const roomLabel = ROOM_LABELS[formData.roomId] || formData.roomId;

    return (
      `Hola ${firstName}, te confirmamos tu cita en Sbeltic:\n` +
      `📅 ${readableDate} a las ${formData.time}\n` +
      `💆 ${formData.treatmentName}\n` +
      `👩‍⚕️ Te atiende: ${doctorName}\n` +
      `📍 ${roomLabel}\n` +
      `¡Te esperamos!`
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (isNewPatient && !formData.newPatientName.trim())
      return setFormError("Escribe el nombre del paciente nuevo.");
    if (!isNewPatient && !formData.patientId)
      return setFormError("Selecciona un paciente de la lista.");
    if (!formData.doctorId)
      return setFormError("Selecciona el personal que atiende.");
    if (!formData.treatmentName)
      return setFormError("Selecciona un tratamiento de la lista.");
    if (durationTotal < 15)
      return setFormError("La duración mínima es 15 minutos.");

    const appointmentDate = new Date(
      `${formData.date}T${formData.time}:00`,
    ).toISOString();

    if (new Date(appointmentDate) <= new Date())
      return setFormError("La fecha y hora deben ser en el futuro.");
    if (new Date(appointmentDate).getDay() === 0)
      return setFormError("La clínica cierra los domingos.");

    setIsSaving(true);
    // onSave (en la página) devuelve un mensaje de error si algo falla, o
    // nada si la cita se guardó correctamente.
    const errMsg = await onSave({
      isNewPatient,
      patientData: {
        name: formData.newPatientName,
        phone: formData.newPatientPhone,
        email: formData.newPatientEmail,
      },
      appointmentData: {
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        roomId: formData.roomId,
        appointmentDate,
        treatmentId: formData.treatmentId || undefined,
        treatmentName: formData.treatmentName,
        treatmentCategory: selectedCategory || undefined,
        duration: durationTotal,
        isPriority: formData.isPriority,
        isUrgent: formData.isPriority ? formData.isUrgent : false,
        notes: formData.notes.trim() || undefined,
      },
    });
    setIsSaving(false);
    if (errMsg) return setFormError(errMsg);

    // Cita guardada con éxito: abrir WhatsApp con la confirmación pre-armada.
    if (formData.sendWhatsAppConfirmation) {
      const phone = toWhatsAppPhone(
        isNewPatient ? formData.newPatientPhone : formData.patientPhone,
      );
      if (phone) {
        window.open(
          `https://wa.me/${phone}?text=${encodeURIComponent(buildConfirmationMessage())}`,
          "_blank",
        );
      } else {
        toast.info("La cita se guardó, pero el paciente no tiene teléfono para enviar la confirmación.");
      }
    }
  };

  return (
    <div className="fixed inset-0 sm:inset-0 bg-slate-900/60 backdrop-blur-sm z-99999 flex items-start sm:items-center justify-center p-4 pt-16 pb-28 sm:pt-4 sm:pb-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[75dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-black text-slate-800">
            Nueva Cita Sbeltic
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onInput={() => formError && setFormError("")}
          className="p-6 overflow-y-auto space-y-6"
        >
          {loadingData ? (
            <div className="text-center py-10 text-slate-500 font-bold animate-pulse">
              Descargando perfiles desde Sbeltic Studio...
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. SELECTOR DE CATEGORÍA */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                  Área de Atención
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm border border-transparent
                        ${selectedCategory === cat.id ? cat.colorClass : cat.unselectedClass}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. PACIENTE Y PERSONAL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                {/* Paciente */}
                <div className="space-y-4">
                  <div className="flex gap-4 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setIsNewPatient(false)}
                      className={`text-sm font-bold pb-1 border-b-2 ${!isNewPatient ? "border-slate-800 text-slate-800" : "border-transparent text-slate-400"}`}
                    >
                      Paciente Existente
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewPatient(true)}
                      className={`text-sm font-bold pb-1 border-b-2 ${isNewPatient ? "border-slate-800 text-slate-800" : "border-transparent text-slate-400"}`}
                    >
                      + Nuevo
                    </button>
                  </div>

                  {!isNewPatient ? (
                    <div className="relative">
                      <div className="flex items-center w-full p-3 rounded-xl border border-slate-200 bg-white">
                        <input
                          type="text"
                          placeholder={
                            patients.length === 0
                              ? "Sin pacientes registrados"
                              : "Buscar por nombre o teléfono..."
                          }
                          className="flex-1 outline-none text-sm"
                          value={patientSearch}
                          onChange={(e) => {
                            setPatientSearch(e.target.value);
                            setShowPatientDropdown(true);
                            if (!e.target.value.trim()) {
                              setFormData({
                                ...formData,
                                patientId: "",
                                patientName: "",
                                patientPhone: "",
                              });
                            }
                          }}
                          onFocus={() => setShowPatientDropdown(true)}
                        />
                        {formData.patientId && (
                          <button
                            type="button"
                            onClick={() => {
                              setPatientSearch("");
                              setFormData({
                                ...formData,
                                patientId: "",
                                patientName: "",
                                patientPhone: "",
                              });
                              setShowPatientDropdown(false);
                            }}
                            className="ml-2 text-slate-400 hover:text-slate-600 text-lg leading-none"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {showPatientDropdown && patientSearch.trim() && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                          {filteredPatients.slice(0, 30).map((p) => (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  patientId: p._id,
                                  patientName: p.name,
                                  patientPhone: p.phone,
                                });
                                setPatientSearch(`${p.name} (${p.phone})`);
                                setShowPatientDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex justify-between items-center border-b border-slate-100 last:border-b-0"
                            >
                              <span className="font-medium">{p.name}</span>
                              <span className="text-xs text-slate-400">{p.phone}</span>
                            </button>
                          ))}
                          {filteredPatients.length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center">
                              Sin resultados
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Nombre Completo *"
                        required={isNewPatient}
                        className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm"
                        value={formData.newPatientName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newPatientName: e.target.value,
                          })
                        }
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono a 10 dígitos *"
                        required={isNewPatient}
                        className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm"
                        value={formData.newPatientPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newPatientPhone: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Personal */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    ¿Quién Atiende?
                  </label>
                  <select
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none"
                    value={formData.doctorId}
                    onChange={(e) =>
                      setFormData({ ...formData, doctorId: e.target.value })
                    }
                  >
                    <option value="">Selecciona personal...</option>
                    {staff.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. TRATAMIENTO, FECHA, CABINA y DURACIÓN */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tratamiento — desde DB */}
                <div className="space-y-2 md:col-span-3 lg:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Tratamiento — {getCategoryById(selectedCategory, categories)?.label ?? ""}
                  </label>
                  {categoryTreatments.length === 0 ? (
                    <p className="w-full p-3 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 font-bold text-center">
                      Sin tratamientos. Agrégalos en Pacientes → Catálogo
                    </p>
                  ) : (
                    <select
                      required
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm"
                      value={formData.treatmentId}
                      onChange={(e) => handleTreatmentSelect(e.target.value)}
                    >
                      <option value="">Selecciona opción...</option>
                      {categoryTreatments.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                          {t.estimatedDuration
                            ? ` (${formatDuration(t.estimatedDuration)})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Fecha
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Cabina
                  </label>
                  <select
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm"
                    value={formData.roomId}
                    onChange={(e) =>
                      setFormData({ ...formData, roomId: e.target.value })
                    }
                  >
                    <option value="CABINA_1">Cabina 1</option>
                    <option value="CABINA_2">Cabina 2</option>
                    <option value="CABINA_3">Cabina 3</option>
                    <option value="SPA">Spa</option>
                    <option value="CONSULTORIO">Consultorio</option>
                    <option value="QUIROFANO">Quirófano</option>
                  </select>
                </div>

                {/* Duración: Horas + Minutos */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Duración
                    {durationTotal > 0 && (
                      <span className="ml-1 text-teal-500 normal-case font-bold">
                        = {formatDuration(durationTotal)}
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 p-3 rounded-xl border border-slate-200 outline-none text-sm font-bold"
                      value={formData.durationHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationHours: Number(e.target.value),
                        })
                      }
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                        <option key={h} value={h}>
                          {h}h
                        </option>
                      ))}
                    </select>
                    <select
                      className="flex-1 p-3 rounded-xl border border-slate-200 outline-none text-sm font-bold"
                      value={formData.durationMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationMinutes: Number(e.target.value),
                        })
                      }
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>
                          {m}min
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. NOTA */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Nota <span className="normal-case font-medium text-slate-400">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Indicaciones, recordatorios, preferencias del paciente..."
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm resize-none focus:border-teal-400"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>

              {/* 5. CONFIRMACIÓN POR WHATSAPP */}
              <button
                type="button"
                onClick={() =>
                  setFormData((f) => ({
                    ...f,
                    sendWhatsAppConfirmation: !f.sendWhatsAppConfirmation,
                  }))
                }
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  formData.sendWhatsAppConfirmation
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    formData.sendWhatsAppConfirmation
                      ? "border-emerald-500 bg-emerald-500"
                      : "border-slate-300"
                  }`}
                >
                  {formData.sendWhatsAppConfirmation && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <WhatsappLogo
                    size={20}
                    weight="fill"
                    className={formData.sendWhatsAppConfirmation ? "text-emerald-600" : "text-slate-400"}
                  />
                  <div>
                    <p className={`text-sm font-black uppercase tracking-wide ${formData.sendWhatsAppConfirmation ? "text-emerald-700" : "text-slate-500"}`}>
                      Enviar confirmación por WhatsApp
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      Al guardar se abrirá WhatsApp con los datos de la cita listos para enviar
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* PRIORIDAD */}
          <button
            type="button"
            onClick={() => setFormData((f) => ({ ...f, isPriority: !f.isPriority, isUrgent: !f.isPriority ? f.isUrgent : false }))}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
              formData.isPriority
                ? "border-amber-400 bg-amber-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                formData.isPriority
                  ? "border-amber-400 bg-amber-400"
                  : "border-slate-300"
              }`}
            >
              {formData.isPriority && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-black uppercase tracking-wide ${formData.isPriority ? "text-amber-700" : "text-slate-500"}`}>
                Marcar como prioritaria
              </p>
              <p className="text-xs text-slate-400 font-medium">Aparecerá en la lista de prioridad del panel lateral</p>
            </div>
          </button>

          {/* URGENTE — solo visible si ya es prioritaria */}
          {formData.isPriority && (
            <button
              type="button"
              onClick={() => setFormData((f) => ({ ...f, isUrgent: !f.isUrgent }))}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                formData.isUrgent
                  ? "border-rose-400 bg-rose-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                  formData.isUrgent
                    ? "border-rose-400 bg-rose-400"
                    : "border-slate-300"
                }`}
              >
                {formData.isUrgent && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-black uppercase tracking-wide ${formData.isUrgent ? "text-rose-700" : "text-slate-500"}`}>
                  Marcar como urgente
                </p>
                <p className="text-xs text-slate-400 font-medium">Aparecerá destacada en rojo en la lista de prioridades</p>
              </div>
            </button>
          )}

          <FormError message={formError} />

          <div className="flex gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loadingData || isSaving}
              className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingData || isSaving}
              className="flex-1 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar Cita Sbeltic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
