import { describe, it, expect } from 'vitest';
import { buildTable, createCheckTestSpec, createColumnTestSpec, createDelete } from '../utils/buildSchema.js';
import { ColumnExpressionNode } from '../../src/ast/expression/ColumnExpressionNode.js';
import { LiteralExpressionNode } from '../../src/ast/expression/LiteralExpressionNode.js';
import { ComparisonPredicateNode } from '../../src/ast/predicate/ComparisonPredicateNode.js';
import { DEFAULT } from '../../src/dialect/keywords.js';
import { SQL_DECIMAL, SQL_VARCHAR } from '../../src/types/SqlType.js';

describe('Table::addRows', () => {
  it('inserts a row into a table with defined columns', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: SQL_DECIMAL }))
      .createColumn(createColumnTestSpec({ name: "C2", type: SQL_DECIMAL }));

    const row = [1, 2];

    const updated = table.addRows(
      [row]
    );

    expect(updated.requireRow(0)).toEqual(row);
  });

  it('inserts a batch of rows into a table with defined columns', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: SQL_DECIMAL }))
      .createColumn(createColumnTestSpec({ name: "C2", type: SQL_DECIMAL }));

    const updated = table.addRows([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);

    expect(updated.numRows).toBe(3);
    expect(updated.requireRow(0)).toEqual([1, 2]);
    expect(updated.requireRow(1)).toEqual([3, 4]);
    expect(updated.requireRow(2)).toEqual([5, 6]);
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: SQL_DECIMAL }));

    const updated = table.addRows([[1]]);

    expect(() => table.requireRow(0)).toThrow();
    expect(updated.requireRow(0)).toEqual([1]);
  });

  it('throws when inserting NULL into non-nullable column', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
      }));

    expect(() => {
      table.addRows([[null]]);
    }).toThrow();
  });

  it('throws when inserting duplicate unique values', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: SQL_VARCHAR,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
      });
    
    table = table.addRows([["a@test.com"]]);

    expect(() => {
      table.addRows([["a@test.com"]]);
    }).toThrow();
  });

  it('allows distinct unique values', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: SQL_VARCHAR,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
      });

    table = table.addRows([["a@test.com"]]);

    expect(() => {
      table.addRows([["b@test.com"]]);
    }).not.toThrow();
  });

  it('throws when inserting duplicate primary key values', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
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
      });

    table = table.addRows([[1]]);

    expect(() => {
      table.addRows([[1]]);
    }).toThrow();
  });

  it('throws when inserting duplicate composite unique values', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "FirstName",
        type: SQL_VARCHAR,
      }))
      .createColumn(createColumnTestSpec({
        name: "LastName",
        type: SQL_VARCHAR,
      }))
      .createIndex({
        name: "UQ_Name",
        columns: ["FirstName", "LastName"],
        unique: true,
      });

    table = table.addRows([["John", "Smith"]]);

    expect(() => {
      table.addRows([["John", "Smith"]]);
    }).toThrow();
  });

  it('allows multiple NULL rows when nullsDistinct is true', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: SQL_VARCHAR,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
        nullsDistinct: true,
      });

    table = table.addRows([[null]]);

    expect(() => {
      table.addRows([[null]]);
    }).not.toThrow();
  });

  it('rejects multiple NULL rows when nullsDistinct is false', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: SQL_VARCHAR,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
        nullsDistinct: false,
      });
    
    table = table.addRows([[null]]);

    expect(() => {
      table.addRows([[null]]);
    }).toThrow();
  });

  it('allows NULL mixed with distinct non-null values', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: SQL_VARCHAR,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
        nullsDistinct: true,
      });

    table = table.addRows([[null]]);

    expect(() => {
      table.addRows([["a@test.com"]]);
    }).not.toThrow();
  });

  it('allows composite rows differing only by NULL when nullsDistinct is true', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({ name: "a", type: SQL_VARCHAR }))
      .createColumn(createColumnTestSpec({ name: "b", type: SQL_VARCHAR }))
      .createIndex({
        name: "UQ_Composite",
        columns: ["a", "b"],
        unique: true,
        nullsDistinct: true,
      });

    table = table.addRows([["X", null],["X", "Y"]]);

    const index = table.indexes.requireByName("UQ_Composite");

    expect(index.hasProjectedValues(["X", null])).toBe(true); // <- ends up being false
    expect(index.hasProjectedValues(["X", "Y"])).toBe(true);
  });

  it('ignores NULLs in non-indexed columns for uniqueness', () => {
    let table = buildTable()
      .createColumn({ name: "A", type: SQL_VARCHAR })
      .createColumn({ name: "B", type: SQL_VARCHAR })
      .createIndex({
        name: "UQ_A",
        columns: ["A"],
        unique: true,
      });

    table = table.addRows([["X", null]]);

    expect(() => {
      table.addRows([["Y", "other"]]); // OK (new value)
    }).not.toThrow();

    expect(() => {
      table.addRows([["X", "other"]]); // throws (duplicate A)
    }).toThrow();
  });

  it('enforces index synchronization across multiple indexes', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({ name: "id", type: SQL_DECIMAL }))
      .createColumn(createColumnTestSpec({ name: "email", type: SQL_VARCHAR }))
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

    table = table.addRows([[1, "a@test.com"]]);

    const pk = table.indexes.requireByName("PK");
    const uq = table.indexes.requireByName("UQ_Email");

    expect(pk.hasProjectedValues([1])).toBe(true);
    expect(uq.hasProjectedValues(["a@test.com"])).toBe(true);
  });

  it('maintains correct rowNum assignment under repeated inserts', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({ name: "id", type: SQL_DECIMAL }));

    table = table.addRows([[1],[2],[3]]);

    expect(table.requireRowView(0).index).toBe(0);
    expect(table.requireRowView(1).index).toBe(1);
    expect(table.requireRowView(2).index).toBe(2);
  });

  it('does not reuse deleted row numbers', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
      }));

    table = table.addRows([[1],[2]]);

    table = table.removeRows([createDelete(table, 0)]);

    const updated = table.addRows([[3]]);

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
        type: SQL_DECIMAL,
      }));

    table = table.addRows([[1],[2]]);

    const updated = table.addRows([[3]]);

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
        type: SQL_VARCHAR,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRows([["a@test.com"]]);

    const updated = table.addRows([["b@test.com"]]);

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
        type: SQL_DECIMAL,
      }));

    expect(table.numRows).toBe(0);

    table = table.addRows([[1]]);

    expect(table.numRows).toBe(1);

    table = table.addRows([[2]]);

    expect(table.numRows).toBe(2);
  });

  it('rejects rows that violate checks', () => {
    const table =
      buildTable()
        .createColumn({
          name: "Age",
          type: SQL_DECIMAL,
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
      table.addRows([[10]]);
    }).toThrow();
  });

  it('allows rows that satisfy checks', () => {
    const table =
      buildTable()
        .createColumn({
          name: "Age",
          type: SQL_DECIMAL,
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
      table.addRows([[20]]);
    }).not.toThrow();
  });

  it("rejects duplicate unique values within a batch", () => {
    const table = buildTable()
      .createColumn(
        createColumnTestSpec({
          name: "email",
          type: SQL_VARCHAR,
        }),
      )
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    expect(() =>
      table.addRows([
        ["a@test.com"],
        ["a@test.com"],
      ]),
    ).toThrow();
  });

  it("does not partially insert a batch when one row violates a constraint", () => {
    const table = buildTable()
      .createColumn(
        createColumnTestSpec({
          name: "id",
          type: SQL_DECIMAL,
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
        [1],
        [2],
        [1],
      ]),
    ).toThrow();

    expect(original.numRows).toBe(0);
  });

  it("resolves auto-increment defaults independently for each inserted row", () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
        nullable: false,
        autoIncrementStep: 1,
        autoIncrementStart: 1,
      }));

    table = table.addRows([
      [undefined],
      [undefined],
      [undefined],
    ]);

    expect(table.requireRow(0)).toEqual([1]);
    expect(table.requireRow(1)).toEqual([2]);
    expect(table.requireRow(2)).toEqual([3]);
  });

  it("advances auto-increment when DEFAULT is explicitly inserted", () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
        nullable: false,
        autoIncrementStep: 1,
        autoIncrementStart: 1,
      }));

    table = table.addRows([
      [DEFAULT],
      [DEFAULT],
    ]);

    expect(table.requireRow(0)).toEqual([1]);
    expect(table.requireRow(1)).toEqual([2]);
  });

  it("advances auto-increment after an explicit value at or above the next value", () => {
    let table = buildTable()
      .createColumn({
        name: "id",
        type: SQL_DECIMAL,
        nullable: false,
        autoIncrementStep: 1,
        autoIncrementStart: 1,
      },
      {
        autoIncrementAllowsExplicitDefault: true,
      });

    table = table.addRows([
      [10],
      [undefined],
    ]);

    expect(table.requireRow(0)).toEqual([10]);
    expect(table.requireRow(1)).toEqual([11]);
  });

  it("does not advance auto-increment after an explicit value when disabled", () => {
    let table = buildTable()
      .createColumn({
        name: "id",
        type: SQL_DECIMAL,
        nullable: false,
        autoIncrementStep: 1,
        autoIncrementStart: 1,
      },
      {
        autoIncrementExplicitValueAdvances: false,
      });

    table = table.addRows([
      [10],
      [undefined],
    ]);

    expect(table.requireRow(0)).toEqual([10]);
    expect(table.requireRow(1)).toEqual([1]);
  });

  it("uses the next auto-increment value for explicit NULL when configured", () => {
    let table = buildTable()
      .createColumn({
        name: "id",
        type: SQL_DECIMAL,
        nullable: false,
        autoIncrementStep: 1,
        autoIncrementStart: 1,
      },
      {
        autoIncrementNullGenerates: true,
      });

    table = table.addRows([
      [null],
    ]);

    expect(table.requireRow(0)).toEqual([1]);
  });

  it("does not treat explicit NULL as auto-increment when disabled", () => {
    let table = buildTable()
      .createColumn({
        name: "id",
        type: SQL_DECIMAL,
        nullable: true,
        autoIncrementStep: 1,
        autoIncrementStart: 1,
      },
      {
        autoIncrementNullGenerates: false,
      });

    table = table.addRows([
      [null],
    ]);

    expect(table.requireRow(0)).toEqual([null]);
  });

  it("uses the next auto-increment value for explicit zero when configured", () => {
    let table = buildTable()
      .createColumn({
        name: "id",
        type: SQL_DECIMAL,
        nullable: false,
        autoIncrementStep: 1,
        autoIncrementStart: 1,
      },
      {
        autoIncrementZeroGenerates: true,
      });

    table = table.addRows([
      [0],
    ]);

    expect(table.requireRow(0)).toEqual([1]);
  });

  it("uses the column default when an insert value is omitted", () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
        nullable: false,
        defaultValue: 42,
      }));

    table = table.addRows([
      [undefined],
    ]);

    expect(table.requireRow(0)).toEqual([42]);
  });

  it("uses NULL when an omitted nullable column has no default", () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
        nullable: true,
      }));

    table = table.addRows([
      [undefined],
    ]);

    expect(table.requireRow(0)).toEqual([null]);
  });

  it("rejects an omitted non-nullable column without a default", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "id",
        type: SQL_DECIMAL,
        nullable: false,
      }));

    expect(() =>
      table.addRows([
        [undefined],
      ]),
    ).toThrow();
  });
});