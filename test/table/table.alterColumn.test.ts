import { describe, it, expect } from 'vitest';
import { buildTable, createCheckTestSpec, createColumnTestSpec } from '../utils/buildSchema.js';
import { ColumnExpressionNode } from '../../src/ast/expression/ColumnExpressionNode.js';
import { LiteralExpressionNode } from '../../src/ast/expression/LiteralExpressionNode.js';
import { ComparisonPredicateNode } from '../../src/ast/predicate/ComparisonPredicateNode.js';
import { SQL_DECIMAL, SQL_VARCHAR } from '../../src/types/SqlType.js';

describe('Table::alterColumn', () => {
  it('rejects altering a column rows fail existing checks', () => {

    const table =
      buildTable()
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_DECIMAL,
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
        .addRows([[20]]);

    expect(() => {
      table.alterColumn(
        "Age",
        SQL_VARCHAR
      );
    }).toThrow();
  });

  it('allows altering column when checks still satisfied', () => {
    const table =
      buildTable()
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_DECIMAL,
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
        .addRows([[20]]);

    expect(() => {
      table.alterColumn("Age", SQL_DECIMAL);
    }).not.toThrow();
  });
});