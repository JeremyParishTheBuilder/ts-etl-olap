import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { Table } from '../../src/schema/Table.js';

describe('Database::addTable', () => {
  it('adds a table to the database', () => {
    const database = new Database("DB1");

    const updated = database.addTable(
      new Table("T1")
    );

    expect(updated.requireTable("T1")).toBeDefined();
  });

  it('does not mutate original database (immutability)', () => {
    const database = new Database("DB1");

    const updated = database.addTable(
      new Table("T1")
    );

    expect(() => database.requireTable("T1")).toThrow();
    expect(updated.requireTable("T1")).toBeDefined();
  });

  it('replaces table when updating existing table', () => {
    const database = new Database("DB1")
      .addTable(
        new Table("T1")
          .addColumn({ name: "C1", type: Number })
      );

    const updated = database.updateTable(
      new Table("T1")
        .addColumn({ name: "C2", type: Number })
    );

    expect(() => {
      updated.requireTable("T1").requireColumn("C1");
    }).toThrow();

    expect(
      updated.requireTable("T1").requireColumn("C2")
    ).toBeDefined();
  });

  it('preserves original table casing', () => {
    const database = new Database("DB1")
      .createTable("Users");

    expect(
      database.requireTable("users").name
    ).toBe("Users");
  });
});