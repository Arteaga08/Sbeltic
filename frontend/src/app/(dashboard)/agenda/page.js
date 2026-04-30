"use client";

import { useEffect, useState, useMemo } from "react";
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

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // lunes
  return d;
}

export default function AgendaPage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterRoom, setFilterRoom] = useState("ALL");
  const [filterDoctor, setFilterDoctor] = useState("ALL");

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [upcomingSurgeries, setUpcomingSurgeries] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("sbeltic_user");
      const user = userStr ? JSON.parse(userStr) : null;
      setUserRole(user?.role || "");
    } catch {
      setUserRole("");
    }
  }, []);

  const isReadOnly = userRole === "MARKETING";

  // ── Fetches ──
  const fetchWeekAppointments = async (start) => {
    try {
      const res = await fetch(
        `${API}/appointments?date=${start.toISOString()}&days=6`,
        { headers: { Authorization: `Bearer ${getToken()}`, "Cache-Control": "no-cache" } },
      );
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

  const fetchUpcomingSurgeries = async () => {
    try {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const res = await fetch(
        `${API}/appointments?date=${from.toISOString()}&days=6`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      const data = await res.json();
      const arr = data.data || [];
      setUpcomingSurgeries(
        arr.filter(
          (a) =>
            (a.treatmentCategory || getCategoryFromTreatment(a.treatmentName)) === "CIRUGIA" &&
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

  // ── Carga inicial y al cambiar semana ──
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchWeekAppointments(weekStart),
      fetchWaitlist(),
    ]).finally(() => setLoading(false));
  }, [weekStart]);

  useEffect(() => {
    fetchStaff();
    fetchUpcomingSurgeries();
  }, []);

  // ── Filtrar appointments por doctor si aplica ──
  const visibleAppointments = useMemo(
    () =>
      filterDoctor === "ALL"
        ? appointments
        : appointments.filter((a) => String(a.doctorId?._id || a.doctorId) === filterDoctor),
    [appointments, filterDoctor],
  );

  // ── Agrupar por fecha (clave "YYYY-MM-DD" en hora local) ──
  const appointmentsByDate = useMemo(() => {
    return visibleAppointments.reduce((acc, a) => {
      const key = new Date(a.appointmentDate).toLocaleDateString("en-CA");
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    }, {});
  }, [visibleAppointments]);

  // ── Resumen semanal calculado client-side ──
  const weeklySummary = useMemo(() => {
    const active = visibleAppointments.filter((a) => a.status !== "CANCELLED");
    return {
      total: active.length,
      confirmed: active.filter((a) => ["CONFIRMED", "IN_PROGRESS"].includes(a.status)).length,
      revenue: active
        .filter((a) => a.status === "COMPLETED")
        .reduce((s, a) => s + (a.originalQuote || 0), 0),
    };
  }, [visibleAppointments]);

  // ── Handlers ──
  const handleAppointmentClick = (appt) => setSelectedAppointment(appt);

  const handleSuperModalSave = (updatedAppt) => {
    setAppointments((prev) =>
      prev.map((a) => (a._id === updatedAppt._id ? updatedAppt : a)),
    );
    toast.success("Cita actualizada");
  };

  const handleSuperModalCancel = (cancelledAppt) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a._id === cancelledAppt._id ? { ...a, status: "CANCELLED" } : a,
      ),
    );
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
        fetchWeekAppointments(weekStart);
      } else {
        const errMsg =
          apptResult.message ||
          apptResult.errors?.[0]?.message ||
          "No se pudo agendar la cita.";
        toast.error(errMsg);
      }
    } catch {
      toast.error("Error de conexión con el servidor.");
    }
  };

  const handleWeekChange = (date) => setWeekStart(getWeekStart(date));

  const panelBadgeCount =
    upcomingSurgeries.length + waitlist.filter((w) => w.status === "WAITING").length;

  return (
    <div className="flex flex-col overflow-hidden -mx-4 -my-4 md:-mx-10 md:-my-10 h-[calc(100dvh-80px)] md:h-dvh">

      {/* Header */}
      <AgendaHeader
        weekStart={weekStart}
        onWeekChange={handleWeekChange}
        filterRoom={filterRoom}
        onFilterRoom={setFilterRoom}
        staff={staff}
        filterDoctor={filterDoctor}
        onFilterDoctor={setFilterDoctor}
        onNewAppointment={() => setIsNewModalOpen(true)}
        isReadOnly={isReadOnly}
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
            weekStart={weekStart}
            appointmentsByDate={appointmentsByDate}
            filterRoom={filterRoom}
            onAppointmentClick={handleAppointmentClick}
          />
        )}

        <SidePanels
          waitlist={waitlist}
          weeklySummary={weeklySummary}
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
        isReadOnly={isReadOnly}
      />

      {/* Modal Nueva Cita — no se renderiza en modo solo lectura */}
      {!isReadOnly && (
        <NewAppointmentModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSave={handleSaveNewAppointment}
        />
      )}
    </div>
  );
}
