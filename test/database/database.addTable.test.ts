import { describe, it, expect } from 'vitest';
import { buildDatabase, buildTable } from '../utils/buildSchema.js';

describe('Database::addTable', () => {
  it('adds a table to the database', () => {
    const database = buildDatabase();

    const updated = database.addTable(
      buildTable({name: "T1"})
    );

    expect(updated.tables.requireByName("T1")).toBeDefined();
  });

  it('does not mutate original database (immutability)', () => {
    const database = buildDatabase();

    const updated = database.addTable(
      buildTable({name: "T1"})
    );

    expect(() => database.tables.requireByName("T1")).toThrow();
    expect(updated.tables.requireByName("T1")).toBeDefined();
  });

  it('preserves original table casing', () => {
    const database = buildDatabase()
      .createTable({name: "Users"});

    expect(
      database.tables.requireByName("users").name
    ).toBe("Users");
  });
});