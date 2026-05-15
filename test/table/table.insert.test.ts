import { describe, it, expect } from 'vitest';

import { Table } from "../../src/schema/Table.js";
import { Index } from '../../src/schema/Index.js';
import { PrimaryKey } from '../../src/schema/PrimaryKey.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Table::insertNormalizedRow', () => {
  it('inserts a row into a table with defined columns', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addColumn({ name: "C2", type: Number });

    const row = [1, 2];

    const updated = table.insertNormalizedRow(row);

    expect(updated.requireRow(0)).toEqual(row);
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const updated = table.insertNormalizedRow([1]);

    expect(() => table.requireRow(0)).toThrow();
    expect(updated.requireRow(0)).toEqual([1]);
  });

  it('throws when row length does not match schema (too few values)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addColumn({ name: "C2", type: Number });

    expect(() => {
      table.insertNormalizedRow([1]); // missing column
    }).toThrow();
  });

  it('throws when row length does not match schema (too many values)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addColumn({ name: "C2", type: Number });

    expect(() => {
      table.insertNormalizedRow([1, 2, 3]);
    }).toThrow();
  });

  it('throws when inserting NULL into non-nullable column', () => {
    const table = new Table("Users")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      });

    expect(() => {
      table.insertNormalizedRow([null]);
    }).toThrow();
  });

  it('throws when inserting duplicate unique values', () => {
    const table = new Table("Users")
      .addColumn({
        name: "Email",
        type: String,
      })
      .addIndex(
        Index.fromSpec({
          name: "UQ_Email",
          columns: ["Email"],
          unique: true,
        })
      )
      .insertNormalizedRow(["a@test.com"]);

    expect(() => {
      table.insertNormalizedRow(["a@test.com"]);
    }).toThrow();
  });

  it('allows distinct unique values', () => {
    let table = new Table("Users")
      .addColumn({
        name: "Email",
        type: String,
      })
      .addIndex(
        Index.fromSpec({
          name: "UQ_Email",
          columns: ["Email"],
          unique: true,
        })
      );

    table = table.insertNormalizedRow(["a@test.com"]);

    expect(() => {
      table.insertNormalizedRow(["b@test.com"]);
    }).not.toThrow();
  });

  it('throws when inserting duplicate primary key values', () => {
    const table = new Table("Users")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .addIndex(
        Index.fromSpec({
          name: "PK_Users",
          columns: ["Id"],
          unique: true,
        })
      )
      .addPrimaryKey(
        PrimaryKey.fromSpec({
          kind: CONSTRAINT_KIND.primaryKey,
          name: "PK_Users",
          columns: ["Id"],
          index: "PK_Users",
        })
      )
      .insertNormalizedRow([1]);

    expect(() => {
      table.insertNormalizedRow([1]);
    }).toThrow();
  });

  it('throws when inserting duplicate composite unique values', () => {
    const table = new Table("Users")
      .addColumn({
        name: "FirstName",
        type: String,
      })
      .addColumn({
        name: "LastName",
        type: String,
      })
      .addIndex(
        Index.fromSpec({
          name: "UQ_Name",
          columns: ["FirstName", "LastName"],
          unique: true,
        })
      )
      .insertNormalizedRow(["John", "Smith"]);

    expect(() => {
      table.insertNormalizedRow(["John", "Smith"]);
    }).toThrow();
  });

  it('allows multiple NULL values when nullsDistinct is true', () => {
    let table = new Table("Users")
      .addColumn({
        name: "Email",
        type: String,
      })
      .addIndex(
        Index.fromSpec({
          name: "UQ_Email",
          columns: ["Email"],
          unique: true,
          nullsDistinct: true,
        })
      );

    table = table.insertNormalizedRow([null]);

    expect(() => {
      table.insertNormalizedRow([null]);
    }).not.toThrow();
  });

  it('rejects multiple NULL values when nullsDistinct is false', () => {
    const table = new Table("Users")
      .addColumn({
        name: "Email",
        type: String,
      })
      .addIndex(
        Index.fromSpec({
          name: "UQ_Email",
          columns: ["Email"],
          unique: true,
          nullsDistinct: false,
        })
      )
      .insertNormalizedRow([null]);

    expect(() => {
      table.insertNormalizedRow([null]);
    }).toThrow();
  });

  it('allows NULL mixed with distinct non-null values', () => {
    let table = new Table("Users")
      .addColumn({
        name: "Email",
        type: String,
      })
      .addIndex(
        Index.fromSpec({
          name: "UQ_Email",
          columns: ["Email"],
          unique: true,
          nullsDistinct: true,
        })
      );

    table = table.insertNormalizedRow([null]);

    expect(() => {
      table.insertNormalizedRow(["a@test.com"]);
    }).not.toThrow();
  });

  it('allows composite rows differing only by NULL when nullsDistinct is true', () => {
    let table = new Table("Users")
      .addColumn({
        name: "FirstName",
        type: String,
      })
      .addColumn({
        name: "MiddleName",
        type: String,
      })
      .addIndex(
        Index.fromSpec({
          name: "UQ_Name",
          columns: ["FirstName", "MiddleName"],
          unique: true,
          nullsDistinct: true,
        })
      );

    table = table.insertNormalizedRow([
      "John",
      null,
    ]);

    expect(() => {
      table.insertNormalizedRow([
        "John",
        null,
      ]);
    }).not.toThrow();
  });
});