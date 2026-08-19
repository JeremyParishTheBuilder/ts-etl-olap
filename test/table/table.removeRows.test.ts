import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec, createDelete } from '../utils/buildSchema.js';
import { SQL_DECIMAL, SQL_VARCHAR } from '../../src/types/SqlType.js';

describe('Table::removeRow', () => {

  it('marks a row as not alive', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    table = table.addRows([
      [1],
    ]);

    const updated = table.removeRows(
      [createDelete(table, 0)]
    );

    expect(updated.isRowAlive(0)).toBe(false);
  });

  it('removes row entries from indexes', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "email",
        type: SQL_VARCHAR,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      ["a@test.com"],
    ]);

    const updated = table.removeRows(
      [createDelete(table, 0)]
    );

    const index =
      updated.indexes.requireByName("UQ_Email");

    expect(
      index.hasProjectedValues(["a@test.com"])
    ).toBe(false);
  });

  it('preserves unrelated index entries', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "email",
        type: SQL_VARCHAR,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      ["a@test.com"],
      ["b@test.com"],
      ["c@test.com"],
    ]);

    const updated = table.removeRows(
      [createDelete(table, 1)]
    );

    const index =
      updated.indexes.requireByName("UQ_Email");

    expect(
      index.hasProjectedValues(["a@test.com"])
    ).toBe(true);

    expect(
      index.hasProjectedValues(["b@test.com"])
    ).toBe(false);

    expect(
      index.hasProjectedValues(["c@test.com"])
    ).toBe(true);
  });

  it('preserves row numbers of remaining rows', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    table = table.addRows([
      [1],
      [2],
      [3],
    ]);

    const updated = table.removeRows(
      [createDelete(table, 1)]
    );

    expect(
      updated.requireRowView(0).index
    ).toBe(0);

    expect(
      updated.requireRowView(2).index
    ).toBe(2);
  });

  it('rejects removing already deleted rows', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    table = table.addRows([
      [1],
    ]);

    table = table.removeRows(
      [createDelete(table, 0)]
    );

    expect(() =>
      table.removeRows(
        [createDelete(table, 0)]
      )
    ).toThrow();
  });

  it('rejects invalid row indexes', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    expect(() =>
      table.removeRows(
        [createDelete(table, 99)]
      )
    ).toThrow();
  });

  it('prevents deleted rows from being fetched', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    table = table.addRows([
      [1],
    ]);

    const updated = table.removeRows(
      [createDelete(table, 0)]
    );

    expect(
      updated.getRow(0)
    ).toBeUndefined();

    expect(() =>
      updated.requireRow(0)
    ).toThrow();

    expect(
      updated.getRowView(0)
    ).toBeUndefined();

    expect(() =>
      updated.requireRowView(0)
    ).toThrow();
  });

  it('prevents deleted rows from being iterated', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    table = table.addRows([
      [1],
      [2],
      [3],
    ]);

    const updated = table.removeRows(
      [createDelete(table, 1)]
    );

    const rows = [
      ...updated.iterateAliveRows(),
    ];

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

  it('preserves immutable table state during removal', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    table = table.addRows([
      [1],
    ]);

    const updated = table.removeRows(
      [createDelete(table, 0)]
    );

    expect(
      table.requireRow(0)
    ).toEqual([1]);

    expect(
      updated.getRow(0)
    ).toBeUndefined();

    expect(updated).not.toBe(table);
    expect(updated.columns).toBe(table.columns);
    expect(updated.rowAlive).not.toBe(table.rowAlive);
  });

  it('does not decrement numRows after deletion', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    table = table.addRows([
      [1],
    ]);

    expect(table.numRows).toBe(1);

    const updated = table.removeRows(
      [createDelete(table, 0)]
    );

    expect(updated.numRows).toBe(1);
  });

  it('allows new rows after deletion using new row numbers', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    table = table.addRows([
      [1],
      [2],
    ]);

    table = table.removeRows(
      [createDelete(table, 0)]
    );

    const updated = table.addRows([
      [3],
    ]);

    expect(
      updated.requireRowView(2)
    ).toEqual({
      index: 2,
      values: [3],
    });
  });

  it("removes multiple rows", () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }))
      .createColumn(createColumnTestSpec({
        name: "name",
        type: SQL_VARCHAR,
      }));
      
    table = table.addRows([
      [1, "Alice"],
      [2, "Bob"],
      [3, "Charlie"],
    ]);

    const updated = table.removeRows([
      {
        rowNum: 0,
        oldRow: [1, "Alice"],
      },
      {
        rowNum: 2,
        oldRow: [3, "Charlie"],
      },
    ]);

    expect([...updated.iterateAliveRows()])
      .toHaveLength(1);
  });
});