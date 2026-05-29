import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';

describe('Table::renameIndex', () => {
  it('renames an index', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      });

    const updated = table.renameIndex("I1", "I2");

    expect(() => {
      updated.requireIndex("I1");
    }).toThrow();

    expect(
      updated.requireIndex("I2")
    ).toBeDefined();
  });

  it('preserves index properties during rename', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: true,
      });

    const updated = table.renameIndex("I1", "I2");

    const index = updated.requireIndex("I2");

    expect(index.unique).toBe(true);
    expect(index.columns).toEqual(["c1"]);
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      });

    const updated = table.renameIndex("I1", "I2");

    expect(
      table.requireIndex("I1")
    ).toBeDefined();

    expect(() => {
      table.requireIndex("I2");
    }).toThrow();

    expect(
      updated.requireIndex("I2")
    ).toBeDefined();
  });

  it('throws when renaming non-existent index', () => {
    const table = new Table("T1");

    expect(() => {
      table.renameIndex("I1", "I2");
    }).toThrow();
  });

  it('throws when target index name already exists', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      })
      .createIndex({
        name: "I2",
        columns: ["C1"],
        unique: false,
      });

    expect(() => {
      table.renameIndex("I1", "I2");
    }).toThrow();
  });

  it('renames regardless of casing', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .createIndex({
        name: "UserLookup",
        columns: ["C1"],
        unique: false,
      });

    const updated = table.renameIndex(
      "userlookup",
      "I2"
    );

    expect(
      updated.requireIndex("I2")
    ).toBeDefined();
  });

  it('updates primary key index reference when renaming backing index', () => {
    const table = new Table("T1")
      .addColumn({ name: "Id", type: Number, nullable: false, defaultValue: 0 })
      .createIndex({
        name: "PK_Index",
        columns: ["Id"],
        unique: true,
      })
      .createPrimaryKey({
        name: "PK_T1",
        columns: ["Id"],
        index: "PK_Index",
      });

    const updated = table.renameIndex(
      "PK_Index",
      "PK_Index_Renamed"
    );

    expect(
      updated.requirePrimaryKey().index
    ).toBe("pk_index_renamed");
  });

  it('rejects renaming an index owned by a foreign key', () => {
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
      table.renameIndex(
        fk.reverseIndex,
        "IDX_New"
      )
    ).toThrow();
  });

  it('allows renaming non-owned indexes', () => {
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
      table.renameIndex(
        "IDX_Email",
        "IDX_Email_New",
      );

    expect(
      updated.getIndex("IDX_Email")
    ).toBeUndefined();

    expect(
      updated.requireIndex("IDX_Email_New")
    ).toBeDefined();
  });
});