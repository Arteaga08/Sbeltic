import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Patient from "../models/clinical/Patient.js";
import TimeBlock from "../models/TimeBlock.js";
import Treatment from "../models/clinical/Treatment.js";
import Coupon from "../models/marketing/Coupon.js";
import Waitlist from "../models/clinical/Waitlist.js";
import AppError from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/responseHandler.js";
import { deductInventoryFEFO } from "../services/inventoryService.js";
import { processTriggerCoupons, notifyNextWaitlistCandidate } from "../services/automationService.js";
import { checkFullSchedule, findNextAvailableSlot, RECEPTIONIST_ROOMS } from "../services/availabilityService.js";

// --- HELPERS DE COLISIÓN (Internos) ---

const checkBlockCollision = async (doctorId, startTime, durationMinutes) => {
  const newStart = new Date(startTime);
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

  const block = await TimeBlock.findOne({
    doctorId,
    startTime: { $lt: newEnd },
    endTime: { $gt: newStart },
  });

  return block;
};

const checkTimeCollision = async (
  performerId,
  roomId,
  newStartTime,
  durationMinutes,
  excludeAppointmentId = null,
) => {
  const newStart = new Date(newStartTime);
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);
  const startOfDay = new Date(newStart).setHours(0, 0, 0, 0);
  const endOfDay = new Date(newStart).setHours(23, 59, 59, 999);

  // 1. Normalizamos los IDs a String usando el constructor seguro String()
  // Esto evita errores si el valor es null o undefined.
  const targetPerformerId = String(performerId);
  const targetRoomId = String(roomId);
  const idToExclude = excludeAppointmentId
    ? String(excludeAppointmentId)
    : null;

  const dailyAppointments = await Appointment.find({
    status: { $ne: "CANCELLED" },
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    $or: [{ doctorId: performerId }, { roomId: roomId }],
  });

  for (let appt of dailyAppointments) {
    // 2. Comparación segura de IDs omitiendo la cita actual si existe
    if (idToExclude && String(appt._id) === idToExclude) {
      continue;
    }

    const existingStart = new Date(appt.appointmentDate);
    const existingEnd = new Date(
      existingStart.getTime() + appt.duration * 60000,
    );

    // 3. Lógica de traslape de tiempos
    if (newStart < existingEnd && newEnd > existingStart) {
      const sameRoom = String(appt.roomId) === targetRoomId;
      const sameDoctor = String(appt.doctorId) === targetPerformerId;

      // Diferente doctor Y diferente cabina → no hay conflicto real
      if (!sameRoom && !sameDoctor) continue;

      // Misma cabina, diferente doctor → Choque de cuarto
      if (sameRoom && !sameDoctor) {
        return {
          collision: true,
          reason: `La habitación/cabina ${roomId} ya está ocupada en ese horario.`,
        };
      }

      // Mismo doctor (cualquier cabina) → Choque de agenda del personal
      return {
        collision: true,
        reason: "El personal ya tiene una cita asignada en ese horario.",
      };
    }
  }
  return { collision: false };
};

// --- CONTROLADORES CRUD ---

const createAppointment = asyncHandler(async (req, res, next) => {
  const { doctorId, roomId, appointmentDate, duration = 30 } = req.body;

  const block = await checkBlockCollision(doctorId, appointmentDate, duration);
  if (block)
    return next(new AppError(`Personal no disponible: ${block.type}`, 400));

  const collisionCheck = await checkTimeCollision(
    doctorId,
    roomId,
    appointmentDate,
    duration,
  );
  if (collisionCheck.collision)
    return next(new AppError(collisionCheck.reason, 400));

  // Verificar agenda llena para cuartos de recepcionista
  if (RECEPTIONIST_ROOMS.includes(roomId)) {
    const fullCheck = await checkFullSchedule(appointmentDate, duration);
    if (fullCheck.isFull) {
      const nextSlot = await findNextAvailableSlot(duration, new Date(appointmentDate));
      return res.status(409).json({
        success: false,
        message: "Agenda llena: todas las cabinas o recepcionistas están ocupadas en ese horario.",
        code: "SCHEDULE_FULL",
        data: {
          nextAvailableSlot: nextSlot
            ? { suggestedDate: nextSlot.slot, suggestedRooms: nextSlot.freeRooms }
            : null,
          canJoinWaitlist: !nextSlot,
        },
      });
    }
  }

  const appointment = new Appointment({ ...req.body, createdBy: req.user._id });
  const savedAppointment = await appointment.save();

  const populated = await Appointment.findById(savedAppointment._id)
    .populate("patientId", "name phone")
    .populate("doctorId", "name");

  sendResponse(res, 201, populated, "Cita agendada correctamente");
});

