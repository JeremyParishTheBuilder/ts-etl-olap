import { describe, it, expect } from 'vitest';
import { TableScanNode } from '../../src/evaluation/plan/TableScanNode.js';
import { ProjectNode } from '../../src/evaluation/plan/ProjectNode.js';
import { FilterNode } from '../../src/evaluation/plan/FilterNode.js';
import { ComparisonPredicate } from '../../src/evaluation/predicate/ComparisonPredicate.js';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';
import { ColumnExpression } from '../../src/evaluation/expression/ColumnExpression.js';
import { LiteralExpression } from '../../src/evaluation/expression/LiteralExpression.js';

describe('Query::projectNode', () => {
  it("projects selected columns", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Name",
        type: String,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: Number,
        nullable: false,
      }))
      .addRow([1, "Alice", 30]);

    const scan = new TableScanNode(table);

    const project = new ProjectNode(
      [0, 2],
      scan
    );

    const rows = [...project.execute()];

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
        type: Number,
        nullable: false,
      }))
      .addRow([10])
      .addRow([20]);

    const scan = new TableScanNode(table);

    const project = new ProjectNode(
      [0],
      scan
    );

    const rows = [...project.execute()];

    expect(rows.map(r => r.index)).toEqual([
      0,
      1,
    ]);
  });

  it("preserves deterministic row ordering", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
        nullable: false,
      }))
      .addRow([1, 100])
      .addRow([2, 200])
      .addRow([3, 300]);

    const scan = new TableScanNode(table);

    const project = new ProjectNode(
      [1],
      scan
    );

    const rows = [...project.execute()];

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
        type: Number,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: Number,
        nullable: false,
      }))
      .addRow([1, 10])
      .addRow([2, 20])
      .addRow([3, 30]);

    const scan = new TableScanNode(table);

    const filter = new FilterNode(
      new ComparisonPredicate(new ColumnExpression(1), "gt", new LiteralExpression(15)),
      scan
    );

    const project = new ProjectNode(
      [0],
      filter
    );

    const rows = [...project.execute()];

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

  it("supports projecting no columns", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .addRow([1]);

    const scan = new TableScanNode(table);

    const project = new ProjectNode(
      [],
      scan
    );

    const rows = [...project.execute()];

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
        type: Number,
        nullable: false,
      }));

    const scan = new TableScanNode(table);

    const project = new ProjectNode(
      [0],
      scan
    );

    expect([...project.execute()]).toEqual([]);
  });

  it("does not mutate source rows", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Name",
        type: String,
        nullable: false,
      }))
      .addRow([1, "Alice"]);

    const scan = new TableScanNode(table);

    const project = new ProjectNode(
      [0, 1],
      scan
    );

    project.execute();

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
        type: Number,
        nullable: false,
      }))
      .addRow([1])
      .addRow([2]);

    const scan = new TableScanNode(table);

    const project = new ProjectNode(
      [0],
      scan
    );

    const first = [...project.execute()];
    const second = [...project.execute()];

    expect(first).toEqual(second);
  });
});