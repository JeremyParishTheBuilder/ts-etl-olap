import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::removePrimaryKey', () => {
  function buildTableWithPrimaryKey() {
    return buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      })
      .createPrimaryKey({
        name: "PK_T1",
        index: "PK_T1",
      });
  }

  it('removes the primary key', () => {
    const table = buildTableWithPrimaryKey();

    const updated = table.removePrimaryKey();

    expect(updated.primaryKey).toBeUndefined();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTableWithPrimaryKey();

    const updated = table.removePrimaryKey();

    expect(
      table.requirePrimaryKey()
    ).toBeDefined();

    expect(
      updated.primaryKey
    ).toBeUndefined();
  });

  it('throws when no primary key exists', () => {
    const table = buildTable();

    expect(() => {
      table.removePrimaryKey();
    }).toThrow();
  });

  it('preserves independent backing index', () => {
    const table = buildTableWithPrimaryKey()

    const updated = table.removePrimaryKey();

    expect(updated.primaryKey).toBeUndefined();

    expect(
      updated.requireIndex("PK_T1")
    ).toBeDefined();
  });
});