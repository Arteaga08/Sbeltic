import Appointment from "../models/Appointment.js";
import StaffEarning from "../models/finance/StaffEarning.js";
import User from "../models/User.js";

// Roles que se consideran colaboradores (atienden pacientes y pagan comisión al admin)
const COLLABORATOR_ROLES = ["DOCTOR", "PHYSIOTHERAPIST"];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Calcula la comisión que recibe el admin.
 * @param {number} earnedAmount - Monto ganado por el colaborador en la cita.
 * @param {"PERCENTAGE"|"FIXED"} type - Tipo de comisión.
 * @param {number} value - % (si PERCENTAGE) o monto fijo en MXN (si FIXED).
 * @returns {number} comisión redondeada a 2 decimales.
 */
const computeCommission = (earnedAmount, type, value) => {
  const amount = Number(earnedAmount) || 0;
  const val = Number(value) || 0;

  if (type === "FIXED") return round2(val);
  // PERCENTAGE por defecto
  return round2((amount * val) / 100);
};

/**
 * Devuelve el rango [start, end) del mes indicado.
 * @param {number} month - 1-12
 * @param {number} year
 */
const getMonthRange = (month, year) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
};

/**
 * Estado de cuenta de un colaborador para un mes: lista de citas COMPLETED
 * unidas (left join) con su ganancia registrada + resumen de totales.
 */
const getCollaboratorStatement = async (collaboratorId, month, year) => {
  const { start, end } = getMonthRange(month, year);

  const appointments = await Appointment.find({
    doctorId: collaboratorId,
    status: "COMPLETED",
    isActive: true,
    appointmentDate: { $gte: start, $lt: end },
  })
    .populate("patientId", "name")
    .sort({ appointmentDate: 1 })
    .lean();

  const earnings = await StaffEarning.find({
    collaboratorId,
    serviceDate: { $gte: start, $lt: end },
  }).lean();

  const earningByAppointment = new Map(
    earnings.map((e) => [String(e.appointmentId), e]),
  );

  const items = appointments.map((appt) => {
    const earning = earningByAppointment.get(String(appt._id)) || null;
    return {
      appointmentId: appt._id,
      appointmentDate: appt.appointmentDate,
      patientName: appt.patientId?.name || "Paciente",
      treatmentName: appt.treatmentName,
      finalAmount: appt.finalAmount || 0, // monto sugerido (precarga)
      earning, // null si aún no se registra
    };
  });

  const summary = items.reduce(
    (acc, item) => {
      if (item.earning) {
        acc.totalEarned = round2(acc.totalEarned + (item.earning.earnedAmount || 0));
        acc.totalCommission = round2(
          acc.totalCommission + (item.earning.commissionAmount || 0),
        );
      } else {
        acc.pendingCount += 1;
      }
      return acc;
    },
    { totalEarned: 0, totalCommission: 0, pendingCount: 0 },
  );

  summary.netForCollaborator = round2(
    summary.totalEarned - summary.totalCommission,
  );
  summary.patientsCount = items.length;

  const collaboratorUser = await User.findById(collaboratorId)
    .select("commissionType commissionValue")
    .lean();

  return {
    items,
    summary,
    defaultCommission: {
      type: collaboratorUser?.commissionType || "PERCENTAGE",
      value: collaboratorUser?.commissionValue || 0,
    },
  };
};

/**
 * Resumen para el admin: totales del mes por cada colaborador activo.
 * Incluye colaboradores sin registros (en ceros) para dar panorama completo.
 */
const getAdminSummary = async (month, year) => {
  const { start, end } = getMonthRange(month, year);

  const collaborators = await User.find({
    isActive: true,
    role: { $in: COLLABORATOR_ROLES },
  })
    .select("_id name role")
    .sort({ name: 1 })
    .lean();

  const totals = await StaffEarning.aggregate([
    { $match: { serviceDate: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: "$collaboratorId",
        totalEarned: { $sum: "$earnedAmount" },
        totalCommission: { $sum: "$commissionAmount" },
        patientsCount: { $sum: 1 },
      },
    },
  ]);

  const totalsByCollaborator = new Map(
    totals.map((t) => [String(t._id), t]),
  );

  const apptCounts = await Appointment.aggregate([
    {
      $match: {
        doctorId: { $in: collaborators.map((c) => c._id) },
        status: "COMPLETED",
        isActive: true,
        appointmentDate: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$doctorId", total: { $sum: 1 } } },
  ]);
  const apptCountByCollaborator = new Map(
    apptCounts.map((a) => [String(a._id), a.total]),
  );

  return collaborators.map((c) => {
    const t = totalsByCollaborator.get(String(c._id));
    const totalEarned = round2(t?.totalEarned || 0);
    const totalCommission = round2(t?.totalCommission || 0);
    const patientsCount = t?.patientsCount || 0;
    const completedCount = apptCountByCollaborator.get(String(c._id)) || 0;
    return {
      collaboratorId: c._id,
      name: c.name,
      role: c.role,
      totalEarned,
      totalCommission,
      netForCollaborator: round2(totalEarned - totalCommission),
      patientsCount,
      pendingCount: Math.max(0, completedCount - patientsCount),
    };
  });
};

export {
  COLLABORATOR_ROLES,
  computeCommission,
  getMonthRange,
  getCollaboratorStatement,
  getAdminSummary,
};
