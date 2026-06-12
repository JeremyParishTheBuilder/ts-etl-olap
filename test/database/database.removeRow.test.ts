import { describe, it, expect } from 'vitest';

import { Database } from "../../src/schema/Database.js";
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';
import { buildTable, createColumnTestSpec, createForeignKeyTestSpec_Database } from '../utils/buildSchema.js';

describe('Database::removeRow', () => {

  it('removes an unreferenced row', () => {
    let users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    users = users.addRow([1]);

    let db = new Database("DB1")
      .addTable(users);

    const updated = db.removeRow(
      "Users",
      0,
    );

    expect(
      updated
        .tables.requireByName("Users")
        .getRow(0)
    ).toBeUndefined();
  });

  it('rejects deleting a parent row referenced by a child row', () => {
    let roles = buildTable({name: "Roles"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    roles = roles.addRow([1]);

    let users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "roleId",
        type: Number,
      }))
      .createIndex({
        name: "FKRI_Roles",
        columns: ["roleId"],
        unique: false,
      });

    users = users.addRow([1]);

    const db = new Database("DB1")
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", createForeignKeyTestSpec_Database({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        reverseIndex: "FKRI_Roles",
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      }));

    expect(() =>
      db.removeRow(
        "Roles",
        0,
      )
    ).toThrow();
  });

  it('allows deleting a parent row once referencing child rows are deleted', () => {
    let roles = buildTable({name: "Roles"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    roles = roles.addRow([1]);

    let users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "roleId",
        type: Number,
      }))
      .createIndex({
        name: "FKRI_Roles",
        columns: ["roleId"],
        unique: false,
      });

    users = users.addRow([1]);

    let db = new Database("DB1")
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", createForeignKeyTestSpec_Database({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        reverseIndex: "FKRI_Roles",
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      }));

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
        .tables.requireByName("Roles")
        .getRow(0)
    ).toBeUndefined();
  });

  it('ignores deleted child rows during FK delete checks', () => {
    let roles = buildTable({name: "Roles"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    roles = roles.addRow([1]);

    let users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "roleId",
        type: Number,
      }))
      .createIndex({
        name: "FKRI_Roles",
        columns: ["roleId"],
        unique: false,
      });

    users = users.addRow([1]);

    users = users.removeRow(0);

    const db = new Database("DB1")
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", createForeignKeyTestSpec_Database({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        reverseIndex: "FKRI_Roles",
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      }));

    expect(() =>
      db.removeRow(
        "Roles",
        0,
      )
    ).not.toThrow();
  });

  it('rejects deleting invalid row numbers', () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

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
    let users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

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
    let users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    users = users.addRow([1]);

    const db = new Database("DB1")
      .addTable(users);

    const updated = db.removeRow(
      "Users",
      0,
    );

    expect(
      db
        .tables.requireByName("Users")
        .requireRow(0)
    ).toEqual([1]);

    expect(
      updated
        .tables.requireByName("Users")
        .getRow(0)
    ).toBeUndefined();

    expect(updated).not.toBe(db);
    expect(
      updated.tables.requireByName("Users")
    ).not.toBe(
      db.tables.requireByName("Users")
    );
  });

  it('preserves unrelated tables during deletion', () => {
    let users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    users = users.addRow([1]);

    let roles = buildTable({name: "Roles"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

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
        .tables.requireByName("Roles")
        .requireRow(0)
    ).toEqual([10]);
  });

});