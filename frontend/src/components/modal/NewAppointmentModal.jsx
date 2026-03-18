"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  TREATMENT_CATEGORIES,
  getCategoryById,
} from "@/lib/treatmentCategories";

const API = process.env.NEXT_PUBLIC_API_URL;

function formatDuration(mins) {
  if (!mins) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export default function NewAppointmentModal({ isOpen, onClose, onSave }) {
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("CIRUGIA");

  const [formData, setFormData] = useState({
    patientId: "",
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
  });

  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsNewPatient(false);
      setSelectedCategory("CIRUGIA");
      setFormData({
        patientId: "",
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
      });
      fetchRealData();
    }
  }, [isOpen]);

  // Al cambiar categoría, limpiar tratamiento seleccionado
  useEffect(() => {
    setFormData((prev) => ({ ...prev, treatmentId: "", treatmentName: "" }));
  }, [selectedCategory]);

  const fetchRealData = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [resP, resS, resT] = await Promise.all([
        fetch(`${API}/patients?limit=500`, { headers }),
        fetch(`${API}/users`, { headers }),
        fetch(`${API}/treatments?limit=200`, { headers }),
      ]);
      const [dataP, dataS, dataT] = await Promise.all([
        resP.json(),
        resS.json(),
        resT.json(),
      ]);

      // Pacientes: { data: { patients: [...], pagination: {...} } }
      const rawP =
        dataP.data?.patients ?? dataP.data ?? dataP.patients ?? dataP;
      setPatients(Array.isArray(rawP) ? rawP : []);

      // Staff: { data: [...] }
      const rawS = dataS.data ?? dataS.users ?? dataS;
      setStaff(Array.isArray(rawS) ? rawS : []);

      // Tratamientos: { data: { results: [...] } }
      const rawT = dataT.data?.results ?? dataT.data ?? dataT.results ?? dataT;
      setTreatments(
        Array.isArray(rawT) ? rawT.filter((t) => t.isActive !== false) : [],
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos. Intenta reingresar.");
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isNewPatient && !formData.patientId)
      return toast.error("Selecciona un paciente de la lista.");
    if (!formData.doctorId)
      return toast.error("Selecciona el personal que atiende.");
    if (!formData.treatmentName)
      return toast.error("Selecciona un tratamiento de la lista.");
    if (durationTotal < 15)
      return toast.error("La duración mínima es 15 minutos.");

    const appointmentDate = new Date(
      `${formData.date}T${formData.time}:00`,
    ).toISOString();

    if (new Date(appointmentDate) <= new Date())
      return toast.error("La fecha y hora deben ser en el futuro.");
    if (new Date(appointmentDate).getDay() === 0)
      return toast.error("La clínica cierra los domingos.");

    onSave({
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
      },
    });
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

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
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
                  {TREATMENT_CATEGORIES.map((cat) => (
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
                    <select
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none"
                      value={formData.patientId}
                      onChange={(e) =>
                        setFormData({ ...formData, patientId: e.target.value })
                      }
                    >
                      <option value="">
                        {patients.length === 0
                          ? "Sin pacientes registrados"
                          : "Buscar en base de datos..."}
                      </option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.phone})
                        </option>
                      ))}
                    </select>
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
                    Tratamiento — {getCategoryById(selectedCategory).label}
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
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loadingData}
              className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loadingData}
              className="flex-1 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all"
            >
              Guardar Cita Sbeltic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
