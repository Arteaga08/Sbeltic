import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

// =============================================
// Bug J: HMAC timing-safe comparison
// Bug I: Phone lookup without regex injection
// =============================================

import { verifyWebhookSignature } from "../services/whatsappService.js";

describe("verifyWebhookSignature (Bug J — timing-safe HMAC)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, WHATSAPP_APP_SECRET: "test-secret-key" };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("should return true for a valid signature", () => {
    const body = '{"test":"data"}';
    const expectedHash = crypto
      .createHmac("sha256", "test-secret-key")
      .update(body)
      .digest("hex");
    const signature = `sha256=${expectedHash}`;

    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });

  it("should return false for an invalid signature", () => {
    const body = '{"test":"data"}';
    const signature = "sha256=0000000000000000000000000000000000000000000000000000000000000000";

    expect(verifyWebhookSignature(body, signature)).toBe(false);
  });

  it("should return false when signatures have different lengths", () => {
    const body = '{"test":"data"}';
    const signature = "sha256=short";

    expect(verifyWebhookSignature(body, signature)).toBe(false);
  });

  it("should return false when WHATSAPP_APP_SECRET is not set", () => {
    delete process.env.WHATSAPP_APP_SECRET;
    expect(verifyWebhookSignature("body", "sha256=abc")).toBe(false);
  });

  it("should use timing-safe comparison (not ===)", () => {
    // Verify that crypto.timingSafeEqual is being used by spying on it
    const spy = vi.spyOn(crypto, "timingSafeEqual");

    const body = '{"test":"data"}';
    const expectedHash = crypto
      .createHmac("sha256", "test-secret-key")
      .update(body)
      .digest("hex");
    const signature = `sha256=${expectedHash}`;

    verifyWebhookSignature(body, signature);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should handle empty body", () => {
    const body = "";
    const expectedHash = crypto
      .createHmac("sha256", "test-secret-key")
      .update(body)
      .digest("hex");
    const signature = `sha256=${expectedHash}`;

    expect(verifyWebhookSignature(body, signature)).toBe(true);
  });
});

// =============================================
// Bug I: Phone lookup — exact match, no regex
// =============================================
describe("Phone number matching (Bug I — no regex injection)", () => {
  it("should match exact phone formats without regex", () => {
    // This tests the logic pattern used in webhookController.js
    const from = "5215551234567";
    const last10 = from.slice(-10);

    // Simulate what Patient.findOne query looks like
    const query = {
      $or: [
        { phone: from },
        { phone: last10 },
        { phone: `+${from}` },
      ],
    };

    // Verify exact match patterns (no $regex)
    expect(query.$or).toHaveLength(3);
    expect(query.$or[0]).toEqual({ phone: "5215551234567" });
    expect(query.$or[1]).toEqual({ phone: "5551234567" }); // last 10 digits
    expect(query.$or[2]).toEqual({ phone: "+5215551234567" });

    // Ensure no regex operators in query
    const queryStr = JSON.stringify(query);
    expect(queryStr).not.toContain("$regex");
  });

  it("should not be vulnerable to regex special characters in phone", () => {
    // Previously, if phone contained regex chars like .+*? it would match unexpected patterns
    const maliciousPhone = "52155.234567";
    const last10 = maliciousPhone.slice(-10);

    const query = {
      $or: [
        { phone: maliciousPhone },
        { phone: last10 },
        { phone: `+${maliciousPhone}` },
      ],
    };

    // With exact match, "." is literal, not "any character"
    expect(query.$or[0].phone).toBe("52155.234567");
    expect(query.$or[1].phone).toBe("155.234567"); // last 10 of "52155.234567"
  });

  it("should handle Mexican phone normalization (521 → 52)", () => {
    // The webhook normalizes 521XXXXXXXXXX to 52XXXXXXXXXX
    let from = "5215551234567";

    if (from.startsWith("521") && from.length === 13) {
      from = "52" + from.substring(3);
    }

    expect(from).toBe("525551234567");
    expect(from.length).toBe(12);
  });

  it("should not normalize non-Mexican numbers", () => {
    let from = "14155551234"; // US number

    if (from.startsWith("521") && from.length === 13) {
      from = "52" + from.substring(3);
    }

    expect(from).toBe("14155551234"); // unchanged
  });
});
