import { describe, it, expect } from 'vitest';
import { buildTable, createCheckTestSpec, createColumnTestSpec } from '../utils/buildSchema.js';
import { ComparisonPredicateNode } from '../../src/evaluation/predicate/ComparisonPredicate.js';
import { ColumnExpressionNode } from '../../src/evaluation/expression/ColumnExpression.js';
import { LiteralExpressionNode } from '../../src/evaluation/expression/LiteralExpression.js';

describe('Table::alterColumn', () => {
  it('rejects altering a column rows fail existing checks', () => {

    const table =
      buildTable()
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: Number,
        }))
        .createCheck(
          createCheckTestSpec({
            name: "CHK_Adult",
            predicate: new ComparisonPredicateNode(
              new ColumnExpressionNode("Age"),
              "gte",
              new LiteralExpressionNode(18),
            ),
          })
        )
        .addRow([20]);

    expect(() => {
      table.alterColumn(
        "Age",
        String
      );
    }).toThrow();
  });

  it('allows altering column when checks still satisfied', () => {
    const table =
      buildTable()
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: Number,
        }))
        .createCheck(
          createCheckTestSpec({
            name: "CHK_Adult",
            predicate: new ComparisonPredicateNode(
              new ColumnExpressionNode("Age"),
              "gte",
              new LiteralExpressionNode(18),
            ),
          })
        )
        .addRow([20]);

    expect(() => {
      table.alterColumn("Age", Number);
    }).not.toThrow();
  });
});