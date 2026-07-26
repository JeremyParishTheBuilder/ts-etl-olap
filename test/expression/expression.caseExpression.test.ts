import { describe, it, expect } from 'vitest';

import { ComparisonPredicate } from '../../src/evaluation/predicate/ComparisonPredicate.js';
import { ColumnExpression } from '../../src/evaluation/expression/ColumnExpression.js';
import { LiteralExpression } from '../../src/evaluation/expression/LiteralExpression.js';
import { type RowView } from '../../src/relational/RowView.js';
import { PostgresInputBatch } from '../../src/input/PostgresInputBatch.js';
import { freshEngine } from '../engine/freshEngine.js';
import { CaseExpression } from '../../src/evaluation/expression/CaseExpression.js';

function createTestSql() {
  return freshEngine().input() as PostgresInputBatch;
}

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
    const sql = createTestSql();

    const expr = sql.case()
      .when(sql.column("Id").eq(1)).then("A")
      .when(sql.column("Id").eq(2)).then("B") 
      .else("C");

    expect(expr.kind).toBe("case");
    expect(expr.branches).toHaveLength(2);
  });

  it("allows column expressions in CASE ELSE", () => {
    const sql = createTestSql();

    const expr = sql.case()
      .when(sql.column("Id").eq(1)).then(10)
      .else(sql.column("Id"));

    expect(expr.kind).toBe("case");
  });

});