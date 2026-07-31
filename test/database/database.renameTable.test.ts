import { describe, it, expect } from 'vitest';
import { buildDatabase, buildParentChildDatabase, buildTable } from '../utils/buildSchema.js';

describe('Database::renameTable', () => {

  it('renames table and makes it retrievable under new name', () => {
    const db = buildDatabase()
      .addTable(buildTable({ name: "Users" }));

    const updated = db.renameTable(
      "Users",
      "Accounts",
    );

    expect(() =>
      updated.tables.requireByName("Accounts")
    ).not.toThrow();

    expect(() =>
      updated.tables.requireByName("Users")
    ).toThrow();
  });

  it('preserves table id during rename', () => {
    const db = buildDatabase()
      .addTable(buildTable({ name: "Users" }));

    const originalId =
      db.tables.requireByName("Users").id;

    const updated =
      db.renameTable("Users", "Accounts");

    expect(
      updated.tables.requireByName("Accounts").id
    ).toBe(originalId);
  });

  it('updates table name lookup', () => {
    const db = buildDatabase()
      .addTable(buildTable({ name: "Users" }));

    const updated =
      db.renameTable("Users", "Accounts");

    expect(
      updated.tables.getIdByName("Users")
    ).toBeUndefined();

    expect(
      updated.tables.getIdByName("Accounts")
    ).toBeDefined();
  });

  it('rejects renaming to existing table name', () => {
    const db = buildDatabase()
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
      updated.tables.requireByName("child").foreignKeys.requireByName("fk1")
    ).not.toThrow();
  });
});