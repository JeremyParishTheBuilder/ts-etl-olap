import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::addRow', () => {
  it('inserts a row into a table with defined columns', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    const row = [1, 2];

    const updated = table.addRow(row);

    expect(updated.requireRow(0)).toEqual(row);
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const updated = table.addRow([1]);

    expect(() => table.requireRow(0)).toThrow();
    expect(updated.requireRow(0)).toEqual([1]);
  });

  it('throws when row length does not match schema (too few values)', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    expect(() => {
      table.addRow([1]); // missing column
    }).toThrow();
  });

  it('throws when row length does not match schema (too many values)', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    expect(() => {
      table.addRow([1, 2, 3]);
    }).toThrow();
  });

  it('throws when inserting NULL into non-nullable column', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }));

    expect(() => {
      table.addRow([null]);
    }).toThrow();
  });

  it('throws when inserting duplicate unique values', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: String,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
      })
      .addRow(["a@test.com"]);

    expect(() => {
      table.addRow(["a@test.com"]);
    }).toThrow();
  });

  it('allows distinct unique values', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: String,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
      });

    table = table.addRow(["a@test.com"]);

    expect(() => {
      table.addRow(["b@test.com"]);
    }).not.toThrow();
  });

  it('throws when inserting duplicate primary key values', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: true,
      })
      .createPrimaryKey({
        name: "PK_Users",
        index: "PK_Users",
      })
      .addRow([1]);

    expect(() => {
      table.addRow([1]);
    }).toThrow();
  });

  it('throws when inserting duplicate composite unique values', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "FirstName",
        type: String,
      }))
      .createColumn(createColumnTestSpec({
        name: "LastName",
        type: String,
      }))
      .createIndex({
        name: "UQ_Name",
        columns: ["FirstName", "LastName"],
        unique: true,
      })
      .addRow(["John", "Smith"]);

    expect(() => {
      table.addRow(["John", "Smith"]);
    }).toThrow();
  });

  it('allows multiple NULL values when nullsDistinct is true', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: String,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
        nullsDistinct: true,
      });

    table = table.addRow([null]);

    expect(() => {
      table.addRow([null]);
    }).not.toThrow();
  });

  it('rejects multiple NULL values when nullsDistinct is false', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: String,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
        nullsDistinct: false,
      })
      .addRow([null]);

    expect(() => {
      table.addRow([null]);
    }).toThrow();
  });

  it('allows NULL mixed with distinct non-null values', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: String,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
        nullsDistinct: true,
      });

    table = table.addRow([null]);

    expect(() => {
      table.addRow(["a@test.com"]);
    }).not.toThrow();
  });

  it('allows composite rows differing only by NULL when nullsDistinct is true', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({ name: "a", type: String }))
      .createColumn(createColumnTestSpec({ name: "b", type: String }))
      .createIndex({
        name: "UQ_Composite",
        columns: ["a", "b"],
        unique: true,
        nullsDistinct: true,
      });

    table = table.addRow(["X", null]);
    table = table.addRow(["X", "Y"]);

    const index = table.requireIndex("UQ_Composite");

    expect(index.hasProjectedValues(["X", null])).toBe(true);
    expect(index.hasProjectedValues(["X", "Y"])).toBe(true);
  });

  it('enforces index synchronization across multiple indexes', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({ name: "id", type: Number }))
      .createColumn(createColumnTestSpec({ name: "email", type: String }))
      .createIndex({
        name: "PK",
        columns: ["id"],
        unique: true,
      })
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRow([1, "a@test.com"]);

    const pk = table.requireIndex("PK");
    const uq = table.requireIndex("UQ_Email");

    expect(pk.hasProjectedValues([1])).toBe(true);
    expect(uq.hasProjectedValues(["a@test.com"])).toBe(true);
  });

  it('maintains correct rowNum assignment under repeated inserts', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({ name: "id", type: Number }));

    table = table.addRow([1]);
    table = table.addRow([2]);
    table = table.addRow([3]);

    expect(table.requireRowView(0).index).toBe(0);
    expect(table.requireRowView(1).index).toBe(1);
    expect(table.requireRowView(2).index).toBe(2);
  });

  it('does not reuse deleted row numbers', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRow([1]);
    table = table.addRow([2]);

    table = table.removeRow(0);

    const updated = table.addRow([3]);

    expect(
      updated.requireRowView(2)
    ).toEqual({
      index: 2,
      values: [3],
    });
  });

  it('preserves existing rows during insertion', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    table = table.addRow([1]);
    table = table.addRow([2]);

    const updated = table.addRow([3]);

    expect(
      updated.requireRow(0)
    ).toEqual([1]);

    expect(
      updated.requireRow(1)
    ).toEqual([2]);

    expect(
      updated.requireRow(2)
    ).toEqual([3]);
  });

  it('preserves existing index entries during insertion', () => {
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

    const updated = table.addRow(["b@test.com"]);

    const index =
      updated.requireIndex("UQ_Email");

    expect(
      index.hasProjectedValues(["a@test.com"])
    ).toBe(true);

    expect(
      index.hasProjectedValues(["b@test.com"])
    ).toBe(true);
  });

  it('increments numRows after insertion', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    expect(table.numRows).toBe(0);

    table = table.addRow([1]);

    expect(table.numRows).toBe(1);

    table = table.addRow([2]);

    expect(table.numRows).toBe(2);
  });
});