import { describe, it, expect, vi } from 'vitest';
import { type Predicate } from '../../src/evaluation/predicate/Predicate.js';
import { RowView } from '../../src/relational/RowView.js';
import { NotPredicate } from '../../src/evaluation/predicate/NotPredicate.js';
import { AndPredicate } from '../../src/evaluation/predicate/AndPredicate.js';
import { OrPredicate } from '../../src/evaluation/predicate/OrPredicate.js';
import { XorPredicate } from '../../src/evaluation/predicate/XorPredicate.js';

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
    const pred = new AndPredicate([
      truePredicate,
      falsePredicate,
    ]);

    expect(pred.evaluate(emptyRow)).toBe(false);
  });

  it("evaluates or", () => {
    const pred = new OrPredicate([
      falsePredicate,
      truePredicate,
    ]);

    expect(pred.evaluate(emptyRow)).toBe(true);
  });

  it("returns false when both or predicates are false", () => {
    const pred = new OrPredicate([
      falsePredicate,
      falsePredicate,
    ]);

    expect(pred.evaluate(emptyRow)).toBe(false);
  });

  it("evaluates xor", () => {
    const pred = new XorPredicate(
      truePredicate,
      falsePredicate,
    );

    const pred2 = new XorPredicate(
      falsePredicate,
      truePredicate
    );

    expect(pred.evaluate(emptyRow)).toBe(true);
    expect(pred2.evaluate(emptyRow)).toBe(true);
  });

  it("returns false when xor predicates are equal", () => {
    const pred = new XorPredicate(
      truePredicate,
      truePredicate
    );

    const pred2 = new XorPredicate(
      falsePredicate,
      falsePredicate
    );

    expect(pred.evaluate(emptyRow)).toBe(false);
    expect(pred2.evaluate(emptyRow)).toBe(false);
  });

  it("supports nested composition", () => {
    const inner = new OrPredicate([
      truePredicate,
      falsePredicate,
    ]);

    const outer = new AndPredicate([
      inner,
      truePredicate,
    ]);

    expect(outer.evaluate(emptyRow)).toBe(true);
  });

  it("short-circuits and evaluation", () => {
    const right = {
      evaluate: vi.fn(() => true)
    };

    const pred = new AndPredicate([
      falsePredicate,
      right
    ]);

    pred.evaluate(emptyRow);

    expect(right.evaluate).not.toHaveBeenCalled();
  });

  it("short-circuits or evaluation", () => {
    const right = {
      evaluate: vi.fn(() => false)
    };

    const pred = new OrPredicate([
      truePredicate,
      right
    ]);

    pred.evaluate(emptyRow);

    expect(right.evaluate).not.toHaveBeenCalled();
  });

  it("evaluates deterministically", () => {
    const pred = new XorPredicate(
      truePredicate,
      falsePredicate,
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

    const pred = new AndPredicate([
      truePredicate,
      truePredicate
    ]);

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
    const inner = new AndPredicate([
      truePredicate,
      falsePredicate
    ]);

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