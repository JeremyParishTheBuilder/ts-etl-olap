import { describe, it, expect } from 'vitest';
import { buildTable, createCheckTestSpec, createColumnTestSpec, createDelete, createInsert } from '../utils/buildSchema.js';
import { ColumnExpressionNode } from '../../src/ast/expression/ColumnExpressionNode.js';
import { LiteralExpressionNode } from '../../src/ast/expression/LiteralExpressionNode.js';
import { ComparisonPredicateNode } from '../../src/ast/predicate/ComparisonPredicateNode.js';

describe('Table::addRows', () => {
  it('inserts a row into a table with defined columns', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    const row = [1, 2];

    const updated = table.addRow(row);

    expect(updated.requireRow(0)).toEqual(row);
  });

  it('inserts a batch of rows into a table with defined columns', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    const updated = table.addRows([
      createInsert([1, 2]),
      createInsert([3, 4]),
      createInsert([5, 6]),
    ]);

    expect(updated.numRows).toBe(3);
    expect(updated.requireRow(0)).toEqual([1, 2]);
    expect(updated.requireRow(1)).toEqual([3, 4]);
    expect(updated.requireRow(2)).toEqual([5, 6]);
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
        columns: ["Id"],
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

  it('allows multiple NULL rows when nullsDistinct is true', () => {
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

  it('rejects multiple NULL rows when nullsDistinct is false', () => {
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

    const index = table.indexes.requireByName("UQ_Composite");

    expect(index.hasProjectedValues(["X", null])).toBe(true); // <- ends up being false
    expect(index.hasProjectedValues(["X", "Y"])).toBe(true);
  });

  it('ignores NULLs in non-indexed columns for uniqueness', () => {
    let table = buildTable()
      .createColumn({ name: "A", type: String })
      .createColumn({ name: "B", type: String })
      .createIndex({
        name: "UQ_A",
        columns: ["A"],
        unique: true,
      });

    table = table.addRow(["X", null]);

    expect(() => {
      table.addRow(["Y", "other"]); // OK (new value)
    }).not.toThrow();

    expect(() => {
      table.addRow(["X", "other"]); // throws (duplicate A)
    }).toThrow();
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

    const pk = table.indexes.requireByName("PK");
    const uq = table.indexes.requireByName("UQ_Email");

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

    table = table.removeRows([createDelete(table, 0)]);

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
      updated.indexes.requireByName("UQ_Email");

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

  it('rejects rows that violate checks', () => {
    const table =
      buildTable()
        .createColumn({
          name: "Age",
          type: Number,
        })
        .createCheck(
          createCheckTestSpec({
            name: "CHK_Adult",
            predicate: new ComparisonPredicateNode(
              new ColumnExpressionNode("Age"),
              "gte",
              new LiteralExpressionNode(18),
            ),
          })
        );

    expect(() => {
      table.addRow([10]);
    }).toThrow();
  });

  it('allows rows that satisfy checks', () => {
    const table =
      buildTable()
        .createColumn({
          name: "Age",
          type: Number,
        })
        .createCheck(
          createCheckTestSpec({
            name: "CHK_Adult",
            predicate: new ComparisonPredicateNode(
              new ColumnExpressionNode("Age"),
              "gte",
              new LiteralExpressionNode(18),
            ),
          })
        );

    expect(() => {
      table.addRow([20]);
    }).not.toThrow();
  });

  it("rejects duplicate unique values within a batch", () => {
    const table = buildTable()
      .createColumn(
        createColumnTestSpec({
          name: "email",
          type: String,
        }),
      )
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    expect(() =>
      table.addRows([
        createInsert(["a@test.com"]),
        createInsert(["a@test.com"]),
      ]),
    ).toThrow();
  });

  it("does not partially insert a batch when one row violates a constraint", () => {
    const table = buildTable()
      .createColumn(
        createColumnTestSpec({
          name: "id",
          type: Number,
        }),
      )
      .createIndex({
        name: "UQ_Id",
        columns: ["id"],
        unique: true,
      });

    const original = table;

    expect(() =>
      table.addRows([
        createInsert([1]),
        createInsert([2]),
        createInsert([1]),
      ]),
    ).toThrow();

    expect(original.numRows).toBe(0);
  });
});