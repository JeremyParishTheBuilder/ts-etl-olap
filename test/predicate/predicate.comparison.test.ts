import { describe, it, expect } from 'vitest';
import { ComparisonPredicate } from '../../src/query/predicate/ComparisonPredicate.js';
import { RowView } from '../../src/schema/RowView.js';

describe("ComparisonPredicate", () => {
  it("evaluates equality", () => {
    const pred = new ComparisonPredicate(0, "eq", 1);
    const row1: RowView = {
      index: 0,
      values: [1]
    };
    const row2: RowView = {
      index: 0,
      values: [0]
    };

    expect(pred.evaluate(row1)).toBe(true);
    expect(pred.evaluate(row2)).toBe(false);
  });

  it("evaluates inequality", () => {
    const pred = new ComparisonPredicate(0, "ne", 1);
    const row1: RowView = {
      index: 0,
      values: [1]
    };
    const row2: RowView = {
      index: 0,
      values: [0]
    };

    expect(pred.evaluate(row1)).toBe(false);
    expect(pred.evaluate(row2)).toBe(true);
  });

  it("evaluates gt", () => {
    const pred = new ComparisonPredicate(0, "gt", 1);
    const row1: RowView = {
      index: 0,
      values: [1]
    };
    const row2: RowView = {
      index: 0,
      values: [2]
    };

    expect(pred.evaluate(row1)).toBe(false);
    expect(pred.evaluate(row2)).toBe(true);
  });

  it("evaluates lt", () => {
    const pred = new ComparisonPredicate(0, "lt", 1);
    const row1: RowView = {
      index: 0,
      values: [1]
    };
    const row2: RowView = {
      index: 0,
      values: [0]
    };

    expect(pred.evaluate(row1)).toBe(false);
    expect(pred.evaluate(row2)).toBe(true);
  });

  it("uses the configured column index", () => {
    const pred = new ComparisonPredicate(1, "eq", 5);

    const row: RowView = {
      index: 0,
      values: [999, 5]
    };

    expect(pred.evaluate(row)).toBe(true);
  });

  it("returns false for incompatible equality types", () => {
    const pred = new ComparisonPredicate(0, "eq", 2);

    const row: RowView = {
      index: 0,
      values: ["2"]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("returns false for incompatible ordering types", () => {
    const pred = new ComparisonPredicate(0, "gt", 2);

    const row: RowView = {
      index: 0,
      values: ["3"]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("returns false for null equality comparisons", () => {
    const pred = new ComparisonPredicate(0, "eq", 1);

    const row: RowView = {
      index: 0,
      values: [null]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("returns false when both equality values are null", () => {
    const pred = new ComparisonPredicate(0, "eq", null);

    const row: RowView = {
      index: 0,
      values: [null]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("returns false for null ordering comparisons", () => {
    const pred = new ComparisonPredicate(0, "gt", 1);

    const row: RowView = {
      index: 0,
      values: [null]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("returns false when ordering against null", () => {
    const pred = new ComparisonPredicate(0, "lt", null);

    const row: RowView = {
      index: 0,
      values: [1]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("throws for unsupported operators", () => {
    const pred = new ComparisonPredicate(
      0,
      "invalid" as never,
      1
    );

    const row: RowView = {
      index: 0,
      values: [1]
    };

    expect(() => pred.evaluate(row)).toThrow();
  });

  it("evaluates deterministically", () => {
    const pred = new ComparisonPredicate(0, "eq", 1);

    const row: RowView = {
      index: 0,
      values: [1]
    };

    expect(pred.evaluate(row)).toBe(true);
    expect(pred.evaluate(row)).toBe(true);
    expect(pred.evaluate(row)).toBe(true);
  });
});