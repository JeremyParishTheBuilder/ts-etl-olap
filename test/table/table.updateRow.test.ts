import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::updateRow', () => {

  it('updates an existing row', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRow([1]);

    const updated = table.updateRow(
      [2],
      0,
    );

    expect(
      updated.requireRow(0)
    ).toEqual([2]);
  });

  it('does not mutate original table state', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRow([1]);

    const updated = table.updateRow(
      [2],
      0,
    );

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

    table = table.addRow([1]);

    expect(() =>
      table.updateRow([2], 99)
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

    table = table.addRow([1, "Alice"]);

    expect(() =>
      table.updateRow(
        [1],
        0,
      )
    ).toThrow();
  });

  it('throws when updated row length is too large', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRow([1]);

    expect(() =>
      table.updateRow(
        [1, 2],
        0,
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

    table = table.addRow([1]);

    expect(() =>
      table.updateRow(
        [null],
        0,
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

    table = table.addRow(["a@test.com"]);

    const updated = table.updateRow(
      ["b@test.com"],
      0,
    );

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

    table = table.addRow(["a@test.com"]);

    const updated = table.updateRow(
      ["a@test.com"],
      0,
    );

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

    table = table.addRow(["a@test.com"]);
    table = table.addRow(["b@test.com"]);

    expect(() =>
      table.updateRow(
        ["a@test.com"],
        1,
      )
    ).toThrow();
  });

  it('preserves unrelated rows during update', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRow([1]);
    table = table.addRow([2]);

    const updated = table.updateRow(
      [10],
      0,
    );

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

    table = table.addRow([1]);

    const updated = table.updateRow(
      [2],
      0,
    );

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

    table = table.addRow([1]);

    const updated = table.updateRow(
      [2],
      0,
    );

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

    table = table.addRow([1, "a@test.com"]);
    table = table.addRow([2, "b@test.com"]);

    const updated = table.updateRow(
      [2, "c@test.com"],
      1,
    );

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

    table = table.addRow([
      1,
      "a@test.com",
      "Alice",
    ]);

    const updated = table.updateRow(
      [
        1,
        "a@test.com",
        "Alicia",
      ],
      0,
    );

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

    table = table.addRow([1, "a@test.com"]);
    table = table.addRow([2, "b@test.com"]);

    expect(() =>
      table.updateRow(
        [2, "a@test.com"],
        1,
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

    table = table.addRow([
      1,
      "a@test.com",
      "Alice",
    ]);

    const updated = table.updateRow(
      [
        1,
        "a@test.com",
        "Alicia",
      ],
      0,
    );

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

    table = table.addRow([1, "a@test.com"]);
    table = table.addRow([2, "b@test.com"]);
    table = table.addRow([3, "c@test.com"]);

    const updated = table.updateRow(
      [2, "updated@test.com"],
      1,
    );

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

    table = table.addRow([1]);

    table = table.removeRow(0);

    expect(() =>
      table.updateRow([2], 0)
    ).toThrow();
  });

  it('preserves immutable table state during updates', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRow([1]);

    const updated = table.updateRow(
      [2],
      0,
    );

    expect(
      table.requireRow(0)
    ).toEqual([1]);

    expect(
      updated.requireRow(0)
    ).toEqual([2]);

    expect(updated).not.toBe(table);
    expect(updated.columns).not.toBe(table.columns);
  });
});