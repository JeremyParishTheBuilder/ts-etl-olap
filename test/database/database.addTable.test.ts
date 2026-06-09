import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { buildTable } from '../utils/buildSchema.js';

describe('Database::addTable', () => {
  it('adds a table to the database', () => {
    const database = new Database("DB1");

    const updated = database.addTable(
      buildTable({name: "T1"})
    );

    expect(updated.requireTable("T1")).toBeDefined();
  });

  it('does not mutate original database (immutability)', () => {
    const database = new Database("DB1");

    const updated = database.addTable(
      buildTable({name: "T1"})
    );

    expect(() => database.requireTable("T1")).toThrow();
    expect(updated.requireTable("T1")).toBeDefined();
  });

  it('preserves original table casing', () => {
    const database = new Database("DB1")
      .createTable({name: "Users"});

    expect(
      database.requireTable("users").name
    ).toBe("Users");
  });
});