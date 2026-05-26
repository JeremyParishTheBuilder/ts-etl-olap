import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';

describe('Table::addIndex', () => {
  it('adds an index to the table', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const updated = table.createIndex({
      name: "I1",
      columns: ["C1"],
      unique: false,
    });

    expect(
      updated.requireIndex("I1")
    ).toBeDefined();
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const updated = table.createIndex({
      name: "I1",
      columns: ["C1"],
      unique: false,
    });

    expect(() => {
      table.requireIndex("I1");
    }).toThrow();

    expect(
      updated.requireIndex("I1")
    ).toBeDefined();
  });

  it('throws when index name already exists', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      });

    expect(() => {
      table.createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      });
    }).toThrow();
  });

  it('throws when index references missing columns', () => {
    const table = new Table("T1");

    expect(() => {
      table.createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      });
    }).toThrow();
  });

  it('normalizes referenced column names', () => {
    const table = new Table("T1")
      .addColumn({ name: "UserId", type: Number });

    const updated = table.createIndex({
      name: "I1",
      columns: ["UserId"],
      unique: false,
    });

    expect(
      updated.requireIndex("I1").columns
    ).toEqual(["userid"]);
  });

  it('preserves original index name casing', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const updated = table.createIndex({
      name: "UserLookup",
      columns: ["C1"],
      unique: false,
    });

    expect(
      updated.requireIndex("userlookup").name
    ).toBe("UserLookup");
  });

  it('throws when adding duplicate unique column set', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: true,
      });

    expect(() => {
      table.createIndex({
        name: "I2",
        columns: ["C1"],
        unique: true,
      });
    }).toThrow();
  });

  it('throws when existing rows violate uniqueness', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const tableWithRows = table
      .addRow([1])
      .addRow([1]);

    expect(() => {
      tableWithRows.createIndex({
        name: "UserLookup",
        columns: ["C1"],
        unique: true,
      })
    }).toThrow();
  });
});