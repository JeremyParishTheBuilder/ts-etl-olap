import { describe, it, expect } from 'vitest';
import { TableScanNode } from '../../src/evaluation/plan/TableScanNode.js';
import { EvaluateNode } from '../../src/evaluation/plan/EvaluateNode.js';
import { FilterNode } from '../../src/evaluation/plan/FilterNode.js';
import { ComparisonPredicate } from '../../src/evaluation/predicate/ComparisonPredicate.js';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';
import { ColumnExpression } from '../../src/evaluation/expression/ColumnExpression.js';
import { LiteralExpression } from '../../src/evaluation/expression/LiteralExpression.js';
import { SQL_DECIMAL, SQL_VARCHAR } from '../../src/types/SqlType.js';
import { ColumnExpressionNode } from '../../src/ast/expression/ColumnExpressionNode.js';
import { bindExpression, resolveExpression } from '../../src/semantic/expression.js';

describe('Query::evaluateNode', () => {
  it("evaluates expressions", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Name",
        type: SQL_VARCHAR,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .addRows([[1, "Alice", 30]]);

    const scan = new TableScanNode(table);

    const evaluate = new EvaluateNode(
      [
        bindExpression(resolveExpression(new ColumnExpressionNode("id"), table), table),
        bindExpression(resolveExpression(new ColumnExpressionNode("age"), table), table)
      ],
      scan
    );

    const rows = [...evaluate.execute()];

    expect(rows).toEqual([
      {
        index: 0,
        values: [1, 30],
      },
    ]);
  });

  it("preserves original row indexes", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Value",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .addRows([[10],[20]]);

    const scan = new TableScanNode(table);

    const evaluate = new EvaluateNode(
      [bindExpression(resolveExpression(new ColumnExpressionNode("Value"), table), table),],
      scan
    );

    const rows = [...evaluate.execute()];

    expect(rows.map(r => r.index)).toEqual([
      0,
      1,
    ]);
  });

  it("preserves deterministic row ordering", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "A",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .addRows([[1, 100],[2, 200],[3, 300]]);

    const scan = new TableScanNode(table);

    const evaluate = new EvaluateNode(
      [bindExpression(resolveExpression(new ColumnExpressionNode("B"), table), table),],
      scan
    );

    const rows = [...evaluate.execute()];

    expect(rows.map(r => r.values)).toEqual([
      [100],
      [200],
      [300],
    ]);
  });

  it("supports composition with filter nodes", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .addRows([[1, 10],[2, 20],[3, 30]]);

    const scan = new TableScanNode(table);

    const filter = new FilterNode(
      new ComparisonPredicate(new ColumnExpression(1), "gt", new LiteralExpression(15)),
      scan
    );

    const evaluate = new EvaluateNode(
      [bindExpression(resolveExpression(new ColumnExpressionNode("Id"), table), table),],
      filter
    );

    const rows = [...evaluate.execute()];

    expect(rows).toEqual([
      {
        index: 1,
        values: [2],
      },
      {
        index: 2,
        values: [3],
      },
    ]);
  });

  it("evaluate zero expressions", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .addRows([[1]]);

    const scan = new TableScanNode(table);

    const evaluate = new EvaluateNode(
      [],
      scan
    );

    const rows = [...evaluate.execute()];

    expect(rows).toEqual([
      {
        index: 0,
        values: [],
      },
    ]);
  });

  it("returns no rows when the source is empty", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
      }));

    const scan = new TableScanNode(table);

    const evaluate = new EvaluateNode(
      [bindExpression(resolveExpression(new ColumnExpressionNode("Id"), table), table),],
      scan
    );

    expect([...evaluate.execute()]).toEqual([]);
  });

  it("does not mutate source rows", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Name",
        type: SQL_VARCHAR,
        nullable: false,
      }))
      .addRows([[1, "Alice"]]);

    const scan = new TableScanNode(table);

    const evaluate = new EvaluateNode(
      [
        bindExpression(resolveExpression(new ColumnExpressionNode("Id"), table), table),
        bindExpression(resolveExpression(new ColumnExpressionNode("Name"), table), table),
      ],
      scan
    );

    evaluate.execute();

    expect([...table.iterateAliveRows()]).toEqual([
      {
        index: 0,
        values: [1, "Alice"],
      },
    ]);
  });

  it("evaluates deterministically", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Value",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .addRows([[1],[2]]);

    const scan = new TableScanNode(table);

    const evaluate = new EvaluateNode(
      [bindExpression(resolveExpression(new ColumnExpressionNode("Value"), table), table),],
      scan
    );

    const first = [...evaluate.execute()];
    const second = [...evaluate.execute()];

    expect(first).toEqual(second);
  });
});