const getAppointments = asyncHandler(async (req, res, next) => {
  const { doctorId, date, status, roomId } = req.query;
  const query = {};

  if (doctorId) query.doctorId = doctorId;
  if (roomId) query.roomId = roomId;
  if (status) query.status = status;
  if (date && typeof date === "string") {
    const start = new Date(date);
    if (!isNaN(start)) {
      const daysParam = Math.min(parseInt(req.query.days) || 1, 30);
      const end = new Date(
        start.getTime() + daysParam * 24 * 60 * 60 * 1000 - 1,
      );
      query.appointmentDate = { $gte: start, $lte: end };
    }
  }

  const appointments = await Appointment.find(query)
    .populate("patientId", "name phone")
    .populate("doctorId", "name")
    .sort({ appointmentDate: 1 });

  sendResponse(res, 200, appointments);
});

const getAppointmentById = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("patientId", "name phone email")
    .populate("doctorId", "name role")
    .populate("createdBy", "name");

  if (!appointment) return next(new AppError("Cita no encontrada", 404));
  sendResponse(res, 200, appointment);
});

const updateAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError("Cita no encontrada", 404));

  // 1. Bloqueo de seguridad para citas ya completadas
  if (
    appointment.status === "COMPLETED" &&
    req.body.status &&
    req.body.status !== "COMPLETED"
  ) {
    return next(
      new AppError(
        "No se puede alterar una cita completada. El registro está bloqueado.",
        400,
      ),
    );
  }

  // 2. Validación de colisiones (Personal y Cabina)
  if (
    req.body.appointmentDate ||
    req.body.doctorId ||
    req.body.duration ||
    req.body.roomId
  ) {
    const newDoctorId = req.body.doctorId || appointment.doctorId;
    const newRoomId = req.body.roomId || appointment.roomId;
    const newDate = req.body.appointmentDate || appointment.appointmentDate;
    const newDuration = req.body.duration || appointment.duration;

    const block = await checkBlockCollision(newDoctorId, newDate, newDuration);
    if (block)
      return next(new AppError(`Colisión con bloqueo: ${block.type}`, 400));

    const collisionCheck = await checkTimeCollision(
      newDoctorId,
      newRoomId,
      newDate,
      newDuration,
      appointment._id,
    );
    if (collisionCheck.collision)
      return next(new AppError(collisionCheck.reason, 400));

    // Verificar agenda llena para cuartos de recepcionista
    if (RECEPTIONIST_ROOMS.includes(newRoomId)) {
      const fullCheck = await checkFullSchedule(newDate, newDuration, appointment._id);
      if (fullCheck.isFull) {
        const nextSlot = await findNextAvailableSlot(newDuration, new Date(newDate));
        return res.status(409).json({
          success: false,
          message: "Agenda llena: todas las cabinas o recepcionistas están ocupadas en ese horario.",
          code: "SCHEDULE_FULL",
          data: {
            nextAvailableSlot: nextSlot
              ? { suggestedDate: nextSlot.slot, suggestedRooms: nextSlot.freeRooms }
              : null,
            canJoinWaitlist: !nextSlot,
          },
        });
      }
    }
  }

  let safeCouponCode = null;
  if (typeof req.body.couponCode === "string") {
    safeCouponCode = req.body.couponCode.toUpperCase();
  }

  const isCompletingNow =
    req.body.status === "COMPLETED" && appointment.status !== "COMPLETED";

  let session = null;
  let isFirstVisit = false;

  try {
    // Intentamos iniciar sesión si vamos a completar la cita (Checkout)
    if (isCompletingNow) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (sessionErr) {
        // Si falla por falta de Replica Set, trabajamos sin sesión (Modo Local)
        console.warn(
          "⚠️ Ejecutando sin transacciones (Entorno Local detectado).",
        );
        session = null;
      }
    }

    // 3. Mapeo de campos permitidos
    const allowedFields = [
      "appointmentDate",
      "duration",
      "status",
      "treatmentName",
      "treatmentCategory",
      "originalQuote",
      "isReminderSent",
      "nextFollowUpDate",
      "doctorId",
      "treatmentId",
      "consumedSupplies",
      "roomId",
      "isTouchUp",
      "touchUpDate",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) appointment[field] = req.body[field];
    });

    // 4. Actualización de expediente de consulta
    if (req.body.consultationRecord) {
      appointment.consultationRecord = {
        ...appointment.consultationRecord,
        ...req.body.consultationRecord,
        vitalSigns: {
          ...appointment.consultationRecord?.vitalSigns,
          ...req.body.consultationRecord?.vitalSigns,
        },
        physicalExam: {
          ...appointment.consultationRecord?.physicalExam,
          ...req.body.consultationRecord?.physicalExam,
        },
      };
    }

    // 5. Lógica de Checkout (Solo si pasa a COMPLETED)
    if (isCompletingNow) {
      let treatment = appointment.treatmentId
        ? await Treatment.findById(appointment.treatmentId).session(session)
        : null;

      // Descuento de Inventario FEFO
      if (appointment.consumedSupplies?.length > 0) {
        for (const item of appointment.consumedSupplies) {
          await deductInventoryFEFO(item.productId, item.quantity, session);
        }
      }

      let dictatedAmount = appointment.originalQuote || 0;
      let totalDiscount = 0;

      // Promo automática por tratamiento
      const hasActivePromo =
        treatment?.promotionalPrice && treatment?.promoExpiresAt > new Date();
      if (
        hasActivePromo &&
        (dictatedAmount === 0 || dictatedAmount > treatment.promotionalPrice)
      ) {
        totalDiscount =
          dictatedAmount > 0 ? dictatedAmount - treatment.promotionalPrice : 0;
        dictatedAmount = treatment.promotionalPrice;
      }

      // Aplicación de Cupón Manual
      if (safeCouponCode && totalDiscount === 0) {
        const coupon = await Coupon.findOne({
          code: safeCouponCode,
          isActive: true,
          expiresAt: { $gte: new Date() },
        }).session(session);

        if (coupon) {
          totalDiscount =
            coupon.discountType === "PERCENTAGE"
              ? dictatedAmount * (coupon.discountValue / 100)
              : coupon.discountValue;

          dictatedAmount -= totalDiscount;
          appointment.appliedCoupon = coupon._id;
          coupon.usedCount += 1;

          if (coupon.usedCount >= coupon.maxRedemptions)
            coupon.isActive = false;
          await coupon.save({ session });

          // Recompensa por referido si aplica
          if (coupon.type === "REFERRAL" && coupon.referralConfig?.ownerId) {
            const rewardCoupon = new Coupon({
              code: `REWARD-${Math.random().toString(36).substring(7).toUpperCase()}`,
              type: "WELCOME",
              discountType: "PERCENTAGE",
              discountValue: 10,
              expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              maxRedemptions: 1,
              whatsappTemplateName: "sbeltic_bienvenida",
            });
            await rewardCoupon.save({ session });
            await Patient.findByIdAndUpdate(
              coupon.referralConfig.ownerId,
              { $push: { walletCoupons: rewardCoupon._id } },
              { session },
            );
          }
        }
      }

      appointment.discountApplied = totalDiscount;
      appointment.finalAmount = dictatedAmount;

      // Cupón de Bienvenida (Si es su primera cita completada)
      const pastCompleted = await Appointment.countDocuments({
        patientId: appointment.patientId,
        status: "COMPLETED",
        _id: { $ne: appointment._id },
      }).session(session);

      if (pastCompleted === 0) {
        isFirstVisit = true;
        const welcome = new Coupon({
          code: `WELCOME-${Math.random().toString(36).substring(7).toUpperCase()}`,
          type: "WELCOME",
          discountType: "PERCENTAGE",
          discountValue: 10,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          maxRedemptions: 1,
          whatsappTemplateName: "sbeltic_bienvenida",
        });
        await welcome.save({ session });
        await Patient.findByIdAndUpdate(
          appointment.patientId,
          { $push: { walletCoupons: welcome._id } },
          { session },
        );
      }

      // Fecha de retoque sugerida
      if (treatment?.suggestedTouchUpDays) {
        appointment.touchUpDate = new Date(
          Date.now() + treatment.suggestedTouchUpDays * 24 * 60 * 60 * 1000,
        );
      }
    }

    // 6. Guardado y Commit
    await appointment.save({ session });

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    const finalApp = await Appointment.findById(appointment._id)
      .populate("patientId", "name phone walletCoupons")
      .populate("doctorId", "name")
      .populate("treatmentId", "name")
      .populate("appliedCoupon", "code discountValue");

    sendResponse(
      res,
      200,
      finalApp,
      "Cita actualizada y procesada correctamente.",
    );

    // Disparar triggers de marketing (fire-and-forget, no bloquea la respuesta)
    if (isFirstVisit) {
      processTriggerCoupons("ON_APPOINTMENT_COMPLETE", finalApp.patientId, {
        isFirstVisit: true,
      }).catch(console.error);
    }
  } catch (error) {
    // Si la transacción falla al final, intentamos abortar
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    // Manejo específico del error de Replica Set en medio del proceso
    if (
      error.message.includes("replica set") ||
      error.message.includes("Transaction numbers")
    ) {
      console.warn(
        "❌ Falló la transacción en tiempo de ejecución. Reintentando guardado simple...",
      );
      await appointment.save(); // Intento final sin sesión
      return sendResponse(
        res,
        200,
        appointment,
        "Cita guardada (Sin Transacciones)",
      );
    }

    return next(new AppError(`Error en el proceso: ${error.message}`, 400));
  }
});

const cancelAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment || appointment.status === "CANCELLED")
    return next(new AppError("Cita no encontrada o ya cancelada", 404));

  appointment.status = "CANCELLED";
  await appointment.save();

  // Notificar al siguiente candidato en waitlist (con criterio semanal)
  const waitlistTriggered = await notifyNextWaitlistCandidate(
    appointment.doctorId,
    appointment.appointmentDate,
  );

  sendResponse(
    res,
    200,
    { appointment, waitlistTriggered },
    "Cita cancelada correctamente.",
  );
});

const getDaySummary = asyncHandler(async (req, res, next) => {
  const { date } = req.query;
  const start = date
    ? new Date(date)
    : (() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
      })();
  const startOfDay = new Date(start);
  const endOfDay = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);

  const appointments = await Appointment.find({
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: "CANCELLED" },
  });

  const total = appointments.length;
  const confirmed = appointments.filter((a) =>
    ["CONFIRMED", "IN_PROGRESS"].includes(a.status),
  ).length;
  const revenue = appointments
    .filter((a) => a.status === "COMPLETED")
    .reduce((sum, a) => sum + (a.finalAmount || 0), 0);

  sendResponse(res, 200, { total, confirmed, revenue });
});

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getDaySummary,
};
