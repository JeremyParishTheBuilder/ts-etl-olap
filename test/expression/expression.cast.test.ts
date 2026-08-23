import { describe, it, expect } from 'vitest';
import { CastExpression } from '../../src/evaluation/expression/CastExpression.js';
import { SQL_DECIMAL, SQL_INTEGER, SQL_VARCHAR } from '../../src/types/SqlType.ts';
import { LiteralExpression } from '../../src/evaluation/expression/LiteralExpression.ts';
import { cast } from '../../src/ast/dsl.ts';

describe("Expression::cast", () => {
  it("casts an INTEGER value to INTEGER", () => {
    const expr = new CastExpression(
      new LiteralExpression(1),
      SQL_INTEGER,
    );

    expect(expr.evaluate(undefined)).toBe(1);
  });

  it("casts an INTEGER value to VARCHAR", () => {
    const expr = new CastExpression(
      new LiteralExpression(1),
      SQL_VARCHAR,
    );

    expect(expr.evaluate(undefined)).toBe("1");
  });

  it("casts an INTEGER value to DECIMAL", () => {
    const expr = new CastExpression(
      new LiteralExpression(1),
      SQL_DECIMAL,
    );

    expect(expr.evaluate(undefined)).toBe(1);
  });

  it("throws when the runtime value cannot be cast to the target type", () => {
    const expr = new CastExpression(
      new LiteralExpression("not an integer"),
      SQL_INTEGER,
    );

    expect(() => expr.evaluate(undefined)).toThrow();
  });

  it("uses the evaluated expression value as the cast source", () => {
    const expr = new CastExpression(
      new LiteralExpression("123"),
      SQL_VARCHAR,
    );

    expect(expr.evaluate(undefined)).toBe("123");
  });

  it("preserves NULL when casting to another SQL type", () => {
    const expr = new CastExpression(
      new LiteralExpression(null),
      SQL_INTEGER,
    );

    expect(expr.evaluate(undefined)).toBeNull();
  });

  it("cast builder constructs the correct expression tree", () => {
    const expr = cast(1).as(SQL_VARCHAR);

    expect(expr.kind).toBe("cast");
    expect(expr.type).toBe(SQL_VARCHAR);
  });
});