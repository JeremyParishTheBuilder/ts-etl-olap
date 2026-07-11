import { describe, it, expect, vi } from 'vitest';
import { type Predicate } from '../../src/evaluation/predicate/Predicate.js';
import { BinaryLogicalPredicate } from '../../src/evaluation/predicate/LogicalPredicate.js';
import { RowView } from '../../src/schema/RowView';
import { NotPredicate } from '../../src/evaluation/predicate/NotPredicate.js';
import { AndPredicate } from '../../src/evaluation/predicate/AndPredicate.js';

const truePredicate: Predicate = {
  evaluate: () => true
};

const falsePredicate: Predicate = {
  evaluate: () => false
};

const emptyRow: RowView = {
  index: 0,
  values: []
};

describe("BinaryLogicalPredicate.evaluate()", () => {
  it("evaluates and", () => {
    const pred = new AndPredicate([
      truePredicate,
      truePredicate
    ]);

    expect(pred.evaluate(emptyRow)).toBe(true);
  });

  it("returns false when one and predicate is false", () => {
    const pred = new BinaryLogicalPredicate(
      truePredicate,
      falsePredicate,
      "and"
    );

    expect(pred.evaluate(emptyRow)).toBe(false);
  });

  it("evaluates or", () => {
    const pred = new BinaryLogicalPredicate(
      falsePredicate,
      truePredicate,
      "or"
    );

    expect(pred.evaluate(emptyRow)).toBe(true);
  });

  it("returns false when both or predicates are false", () => {
    const pred = new BinaryLogicalPredicate(
      falsePredicate,
      falsePredicate,
      "or"
    );

    expect(pred.evaluate(emptyRow)).toBe(false);
  });

  it("evaluates xor", () => {
    const pred = new BinaryLogicalPredicate(
      truePredicate,
      falsePredicate,
      "xor"
    );

    const pred2 = new BinaryLogicalPredicate(
      falsePredicate,
      truePredicate,
      "xor"
    );

    expect(pred.evaluate(emptyRow)).toBe(true);
    expect(pred2.evaluate(emptyRow)).toBe(true);
  });

  it("returns false when xor predicates are equal", () => {
    const pred = new BinaryLogicalPredicate(
      truePredicate,
      truePredicate,
      "xor"
    );

    const pred2 = new BinaryLogicalPredicate(
      falsePredicate,
      falsePredicate,
      "xor"
    );

    expect(pred.evaluate(emptyRow)).toBe(false);
    expect(pred2.evaluate(emptyRow)).toBe(false);
  });

  it("supports nested composition", () => {
    const inner = new BinaryLogicalPredicate(
      truePredicate,
      falsePredicate,
      "or"
    );

    const outer = new BinaryLogicalPredicate(
      inner,
      truePredicate,
      "and"
    );

    expect(outer.evaluate(emptyRow)).toBe(true);
  });

  it("short-circuits and evaluation", () => {
    const right = {
      evaluate: vi.fn(() => true)
    };

    const pred = new BinaryLogicalPredicate(
      falsePredicate,
      right,
      "and"
    );

    pred.evaluate(emptyRow);

    expect(right.evaluate).not.toHaveBeenCalled();
  });

  it("short-circuits or evaluation", () => {
    const right = {
      evaluate: vi.fn(() => false)
    };

    const pred = new BinaryLogicalPredicate(
      truePredicate,
      right,
      "or"
    );

    pred.evaluate(emptyRow);

    expect(right.evaluate).not.toHaveBeenCalled();
  });

  it("throws for unsupported operators", () => {
    const pred = new BinaryLogicalPredicate(
      truePredicate,
      truePredicate,
      "invalid" as never
    );

    expect(() =>
      pred.evaluate(emptyRow)
    ).toThrow();
  });

  it("evaluates deterministically", () => {
    const pred = new BinaryLogicalPredicate(
      truePredicate,
      falsePredicate,
      "xor"
    );

    expect(pred.evaluate(emptyRow)).toBe(true);
    expect(pred.evaluate(emptyRow)).toBe(true);
    expect(pred.evaluate(emptyRow)).toBe(true);
  });

  it("does not mutate the RowView", () => {
    const row = {
      index: 0,
      values: [1]
    };

    const pred = new BinaryLogicalPredicate(
      truePredicate,
      truePredicate,
      "and"
    );

    pred.evaluate(row);

    expect(row).toEqual({
      index: 0,
      values: [1]
    });
  });
})

describe("NotPredicate.evaluate()", () => {
  it("negates true predicates", () => {
    const pred = new NotPredicate(truePredicate);

    expect(pred.evaluate(emptyRow)).toBe(false);
  });

  it("negates false predicates", () => {
    const pred = new NotPredicate(falsePredicate);

    expect(pred.evaluate(emptyRow)).toBe(true);
  });

  it("supports nested predicates", () => {
    const inner = new BinaryLogicalPredicate(
      truePredicate,
      falsePredicate,
      "and"
    );

    const pred = new NotPredicate(inner);

    expect(pred.evaluate(emptyRow)).toBe(true);
  });

  it("evaluates deterministically", () => {
    const pred = new NotPredicate(falsePredicate);

    const row = {
      index: 0,
      values: []
    };

    expect(pred.evaluate(row)).toBe(true);
    expect(pred.evaluate(row)).toBe(true);
    expect(pred.evaluate(row)).toBe(true);
  });

  it("does not mutate the RowView", () => {
    const row = {
      index: 0,
      values: [1]
    };

    const pred = new NotPredicate(truePredicate);

    pred.evaluate(row);

    expect(row).toEqual({
      index: 0,
      values: [1]
    });
  });
})