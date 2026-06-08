import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::removePrimaryKey', () => {
  function buildTable(): Table {
    return new Table("T1")
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
    const table = buildTable();

    const updated = table.removePrimaryKey();

    expect(updated.primaryKey).toBeUndefined();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable();

    const updated = table.removePrimaryKey();

    expect(
      table.requirePrimaryKey()
    ).toBeDefined();

    expect(
      updated.primaryKey
    ).toBeUndefined();
  });

  it('throws when no primary key exists', () => {
    const table = new Table("T1");

    expect(() => {
      table.removePrimaryKey();
    }).toThrow();
  });

  it('preserves independent backing index', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "PK_Index",
        columns: ["Id"],
        unique: true,
      })
      .createPrimaryKey({
        name: "PK_T1",
        index: "PK_Index",
      });

    const updated = table.removePrimaryKey();

    expect(updated.primaryKey).toBeUndefined();

    expect(
      updated.requireIndex("PK_Index")
    ).toBeDefined();
  });
});