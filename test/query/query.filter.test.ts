import { describe, it, expect } from 'vitest';
import { TableScanNode } from '../../src/query/plan/TableScanNode.js';
import { ComparisonPredicate } from '../../src/query/predicate/ComparisonPredicate.js';
import { FilterNode } from '../../src/query/plan/FilterNode.js';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Query::filterNode', () => {
  it("returns rows matching the predicate", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: Number,
        nullable: false,
      }))
      .addRow([10])
      .addRow([20])
      .addRow([30]);

    const scan = new TableScanNode(table);

    const predicate = new ComparisonPredicate(
      0,
      "gt",
      15
    );

    const filter = new FilterNode(predicate, scan);

    const rows = [...filter.execute()];

    expect(rows).toEqual([
      {
        index: 1,
        values: [20],
      },
      {
        index: 2,
        values: [30],
      },
    ]);
  });

  it("returns no rows when no rows match the predicate", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: Number,
        nullable: false,
      }))
      .addRow([10])
      .addRow([20]);

    const scan = new TableScanNode(table);

    const predicate = new ComparisonPredicate(
      0,
      "gt",
      100
    );

    const filter = new FilterNode(predicate, scan);

    expect([...filter.execute()]).toEqual([]);
  });

  it("returns all rows when all rows match the predicate", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: Number,
        nullable: false,
      }))
      .addRow([10])
      .addRow([20]);

    const scan = new TableScanNode(table);

    const predicate = new ComparisonPredicate(
      0,
      "gt",
      0
    );

    const filter = new FilterNode(predicate, scan);

    const rows = [...filter.execute()];

    expect(rows).toHaveLength(2);
  });

  it("preserves deterministic row ordering", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Value",
        type: Number,
        nullable: false,
      }))
      .addRow([5])
      .addRow([10])
      .addRow([15]);

    const scan = new TableScanNode(table);

    const predicate = new ComparisonPredicate(
      0,
      "gt",
      6
    );

    const filter = new FilterNode(predicate, scan);

    const rows = [...filter.execute()];

    expect(rows.map(r => r.values[0])).toEqual([
      10,
      15,
    ]);
  });

  it("supports nested filter composition", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Value",
        type: Number,
        nullable: false,
      }))
      .addRow([5])
      .addRow([10])
      .addRow([15])
      .addRow([20]);

    const scan = new TableScanNode(table);

    const gtPredicate = new ComparisonPredicate(
      0,
      "gt",
      5
    );

    const ltPredicate = new ComparisonPredicate(
      0,
      "lt",
      20
    );

    const firstFilter = new FilterNode(gtPredicate, scan);

    const secondFilter = new FilterNode(
      ltPredicate,
      firstFilter
    );

    const rows = [...secondFilter.execute()];

    expect(rows.map(r => r.values[0])).toEqual([
      10,
      15,
    ]);
  });

  it("does not mutate source rows", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Value",
        type: Number,
        nullable: false,
      }))
      .addRow([1]);

    const scan = new TableScanNode(table);

    const predicate = new ComparisonPredicate(
      0,
      "eq",
      1
    );

    const filter = new FilterNode(predicate, scan);

    [...filter.execute()];

    expect([...table.iterateAliveRows()]).toEqual([
      {
        index: 0,
        values: [1],
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

    const predicate = new ComparisonPredicate(
      0,
      "gt",
      0
    );

    const filter = new FilterNode(predicate, scan);

    const first = [...filter.execute()];
    const second = [...filter.execute()];

    expect(first).toEqual(second);
  });
});