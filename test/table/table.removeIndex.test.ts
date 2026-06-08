import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { addForeignKeyByName, createForeignKeyTestSpec_Table, createIndexTestSpec } from '../utils/buildSchema.js';

describe('Table::removeIndex', () => {
  it('removes an index from the table', () => {
    const table = new Table("T1")
      .createColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      });

    const updated = table.removeIndex("I1");

    expect(() => {
      updated.requireIndex("I1");
    }).toThrow();
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .createColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      });

    const updated = table.removeIndex("I1");

    expect(
      table.requireIndex("I1")
    ).toBeDefined();

    expect(() => {
      updated.requireIndex("I1");
    }).toThrow();
  });

  it('throws when removing non-existent index', () => {
    const table = new Table("T1");

    expect(() => {
      table.removeIndex("I1");
    }).toThrow();
  });

  it('rejects removing an index owned by a foreign key', () => {
    const table = new Table("Child")
      .createColumn({
        name: "c1",
        type: Number,
      })
      .createIndex(createIndexTestSpec({
        name: "i1",
      }));

    const tableWithFk = addForeignKeyByName(table,
      {
        name: "FK_Parent",
        columns: ["c1"],
        reverseIndex: "i1",
      }
    );

    expect(() =>
      tableWithFk.removeIndex("i1")
    ).toThrow();
  });

  it('allows removing non-owned indexes', () => {
    const table = new Table("Users")
      .createColumn({
        name: "Email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["Email"],
      });

    const updated =
      table.removeIndex("IDX_Email");

    expect(
      updated.getIndex("IDX_Email")
    ).toBeUndefined();
  });

  // Enable later if PK indexes gain ownership semantics
  it('rejects removing an index owned by a primary key', () => {
    const table = new Table("Users")
      .createColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex(createIndexTestSpec({
        name: "i1",
        columns: ["Id"],
        unique: true,
      }))
      .createPrimaryKey({
        name: "PK_Users",
        index: "i1",
      });

    expect(() =>
      table.removeIndex("i1")
    ).toThrow();
  });
});