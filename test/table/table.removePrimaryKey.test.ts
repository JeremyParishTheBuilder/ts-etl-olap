import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Index } from '../../src/schema/Index.js';
import { PrimaryKey } from '../../src/schema/PrimaryKey.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Table::removePrimaryKey', () => {
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

  it('removes owned backing index when PK name matches index name', () => {
    const table = new Table("T1")
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

    const updated = table.removePrimaryKey();

    expect(updated.primaryKey).toBeUndefined();

    expect(() => {
      updated.requireIndex("PK_T1");
    }).toThrow();
  });

  it('preserves independent backing index when names differ', () => {
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

    const updated = table.removePrimaryKey();

    expect(updated.primaryKey).toBeUndefined();

    expect(
      updated.requireIndex("PK_Index")
    ).toBeDefined();
  });
});