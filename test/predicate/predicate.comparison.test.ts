import { describe, it, expect } from 'vitest';
import { ComparisonPredicate } from '../../src/evaluation/predicate/ComparisonPredicate.js';
import { RowView } from '../../src/relational/RowView.js';
import { ColumnExpression } from '../../src/evaluation/expression/ColumnExpression.js';
import { LiteralExpression } from '../../src/evaluation/expression/LiteralExpression.js';

describe("ComparisonPredicate", () => {
  it("evaluates equality", () => {
    const pred = new ComparisonPredicate(new ColumnExpression(0), "eq", new LiteralExpression(1));
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
    const pred = new ComparisonPredicate(new ColumnExpression(0), "ne", new LiteralExpression(1));
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
    const pred = new ComparisonPredicate(new ColumnExpression(0), "gt", new LiteralExpression(1));
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
    const pred = new ComparisonPredicate(new ColumnExpression(0), "lt", new LiteralExpression(1));
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
    const pred = new ComparisonPredicate(new ColumnExpression(1), "eq", new LiteralExpression(5));

    const row: RowView = {
      index: 0,
      values: [999, 5]
    };

    expect(pred.evaluate(row)).toBe(true);
  });

  it("returns false for incompatible equality types", () => {
    const pred = new ComparisonPredicate(new ColumnExpression(0), "eq", new LiteralExpression(2));

    const row: RowView = {
      index: 0,
      values: ["2"]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("throws for incompatible ordering types", () => {
    const pred = new ComparisonPredicate(new ColumnExpression(0), "gt", new LiteralExpression(2));

    const row: RowView = {
      index: 0,
      values: ["3"]
    };

    expect(() => { pred.evaluate(row) }).toThrow();
  });

  it("returns false for null equality comparisons", () => {
    const pred = new ComparisonPredicate(new ColumnExpression(0), "eq", new LiteralExpression(1));

    const row: RowView = {
      index: 0,
      values: [null]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("returns false when both equality values are null", () => {
    const pred = new ComparisonPredicate(new ColumnExpression(0), "eq", new LiteralExpression(null));

    const row: RowView = {
      index: 0,
      values: [null]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("returns false for null ordering comparisons", () => {
    const pred = new ComparisonPredicate(new ColumnExpression(0), "gt", new LiteralExpression(1));

    const row: RowView = {
      index: 0,
      values: [null]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("returns false when ordering against null", () => {
    const pred = new ComparisonPredicate(new ColumnExpression(0), "lt", new LiteralExpression(null));

    const row: RowView = {
      index: 0,
      values: [1]
    };

    expect(pred.evaluate(row)).toBe(false);
  });

  it("throws for unsupported operators", () => {
    const pred = new ComparisonPredicate(
      new ColumnExpression(0),
      "invalid" as never,
      new LiteralExpression(1)
    );

    const row: RowView = {
      index: 0,
      values: [1]
    };

    expect(() => pred.evaluate(row)).toThrow();
  });

  it("evaluates deterministically", () => {
    const pred = new ComparisonPredicate(new ColumnExpression(0), "eq", new LiteralExpression(1));

    const row: RowView = {
      index: 0,
      values: [1]
    };

    expect(pred.evaluate(row)).toBe(true);
    expect(pred.evaluate(row)).toBe(true);
    expect(pred.evaluate(row)).toBe(true);
  });
});