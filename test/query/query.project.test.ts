import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { TableScanNode } from '../../src/query/plan/TableScanNode.js';
import { ProjectNode } from '../../src/query/plan/ProjectNode.js';
import { FilterNode } from '../../src/query/plan/FilterNode.js';
import { ComparisonPredicate } from '../../src/query/predicate/ComparisonPredicate.js';
import { createColumnTestSpec } from '../utils/buildSchema.js';

describe('Query::projectNode', () => {
  it("projects selected columns", () => {
    const table = new Table("Users")
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
    const table = new Table("Users")
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
    const table = new Table("Users")
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
    const table = new Table("Users")
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
      new ComparisonPredicate(1, "gt", 15),
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
    const table = new Table("Users")
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
    const table = new Table("Users")
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
    const table = new Table("Users")
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
      [1],
      scan
    );

    [...project.execute()];

    expect([...table.iterateAliveRows()]).toEqual([
      {
        index: 0,
        values: [1, "Alice"],
      },
    ]);
  });

  it("evaluates deterministically", () => {
    const table = new Table("Users")
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