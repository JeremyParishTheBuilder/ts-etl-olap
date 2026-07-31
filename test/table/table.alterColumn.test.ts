import { describe, it, expect } from 'vitest';
import { buildTable, createCheckTestSpec, createColumnTestSpec } from '../utils/buildSchema.js';
import { ColumnExpressionNode } from '../../src/semantic/ast/expression/ColumnExpressionNode.js';
import { LiteralExpressionNode } from '../../src/semantic/ast/expression/LiteralExpressionNode.js';
import { ComparisonPredicateNode } from '../../src/semantic/ast/predicate/ComparisonPredicateNode.js';

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