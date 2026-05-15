import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Index } from '../../src/schema/Index.js';
import { PrimaryKey } from '../../src/schema/PrimaryKey.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Table::requirePrimaryKey', () => {
  it('returns the primary key', () => {
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

    expect(
      table.requirePrimaryKey()
    ).toBeDefined();
  });

  it('throws when no primary key exists', () => {
    const table = new Table("T1");

    expect(() => {
      table.requirePrimaryKey();
    }).toThrow();
  });
});