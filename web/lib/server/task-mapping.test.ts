import { describe, expect, it } from "vitest";
import { formatShortDate, PRIORITY_CODE_TO_LABEL, PRIORITY_LABEL_TO_CODE, STATUS_CODE_TO_LABEL, STATUS_LABEL_TO_CODE } from "./task-mapping";

describe("STATUS_CODE_TO_LABEL / STATUS_LABEL_TO_CODE", () => {
  it("round-trips every status code through its label and back", () => {
    for (const code of Object.keys(STATUS_CODE_TO_LABEL)) {
      const label = STATUS_CODE_TO_LABEL[code];
      expect(STATUS_LABEL_TO_CODE[label]).toBe(code);
    }
  });
});

describe("PRIORITY_CODE_TO_LABEL / PRIORITY_LABEL_TO_CODE", () => {
  it("round-trips every priority code through its label and back", () => {
    for (const code of Object.keys(PRIORITY_CODE_TO_LABEL)) {
      const label = PRIORITY_CODE_TO_LABEL[code];
      expect(PRIORITY_LABEL_TO_CODE[label]).toBe(code);
    }
  });
});

describe("formatShortDate", () => {
  it("formats an ISO date string as '15 Jul'", () => {
    expect(formatShortDate("2025-07-15")).toBe("15 Jul");
  });

  it("formats a Date object the same way", () => {
    expect(formatShortDate(new Date("2025-01-05T00:00:00Z"))).toBe("05 Jan");
  });

  it("returns null for null input", () => {
    expect(formatShortDate(null)).toBeNull();
  });

  it("returns null for an unparseable string instead of 'Invalid Date'", () => {
    expect(formatShortDate("not-a-date")).toBeNull();
  });
});
