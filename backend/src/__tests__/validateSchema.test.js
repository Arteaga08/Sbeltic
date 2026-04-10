import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

// =============================================
// Bug O: validateSchema uses next() instead of res.json()
// Bug B: cronJobs runTask error isolation
// =============================================

import { validateSchema } from "../middlewares/validateSchema.js";

describe("validateSchema middleware (Bug O — uses next() for errors)", () => {
  const mockRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  });

  const mockNext = () => vi.fn();

  it("should call next() without args when validation passes", () => {
    const schema = { body: z.object({ name: z.string() }) };
    const req = { body: { name: "test" } };
    const res = mockRes();
    const next = mockNext();

    validateSchema(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should call next(error) when validation fails — NOT res.status()", () => {
    const schema = { body: z.object({ name: z.string() }) };
    const req = { body: { name: 123 } }; // invalid type
    const res = mockRes();
    const next = mockNext();

    validateSchema(schema)(req, res, next);

    // Must use next(error), NOT res.status(400).json()
    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeDefined();
    expect(error.statusCode).toBe(400);
    expect(error.message).toContain("validación");

    // CRITICAL: res.status should NOT have been called
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should include field names in error messages", () => {
    const schema = {
      body: z.object({
        email: z.string().email(),
        age: z.number().min(0),
      }),
    };
    const req = { body: { email: "invalid", age: -5 } };
    const res = mockRes();
    const next = mockNext();

    validateSchema(schema)(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.errors).toBeDefined();
    expect(error.errors.length).toBeGreaterThan(0);
    // Each error string should contain a field path and a message
    for (const errStr of error.errors) {
      expect(typeof errStr).toBe("string");
      // Format is "field: message" — must include the field name
      expect(errStr).toContain(":");
    }
  });

  it("should validate params when schema.params is provided", () => {
    const schema = { params: z.object({ id: z.string().min(1) }) };
    const req = { params: { id: "abc123" } };
    const res = mockRes();
    const next = mockNext();

    validateSchema(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should validate both body and params", () => {
    const schema = {
      body: z.object({ name: z.string() }),
      params: z.object({ id: z.string() }),
    };
    const req = { body: { name: "test" }, params: { id: "123" } };
    const res = mockRes();
    const next = mockNext();

    validateSchema(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("should pass non-Zod errors through to next()", () => {
    // Simulate a schema that throws a non-Zod error
    const badSchema = {
      body: {
        parse: () => {
          throw new Error("unexpected");
        },
      },
    };
    const req = { body: {} };
    const res = mockRes();
    const next = mockNext();

    validateSchema(badSchema)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error.message).toBe("unexpected");
  });
});

// =============================================
// Bug B: cronJobs runTask error isolation
// =============================================
describe("cronJobs runTask pattern (Bug B — error isolation)", () => {
  it("should catch errors without propagating them", async () => {
    // Replicate the runTask pattern from cronJobs.js
    const runTask = async (name, fn) => {
      try {
        await fn();
      } catch (err) {
        console.error(`❌ [CRON] Fallo en ${name}:`, err.message);
      }
    };

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Should NOT throw even if the function throws
    await expect(
      runTask("testTask", async () => {
        throw new Error("Task failed!");
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "❌ [CRON] Fallo en testTask:",
      "Task failed!",
    );
    errorSpy.mockRestore();
  });

  it("should allow subsequent tasks to run after a failure", async () => {
    const runTask = async (name, fn) => {
      try {
        await fn();
      } catch (err) {
        console.error(`❌ [CRON] Fallo en ${name}:`, err.message);
      }
    };

    vi.spyOn(console, "error").mockImplementation(() => {});

    const results = [];

    await runTask("task1", async () => {
      throw new Error("fail");
    });
    results.push("after-task1");

    await runTask("task2", async () => {
      results.push("task2-ran");
    });

    await runTask("task3", async () => {
      results.push("task3-ran");
    });

    // All tasks after the failure should have executed
    expect(results).toEqual(["after-task1", "task2-ran", "task3-ran"]);

    vi.restoreAllMocks();
  });
});
