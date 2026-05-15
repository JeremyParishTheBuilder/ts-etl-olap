import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';
import { Index } from '../../src/schema/Index.js';
import { PrimaryKey } from '../../src/schema/PrimaryKey.js';
import { ForeignKey } from '../../src/schema/ForeignKey.js';

describe('Database::insertRow', () => {
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
      .addIndex(
        Index.fromSpec({
          name: "PK_Roles",
          columns: ["Id"],
          unique: true,
        })
      )
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

    database = database.addForeignKey(
      "Users",
      ForeignKey.fromSpec({
        kind: CONSTRAINT_KIND.foreignKey,
        name: "FK_Users_Roles",
        columns: ["RoleId"],
        parentTable: "Roles",
        parentColumns: ["Id"],
      })
    );

    database = database.insertRow(
      "Roles",
      [1]
    );

    expect(() => {
      database.insertRow(
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
      .addIndex(
        Index.fromSpec({
          name: "PK_Roles",
          columns: ["Id"],
          unique: true,
        })
      )
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

    database = database.addForeignKey(
      "Users",
      ForeignKey.fromSpec({
        kind: CONSTRAINT_KIND.foreignKey,
        name: "FK_Users_Roles",
        columns: ["RoleId"],
        parentTable: "Roles",
        parentColumns: ["Id"],
      })
    );

    expect(() => {
      database.insertRow(
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
      .addIndex(
        Index.fromSpec({
          name: "PK_Roles",
          columns: ["Id"],
          unique: true,
        })
      )
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

    database = database.addForeignKey(
      "Users",
      ForeignKey.fromSpec({
        kind: CONSTRAINT_KIND.foreignKey,
        name: "FK_Users_Roles",
        columns: ["RoleId"],
        parentTable: "Roles",
        parentColumns: ["Id"],
      })
    );

    expect(() => {
      database.insertRow(
        "Users",
        [null]
      );
    }).not.toThrow();
  });
});