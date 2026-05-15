import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Index } from '../../src/schema/Index.js';
import { PrimaryKey } from '../../src/schema/PrimaryKey.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Table::renamePrimaryKey', () => {
  function buildTable(): Table {
    return new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .addIndex(
        Index.fromSpec({
          name: "PK_T1",
          columns: ["Id"],
          unique: true,
        })
      )
      .addPrimaryKey(
        PrimaryKey.fromSpec({
          kind: CONSTRAINT_KIND.primaryKey,
          name: "PK_T1",
          columns: ["Id"],
          index: "PK_T1",
        })
      );
  }

  it('renames the primary key', () => {
    const table = buildTable();

    const updated = table.renamePrimaryKey("PK_T1_RENAMED");

    expect(
      updated.requirePrimaryKey().name
    ).toBe("PK_T1_RENAMED");
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable();

    const updated = table.renamePrimaryKey("PK_T1_RENAMED");

    expect(
      table.requirePrimaryKey().name
    ).toBe("PK_T1");

    expect(
      updated.requirePrimaryKey().name
    ).toBe("PK_T1_RENAMED");
  });

  it('preserves backing index reference', () => {
    const table = buildTable();

    const updated = table.renamePrimaryKey("PK_T1_RENAMED");

    expect(
      updated.requirePrimaryKey().index
    ).toBe("pk_t1");
  });

  it('throws when primary key does not exist', () => {
    const table = new Table("T1");

    expect(() => {
      table.renamePrimaryKey("PK_T1_RENAMED");
    }).toThrow();
  });

  it('throws when another constraint already uses the new name', () => {
    const table = buildTable()
      .addColumn({
        name: "OtherId",
        type: Number,
        nullable: false,
      })
      .addIndex(
        Index.fromSpec({
          name: "UQ_1",
          columns: ["OtherId"],
          unique: true,
        })
      );

    expect(() => {
      table.renamePrimaryKey("UQ_1");
    }).toThrow();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTable();

    const updated = table.renamePrimaryKey("RenamedPK");

    expect(
      updated.requirePrimaryKey().name
    ).toBe("RenamedPK");
  });

  it('returns same table when renaming to same name', () => {
    const table = buildTable();

    const updated = table.renamePrimaryKey("PK_T1");

    expect(updated).toBe(table);
  });

  it('preserves backing index reference after rename', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .addIndex(
        Index.fromSpec({
          name: "PK_Index",
          columns: ["Id"],
          unique: true,
        })
      )
      .addPrimaryKey(
        PrimaryKey.fromSpec({
          kind: CONSTRAINT_KIND.primaryKey,
          name: "PK_T1",
          columns: ["Id"],
          index: "PK_Index",
        })
      );

    const updated = table.renamePrimaryKey("RenamedPK");

    expect(
      updated.requirePrimaryKey().name
    ).toBe("RenamedPK");

    expect(
      updated.requirePrimaryKey().index
    ).toBe("pk_index");

    expect(
      updated.requireIndex("PK_Index")
    ).toBeDefined();
  });
});