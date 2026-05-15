import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { Table } from '../../src/schema/Table.js';
import { ForeignKey } from '../../src/schema/ForeignKey.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Database::renameColumn', () => {
  it('renames column in the correct table', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(table);

    const updatedDb = db.renameColumn("T1", "C1", "C1_new");

    const updatedTable = updatedDb.requireTable("T1");

    expect(updatedTable.requireColumn("C1_new")).toBeDefined();
    expect(() => updatedTable.requireColumn("C1")).toThrow();
  });

  it('does not affect other tables', () => {
    const t1 = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const t2 = new Table("T2")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(t1)
      .addTable(t2);

    const updatedDb = db.renameColumn("T1", "C1", "C1_new");

    const updatedT2 = updatedDb.requireTable("T2");

    expect(updatedT2.requireColumn("C1")).toBeDefined();
    expect(() => updatedT2.requireColumn("C1_new")).toThrow();
  });

  it('updates parent columns in foreign keys', () => {
    const parent = new Table("Parent")
      .addColumn({ name: "id", type: Number });

    const child = new Table("Child")
      .addColumn({ name: "parent_id", type: Number })
      .addForeignKey(
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "fk_parent",
          columns: ["parent_id"],
          parentTable: "Parent",
          parentColumns: ["id"],
        }),
      );

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child);

    const updatedDb = db.renameColumn("Parent", "id", "id_new");

    const updatedChildTable = updatedDb.requireTable("Child");
    const fk = updatedChildTable.requireForeignKey("fk_parent");

    expect(fk.parentColumns).toEqual(["id_new"]);
  });

  it('does not mutate original database (immutability)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(table);

    const updatedDb = db.renameColumn("T1", "C1", "C1_new");

    const original = db.requireTable("T1");
    const modified = updatedDb.requireTable("T1");

    expect(original.requireColumn("C1")).toBeDefined();
    expect(() => original.requireColumn("C1_new")).toThrow();

    expect(modified.requireColumn("C1_new")).toBeDefined();
  });
});