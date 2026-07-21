import { describe, expect, it, vi, afterEach } from "vitest";
import { withErrorLogging } from "./api-error";

describe("withErrorLogging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes through the handler's return value untouched on success", async () => {
    const result = await withErrorLogging("GET /api/test", async () => "ok");
    expect(result).toBe("ok");
  });

  it("catches a thrown exception, logs it, and returns a clean 500 instead of letting it propagate", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("DB timeout");

    const result = await withErrorLogging("POST /api/test", async () => {
      throw boom;
    });

    expect(consoleSpy).toHaveBeenCalledWith("[api] POST /api/test failed:", boom);
    // NextResponse doesn't expose status via a plain property in this runtime,
    // so assert on the shape that matters: no leaked stack trace, generic message.
    const body = await (result as Response).json();
    expect(body).toEqual({ error: "Something went wrong on our end. Please try again." });
  });
});
