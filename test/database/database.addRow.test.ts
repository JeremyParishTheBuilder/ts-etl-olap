import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { CONSTRAINT_KIND } from '../../src/schema/ConstraintKind.js';
import { PrimaryKey } from '../../src/schema/PrimaryKey.js';
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';

describe('Database::addRow', () => {
  it('allows inserting row with valid foreign key reference', () => {
    let database = new Database("DB1")
      .createTable("Roles")
      .createTable("Users");

    let roles = database.requireTable("Roles")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["Id"],
        unique: true,
      })
      .addPrimaryKey(
        PrimaryKey.fromSpec({
          kind: CONSTRAINT_KIND.primaryKey,
          name: "PK_Roles",
          columns: ["Id"],
          index: "PK_Roles",
        })
      );

    let users = database.requireTable("Users")
      .addColumn({
        name: "RoleId",
        type: Number,
      });

    database = database
      .updateTable(roles)
      .updateTable(users);

    database = database.createForeignKey(
      "Users",
      {
        name: "FK_Users_Roles",
        columns: ["RoleId"],
        parentTable: "Roles",
        parentColumns: ["Id"],
      }
    );

    database = database.addRow(
      "Roles",
      [1]
    );

    expect(() => {
      database.addRow(
        "Users",
        [1]
      );
    }).not.toThrow();
  });

  it('throws when foreign key reference does not exist', () => {
    let database = new Database("DB1")
      .createTable("Roles")
      .createTable("Users");

    let roles = database.requireTable("Roles")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["Id"],
        unique: true,
      })
      .addPrimaryKey(
        PrimaryKey.fromSpec({
          kind: CONSTRAINT_KIND.primaryKey,
          name: "PK_Roles",
          columns: ["Id"],
          index: "PK_Roles",
        })
      );

    let users = database.requireTable("Users")
      .addColumn({
        name: "RoleId",
        type: Number,
      });

    database = database
      .updateTable(roles)
      .updateTable(users);

    database = database.createForeignKey(
      "Users",
      {
        name: "FK_Users_Roles",
        columns: ["RoleId"],
        parentTable: "Roles",
        parentColumns: ["Id"],
      }
    );

    expect(() => {
      database.addRow(
        "Users",
        [999]
      );
    }).toThrow();
  });

  it('allows NULL foreign key values', () => {
    let database = new Database("DB1")
      .createTable("Roles")
      .createTable("Users");

    let roles = database.requireTable("Roles")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["Id"],
        unique: true,
      })
      .addPrimaryKey(
        PrimaryKey.fromSpec({
          kind: CONSTRAINT_KIND.primaryKey,
          name: "PK_Roles",
          columns: ["Id"],
          index: "PK_Roles",
        })
      );

    let users = database.requireTable("Users")
      .addColumn({
        name: "RoleId",
        type: Number,
      });

    database = database
      .updateTable(roles)
      .updateTable(users);

    database = database.createForeignKey(
      "Users",
      {
        name: "FK_Users_Roles",
        columns: ["RoleId"],
        parentTable: "Roles",
        parentColumns: ["Id"],
      }
    );

    expect(() => {
      database.addRow(
        "Users",
        [null]
      );
    }).not.toThrow();
  });

  it('enforces foreign key constraints during insertion', () => {
    let database = new Database("DB1")
      .createTable("Roles")
      .createTable("Users");

    let parent = database.requireTable("Roles")
      .addColumn({
        name: "id",
        type: Number,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    parent = parent.addRow([1]);

    let child = database.requireTable("Users")
      .addColumn({
        name: "roleId",
        type: Number,
      });

    database = database
      .updateTable(parent)
      .updateTable(child)
      .createForeignKey("users", {
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    expect(() =>
      database.addRow(
        "Users",
        [2]
      )
    ).toThrow();
  });

  it('allows insertion when foreign key target exists', () => {
    let database = new Database("DB1")
      .createTable("Roles")
      .createTable("Users");

    let parent = database.requireTable("Roles")
      .addColumn({
        name: "id",
        type: Number,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    parent = parent.addRow([1]);

    let child = database.requireTable("Users")
      .addColumn({
        name: "roleId",
        type: Number,
      });

    database = database
      .updateTable(parent)
      .updateTable(child)
      .createForeignKey("users", {
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      })
      .addRow("Users", [1]);

    expect(
      database
        .requireTable("Users")
        .requireRow(0)
    ).toEqual([1]);
  });

  it('allows insertion when foreign key contains NULL components', () => {
    let database = new Database("DB1")
      .createTable("Roles")
      .createTable("Users");

    let parent = database.requireTable("Roles")
      .addColumn({
        name: "id",
        type: Number,
      })
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      });

    let child = database.requireTable("Users")
      .addColumn({
        name: "roleId",
        type: Number,
      });

    database = database
      .updateTable(parent)
      .updateTable(child)
      .createForeignKey("users", {
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      });

    expect(() =>
      database.addRow(
        "Users",
        [null]
      )
    ).not.toThrow();
  });
});