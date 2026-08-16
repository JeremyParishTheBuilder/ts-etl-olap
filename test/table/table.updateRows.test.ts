import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec, createDelete } from '../utils/buildSchema.js';
import { DEFAULT } from '../../src/dialect/keywords.js';

describe('Table::updateRow', () => {

  it('updates an existing row', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRows([[1]]);

    const updated = table.updateRows(
      [0],
      [[2]],
    );

    expect(updated.table.requireRow(0)).toEqual([2]);
    expect(updated.updates).toHaveLength(1);
    expect(updated.updates[0].oldRow).toEqual([1]);
    expect(updated.updates[0].newRow).toEqual([2]);
  });

  it('does not mutate original table state', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      })).addRows([
        [1]
      ]);

    const updated = table.updateRows(
      [0], [[2]]
    ).table;

    expect(
      table.requireRow(0)
    ).toEqual([1]);

    expect(
      updated.requireRow(0)
    ).toEqual([2]);

    expect(updated).not.toBe(table);
  });

  it('rejects invalid row indexes', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRows([
      [1]
    ]);

    expect(() =>
      table.updateRows(
        [99], [[2]]
      )
    ).toThrow();
  });

  it('throws when updated row length is too small', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "name",
        type: String,
      }));

    table = table.addRows([
      [1, "Alice"]
    ]);

    expect(() =>
      table.updateRows(
        [0], [[1]]
      )
    ).toThrow();
  });

  it('throws when updated row length is too large', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRows([
      [1]
    ]);

    expect(() =>
      table.updateRows(
        [0], [[1, 2]]
      )
    ).toThrow();
  });

  it('throws when updating a non-nullable column to NULL', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
        nullable: false,
      }));

    table = table.addRows([
      [1]
    ]);

    expect(() =>
      table.updateRows(
        [0], [[null]]
      )
    ).toThrow();
  });

  it('updates unique index entries when indexed values change', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      ["a@test.com"]
    ]);

    const updated = table.updateRows(
      [0], [["b@test.com"]]
    ).table;

    const index =
      updated.indexes.requireByName("UQ_Email");

    expect(
      index.hasProjectedValues(["a@test.com"])
    ).toBe(false);

    expect(
      index.hasProjectedValues(["b@test.com"])
    ).toBe(true);
  });

  it('preserves unique index entries when indexed values are unchanged', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      ["a@test.com"]
    ]);

    const updated = table.updateRows(
      [0], [["a@test.com"]]
    ).table;

    const index =
      updated.indexes.requireByName("UQ_Email");

    expect(
      index.hasProjectedValues(["a@test.com"])
    ).toBe(true);
  });

  it('rejects updates that violate unique constraints', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      ["a@test.com"],
      ["b@test.com"],
    ]);

    expect(() =>
      table.updateRows(
        [1], [["a@test.com"]]
      )
    ).toThrow();
  });

  it('preserves unrelated rows during update', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRows([
      [1], [2]
    ]);

    const updated = table.updateRows(
      [0], [[10]]
    ).table;

    expect(
      updated.requireRow(1)
    ).toEqual([2]);
  });

  it('preserves row identity during updates', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRows([
      [1]
    ]);

    const updated = table.updateRows(
      [0], [[2]]
    ).table;

    expect(
      updated.requireRowView(0)
    ).toEqual({
      index: 0,
      values: [2],
    });
  });

  it('does not change numRows during updates', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRows([
      [1]
    ]);

    const updated = table.updateRows(
      [0], [[2]]
    ).table;

    expect(updated.numRows).toBe(1);
  });

  it('updates unique indexes when an indexed value changes', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createIndex({
        name: "PK_Users",
        columns: ["id"],
        unique: true,
      })
      .createIndex({
        name: "UQ_Users_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      [1, "a@test.com"],
      [2, "b@test.com"]
    ]);

    const updated = table.updateRows(
      [1], [[2, "c@test.com"]]
    ).table;

    const originalIndex =
      table.indexes.requireByName("UQ_Users_Email");

    const updatedIndex =
      updated.indexes.requireByName("UQ_Users_Email");

    expect(
      originalIndex.hasProjectedValues(["b@test.com"])
    ).toBe(true);

    expect(
      updatedIndex.hasProjectedValues(["b@test.com"])
    ).toBe(false);

    expect(
      updatedIndex.hasProjectedValues(["c@test.com"])
    ).toBe(true);

    expect(
      updatedIndex.hasProjectedValues(["a@test.com"])
    ).toBe(true);

    expect(updated).not.toBe(table);
    expect(updated.indexes).not.toBe(table.indexes);
  });

  it('preserves unique index entries when indexed values are unchanged', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createColumn(createColumnTestSpec({
        name: "name",
        type: String,
      }))
      .createIndex({
        name: "PK_Users",
        columns: ["id"],
        unique: true,
      })
      .createIndex({
        name: "UQ_Users_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      [1, "a@test.com", "Alice"]
    ]);

    const updated = table.updateRows(
      [0], [[1, "a@test.com", "Alicia"]]
    ).table;

    const originalIndex =
      table.indexes.requireByName("UQ_Users_Email");

    const updatedIndex =
      updated.indexes.requireByName("UQ_Users_Email");

    expect(
      originalIndex.hasProjectedValues(["a@test.com"])
    ).toBe(true);

    expect(
      updatedIndex.hasProjectedValues(["a@test.com"])
    ).toBe(true);

    expect(updatedIndex.map.size)
      .toBe(1);

    expect(
      [...updatedIndex.map.values()][0]
    ).toEqual([0]);

    expect(updated).not.toBe(table);
    expect(updated.columns).not.toBe(table.columns);
    expect(updated.indexes).not.toBe(table.indexes);
  });

  it('rejects updates that violate unique constraints', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createIndex({
        name: "PK_Users",
        columns: ["id"],
        unique: true,
      })
      .createIndex({
        name: "UQ_Users_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      [1, "a@test.com"],
      [2, "b@test.com"],
    ]);

    expect(() =>
      table.updateRows(
        [1], [[2, "a@test.com"]]
      )
    ).toThrow();
  });

  it('updates non-indexed columns without changing indexed membership', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createColumn(createColumnTestSpec({
        name: "name",
        type: String,
      }))
      .createIndex({
        name: "UQ_Users_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      [1, "a@test.com", "Alice"]
    ]);

    const updated = table.updateRows(
      [0], [[1, "a@test.com", "Alicia"]]
    ).table;

    const index =
      updated.indexes.requireByName("UQ_Users_Email");

    expect(
      index.hasProjectedValues(["a@test.com"])
    ).toBe(true);

    expect(index.map.size).toBe(1);
  });

  it('preserves unrelated rows and index entries during update', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createIndex({
        name: "UQ_Users_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([
      [1, "a@test.com"],
      [2, "b@test.com"],
      [3, "c@test.com"]
    ]);

    const updated = table.updateRows(
      [1], [[2, "updated@test.com"]]
    ).table;

    const index =
      updated.indexes.requireByName("UQ_Users_Email");

    expect(
      index.hasProjectedValues(["a@test.com"])
    ).toBe(true);

    expect(
      index.hasProjectedValues(["c@test.com"])
    ).toBe(true);

    expect(
      index.hasProjectedValues(["updated@test.com"])
    ).toBe(true);

    expect(
      index.hasProjectedValues(["b@test.com"])
    ).toBe(false);
  });

  it('rejects updates against deleted rows', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRows([
      [1]
    ]);

    table = table.removeRows([createDelete(table, 0)]);

    expect(() =>
      table.updateRows(
        [0], [[2]]
      )
    ).toThrow();
  });

  it('preserves immutable table state during updates', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRows([
      [1]
    ]);

    const updated = table.updateRows(
      [0], [[2]]
    ).table;

    expect(
      table.requireRow(0)
    ).toEqual([1]);

    expect(
      updated.requireRow(0)
    ).toEqual([2]);

    expect(updated).not.toBe(table);
    expect(updated.columns).not.toBe(table.columns);
  });

  it("updates multiple rows", () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRows([
      [1],[2],[3]
    ]);

    const updated = table.updateRows(
      [0, 2], [[10], [30]],
    ).table;

    expect(updated.requireRow(0)).toEqual([10]);
    expect(updated.requireRow(1)).toEqual([2]);
    expect(updated.requireRow(2)).toEqual([30]);
  });

  it("uses the column default for explicit DEFAULT during UPDATE", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
        nullable: false,
        defaultValue: 99,
      }))
      .addRows([
        [1],
      ]);

    const result = table.updateRows(
      [0],
      [[DEFAULT]],
    );

    expect(result.table.requireRow(0)).toEqual([99]);
  });

  it("uses the current auto-increment value for DEFAULT during UPDATE", () => {
    const table = buildTable()
      .createColumn({
        name: "id",
        type: Number,
        nullable: false,
        autoIncrementStep: 1,
        autoIncrementStart: 10,
      },
      {
        autoIncrementAllowsExplicitDefault: true,
      })
      .addRows([
        [1],
      ]);

    let updatedTable = table.updateRows(
      [0],
      [[DEFAULT]],
    ).table;

    expect(updatedTable.requireRow(0)).toEqual([10]);

    updatedTable = updatedTable.addRows([
      [undefined],
    ]);

    expect(updatedTable.requireRow(1)).toEqual([11]);
  });

  it("leaves unspecified columns unchanged during UPDATE", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "name",
        type: String,
      }))
      .addRows([
        [1, "old"],
      ]);

    const result = table.updateRows(
      [0],
      [[2, undefined]],
    );

    expect(result.table.requireRow(0)).toEqual([
      2,
      "old",
    ]);
  });

  it("rejects updating the same row more than once in one operation", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .addRows([
        [1],
      ]);

    expect(() =>
      table.updateRows(
        [0, 0],
        [[2], [3]],
      ),
    ).toThrow("already updated");
  });

  it("rejects a different number of row numbers and input rows", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .addRows([
        [1],
        [2],
      ]);

    expect(() =>
      table.updateRows(
        [0, 1],
        [[3]],
      ),
    ).toThrow();
  });
});