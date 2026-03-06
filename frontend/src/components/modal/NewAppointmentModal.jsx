"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// 1. DICCIONARIO DE CATEGORÍAS, COLORES Y TRATAMIENTOS
const CATEGORIES = {
  CIRUGIA: {
    id: "CIRUGIA",
    label: "Cirugía",
    colorClass: "bg-rose-500 text-white shadow-rose-200", // Rojo
    unselectedClass: "bg-rose-50 text-rose-400 hover:bg-rose-100",
    treatments: [
      "Lipoescultura",
      "Rinoplastia",
      "Bichectomía",
      "Aumento Mamario",
      "Otro Quirúrgico",
    ],
  },
  CONSULTA: {
    id: "CONSULTA",
    label: "Consulta Dr.",
    colorClass: "bg-amber-400 text-white shadow-amber-200", // Amarillo
    unselectedClass: "bg-amber-50 text-amber-500 hover:bg-amber-100",
    treatments: [
      "Valoración Inicial",
      "Revisión Post-quirúrgica",
      "Aplicación de Toxina",
      "Rellenos (Fillers)",
    ],
  },
  SPA: {
    id: "SPA",
    label: "Recepción / Spa",
    colorClass: "bg-purple-500 text-white shadow-purple-200", // Morado
    unselectedClass: "bg-purple-50 text-purple-400 hover:bg-purple-100",
    treatments: [
      "Limpieza Facial Profunda",
      "Depilación Láser",
      "Masaje Reductivo",
      "Radiofrecuencia",
    ],
  },
  OTROS: {
    id: "OTROS",
    label: "Otros Dres.",
    colorClass: "bg-pink-400 text-white shadow-pink-200", // Rosa
    unselectedClass: "bg-pink-50 text-pink-400 hover:bg-pink-100",
    treatments: [
      "Consulta Nutrición",
      "Consulta Dermatología",
      "Terapia Post-operatoria",
    ],
  },
};

export default function NewAppointmentModal({ isOpen, onClose, onSave }) {
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("SPA"); // Por defecto

  const [formData, setFormData] = useState({
    patientId: "",
    newPatientName: "",
    newPatientPhone: "",
    newPatientEmail: "",
    doctorId: "",
    roomId: "CABINA_1",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    treatmentName: "", // Se llenará dinámicamente
    duration: 30,
  });

  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) fetchRealData();
  }, [isOpen]);

  // Cuando cambia la categoría, limpiamos el tratamiento anterior para obligar a elegir uno nuevo
  useEffect(() => {
    setFormData((prev) => ({ ...prev, treatmentName: "" }));
  }, [selectedCategory]);

  const fetchRealData = async () => {
    setLoadingData(true);
    try {
      // 1. Obtenemos el token del localStorage
      const token = localStorage.getItem("sbeltic_token");

      // 2. Creamos los headers con la autorización
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // PACIENTES (Ahora con headers)
      const resPatients = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients`,
        { headers },
      );
      const dataPatients = await resPatients.json();
      const pArray =
        dataPatients.data ||
        dataPatients.patients ||
        (Array.isArray(dataPatients) ? dataPatients : []);
      setPatients(pArray);

      // PERSONAL (Ahora con headers)
      const resStaff = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers,
      });
      const dataStaff = await resStaff.json();
      const sArray =
        dataStaff.data ||
        dataStaff.users ||
        (Array.isArray(dataStaff) ? dataStaff : []);
      setStaff(sArray);

      if (pArray.length === 0 || sArray.length === 0) {
        toast.warning("La lista de personal o pacientes está vacía.");
      }
    } catch (error) {
      console.error("Error conectando a BD:", error);
      toast.error("Error de autenticación. Intenta reingresar al sistema.");
    } finally {
      setLoadingData(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.treatmentName)
      return toast.error("Selecciona un tratamiento de la lista.");

    const appointmentDate = new Date(
      `${formData.date}T${formData.time}:00`,
    ).toISOString();

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
        treatmentName: formData.treatmentName,
        duration: Number(formData.duration),
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
              Descargando perfiles desde Vidix Studio...
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. SELECTOR DE COLORES (ÁREA) */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                  Área de Atención
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.values(CATEGORIES).map((cat) => (
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
                {/* Lado Paciente */}
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
                      <option value="">Buscar en base de datos...</option>
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

                {/* Lado Personal */}
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

              {/* 3. TRATAMIENTO, FECHA Y CABINA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* El tratamiento ahora depende del color seleccionado */}
                <div className="space-y-2 md:col-span-3 lg:col-span-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Tratamiento de {CATEGORIES[selectedCategory].label}
                  </label>
                  <select
                    required
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none"
                    value={formData.treatmentName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        treatmentName: e.target.value,
                      })
                    }
                  >
                    <option value="">Selecciona opción...</option>
                    {CATEGORIES[selectedCategory].treatments.map((t, idx) => (
                      <option key={idx} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
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
                    <option value="CONSULTORIO">Consultorio Principal</option>
                    <option value="QUIROFANO">Quirófano</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                  />
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
