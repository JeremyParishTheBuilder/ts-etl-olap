import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { Table } from '../../src/schema/Table.js';
import { ForeignKey } from '../../src/schema/ForeignKey.js';
import { Index } from '../../src/schema/Index.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Database::removeColumn', () => {
  it('removes a column from the correct table', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(table);

    const updatedDb = db.removeColumn("T1", "C1");

    const updatedTable = updatedDb.requireTable("T1");

    expect(() => updatedTable.requireColumn("C1")).toThrow();
  });

  it('does not affect other tables', () => {
    const table1 = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const table2 = new Table("T2")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(table1)
      .addTable(table2);

    const updatedDb = db.removeColumn("T1", "C1");

    const updatedTable2 = updatedDb.requireTable("T2");

    expect(updatedTable2.requireColumn("C1")).toBeDefined();
  });

  it('throws when column is referenced by a foreign key', () => {
    const parent = new Table("Parent")
      .addColumn({ name: "id", type: Number })
      .addIndex(
        Index.fromSpec({
          name: "I1",
          columns: ["id"],
          unique: true,
        }),
      );

    const child = new Table("Child")
      .addColumn({ name: "parent_id", type: Number });

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .addForeignKey(
        "Child",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK1",
          columns: ["parent_id"],
          parentTable: "Parent",
          parentColumns: ["id"],
        }),
      );

    expect(() => {
      db.removeColumn("Parent", "id");
    }).toThrow();
  });

  it('allows removal when no foreign key references exist', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(table);

    const updatedDb = db.removeColumn("T1", "C1");

    const updatedTable = updatedDb.requireTable("T1");

    expect(() => updatedTable.requireColumn("C1")).toThrow();
  });

  it('does not mutate original database (immutability)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(table);

    const updatedDb = db.removeColumn("T1", "C1");

    const originalTable = db.requireTable("T1");
    const updatedTable = updatedDb.requireTable("T1");

    expect(originalTable.requireColumn("C1")).toBeDefined();
    expect(() => updatedTable.requireColumn("C1")).toThrow();
  });

  it('throws when column is referenced by a foreign key', () => {
    const table = new Table("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
      })
      .addForeignKey(
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );

    expect(() => {
      table.removeColumn("UserId");
    }).toThrow();
  });

  it('throws when parent column is referenced by a foreign key', () => {
    const users = new Table("Users")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .addIndex(
        Index.fromSpec({
          name: "PK_Users",
          columns: ["Id"],
          unique: true,
        })
      );

    const posts = new Table("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .addForeignKey(
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

    expect(() => {
      database
        .requireTable("Users")
        .removeColumn("Id");
    }).toThrow();
  });
});