import { describe, it, expect } from 'vitest';
import {
  SQL_BOOLEAN,
  SQL_DATE,
  SQL_DECIMAL,
  SQL_INTEGER,
  SQL_TIMESTAMP,
  SQL_VARCHAR,
  decimal,
  isAssignable,
  isCastable,
  isSameType,
  matchesSqlType,
  castValue,
  varchar,
} from "../../src/types/SqlType.js";

describe("SqlType", () => {
  describe("isSameType", () => {
    it("recognizes identical types", () => {
      expect(isSameType(SQL_INTEGER, SQL_INTEGER)).toBe(true);
      expect(isSameType(SQL_VARCHAR, SQL_VARCHAR)).toBe(true);
      expect(isSameType(SQL_DATE, SQL_DATE)).toBe(true);
    });

    it("rejects different types", () => {
      expect(isSameType(SQL_INTEGER, SQL_DECIMAL)).toBe(false);
      expect(isSameType(SQL_INTEGER, SQL_VARCHAR)).toBe(false);
      expect(isSameType(SQL_DATE, SQL_TIMESTAMP)).toBe(false);
    });

    it("compares VARCHAR length", () => {
      expect(isSameType(varchar(100), varchar(100))).toBe(true);
      expect(isSameType(varchar(100), varchar(200))).toBe(false);
    });

    it("compares DECIMAL precision and scale", () => {
      expect(isSameType(decimal(10, 2), decimal(10, 2))).toBe(true);
      expect(isSameType(decimal(10, 2), decimal(12, 2))).toBe(false);
      expect(isSameType(decimal(10, 2), decimal(10, 3))).toBe(false);
    });

    it("compares TIMESTAMP precision", () => {
      expect(isSameType(
        { kind: "timestamp", precision: 3 },
        { kind: "timestamp", precision: 3 },
      )).toBe(true);

      expect(isSameType(
        { kind: "timestamp", precision: 3 },
        { kind: "timestamp", precision: 6 },
      )).toBe(false);
    });
  });

  describe("isAssignable", () => {
    it("allows assignment to the same type", () => {
      expect(isAssignable(SQL_INTEGER, SQL_INTEGER)).toBe(true);
      expect(isAssignable(SQL_VARCHAR, SQL_VARCHAR)).toBe(true);
      expect(isAssignable(SQL_DATE, SQL_DATE)).toBe(true);
    });

    it("allows integer assignment to decimal", () => {
      expect(isAssignable(SQL_INTEGER, SQL_DECIMAL)).toBe(true);
    });

    it("rejects decimal assignment to integer", () => {
      expect(isAssignable(SQL_DECIMAL, SQL_INTEGER)).toBe(false);
    });

    it("rejects numeric assignment to varchar without conversion", () => {
      expect(isAssignable(SQL_INTEGER, SQL_VARCHAR)).toBe(false);
    });
  });

  describe("isCastable", () => {
    it("allows casting between identical types", () => {
      expect(isCastable(SQL_INTEGER, SQL_INTEGER)).toBe(true);
      expect(isCastable(SQL_DATE, SQL_DATE)).toBe(true);
    });

    it("allows numeric casts", () => {
      expect(isCastable(SQL_INTEGER, SQL_DECIMAL)).toBe(true);
      expect(isCastable(SQL_DECIMAL, SQL_INTEGER)).toBe(true);
    });

    it("allows casts between numeric and varchar", () => {
      expect(isCastable(SQL_INTEGER, SQL_VARCHAR)).toBe(true);
      expect(isCastable(SQL_VARCHAR, SQL_INTEGER)).toBe(true);
      expect(isCastable(SQL_DECIMAL, SQL_VARCHAR)).toBe(true);
      expect(isCastable(SQL_VARCHAR, SQL_DECIMAL)).toBe(true);
    });
  });

  describe("matchesSqlType", () => {
    it("matches integer values", () => {
      expect(matchesSqlType(42, SQL_INTEGER)).toBe(true);
      expect(matchesSqlType(42.5, SQL_INTEGER)).toBe(false);
    });

    it("matches decimal values", () => {
      expect(matchesSqlType(42, SQL_DECIMAL)).toBe(true);
      expect(matchesSqlType(42.5, SQL_DECIMAL)).toBe(true);
    });

    it("matches varchar values", () => {
      expect(matchesSqlType("hello", SQL_VARCHAR)).toBe(true);
      expect(matchesSqlType(42, SQL_VARCHAR)).toBe(false);
    });

    it("matches boolean values", () => {
      expect(matchesSqlType(true, SQL_BOOLEAN)).toBe(true);
      expect(matchesSqlType(false, SQL_BOOLEAN)).toBe(true);
      expect(matchesSqlType(1, SQL_BOOLEAN)).toBe(false);
    });

    it("matches valid date strings", () => {
      expect(matchesSqlType("2026-08-19", SQL_DATE)).toBe(true);
    });

    it("rejects invalid date strings", () => {
      expect(matchesSqlType("2026-02-30", SQL_DATE)).toBe(false);
    });

    it("matches valid timestamp strings", () => {
      expect(
        matchesSqlType(
          "2026-08-19 13:42:17",
          SQL_TIMESTAMP,
        ),
      ).toBe(true);
    });

    it("rejects invalid timestamp strings", () => {
      expect(
        matchesSqlType(
          "2026-08-19 25:42:17",
          SQL_TIMESTAMP,
        ),
      ).toBe(false);
    });

    it("accepts null for every SQL type", () => {
      expect(matchesSqlType(null, SQL_INTEGER)).toBe(true);
      expect(matchesSqlType(null, SQL_VARCHAR)).toBe(true);
      expect(matchesSqlType(null, SQL_DATE)).toBe(true);
    });
  });

  describe("castValue", () => {
    it("casts an integer to decimal", () => {
      expect(castValue(42, SQL_DECIMAL)).toBe(42);
    });

    it("casts a number to varchar", () => {
      expect(castValue(42, SQL_VARCHAR)).toBe("42");
    });

    it("casts a boolean to varchar", () => {
      expect(castValue(true, SQL_VARCHAR)).toBe("true");
    });

    it("casts a valid date string to DATE", () => {
      expect(
        castValue("2026-08-19", SQL_DATE),
      ).toBe("2026-08-19");
    });

    it("casts a valid timestamp string to TIMESTAMP", () => {
      expect(
        castValue(
          "2026-08-19T13:42:17Z",
          SQL_TIMESTAMP,
        ),
      ).toBe("2026-08-19 13:42:17Z");
    });

    it("rejects an invalid date", () => {
      expect(() =>
        castValue("2026-02-30", SQL_DATE),
      ).toThrow();
    });

    it("returns null unchanged", () => {
      expect(castValue(null, SQL_INTEGER)).toBeNull();
      expect(castValue(null, SQL_DATE)).toBeNull();
    });
  });
});