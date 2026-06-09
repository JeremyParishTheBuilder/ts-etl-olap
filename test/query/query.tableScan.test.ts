import { describe, it, expect } from 'vitest';
import { TableScanNode } from '../../src/query/plan/TableScanNode.js';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Query::tableScanNode', () => {
  it("returns alive rows from the table", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .addRow([1])
      .addRow([2]);

    const scan = new TableScanNode(table);

    const rows = [...scan.execute()];

    expect(rows).toEqual([
      {
        index: 0,
        values: [1],
      },
      {
        index: 1,
        values: [2],
      },
    ]);
  });

  it("preserves deterministic row ordering", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .addRow([10])
      .addRow([20])
      .addRow([30]);

    const scan = new TableScanNode(table);

    const rows = [...scan.execute()];

    expect(rows.map(r => r.index)).toEqual([0, 1, 2]);

    expect(rows.map(r => r.values)).toEqual([
      [10],
      [20],
      [30],
    ]);
  });

  it("skips non-alive rows", () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .addRow([1])
      .addRow([2])
      .addRow([3]);

    table = table.removeRow(1);

    const scan = new TableScanNode(table);

    const rows = [...scan.execute()];

    expect(rows).toEqual([
      {
        index: 0,
        values: [1],
      },
      {
        index: 2,
        values: [3],
      },
    ]);
  });

  it("returns RowViews with correct indexes and values", () => {
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

    const rows = [...scan.execute()];

    expect(rows).toEqual([
      {
        index: 0,
        values: [1, "Alice"],
      },
    ]);
  });

  it("does not mutate the table", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .addRow([1]);

    const scan = new TableScanNode(table);

    [...scan.execute()];

    const rows = [...table.iterateAliveRows()];

    expect(rows).toEqual([
      {
        index: 0,
        values: [1],
      },
    ]);
  });

  it("evaluates deterministically", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .addRow([1])
      .addRow([2]);

    const scan = new TableScanNode(table);

    const first = [...scan.execute()];
    const second = [...scan.execute()];

    expect(first).toEqual(second);
  });

  it("returns no rows for an empty table", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }));

    const scan = new TableScanNode(table);

    expect([...scan.execute()]).toEqual([]);
  });
});