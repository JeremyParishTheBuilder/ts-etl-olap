import { describe, it, expect } from 'vitest';
import { LiteralExpressionNode } from '../../src/ast/expression/LiteralExpressionNode.ts';
import { bindExpression, resolveExpression } from '../../src/semantic/expression.ts';
import { BinaryExpression } from '../../src/evaluation/expression/BinaryExpression.ts';
import { LiteralExpression } from '../../src/evaluation/expression/LiteralExpression.ts';
import { buildTable } from '../utils/buildSchema.ts';
import type { RowView } from '../../src/relational/RowView.ts';

describe("Expression::arithmetic", () => {

  it("evaluates binary arithmetic", () => {
    const expr = new BinaryExpression(
      new LiteralExpression(10),
      "add",
      new LiteralExpression(5),
    );

    expect(expr.evaluate(undefined)).toBe(15);
  });

  it("supports arithmetic operations on literal expressions", () => {
    const expr = new LiteralExpressionNode(10).add(5).multiply(2);

    expect(expr.kind).toBe("binary");

    const table = buildTable();

    const resolved = resolveExpression(expr, table);
    const bound = bindExpression(resolved, table);

    const rowView: RowView = { index: 0, values: [] }

    expect(bound.evaluate(rowView)).toBe(30);
  });

});