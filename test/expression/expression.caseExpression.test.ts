import { describe, it, expect } from 'vitest';
import { case_, col } from "../../src/semantic/ast/dsl.js";
import { ComparisonPredicate } from '../../src/evaluation/predicate/ComparisonPredicate.js';
import { ColumnExpression } from '../../src/evaluation/expression/ColumnExpression.js';
import { LiteralExpression } from '../../src/evaluation/expression/LiteralExpression.js';
import { type RowView } from '../../src/relational/RowView.js';
import { CaseExpression } from '../../src/evaluation/expression/CaseExpression.js';

describe('Expression::caseExpression', () => {
  it("evaluates first matching CASE branch", () => {
    const expr = 
      new CaseExpression([{ 
      when:
        new ComparisonPredicate(
          new ColumnExpression(0),
          "eq",
          new LiteralExpression(1)
        ),
      then:
        new LiteralExpression("one")
      },{
      when:
        new ComparisonPredicate(
          new ColumnExpression(0),
          "eq",
          new LiteralExpression(2)
        ),
      then:
        new LiteralExpression("two")
      }],
      new LiteralExpression("other")
    );

    const row1 = { index: 0, values: [1] } as RowView;
    const row2 = { index: 0, values: [2] } as RowView;
    const row3 = { index: 0, values: [3] } as RowView;

    expect(expr.evaluate(row1)).toBe("one");
    expect(expr.evaluate(row2)).toBe("two");
    expect(expr.evaluate(row3)).toBe("other");
  });

  it("case builder constructs correct expression tree", () => {
    const expr = case_()
      .when(col("Id").eq(1)).then("A")
      .when(col("Id").eq(2)).then("B") 
      .else("C");

    expect(expr.kind).toBe("case");
    expect(expr.branches).toHaveLength(2);
  });

  it("allows column expressions in CASE ELSE", () => {
    const expr = case_()
      .when(col("Id").eq(1)).then(10)
      .else(col("Id"));

    expect(expr.kind).toBe("case");
  });

});