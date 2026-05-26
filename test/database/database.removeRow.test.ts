import { describe, it, expect } from 'vitest';

import { Database } from "../../src/schema/Database.js";
import { Table } from "../../src/schema/Table.js";
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';

describe('Database::removeRow', () => {

  it('removes an unreferenced row', () => {
    let users = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    users = users.addRow([1]);

    let db = new Database("DB1")
      .addTable(users);

    const updated = db.removeRow(
      "Users",
      0,
    );

    expect(
      updated
        .requireTable("Users")
        .getRow(0)
    ).toBeUndefined();
  });

  it('rejects deleting a parent row referenced by a child row', () => {
    let roles = new Table("Roles")
      .addColumn({
        name: "id",
        type: Number,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    roles = roles.addRow([1]);

    let users = new Table("Users")
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

    users = users.addRow([1]);

    const db = new Database("DB1")
      .addTable(roles)
      .addTable(users);

    expect(() =>
      db.removeRow(
        "Roles",
        0,
      )
    ).toThrow();
  });

  it('allows deleting a parent row once referencing child rows are deleted', () => {
    let roles = new Table("Roles")
      .addColumn({
        name: "id",
        type: Number,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    roles = roles.addRow([1]);

    let users = new Table("Users")
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

    users = users.addRow([1]);

    let db = new Database("DB1")
      .addTable(roles)
      .addTable(users);

    db = db.removeRow(
      "Users",
      0,
    );

    const updated = db.removeRow(
      "Roles",
      0,
    );

    expect(
      updated
        .requireTable("Roles")
        .getRow(0)
    ).toBeUndefined();
  });

  it('ignores deleted child rows during FK delete checks', () => {
    let roles = new Table("Roles")
      .addColumn({
        name: "id",
        type: Number,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    roles = roles.addRow([1]);

    let users = new Table("Users")
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

    users = users.addRow([1]);

    users = users.removeRow(0);

    const db = new Database("DB1")
      .addTable(roles)
      .addTable(users);

    expect(() =>
      db.removeRow(
        "Roles",
        0,
      )
    ).not.toThrow();
  });

  it('rejects deleting invalid row numbers', () => {
    const users = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    const db = new Database("DB1")
      .addTable(users);

    expect(() =>
      db.removeRow(
        "Users",
        999,
      )
    ).toThrow();
  });

  it('rejects deleting already deleted rows', () => {
    let users = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    users = users.addRow([1]);

    let db = new Database("DB1")
      .addTable(users);

    db = db.removeRow(
      "Users",
      0,
    );

    expect(() =>
      db.removeRow(
        "Users",
        0,
      )
    ).toThrow();
  });

  it('preserves immutable database state during deletion', () => {
    let users = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    users = users.addRow([1]);

    const db = new Database("DB1")
      .addTable(users);

    const updated = db.removeRow(
      "Users",
      0,
    );

    expect(
      db
        .requireTable("Users")
        .requireRow(0)
    ).toEqual([1]);

    expect(
      updated
        .requireTable("Users")
        .getRow(0)
    ).toBeUndefined();

    expect(updated).not.toBe(db);
    expect(
      updated.requireTable("Users")
    ).not.toBe(
      db.requireTable("Users")
    );
  });

  it('preserves unrelated tables during deletion', () => {
    let users = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    users = users.addRow([1]);

    let roles = new Table("Roles")
      .addColumn({
        name: "id",
        type: Number,
      });

    roles = roles.addRow([10]);

    const db = new Database("DB1")
      .addTable(users)
      .addTable(roles);

    const updated = db.removeRow(
      "Users",
      0,
    );

    expect(
      updated
        .requireTable("Roles")
        .requireRow(0)
    ).toEqual([10]);
  });

});