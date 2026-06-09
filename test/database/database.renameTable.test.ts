import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { buildParentChildDatabase, buildTable } from '../utils/buildSchema.js';

describe('Database::renameTable', () => {

  it('renames table and makes it retrievable under new name', () => {
    const db = new Database("DB1")
      .addTable(buildTable({ name: "Users" }));

    const updated = db.renameTable(
      "Users",
      "Accounts",
    );

    expect(() =>
      updated.requireTable("Accounts")
    ).not.toThrow();

    expect(() =>
      updated.requireTable("Users")
    ).toThrow();
  });

  it('preserves table id during rename', () => {
    const db = new Database("DB1")
      .addTable(buildTable({ name: "Users" }));

    const originalId =
      db.requireTable("Users").id;

    const updated =
      db.renameTable("Users", "Accounts");

    expect(
      updated.requireTable("Accounts").id
    ).toBe(originalId);
  });

  it('updates table name lookup', () => {
    const db = new Database("DB1")
      .addTable(buildTable({ name: "Users" }));

    const updated =
      db.renameTable("Users", "Accounts");

    expect(
      updated.getTableIdByName("Users")
    ).toBeUndefined();

    expect(
      updated.getTableIdByName("Accounts")
    ).toBeDefined();
  });

  it('rejects renaming to existing table name', () => {
    const db = new Database("DB1")
      .addTable(buildTable({ name: "Users" }))
      .addTable(buildTable({ name: "Accounts" }));

    expect(() =>
      db.renameTable(
        "Users",
        "Accounts",
      )
    ).toThrow();
  });

  it('does not break foreign key relationships', () => {
    const database = buildParentChildDatabase();

    const updated =
      database.renameTable(
        "Parent",
        "Users",
      );

    expect(() =>
      updated.requireTable("child").requireForeignKey("fk1")
    ).not.toThrow();
  });
});