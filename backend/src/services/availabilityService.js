import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

// --- Constantes ---
export const RECEPTIONIST_ROOMS = ["CABINA_1", "CABINA_2", "CABINA_3", "SPA"];
const BUSINESS_HOURS = { start: 9, end: 18 };
const SLOT_INCREMENT_MINUTES = 15;
const MAX_SEARCH_DAYS = 7;
const RECEPTIONIST_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// --- Caché de recepcionistas ---
let _receptionistCache = null;
let _receptionistCacheExpiry = 0;

export const getActiveReceptionists = async () => {
  if (Date.now() < _receptionistCacheExpiry && _receptionistCache) {
    return _receptionistCache;
  }
  _receptionistCache = await User.find({ role: "RECEPTIONIST", isActive: true }).select("_id name");
  _receptionistCacheExpiry = Date.now() + RECEPTIONIST_CACHE_TTL;
  return _receptionistCache;
};

// --- Verificación de agenda llena ---

/**
 * Verifica si la agenda está llena en un horario dado para servicios de recepcionista.
 * Está "llena" cuando todos los cuartos están ocupados O todas las recepcionistas están ocupadas.
 */
export const checkFullSchedule = async (appointmentDate, durationMinutes, excludeAppointmentId = null) => {
  const newStart = new Date(appointmentDate);
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

  const startOfDay = new Date(newStart);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(newStart);
  endOfDay.setHours(23, 59, 59, 999);

  // 1. Buscar todas las citas no-canceladas del día en cuartos de recepcionista
  const filter = {
    status: { $ne: "CANCELLED" },
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    roomId: { $in: RECEPTIONIST_ROOMS },
  };
  if (excludeAppointmentId) {
    filter._id = { $ne: excludeAppointmentId };
  }

  const [dayAppointments, receptionists] = await Promise.all([
    Appointment.find(filter),
    getActiveReceptionists(),
  ]);

  // 2. Filtrar las que se traslapen con el horario solicitado
  const overlapping = dayAppointments.filter((a) => {
    const aStart = new Date(a.appointmentDate);
    const aEnd = new Date(aStart.getTime() + a.duration * 60000);
    return newStart < aEnd && newEnd > aStart;
  });

  // 3. Calcular cuartos ocupados
  const occupiedRooms = new Set(overlapping.map((a) => a.roomId));
  const freeRooms = RECEPTIONIST_ROOMS.filter((r) => !occupiedRooms.has(r));

  // 4. Calcular recepcionistas ocupadas (excluir bots)
  const botIds = [process.env.BOT_RECEPTIONIST_ID, process.env.BOT_DOCTOR_ID].filter(Boolean);
  const busyReceptionistIds = new Set(
    overlapping
      .map((a) => String(a.doctorId))
      .filter((id) => !botIds.includes(id)),
  );
  const freeReceptionists = receptionists.filter(
    (r) => !busyReceptionistIds.has(String(r._id)),
  );

  const isFull = freeRooms.length === 0 || freeReceptionists.length === 0;

  return { isFull, freeRooms, freeReceptionists };
};

// --- Buscar siguiente slot disponible ---

/**
 * Itera en incrementos de 15 min desde searchStartDate para encontrar
 * el primer slot donde haya al menos un cuarto Y una recepcionista libre.
 */
export const findNextAvailableSlot = async (durationMinutes, searchStartDate, maxDaysAhead = MAX_SEARCH_DAYS) => {
  const receptionists = await getActiveReceptionists();
  if (receptionists.length === 0) return null;

  const botIds = [process.env.BOT_RECEPTIONIST_ID, process.env.BOT_DOCTOR_ID].filter(Boolean);
  const limitDate = new Date(searchStartDate);
  limitDate.setDate(limitDate.getDate() + maxDaysAhead);

  // Iterar día por día, cargando citas una sola vez por día
  let currentDay = new Date(searchStartDate);
  currentDay.setHours(0, 0, 0, 0);

  while (currentDay < limitDate) {
    // Saltar domingos
    if (currentDay.getDay() === 0) {
      currentDay.setDate(currentDay.getDate() + 1);
      continue;
    }

    const dayStart = new Date(currentDay);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(currentDay);
    dayEnd.setHours(23, 59, 59, 999);

    // Cargar todas las citas del día en cuartos de recepcionista (1 query por día)
    const dayAppointments = await Appointment.find({
      status: { $ne: "CANCELLED" },
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      roomId: { $in: RECEPTIONIST_ROOMS },
    });

    // Iterar slots del día
    for (let h = BUSINESS_HOURS.start; h < BUSINESS_HOURS.end; h++) {
      for (let min = 0; min < 60; min += SLOT_INCREMENT_MINUTES) {
        const slotStart = new Date(currentDay);
        slotStart.setHours(h, min, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

        // Saltar slots en el pasado o antes del inicio de búsqueda
        if (slotStart <= searchStartDate) continue;

        // Saltar si el slot excede el horario de negocio
        if (slotEnd.getHours() >= BUSINESS_HOURS.end && slotEnd.getMinutes() > 0) continue;

        // Filtrar citas que se traslapen con este slot
        const overlapping = dayAppointments.filter((a) => {
          const aStart = new Date(a.appointmentDate);
          const aEnd = new Date(aStart.getTime() + a.duration * 60000);
          return slotStart < aEnd && slotEnd > aStart;
        });

        // Cuartos libres
        const occupiedRooms = new Set(overlapping.map((a) => a.roomId));
        const freeRooms = RECEPTIONIST_ROOMS.filter((r) => !occupiedRooms.has(r));
        if (freeRooms.length === 0) continue;

        // Recepcionistas libres
        const busyReceptionistIds = new Set(
          overlapping
            .map((a) => String(a.doctorId))
            .filter((id) => !botIds.includes(id)),
        );
        const freeReceptionists = receptionists.filter(
          (r) => !busyReceptionistIds.has(String(r._id)),
        );
        if (freeReceptionists.length === 0) continue;

        return { slot: slotStart, freeRooms, freeReceptionists };
      }
    }

    currentDay.setDate(currentDay.getDate() + 1);
  }

  return null;
};
