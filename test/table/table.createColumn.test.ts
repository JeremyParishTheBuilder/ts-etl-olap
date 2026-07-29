import { describe, it, expect, } from 'vitest';
import { buildTable, createColumnTestSpec, } from '../utils/buildSchema.js';

describe('Table::createColumn', () => {

  it('adds a column to an empty table', () => {
    const table = buildTable();

    const updated = table.createColumn(createColumnTestSpec({
      name: "C1",
      type: Number,
    }));

    const col = updated.columns.requireByName("C1");

    expect(col).toBeDefined();
    expect(col.position).toBe(0);
  });

  it('assigns increasing column positions', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    expect(table.columns.requireByName("C1").position).toBe(0);
    expect(table.columns.requireByName("C2").position).toBe(1);
  });

  it('does not mutate the original table (immutability)', () => {
    const table = buildTable();

    const updated = table.createColumn(createColumnTestSpec({
      name: "C1",
      type: Number,
    }));

    expect(() => table.columns.requireByName("C1")).toThrow();
    expect(updated.columns.requireByName("C1")).toBeDefined();
  });

  it('throws when adding a duplicate column name', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    expect(() => {
      table.createColumn(createColumnTestSpec({ name: "C1", type: Number }));
    }).toThrow();
  });

  it('preserves existing columns when adding a new one', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const updated = table.createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    expect(updated.columns.requireByName("C1").position).toBe(0);
    expect(updated.columns.requireByName("C2").position).toBe(1);
  });

  it('throws when adding duplicate column names with different casing', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "UserId", type: Number }));

    expect(() => {
      table.createColumn(createColumnTestSpec({ name: "userid", type: Number }));
    }).toThrow();
  });

  it('throws when adding a non-nullable column without default to a populated table', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "C1",
        type: Number,
      }));

    const withRow = table.addRow([
      1
    ]);

    expect(() => {
      withRow.createColumn(createColumnTestSpec({
        name: "C2",
        type: Number,
        nullable: false,
      }));
    }).toThrow();
  });

  it('allows adding a non-nullable column without default to an empty table', () => {
    const table = buildTable();

    const updated = table.createColumn({
      name: "C1",
      type: Number,
      nullable: false,
    });

    expect(
      updated.columns.requireByName("C1")
    ).toBeDefined();
  });

  it('allows adding a non-nullable column with default to a populated table', () => {
    const table = buildTable()
      .createColumn({
        name: "C1",
        type: Number,
      });

    const withRow = table.addRow([
      1
    ]);

    const updated = withRow.createColumn({
      name: "C2",
      type: Number,
      nullable: false,
      defaultValue: 0,
    });

    expect(
      updated.columns.requireByName("C2")
    ).toBeDefined();
  });

  it('allows falsy default values when adding non-nullable columns', () => {
    const table = buildTable({columns: 1});

    const withRow = table.addRow([
      1
    ]);

    expect(() => {
      withRow.createColumn(createColumnTestSpec({
        name: "C2",
        type: Number,
        nullable: false,
        defaultValue: 0,
      }));
    }).not.toThrow();
  });

  it('backfills a nullable column with null values when added to a populated table', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "C1",
        type: Number,
      }))
      .addRow([1])
      .addRow([2])
      .addRow([3]);

    const updated = table.createColumn(createColumnTestSpec({
      name: "C2",
      type: String,
      nullable: true,
    }));

    const column = updated.columns.requireByName("C2");

    expect(column.data).toEqual([
      null,
      null,
      null,
    ]);
  });

  it('backfills a non-nullable column with its default value when added to a populated table', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "C1",
        type: Number,
      }))
      .addRow([1])
      .addRow([2])
      .addRow([3]);

    const updated = table.createColumn(createColumnTestSpec({
      name: "C2",
      type: String,
      nullable: false,
      defaultValue: "Unknown",
    }));

    const column = updated.columns.requireByName("C2");

    expect(column.data).toEqual([
      "Unknown",
      "Unknown",
      "Unknown",
    ]);
  });

  it('does not backfill a newly-added column when the table has no rows', () => {
    const table = buildTable();

    const updated = table.createColumn(createColumnTestSpec({
      name: "C1",
      type: Number,
    }));

    const column = updated.columns.requireByName("C1");

    expect(column.data).toEqual([]);
  });

  it('preserves the existing row count when adding a column', () => {
  const table = buildTable()
    .createColumn(createColumnTestSpec({
      name: "C1",
      type: Number,
    }))
    .addRow([1])
    .addRow([2]);

  const updated = table.createColumn(createColumnTestSpec({
    name: "C2",
    type: Number,
    defaultValue: 0,
  }));

  expect(updated.numRows).toBe(2);
  expect(updated.columns.requireByName("C2").data.length).toBe(2);
});

it('does not modify existing column data when backfilling a new column', () => {
  const table = buildTable()
    .createColumn(createColumnTestSpec({
      name: "C1",
      type: Number,
    }))
    .addRow([10])
    .addRow([20]);

  const updated = table.createColumn(createColumnTestSpec({
    name: "C2",
    type: Number,
    defaultValue: 0,
  }));

  expect(updated.columns.requireByName("C1").data).toEqual([
    10,
    20,
  ]);

  expect(updated.columns.requireByName("C2").data).toEqual([
    0,
    0,
  ]);
});

it('backfills exactly one datum for every existing row', () => {
  const table = buildTable()
    .createColumn(createColumnTestSpec({
      name: "C1",
      type: Number,
    }))
    .addRow([1])
    .addRow([2])
    .addRow([3])
    .addRow([4]);

  const updated = table.createColumn(createColumnTestSpec({
    name: "C2",
    type: Number,
    defaultValue: 0,
  }));

  const column = updated.columns.requireByName("C2");

  expect(column.data.length).toBe(updated.numRows);

  for (let row = 0; row < updated.numRows; row++) {
    expect(column.getDatumAtRow(row)).toBe(0);
  }
});
});