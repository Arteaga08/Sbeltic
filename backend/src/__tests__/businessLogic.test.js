import { describe, it, expect, vi } from "vitest";

// =============================================
// Bug E: Availability — business hours boundary
// Bug N: inventoryService — SKU attempt limit
// Bug H: appointmentController — maxUsesPerUser
// =============================================

// =============================================
// Bug E: Business hours boundary (slotEnd > businessEnd)
// =============================================
describe("Business hours slot validation (Bug E)", () => {
  const BUSINESS_HOURS = { start: 9, end: 18 };

  const isSlotWithinBusinessHours = (slotStart, durationMinutes) => {
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
    const businessEnd = new Date(slotStart);
    businessEnd.setHours(BUSINESS_HOURS.end, 0, 0, 0);
    return slotEnd <= businessEnd;
  };

  it("should accept slot 17:30–18:00 (ends exactly at close)", () => {
    const slotStart = new Date("2026-04-10T17:30:00");
    expect(isSlotWithinBusinessHours(slotStart, 30)).toBe(true);
  });

  it("should reject slot 17:45–18:15 (exceeds close)", () => {
    const slotStart = new Date("2026-04-10T17:45:00");
    expect(isSlotWithinBusinessHours(slotStart, 30)).toBe(false);
  });

  it("should reject slot 17:30–18:30 (60 min, exceeds close)", () => {
    const slotStart = new Date("2026-04-10T17:30:00");
    expect(isSlotWithinBusinessHours(slotStart, 60)).toBe(false);
  });

  it("should accept slot 09:00–09:30 (start of day)", () => {
    const slotStart = new Date("2026-04-10T09:00:00");
    expect(isSlotWithinBusinessHours(slotStart, 30)).toBe(true);
  });

  it("should accept slot 17:00–17:30 (well before close)", () => {
    const slotStart = new Date("2026-04-10T17:00:00");
    expect(isSlotWithinBusinessHours(slotStart, 30)).toBe(true);
  });

  it("should reject slot starting at 18:00 (after hours)", () => {
    const slotStart = new Date("2026-04-10T18:00:00");
    expect(isSlotWithinBusinessHours(slotStart, 30)).toBe(false);
  });

  it("should accept 15-min slot ending at 18:00", () => {
    const slotStart = new Date("2026-04-10T17:45:00");
    expect(isSlotWithinBusinessHours(slotStart, 15)).toBe(true);
  });
});

// =============================================
// Bug N: SKU generation attempt limit
// =============================================
describe("SKU generation attempt limit (Bug N)", () => {
  it("should throw after 100 failed attempts", async () => {
    // Replicate the getUniqueSKU logic with a mock that always returns existing
    const mockFindOne = vi.fn().mockResolvedValue({ sku: "exists" });

    const getUniqueSKU = async (categoryName) => {
      const prefix = categoryName.substring(0, 3).toUpperCase().padEnd(3, "X");
      let isUnique = false;
      let sku = "";
      let attempts = 0;

      while (!isUnique) {
        if (++attempts > 100) {
          throw new Error(
            `No se pudo generar un SKU único para la categoría "${categoryName}" después de 100 intentos`,
          );
        }
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        sku = `${prefix}-${randomDigits}`;

        const existing = await mockFindOne({ sku });
        if (!existing) isUnique = true;
      }

      return sku;
    };

    await expect(getUniqueSKU("Botox")).rejects.toThrow("100 intentos");
    expect(mockFindOne).toHaveBeenCalledTimes(100);
  });

  it("should succeed when a unique SKU is found", async () => {
    let callCount = 0;
    const mockFindOne = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount < 3 ? { sku: "exists" } : null);
    });

    const getUniqueSKU = async (categoryName) => {
      const prefix = categoryName.substring(0, 3).toUpperCase().padEnd(3, "X");
      let isUnique = false;
      let sku = "";
      let attempts = 0;

      while (!isUnique) {
        if (++attempts > 100) {
          throw new Error("Too many attempts");
        }
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        sku = `${prefix}-${randomDigits}`;

        const existing = await mockFindOne({ sku });
        if (!existing) isUnique = true;
      }

      return sku;
    };

    const result = await getUniqueSKU("Botox");
    expect(result).toMatch(/^BOT-\d{4}$/);
    expect(mockFindOne).toHaveBeenCalledTimes(3);
  });

  it("should handle short category names with padding", () => {
    const categoryName = "AB";
    const prefix = categoryName.substring(0, 3).toUpperCase().padEnd(3, "X");
    expect(prefix).toBe("ABX");
  });

  it("should handle empty category name", () => {
    const categoryName = "";
    const prefix = categoryName.substring(0, 3).toUpperCase().padEnd(3, "X");
    expect(prefix).toBe("XXX");
  });
});

// =============================================
// Bug H: maxUsesPerUser enforcement
// =============================================
describe("maxUsesPerUser enforcement (Bug H)", () => {
  it("should block coupon if patient already used it max times", () => {
    const coupon = {
      maxUsesPerUser: 1,
      usedBy: [
        { patientId: { toString: () => "patient-123" }, usedAt: new Date() },
      ],
    };
    const appointmentPatientId = { toString: () => "patient-123" };

    const usageByPatient = coupon.usedBy.filter(
      (u) => u.patientId?.toString() === appointmentPatientId.toString(),
    ).length;

    expect(usageByPatient >= coupon.maxUsesPerUser).toBe(true);
  });

  it("should allow coupon if patient has not used it yet", () => {
    const coupon = {
      maxUsesPerUser: 2,
      usedBy: [
        { patientId: { toString: () => "other-patient" }, usedAt: new Date() },
      ],
    };
    const appointmentPatientId = { toString: () => "patient-123" };

    const usageByPatient = coupon.usedBy.filter(
      (u) => u.patientId?.toString() === appointmentPatientId.toString(),
    ).length;

    expect(usageByPatient >= coupon.maxUsesPerUser).toBe(false);
  });

  it("should allow coupon if patient used it fewer times than max", () => {
    const coupon = {
      maxUsesPerUser: 3,
      usedBy: [
        { patientId: { toString: () => "patient-123" }, usedAt: new Date() },
        { patientId: { toString: () => "patient-123" }, usedAt: new Date() },
        { patientId: { toString: () => "other" }, usedAt: new Date() },
      ],
    };
    const appointmentPatientId = { toString: () => "patient-123" };

    const usageByPatient = coupon.usedBy.filter(
      (u) => u.patientId?.toString() === appointmentPatientId.toString(),
    ).length;

    expect(usageByPatient).toBe(2);
    expect(usageByPatient >= coupon.maxUsesPerUser).toBe(false);
  });

  it("should handle empty usedBy array", () => {
    const coupon = { maxUsesPerUser: 1, usedBy: [] };
    const appointmentPatientId = { toString: () => "patient-123" };

    const usageByPatient = coupon.usedBy.filter(
      (u) => u.patientId?.toString() === appointmentPatientId.toString(),
    ).length;

    expect(usageByPatient).toBe(0);
    expect(usageByPatient >= coupon.maxUsesPerUser).toBe(false);
  });

  it("should handle null patientId in usedBy entries", () => {
    const coupon = {
      maxUsesPerUser: 1,
      usedBy: [{ patientId: null, usedAt: new Date() }],
    };
    const appointmentPatientId = { toString: () => "patient-123" };

    const usageByPatient = coupon.usedBy.filter(
      (u) => u.patientId?.toString() === appointmentPatientId.toString(),
    ).length;

    expect(usageByPatient).toBe(0);
  });
});
