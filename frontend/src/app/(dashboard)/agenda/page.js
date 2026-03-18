"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import AgendaHeader from "@/components/agenda/AgendaHeader";
import CalendarGrid from "@/components/agenda/CalendarGrid";
import SidePanels from "@/components/agenda/SidePanels";
import SuperModal from "@/components/agenda/SuperModal";
import NewAppointmentModal from "@/components/modal/NewAppointmentModal";
import { getCategoryFromTreatment } from "@/lib/treatmentCategories";
import { ListBullets } from "@phosphor-icons/react";

const API = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  if (typeof window !== "undefined") return localStorage.getItem("sbeltic_token");
  return null;
}

function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [appointments, setAppointments] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [daySummary, setDaySummary] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterRoom, setFilterRoom] = useState("ALL");
  const [filterDoctor, setFilterDoctor] = useState("ALL");

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [upcomingSurgeries, setUpcomingSurgeries] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // ── ISO de medianoche local → enviado al backend para range queries ──
  const dateStr = selectedDate.toISOString(); // e.g. "2026-03-17T06:00:00.000Z" en UTC-6

  // ── Fetches ──
  const fetchAppointments = async (date = dateStr) => {
    try {
      const res = await fetch(`${API}/appointments?date=${date}`, {
        headers: { Authorization: `Bearer ${getToken()}`, "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      const arr = data.data || data.appointments || (Array.isArray(data) ? data : []);
      setAppointments(arr);
    } catch {
      toast.error("Error al cargar la agenda");
    }
  };

  const fetchWaitlist = async () => {
    try {
      const res = await fetch(`${API}/waitlist`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setWaitlist(data.data || []);
    } catch {
      // waitlist is non-critical
    }
  };

  const fetchDaySummary = async (date = dateStr) => {
    try {
      const res = await fetch(`${API}/appointments/day-summary?date=${date}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setDaySummary(data.data || null);
    } catch {
      // summary is non-critical
    }
  };

  const fetchUpcomingSurgeries = async () => {
    try {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const res = await fetch(
        `${API}/appointments?date=${from.toISOString()}&days=7`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      const data = await res.json();
      const arr = data.data || [];
      setUpcomingSurgeries(
        arr.filter(
          (a) =>
            getCategoryFromTreatment(a.treatmentName) === "CIRUGIA" &&
            !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status),
        ),
      );
    } catch {
      // non-critical
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${API}/users?role=DOCTOR`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setStaff(data.data || []);
    } catch {
      // staff filter is optional
    }
  };

  // ── Carga inicial y al cambiar fecha ──
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAppointments(dateStr),
      fetchWaitlist(),
      fetchDaySummary(dateStr),
    ]).finally(() => setLoading(false));
  }, [selectedDate]);

  useEffect(() => {
    fetchStaff();
    fetchUpcomingSurgeries();
  }, []);

  // ── Filtrar appointments por doctor si aplica ──
  const visibleAppointments =
    filterDoctor === "ALL"
      ? appointments
      : appointments.filter((a) => String(a.doctorId?._id || a.doctorId) === filterDoctor);

  // ── Handlers ──
  const handleAppointmentClick = (appt) => setSelectedAppointment(appt);

  const handleSuperModalSave = (updatedAppt) => {
    // Actualizar el appointment en la lista local sin refetch completo
    setAppointments((prev) =>
      prev.map((a) => (a._id === updatedAppt._id ? updatedAppt : a)),
    );
    // Refrescar resumen del día
    fetchDaySummary(dateStr);
    toast.success("Cita actualizada");
  };

  const handleSuperModalCancel = (cancelledAppt) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a._id === cancelledAppt._id ? { ...a, status: "CANCELLED" } : a,
      ),
    );
    fetchDaySummary(dateStr);
    toast.success("Cita cancelada");
  };

  // ── Guardar nueva cita (desde NewAppointmentModal) ──
  const handleSaveNewAppointment = async (payloadFromModal) => {
    try {
      const token = getToken();
      const currentUser = JSON.parse(localStorage.getItem("sbeltic_user") || "{}");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const { isNewPatient, patientData, appointmentData } = payloadFromModal;
      let finalPatientId = appointmentData.patientId;

      if (isNewPatient) {
        const patientRes = await fetch(`${API}/patients`, {
          method: "POST",
          headers,
          body: JSON.stringify({ ...patientData, createdBy: currentUser._id }),
        });
        const patientResult = await patientRes.json();
        if (!patientRes.ok) {
          return toast.error(patientResult.message || "Error al registrar el paciente.");
        }
        finalPatientId = patientResult.data._id || patientResult.patient._id;
        toast.success("Paciente nuevo registrado.");
      }

      const apptRes = await fetch(`${API}/appointments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...appointmentData, patientId: finalPatientId }),
      });
      const apptResult = await apptRes.json();

      if (apptRes.ok) {
        toast.success("¡Cita agendada con éxito!");
        setIsNewModalOpen(false);
        fetchAppointments(dateStr);
        fetchDaySummary(dateStr);
      } else {
        toast.error(apptResult.message || "No se pudo agendar la cita.");
      }
    } catch {
      toast.error("Error de conexión con el servidor.");
    }
  };

  const panelBadgeCount =
    upcomingSurgeries.length + waitlist.filter((w) => w.status === "WAITING").length;

  return (
    <div className="flex flex-col overflow-hidden -mx-4 -my-4 md:-mx-10 md:-my-10 h-[calc(100dvh-80px)] md:h-dvh">

      {/* Header */}
      <AgendaHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        filterRoom={filterRoom}
        onFilterRoom={setFilterRoom}
        staff={staff}
        filterDoctor={filterDoctor}
        onFilterDoctor={setFilterDoctor}
        onNewAppointment={() => setIsNewModalOpen(true)}
      />

      {/* Cuerpo principal */}
      <div className="flex flex-1 overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Cargando agenda...
              </p>
            </div>
          </div>
        ) : (
          <CalendarGrid
            appointments={visibleAppointments}
            filterRoom={filterRoom}
            onAppointmentClick={handleAppointmentClick}
          />
        )}

        <SidePanels
          appointments={visibleAppointments}
          waitlist={waitlist}
          daySummary={daySummary}
          upcomingSurgeries={upcomingSurgeries}
          mobileOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
        />

        {/* FAB — solo móvil */}
        <button
          onClick={() => setIsPanelOpen(true)}
          className="md:hidden fixed bottom-24 right-4 z-50 w-14 h-14 bg-teal-500 text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <ListBullets size={24} weight="bold" />
          {panelBadgeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-black flex items-center justify-center">
              {panelBadgeCount}
            </span>
          )}
        </button>
      </div>

      {/* Súper Modal */}
      <SuperModal
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onSave={handleSuperModalSave}
        onCancelAppointment={handleSuperModalCancel}
      />

      {/* Modal Nueva Cita */}
      <NewAppointmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleSaveNewAppointment}
      />
    </div>
  );
}
