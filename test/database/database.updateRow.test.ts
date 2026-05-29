import { describe, it, expect } from 'vitest';

import { Database } from "../../src/schema/Database.js";
import { Table } from "../../src/schema/Table.js";
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';

describe('Database::updateRow', () => {

  it('allows updating a child row to another valid parent reference', () => {
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
    roles = roles.addRow([2]);

    let users = new Table("Users")
      .addColumn({
        name: "roleId",
        type: Number,
      });

    users = users.addRow([1]);

    const db = new Database("DB1")
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", {
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    const updates = [2];

    const updated = db.updateRow(
      "Users",
      0,
      updates,
    );

    expect(
      updated
        .requireTable("Users")
        .requireRow(0)
    ).toEqual([2]);
  });

  it('rejects updating a child row to an invalid foreign key reference', () => {
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
      });

    users = users.addRow([1]);

    const db = new Database("DB1")
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", {
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    const updates = [999];

    expect(() =>
      db.updateRow(
        "Users",
        0,
        updates,
      )
    ).toThrow();
  });

  it('rejects updating a parent row that would orphan child rows', () => {
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
      });

    users = users.addRow([1]);

    const db = new Database("DB1")
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", {
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    const updates = [2];

    expect(() =>
      db.updateRow(
        "Roles",
        0,
        updates,
      )
    ).toThrow();
  });

  it('allows updating a parent row when no child rows reference it', () => {
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
      });

    const db = new Database("DB1")
      .addTable(roles)
      .addTable(users)
      .createForeignKey("users", {
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    const updates = [2];

    const updated = db.updateRow(
      "Roles",
      0,
      updates,
    );

    expect(
      updated
        .requireTable("Roles")
        .requireRow(0)
    ).toEqual([2]);
  });

  it('allows self-referencing foreign key updates that remain valid', () => {
    let employees = new Table("Employees")
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
      });

    employees = employees.addRow([1, null]);
    employees = employees.addRow([2, 1]);

    const db = new Database("DB1")
      .addTable(employees)
      .createForeignKey("employees", {
        name: "FK_Manager",
        columns: ["managerId"],
        parentTable: "Employees",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    const updates = [2, 2];

    const updated = db.updateRow(
      "Employees",
      1,
      updates,
    );

    expect(
      updated
        .requireTable("Employees")
        .requireRow(1)
    ).toEqual([2, 2]);
  });

  it('rejects self-referencing foreign key updates that become invalid', () => {
    let employees = new Table("Employees")
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
      });

    employees = employees.addRow([1, null]);

    const db = new Database("DB1")
      .addTable(employees)
      .createForeignKey("employees", {
        name: "FK_Manager",
        columns: ["managerId"],
        parentTable: "Employees",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });
      
    const updates = [2, 999];

    expect(() =>
      db.updateRow(
        "Employees",
        0,
        updates,
      )
    ).toThrow();
  });

});