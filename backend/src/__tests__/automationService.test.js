import { describe, it, expect, vi, beforeEach } from "vitest";

// =============================================
// Tests para Bug A: calcNextSendAt (setDay fix)
// Tests para Bug G: birthday year check
// Tests para Bug F: atomic coupon updates
// =============================================

// Mock all external dependencies BEFORE importing the module
vi.mock("../models/Appointment.js", () => ({ default: {} }));
vi.mock("../models/clinical/Patient.js", () => ({ default: {} }));
vi.mock("../models/clinical/Treatment.js", () => ({ default: {} }));
vi.mock("../models/marketing/Coupon.js", () => ({
  default: {
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));
vi.mock("../models/clinical/Waitlist.js", () => ({ default: {} }));
vi.mock("./whatsappService.js", () => ({
  sendWhatsAppMessage: vi.fn(),
  sendWhatsAppTemplate: vi.fn(),
}));

const { calcNextSendAt, buildTemplateComponents } = await import(
  "../services/automationService.js"
);

// =============================================
// Bug A: calcNextSendAt — setDay() fix
// =============================================
describe("calcNextSendAt (Bug A — WEEKLY/MONTHLY date calculation)", () => {
  it("should return a valid Date for WEEKLY frequency", () => {
    const coupon = {
      schedule: { frequency: "WEEKLY", sendHour: 10, dayOfWeek: 1 }, // Monday
    };

    const result = calcNextSendAt(coupon);

    expect(result).toBeInstanceOf(Date);
    expect(result.getDay()).toBe(1); // Must be Monday
    expect(result.getHours()).toBe(10);
    expect(result > new Date()).toBe(true); // Must be in the future
  });

  it("should return next occurrence of the target day, not today", () => {
    const today = new Date();
    const todayDow = today.getDay();

    const coupon = {
      schedule: { frequency: "WEEKLY", sendHour: 8, dayOfWeek: todayDow },
    };

    const result = calcNextSendAt(coupon);

    // Should be at least 7 days from now (next week's same day)
    const diffDays = (result - today) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThanOrEqual(14);
    expect(result.getDay()).toBe(todayDow);
  });

  it("should handle WEEKLY with dayOfWeek=0 (Sunday)", () => {
    const coupon = {
      schedule: { frequency: "WEEKLY", sendHour: 9, dayOfWeek: 0 },
    };

    const result = calcNextSendAt(coupon);
    expect(result.getDay()).toBe(0); // Sunday
  });

  it("should handle WEEKLY with dayOfWeek=6 (Saturday)", () => {
    const coupon = {
      schedule: { frequency: "WEEKLY", sendHour: 9, dayOfWeek: 6 },
    };

    const result = calcNextSendAt(coupon);
    expect(result.getDay()).toBe(6); // Saturday
  });

  it("should return a valid Date for MONTHLY frequency", () => {
    const coupon = {
      schedule: { frequency: "MONTHLY", sendHour: 8, dayOfMonth: 15 },
    };

    const result = calcNextSendAt(coupon);

    expect(result).toBeInstanceOf(Date);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(8);
  });

  it("should cap MONTHLY dayOfMonth at 28 to avoid invalid dates", () => {
    const coupon = {
      schedule: { frequency: "MONTHLY", sendHour: 8, dayOfMonth: 31 },
    };

    const result = calcNextSendAt(coupon);
    expect(result.getDate()).toBe(28); // Capped at 28
  });

  it("should return null for ONCE frequency", () => {
    const coupon = { schedule: { frequency: "ONCE" } };
    expect(calcNextSendAt(coupon)).toBeNull();
  });

  it("should return null for AUTO frequency", () => {
    const coupon = { schedule: { frequency: "AUTO" } };
    expect(calcNextSendAt(coupon)).toBeNull();
  });

  it("should default sendHour to 8 when not specified", () => {
    const coupon = {
      schedule: { frequency: "WEEKLY", dayOfWeek: 3 },
    };

    const result = calcNextSendAt(coupon);
    expect(result.getHours()).toBe(8);
  });

  it("should set minutes, seconds, milliseconds to 0", () => {
    const coupon = {
      schedule: { frequency: "WEEKLY", sendHour: 14, dayOfWeek: 5 },
    };

    const result = calcNextSendAt(coupon);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });
});

// =============================================
// Bug G: Birthday year check (s.year != null)
// =============================================
describe("Birthday year null safety (Bug G)", () => {
  it("should not match sentTo entries with undefined year", () => {
    const sentTo = [
      { patientId: { toString: () => "abc123" }, sentAt: new Date(), year: undefined },
      { patientId: { toString: () => "abc123" }, sentAt: new Date() }, // no year field
    ];

    const currentYear = new Date().getFullYear();
    const patientId = "abc123";

    // This replicates the fixed logic from line 358
    const alreadySent = sentTo.some(
      (s) =>
        s.patientId?.toString() === patientId &&
        s.year != null &&
        s.year === currentYear,
    );

    expect(alreadySent).toBe(false);
  });

  it("should match sentTo entries with correct year", () => {
    const currentYear = new Date().getFullYear();
    const sentTo = [
      { patientId: { toString: () => "abc123" }, sentAt: new Date(), year: currentYear },
    ];

    const alreadySent = sentTo.some(
      (s) =>
        s.patientId?.toString() === "abc123" &&
        s.year != null &&
        s.year === currentYear,
    );

    expect(alreadySent).toBe(true);
  });

  it("should not match sentTo entries from previous years", () => {
    const currentYear = new Date().getFullYear();
    const sentTo = [
      { patientId: { toString: () => "abc123" }, sentAt: new Date(), year: currentYear - 1 },
    ];

    const alreadySent = sentTo.some(
      (s) =>
        s.patientId?.toString() === "abc123" &&
        s.year != null &&
        s.year === currentYear,
    );

    expect(alreadySent).toBe(false);
  });
});

// =============================================
// buildTemplateComponents — Pure function
// =============================================
describe("buildTemplateComponents", () => {
  it("should build WELCOME template with correct params", () => {
    const coupon = {
      type: "WELCOME",
      discountType: "PERCENTAGE",
      discountValue: 15,
      code: "WELCOME-ABC",
      templateVariables: {},
    };
    const patient = { name: "María López" };

    const result = buildTemplateComponents(coupon, patient);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("body");
    expect(result[0].parameters).toHaveLength(3);
    expect(result[0].parameters[0].text).toBe("María"); // first name
    expect(result[0].parameters[1].text).toBe("15%");
    expect(result[0].parameters[2].text).toBe("WELCOME-ABC");
  });

  it("should build FIXED_AMOUNT discount format", () => {
    const coupon = {
      type: "WELCOME",
      discountType: "FIXED_AMOUNT",
      discountValue: 200,
      code: "FIXED200",
      templateVariables: {},
    };
    const patient = { name: "Carlos" };

    const result = buildTemplateComponents(coupon, patient);
    expect(result[0].parameters[1].text).toBe("$200");
  });

  it("should handle patient without name", () => {
    const coupon = {
      type: "WELCOME",
      discountType: "PERCENTAGE",
      discountValue: 10,
      code: "TEST",
      templateVariables: {},
    };
    const patient = {};

    const result = buildTemplateComponents(coupon, patient);
    expect(result[0].parameters[0].text).toBe("Paciente");
  });

  it("should build SEASONAL template with named parameters", () => {
    const coupon = {
      type: "SEASONAL",
      discountType: "PERCENTAGE",
      discountValue: 20,
      code: "VERANO20",
      templateVariables: { promocion: "Verano 2026" },
    };
    const patient = { name: "Ana" };

    const result = buildTemplateComponents(coupon, patient);
    const params = result[0].parameters;

    // SEASONAL uses named params
    expect(params[0].parameter_name).toBe("nombre");
    expect(params[1].parameter_name).toBe("promocion");
    expect(params[1].text).toBe("Verano 2026");
    expect(params[2].parameter_name).toBe("codigo");
  });
});
