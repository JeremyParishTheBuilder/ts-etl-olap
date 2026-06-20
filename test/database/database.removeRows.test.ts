import { describe, it, expect } from 'vitest';
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';
import {
  buildDatabase,
  buildTable,
  createColumnTestSpec,
  createDelete,
  createForeignKeyTestSpec_Database
} from '../utils/buildSchema.js';

describe('Database::removeRow', () => {

  it('removes an unreferenced row', () => {
    let users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    users = users.addRow([1]);

    let db = buildDatabase()
      .addTable(users);

    const updated = db.removeRows(
      "Users",
      [createDelete(users, 0)]
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

    const db = buildDatabase()
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
      db.removeRows(
        "Roles",
        [createDelete(roles, 0)]
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

    let db = buildDatabase()
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

    db = db.removeRows(
      "Users",
      [createDelete(users, 0)]
    );

    const updated = db.removeRows(
      "Roles",
      [createDelete(roles, 0)]
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

    users = users.removeRows(
      [createDelete(users, 0)]
    );

    const db = buildDatabase()
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
      db.removeRows(
        "Roles",
        [createDelete(roles, 0)]
      )
    ).not.toThrow();
  });

  it('rejects deleting invalid row numbers', () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

    const db = buildDatabase()
      .addTable(users);

    expect(() =>
      db.removeRows(
        "Users",
        [createDelete(users, 999)]
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

    let db = buildDatabase()
      .addTable(users);

    db = db.removeRows(
      "Users",
      [createDelete(users, 0)]
    );

    const updatedUsers = db.tables.require(users.id);

    expect(() =>
      db.removeRows(
        "Users",
        [createDelete(updatedUsers, 0)]
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

    const db = buildDatabase()
      .addTable(users);

    const updated = db.removeRows(
      "Users",
      [createDelete(users, 0)]
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

    const db = buildDatabase()
      .addTable(users)
      .addTable(roles);

    const updated = db.removeRows(
      "Users",
      [createDelete(users, 0)]
    );

    expect(
      updated
        .tables.requireByName("Roles")
        .requireRow(0)
    ).toEqual([10]);
  });

  it("removes multiple rows", () => {
    let users = buildTable({ name: "Users" })
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "name",
        type: String,
      }));

    users = users.addRow([1, "Alice"]);
    users = users.addRow([2, "Bob"]);
    users = users.addRow([3, "Charlie"]);

    const db = buildDatabase()
      .addTable(users);

    const updated = db.removeRows(
      "Users",
      [
        createDelete(users, 0),
        createDelete(users, 2),
      ],
    );

    const updatedUsers =
      updated.tables.requireByName("Users");

    expect([...updatedUsers.iterateAliveRows()])
      .toHaveLength(1);

    expect(updatedUsers.requireRow(1))
      .toEqual([2, "Bob"]);
  });

  it("cascades multiple parent deletes in a single operation", () => {
    let roles = buildTable({ name: "Roles" })
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
    roles = roles.addRow([2]);

    let users = buildTable({ name: "Users" })
      .createColumn(createColumnTestSpec({
        name: "roleId",
        type: Number,
      }))
      .createIndex({
        name: "FKRI_Users",
        columns: ["roleId"],
        unique: false,
      });

    users = users.addRow([1]);
    users = users.addRow([2]);

    const db = buildDatabase()
      .addTable(roles)
      .addTable(users)
      .createForeignKey(
        "Users",
        createForeignKeyTestSpec_Database({
          name: "FK_Users_Roles",
          columns: ["roleId"],
          reverseIndex: "FKRI_Users",
          parentTable: "Roles",
          parentColumns: ["id"],
          onDelete: ReferentialAction.cascade,
          onUpdate: ReferentialAction.restrict,
        }),
      );

    const updated = db.removeRows(
      "Roles",
      [
        createDelete(roles, 0),
        createDelete(roles, 1),
      ],
    );

    const updatedRoles =
      updated.tables.requireByName("Roles");

    const updatedUsers =
      updated.tables.requireByName("Users");

    expect([...updatedRoles.iterateAliveRows()])
      .toHaveLength(0);

    expect([...updatedUsers.iterateAliveRows()])
      .toHaveLength(0);
  });
});