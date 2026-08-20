import { describe, it, expect } from 'vitest';
import {
  isValidDateValue,
  isValidTimestampValue,
  normalizeDate,
  normalizeTimestamp,
} from "../../src/types/SqlDateTime.js";

describe("SqlDateTime", () => {
  describe("isValidDateValue", () => {
    it("accepts ISO dates", () => {
      expect(isValidDateValue("2026-08-19")).toBe(true);
    });

    it("accepts compact SQL-compatible dates", () => {
      expect(isValidDateValue("20260819")).toBe(true);
    });

    it("rejects impossible days", () => {
      expect(isValidDateValue("2026-02-30")).toBe(false);
    });

    it("rejects impossible months", () => {
      expect(isValidDateValue("2026-13-01")).toBe(false);
    });

    it("handles leap years", () => {
      expect(isValidDateValue("2024-02-29")).toBe(true);
      expect(isValidDateValue("2025-02-29")).toBe(false);
    });
  });

  describe("isValidTimestampValue", () => {
    it("accepts a timestamp with a space separator", () => {
      expect(
        isValidTimestampValue("2026-08-19 13:42:17"),
      ).toBe(true);
    });

    it("accepts an ISO timestamp with T", () => {
      expect(
        isValidTimestampValue("2026-08-19T13:42:17"),
      ).toBe(true);
    });

    it("accepts fractional seconds", () => {
      expect(
        isValidTimestampValue(
          "2026-08-19T13:42:17.123456",
        ),
      ).toBe(true);
    });

    it("accepts UTC", () => {
      expect(
        isValidTimestampValue(
          "2026-08-19T13:42:17Z",
        ),
      ).toBe(true);
    });

    it("accepts an explicit timezone", () => {
      expect(
        isValidTimestampValue(
          "2026-08-19T13:42:17+05:30",
        ),
      ).toBe(true);
    });

    it("rejects invalid hours", () => {
      expect(
        isValidTimestampValue(
          "2026-08-19T25:42:17",
        ),
      ).toBe(false);
    });

    it("rejects invalid calendar dates", () => {
      expect(
        isValidTimestampValue(
          "2026-02-30T13:42:17",
        ),
      ).toBe(false);
    });
  });

  describe("normalizeDate", () => {
    it("leaves canonical dates unchanged", () => {
      expect(normalizeDate("2026-08-19")).toBe(
        "2026-08-19",
      );
    });

    it("normalizes compact dates", () => {
      expect(normalizeDate("20260819")).toBe(
        "2026-08-19",
      );
    });

    it("rejects invalid dates", () => {
      expect(() => normalizeDate("2026-02-30")).toThrow();
    });
  });

  describe("normalizeTimestamp", () => {
    it("normalizes T to a space", () => {
      expect(
        normalizeTimestamp("2026-08-19T13:42:17"),
      ).toBe("2026-08-19 13:42:17");
    });

    it("preserves fractional seconds", () => {
      expect(
        normalizeTimestamp(
          "2026-08-19T13:42:17.123456",
        ),
      ).toBe("2026-08-19 13:42:17.123456");
    });

    it("normalizes a compact timezone offset", () => {
      expect(
        normalizeTimestamp(
          "2026-08-19T13:42:17+0530",
        ),
      ).toBe("2026-08-19 13:42:17+05:30");
    });

    it("preserves UTC", () => {
      expect(
        normalizeTimestamp(
          "2026-08-19T13:42:17Z",
        ),
      ).toBe("2026-08-19 13:42:17Z");
    });

    it("rejects invalid timestamps", () => {
      expect(() =>
        normalizeTimestamp(
          "2026-02-30T13:42:17",
        ),
      ).toThrow();
    });
  });
});