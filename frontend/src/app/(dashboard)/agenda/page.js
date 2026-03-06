"use client";
import { useState, useEffect, useRef } from "react";
import AppointmentCard from "@/components/AppointmentCard";
import NewAppointmentModal from "@/components/modal/NewAppointmentModal"; // 1. Importamos tu Modal
import { toast } from "sonner";

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Estado para controlar si el Modal está abierto o cerrado
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dateInputRef = useRef(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // 1. Sacamos la llave de acceso (token) que guardamos en el login
      const token = localStorage.getItem("sbeltic_token");

      // 2. Hacemos la petición enviando el header de Authorization
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments?date=${selectedDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // 🛡️ Aquí está la magia
          },
        },
      );

      const result = await response.json();
      console.log("📡 Respuesta real del backend:", result);

      const dataArray =
        result.data ||
        result.appointments ||
        (Array.isArray(result) ? result : []);
      setAppointments(dataArray);
    } catch (error) {
      console.error("Error en fetchAppointments:", error);
      toast.error("Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const handleContainerClick = () => {
    if (
      dateInputRef.current &&
      typeof dateInputRef.current.showPicker === "function"
    ) {
      dateInputRef.current.showPicker();
    }
  };

  // 3. LA FUNCIÓN MÁGICA QUE GUARDA LA CITA
  const handleSaveAppointment = async (payloadFromModal) => {
    try {
      // 1. Preparamos la seguridad y el usuario actual
      const token = localStorage.getItem("sbeltic_token");
      const currentUser = JSON.parse(
        localStorage.getItem("sbeltic_user") || "{}",
      );

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const { isNewPatient, patientData, appointmentData } = payloadFromModal;
      let finalPatientId = appointmentData.patientId;

      // PASO 1: Si es paciente nuevo, lo creamos enviando el Token
      if (isNewPatient) {
        const patientRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/patients`,
          {
            method: "POST",
            headers, // <-- Mandamos el token aquí
            body: JSON.stringify({
              ...patientData,
              createdBy: currentUser._id,
            }),
          },
        );
        const patientResult = await patientRes.json();

        if (!patientRes.ok) {
          return toast.error(
            patientResult.message || "Error al registrar el nuevo paciente.",
          );
        }
        finalPatientId = patientResult.data._id || patientResult.patient._id;
        toast.success("Paciente nuevo registrado.");
      }

      // PASO 2: Creamos la Cita
      const finalAppointmentPayload = {
        ...appointmentData,
        patientId: finalPatientId,
        createdBy: currentUser._id, // 🛡️ Ahora sabemos EXACTAMENTE quién creó la cita en el sistema
      };

      const apptRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments`,
        {
          method: "POST",
          headers, // <-- Y mandamos el token aquí también
          body: JSON.stringify(finalAppointmentPayload),
        },
      );

      const apptResult = await apptRes.json();

      if (apptRes.ok) {
        toast.success("¡Cita agendada con éxito!");
        setIsModalOpen(false);
        fetchAppointments(); // Recargamos la vista
      } else {
        toast.error(
          apptResult.message ||
            "No se pudo agendar la cita. Posible choque de horarios.",
        );
      }
    } catch (error) {
      console.error("Error completo:", error);
      toast.error("Error de conexión con el servidor.");
    }
  };
  return (
    <div className="space-y-10 p-4 md:p-8 pb-24 md:pb-8">
      <header className="flex flex-col items-center text-center gap-8 mb-12">
        {/* 1. Bloque de Título: Centrado y con el estilo Vidix Standard */}
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-extrabold italic uppercase tracking-normal text-slate-900 leading-none">
            Agenda Sbeltic
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Control total de la clínica
          </p>
        </div>

        {/* 2. Contenedor de Controles: Apilados y con ancho controlado */}
        <div className="w-full max-w-md flex flex-col gap-4">
          {/* BOTÓN DEL CALENDARIO (Ahora con padding y texto centrado) */}
          <div
            onClick={handleContainerClick}
            className="flex items-center justify-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-all group w-full"
          >
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest group-hover:text-rose-500 transition-colors">
              FECHA:
            </span>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-sm uppercase"
            />
          </div>

          {/* BOTÓN GIGANTE DE NUEVA CITA (Igual al de "Alta de Personal") */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-5 bg-slate-900 text-white font-black text-[11px] tracking-[0.2em] uppercase rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg leading-none">+</span> NUEVA CITA
          </button>
        </div>
      </header>

      {/* RENDERIZAMOS LAS TARJETAS... */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-slate-200 animate-pulse rounded-3xl"
            />
          ))}
        </div>
      ) : (
        <>
          {appointments.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-400 font-medium">
                No hay citas programadas para este día.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {appointments.map((appt) => (
                <AppointmentCard key={appt._id} appointment={appt} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 5. EL MODAL INVISIBLE (Solo se muestra si isModalOpen es true) */}
      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
      />
    </div>
  );
}
