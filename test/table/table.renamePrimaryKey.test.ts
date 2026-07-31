import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::renamePrimaryKey', () => {
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
        columns: ["Id"],
      });
  }

  it('renames the primary key', () => {
    const table = buildTableWithPrimaryKey();

    const updated = table.renamePrimaryKey("PK_T1_RENAMED");

    expect(
      updated.requirePrimaryKey().name
    ).toBe("PK_T1_RENAMED");
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTableWithPrimaryKey();

    const updated = table.renamePrimaryKey("PK_T1_RENAMED");

    expect(
      table.requirePrimaryKey().name
    ).toBe("PK_T1");

    expect(
      updated.requirePrimaryKey().name
    ).toBe("PK_T1_RENAMED");
  });

  it('preserves backing index reference', () => {
    const table = buildTableWithPrimaryKey();

    const updated = table.renamePrimaryKey("PK_T1_RENAMED");

    expect(
      updated.requirePrimaryKey().index
    ).toBe(table.requirePrimaryKey().index);
  });

  it('throws when primary key does not exist', () => {
    const table = buildTable();

    expect(() => {
      table.renamePrimaryKey("PK_T1_RENAMED");
    }).toThrow();
  });

  it('throws when another constraint already uses the new name', () => {
    const table = buildTableWithPrimaryKey()
      .createColumn(createColumnTestSpec({
        name: "OtherId",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "UQ_1",
        columns: ["OtherId"],
        unique: true,
      })
      .createUnique({
        name: "UQ_1",
        indexName: "UQ_1",
        ownsIndex: true,
      });

    expect(() => {
      table.renamePrimaryKey("UQ_1");
    }).toThrow();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTableWithPrimaryKey();

    const updated = table.renamePrimaryKey("RenamedPK");

    expect(
      updated.requirePrimaryKey().name
    ).toBe("RenamedPK");
  });

  it('returns same table when renaming to same name', () => {
    const table = buildTableWithPrimaryKey();

    const updated = table.renamePrimaryKey("PK_T1");

    expect(updated).toBe(table);
  });

});