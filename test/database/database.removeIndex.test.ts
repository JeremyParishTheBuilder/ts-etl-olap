import { describe, it, expect } from 'vitest';

import { Database } from "../../src/schema/Database.js";
import { Table } from "../../src/schema/Table.js";
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';

describe('Database::removeIndex', () => {

  it('removes an index from a table', () => {
    const table = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["email"],
      });

    const db = new Database("DB1")
      .addTable(table);

    const updated = db.removeIndex(
      "Users",
      "IDX_Email",
    );

    expect(
      updated
        .requireTable("Users")
        .getIndex("IDX_Email")
    ).toBeUndefined();
  });

  it('does not mutate original database state', () => {
    const table = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["email"],
      });

    const db = new Database("DB1")
      .addTable(table);

    const updated = db.removeIndex(
      "Users",
      "IDX_Email",
    );

    expect(
      db
        .requireTable("Users")
        .requireIndex("IDX_Email")
    ).toBeDefined();

    expect(
      updated
        .requireTable("Users")
        .getIndex("IDX_Email")
    ).toBeUndefined();

    expect(updated).not.toBe(db);

    expect(
      updated.requireTable("Users")
    ).not.toBe(
      db.requireTable("Users")
    );
  });

  it('preserves unrelated tables during index removal', () => {
    const users = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["email"],
      });

    const roles = new Table("Roles")
      .addColumn({
        name: "id",
        type: Number,
      });

    const db = new Database("DB1")
      .addTable(users)
      .addTable(roles);

    const updated = db.removeIndex(
      "Users",
      "IDX_Email",
    );

    expect(
      updated
        .requireTable("Roles")
    ).toBe(
      db.requireTable("Roles")
    );
  });

  it('throws when removing a non-existent index', () => {
    const table = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      });

    const db = new Database("DB1")
      .addTable(table);

    expect(() =>
      db.removeIndex(
        "Users",
        "IDX_Missing",
      )
    ).toThrow();
  });

  it('rejects removing an index referenced by a foreign key', () => {
    const parent = new Table("Roles")
      .addColumn({
        name: "id",
        type: Number,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    const child = new Table("Users")
      .addColumn({
        name: "roleId",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        parentIndex: "pk_roles",
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child);

    expect(() =>
      db.removeIndex(
        "Roles",
        "PK_Roles",
      )
    ).toThrow();
  });

  it('allows removing an index not referenced by a foreign key', () => {
    const parent = new Table("Roles")
      .addColumn({
        name: "id",
        type: Number,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      })
      .createIndex({
        name: "IDX_Extra",
        columns: ["id"],
      });

    const child = new Table("Users")
      .addColumn({
        name: "roleId",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        parentIndex: "pk_roles",
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child);

    const updated = db.removeIndex(
      "Roles",
      "IDX_Extra",
    );

    expect(
      updated
        .requireTable("Roles")
        .getIndex("IDX_Extra")
    ).toBeUndefined();

    expect(
      updated
        .requireTable("Roles")
        .requireIndex("PK_Roles")
    ).toBeDefined();
  });

  it('rejects removing indexes required by self-referencing foreign keys', () => {
    const employees = new Table("Employees")
      .addColumn({
        name: "id",
        type: Number,
      })
      .addColumn({
        name: "managerId",
        type: Number,
      })
      .createIndex({
        name: "PK_Employees",
        columns: ["id"],
        unique: true,
      })
      .createForeignKey({
        name: "FK_Manager",
        columns: ["managerId"],
        parentTable: "Employees",
        parentColumns: ["id"],
        parentIndex: "pk_employees",
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    const db = new Database("DB1")
      .addTable(employees);

    expect(() =>
      db.removeIndex(
        "Employees",
        "PK_Employees",
      )
    ).toThrow();
  });

  it('preserves existing rows after index removal', () => {
    let table = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["email"],
      });

    table = table.addRow(["a@test.com"]);

    const db = new Database("DB1")
      .addTable(table);

    const updated = db.removeIndex(
      "Users",
      "IDX_Email",
    );

    expect(
      updated
        .requireTable("Users")
        .requireRow(0)
    ).toEqual(["a@test.com"]);
  });

  it('preserves remaining indexes after index removal', () => {
    const table = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["email"],
      })
      .createIndex({
        name: "IDX_Email_2",
        columns: ["email"],
      });

    const db = new Database("DB1")
      .addTable(table);

    const updated = db.removeIndex(
      "Users",
      "IDX_Email",
    );

    expect(
      updated
        .requireTable("Users")
        .getIndex("IDX_Email")
    ).toBeUndefined();

    expect(
      updated
        .requireTable("Users")
        .requireIndex("IDX_Email_2")
    ).toBeDefined();
  });

});