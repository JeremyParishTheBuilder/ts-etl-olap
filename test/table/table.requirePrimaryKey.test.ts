import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';

describe('Table::requirePrimaryKey', () => {
  it('returns the primary key', () => {
    let table = new Table("T1")
      .createColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      })
      .createPrimaryKey({
        name: "PK_T1",
        index: "PK_T1",
      });

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