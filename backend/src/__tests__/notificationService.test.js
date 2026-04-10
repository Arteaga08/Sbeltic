import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// =============================================
// Bug C: Telegram notification — real implementation
// =============================================

import { sendTelegramAlert } from "../services/notificationService.js";

describe("sendTelegramAlert (Bug C — real Telegram implementation)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, TELEGRAM_BOT_TOKEN: "fake-bot-token" };
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it("should call Telegram API with correct URL and payload", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, result: {} }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await sendTelegramAlert("Test alert message", "12345");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.telegram.org/botfake-bot-token/sendMessage");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.chat_id).toBe("12345");
    expect(body.text).toBe("Test alert message");
    expect(body.parse_mode).toBe("Markdown");

    vi.unstubAllGlobals();
  });

  it("should not call API when botToken is missing", async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    await sendTelegramAlert("Test", "12345");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("should not call API when chatId is missing", async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);

    await sendTelegramAlert("Test", undefined);

    expect(mockFetch).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("should handle API errors gracefully without throwing", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ ok: false, description: "Forbidden" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    // Should NOT throw
    await expect(sendTelegramAlert("Test", "12345")).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("should handle network errors gracefully without throwing", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    await expect(sendTelegramAlert("Test", "12345")).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
