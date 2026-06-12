import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';

describe('Database::requireTable', () => {
  it('returns an existing table', () => {
    const database = new Database("DB1")
      .createTable({name: "T1"});

    const table = database.tables.requireByName("T1");

    expect(table).toBeDefined();
    expect(table.name).toBe("T1");
  });

  it('throws when table does not exist', () => {
    const database = new Database("DB1");

    expect(() => {
      database.tables.requireByName("T1");
    }).toThrow();
  });

  it('retrieves a table regardless of casing', () => {
    const database = new Database("DB1")
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