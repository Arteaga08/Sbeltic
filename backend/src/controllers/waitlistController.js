import Waitlist from "../models/clinical/Waitlist.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";

const addToWaitlist = asyncHandler(async (req, res, next) => {
  const { patientId, doctorId, desiredDate } = req.body;

  // Ya no necesitamos validar si existen, Zod lo hizo en la ruta.
  // Pasamos directo a la regla de negocio (evitar duplicados).
  const existingEntry = await Waitlist.findOne({
    patientId,
    doctorId,
    desiredDate,
    status: "WAITING",
  });

  if (existingEntry) {
    return next(
      new AppError(
        "El paciente ya está en la lista de espera para esa fecha",
        400,
      ),
    );
  }

  const waitlistEntry = new Waitlist(req.body);
  await waitlistEntry.save();

  sendResponse(
    res,
    201,
    waitlistEntry,
    "Paciente añadido a la lista de espera exitosamente",
  );
});

const getWaitlist = asyncHandler(async (req, res, next) => {
  const list = await Waitlist.find({ status: "WAITING" })
    .populate("patientId", "name phone")
    .populate("doctorId", "name")
    .sort({ desiredDate: 1 });

  sendResponse(res, 200, list);
});

const updateWaitlistStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  // Zod ya validó que req.params.id sea un MongoID válido y que status sea correcto

  const waitlistEntry = await Waitlist.findById(req.params.id);

  if (!waitlistEntry) {
    return next(new AppError("Registro de lista de espera no encontrado", 404));
  }

  if (status) waitlistEntry.status = status;
  await waitlistEntry.save();

  sendResponse(
    res,
    200,
    waitlistEntry,
    "Estado de lista de espera actualizado",
  );
});

// --- EXPORTACIÓN AGRUPADA ---
export { addToWaitlist, getWaitlist, updateWaitlistStatus };
