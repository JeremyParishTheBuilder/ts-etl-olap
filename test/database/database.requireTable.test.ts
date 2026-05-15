import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';

describe('Database::requireTable', () => {
  it('returns an existing table', () => {
    const database = new Database("DB1")
      .createTable("T1");

    const table = database.requireTable("T1");

    expect(table).toBeDefined();
    expect(table.name).toBe("T1");
  });

  it('throws when table does not exist', () => {
    const database = new Database("DB1");

    expect(() => {
      database.requireTable("T1");
    }).toThrow();
  });

  it('retrieves a table regardless of casing', () => {
    const database = new Database("DB1")
      .createTable("Users");

    expect(
      database.requireTable("users")
    ).toBeDefined();

    expect(
      database.requireTable("USERS")
    ).toBeDefined();

    expect(
      database.requireTable("UsErS")
    ).toBeDefined();
  });
});