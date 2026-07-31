import { describe, it, expect } from 'vitest';
import { buildDatabase } from '../utils/buildSchema.js';

describe('Database::requireTable', () => {
  it('returns an existing table', () => {
    const database = buildDatabase()
      .createTable({name: "T1"});

    const table = database.tables.requireByName("T1");

    expect(table).toBeDefined();
    expect(table.name).toBe("T1");
  });

  it('throws when table does not exist', () => {
    const database = buildDatabase();

    expect(() => {
      database.tables.requireByName("T1");
    }).toThrow();
  });

  it('retrieves a table regardless of casing', () => {
    const database = buildDatabase()
      .createTable({name: "Users"});

    expect(
      database.tables.requireByName("users")
    ).toBeDefined();

    expect(
      database.tables.requireByName("USERS")
    ).toBeDefined();

    expect(
      database.tables.requireByName("UsErS")
    ).toBeDefined();
  });
});