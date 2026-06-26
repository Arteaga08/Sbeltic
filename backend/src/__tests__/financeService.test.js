import { describe, it, expect } from "vitest";
import { computeCommission, getMonthRange } from "../services/financeService.js";

// =============================================
// financeService — cálculo de comisión y rango mensual
// =============================================

describe("computeCommission", () => {
  it("calcula porcentaje sobre lo ganado", () => {
    expect(computeCommission(1000, "PERCENTAGE", 30)).toBe(300);
  });

  it("redondea el porcentaje a 2 decimales", () => {
    // 999.99 * 30% = 299.997 -> 300.00
    expect(computeCommission(999.99, "PERCENTAGE", 30)).toBe(300);
    // 333.33 * 33% = 109.9989 -> 110.00
    expect(computeCommission(333.33, "PERCENTAGE", 33)).toBe(110);
  });

  it("usa monto fijo sin importar lo ganado", () => {
    expect(computeCommission(1000, "FIXED", 200)).toBe(200);
    expect(computeCommission(50, "FIXED", 200)).toBe(200);
  });

  it("trata el tipo por defecto como porcentaje", () => {
    expect(computeCommission(1000, undefined, 10)).toBe(100);
  });

  it("devuelve 0 con entradas inválidas o vacías", () => {
    expect(computeCommission(null, "PERCENTAGE", null)).toBe(0);
    expect(computeCommission(1000, "PERCENTAGE", 0)).toBe(0);
    expect(computeCommission(undefined, "FIXED", undefined)).toBe(0);
  });
});

describe("getMonthRange", () => {
  it("devuelve el inicio del mes y el inicio del mes siguiente", () => {
    const { start, end } = getMonthRange(6, 2026);
    expect(start).toEqual(new Date(2026, 5, 1));
    expect(end).toEqual(new Date(2026, 6, 1));
  });

  it("maneja diciembre cruzando al siguiente año", () => {
    const { start, end } = getMonthRange(12, 2026);
    expect(start).toEqual(new Date(2026, 11, 1));
    expect(end).toEqual(new Date(2027, 0, 1));
  });
});
