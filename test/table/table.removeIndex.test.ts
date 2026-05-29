import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';

describe('Table::removeIndex', () => {
  it('removes an index from the table', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
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
      .addColumn({ name: "C1", type: Number })
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
      .addColumn({
        name: "ParentId",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Parent",
        columns: ["ParentId"],
        parentTable: "Parent",
        parentColumns: ["Id"],
        parentColumnIndexes: [0],
        parentIndex: "pk_roles",
      });

    const fk =
      table.requireForeignKey("FK_Parent");

    expect(() =>
      table.removeIndex(fk.reverseIndex)
    ).toThrow();
  });

  it('allows removing non-owned indexes', () => {
    const table = new Table("Users")
      .addColumn({
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
  it.skip('rejects removing an index owned by a primary key', () => {
    const table = new Table("Users")
      .addColumn({
        name: "Id",
        type: Number,
      })
      .createPrimaryKey({
        name: "PK_Users",
        columns: ["Id"],
      });

    const pk =
      table.requirePrimaryKey();

    expect(() =>
      table.removeIndex(pk.index)
    ).toThrow();
  });
});