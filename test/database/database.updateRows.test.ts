import { describe, it, expect } from 'vitest';
import { ReferentialAction } from '../../src/relational/ReferentialAction.js';
import { buildDatabase, buildTable, createColumnTestSpec, createForeignKeyTestSpec_Database, createUpdate } from '../utils/buildSchema.js';

describe('Database::updateRow', () => {

  it('allows updating a child row to another valid parent reference', () => {
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
    roles = roles.addRow([2]);

    let users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "roleId",
        type: Number,
      }))
      .createIndex({
        name: "FKRI_Users",
        columns: ["roleId"],
        unique: false,
      });;

    users = users.addRow([1]);

    const db = buildDatabase()
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", createForeignKeyTestSpec_Database({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        reverseIndex: "FKRI_Users",
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: "restrict",
        onUpdate: "restrict",
      }));

    const updates = [2];

    const updated = db.updateRows(
      "Users",
      [createUpdate(users, 0, updates)]
    );

    expect(
      updated
        .tables.requireByName("Users")
        .requireRow(0)
    ).toEqual([2]);
  });

  it('rejects updating a child row to an invalid foreign key reference', () => {
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
        name: "FKRI_Users",
        columns: ["roleId"],
        unique: false,
      });;

    users = users.addRow([1]);

    const db = buildDatabase()
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", createForeignKeyTestSpec_Database({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        reverseIndex: "FKRI_Users",
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: "restrict",
        onUpdate: "restrict",
      }));

    const updates = [999];

    expect(() =>
      db.updateRows(
        "Users",
        [createUpdate(users, 0, updates)]
      )
    ).toThrow();
  });

  it('rejects updating a parent row that would orphan child rows', () => {
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
        name: "FKRI_Users",
        columns: ["roleId"],
        unique: false,
      });;

    users = users.addRow([1]);

    const db = buildDatabase()
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", createForeignKeyTestSpec_Database({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        reverseIndex: "FKRI_Users",
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: "restrict",
        onUpdate: "restrict",
      }));

    const updates = [2];

    expect(() =>
      db.updateRows(
        "Roles",
        [createUpdate(roles, 0, updates)]
      )
    ).toThrow();
  });

  it('allows updating a parent row when no child rows reference it', () => {
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
        name: "FKRI_Users",
        columns: ["roleId"],
        unique: false,
      });

    const db = buildDatabase()
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", createForeignKeyTestSpec_Database({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        reverseIndex: "FKRI_Users",
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: "restrict",
        onUpdate: "restrict",
      }));

    const updates = [2];

    const updated = db.updateRows(
      "Roles",
      [createUpdate(roles, 0, updates)]
    );

    expect(
      updated
        .tables.requireByName("Roles")
        .requireRow(0)
    ).toEqual([2]);
  });

  it('allows self-referencing foreign key updates that remain valid', () => {
    let employees = buildTable({name: "Employees"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "managerId",
        type: Number,
      }))
      .createIndex({
        name: "PK_Employees",
        columns: ["id"],
        unique: true,
      })
      .createIndex({
        name: "FKRI_Employees",
        columns: ["managerId"],
        unique: false,
      });;

    employees = employees.addRow([1, null]);
    employees = employees.addRow([2, 1]);

    const db = buildDatabase()
      .addTable(employees)
      .createForeignKey("employees", createForeignKeyTestSpec_Database({
        name: "FK_Manager",
        columns: ["managerId"],
        reverseIndex: "FKRI_Employees",
        parentTable: "Employees",
        parentColumns: ["id"],
        onDelete: "restrict",
        onUpdate: "restrict",
      }));

    const updates = [2, 2];

    const updated = db.updateRows(
      "Employees",
      [createUpdate(employees, 1, updates)]
    );

    expect(
      updated
        .tables.requireByName("Employees")
        .requireRow(1)
    ).toEqual([2, 2]);
  });

  it('rejects self-referencing foreign key updates that become invalid', () => {
    let employees = buildTable({name: "Employees"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "managerId",
        type: Number,
      }))
      .createIndex({
        name: "PK_Employees",
        columns: ["id"],
        unique: true,
      })
      .createIndex({
        name: "FKR_Employees",
        columns: ["managerId"],
        unique: false,
      });

    employees = employees.addRow([1, null]);

    const db = buildDatabase()
      .addTable(employees)
      .createForeignKey("employees", createForeignKeyTestSpec_Database({
        name: "FK_Manager",
        columns: ["managerId"],
        parentTable: "Employees",
        parentColumns: ["id"],
        reverseIndex: "FKR_Employees",
        onDelete: "restrict",
        onUpdate: "restrict",
      }));
      
    const updates = [2, 999];

    expect(() =>
      db.updateRows(
        "Employees",
        [createUpdate(employees, 0, updates)]
      )
    ).toThrow();
  });

  it("updates multiple rows in a single operation", () => {
    let users = buildTable({ name: "Users" })
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createIndex({
        name: "PK_Users",
        columns: ["id"],
        unique: true,
      });

    users = users.addRow([1]);
    users = users.addRow([2]);
    users = users.addRow([3]);

    const db = buildDatabase()
      .addTable(users);

    const updated = db.updateRows(
      "Users",
      [
        createUpdate(users, 0, [10]),
        createUpdate(users, 2, [30]),
      ],
    );

    const updatedUsers =
      updated.tables.requireByName("Users");

    expect(updatedUsers.requireRow(0)).toEqual([10]);
    expect(updatedUsers.requireRow(1)).toEqual([2]);
    expect(updatedUsers.requireRow(2)).toEqual([30]);
  });

  it("cascades multiple parent updates in a single operation", () => {
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
          onDelete: "restrict",
          onUpdate: "cascade",
        }),
      );

    const updated = db.updateRows(
      "Roles",
      [
        createUpdate(roles, 0, [10]),
        createUpdate(roles, 1, [20]),
      ],
    );

    const updatedRoles =
      updated.tables.requireByName("Roles");

    const updatedUsers =
      updated.tables.requireByName("Users");

    expect(updatedRoles.requireRow(0))
      .toEqual([10]);

    expect(updatedRoles.requireRow(1))
      .toEqual([20]);

    expect(updatedUsers.requireRow(0))
      .toEqual([10]);

    expect(updatedUsers.requireRow(1))
      .toEqual([20]);
  });
});