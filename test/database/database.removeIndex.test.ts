import { describe, it, expect } from 'vitest';

import { Database } from "../../src/schema/Database.js";
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';
import { 
  buildTable,
  createColumnTestSpec,
  createForeignKeyTestSpec_Database,
  createIndexTestSpec
} from '../utils/buildSchema.js';

describe('Database::removeIndex', () => {

  it('removes an index from a table', () => {
    const db = new Database("DB1")
      .addTable(
        buildTable({columns: ["c1"]})
          .createIndex(createIndexTestSpec({
            name: "i1",
            columns: ["c1"],
          })));

    const updated = db.removeIndex(
      "t1",
      "i1",
    );

    expect(
      updated
        .requireTable("t1")
        .getIndex("i1")
    ).toBeUndefined();
  });

  it('does not mutate original database state', () => {
    const db = new Database("DB1")
      .addTable(
        buildTable({columns: ["c1"]})
          .createIndex(createIndexTestSpec({name: "i1", columns: ["c1"]}))
      );

    const updated = db.removeIndex(
      "t1",
      "i1",
    );

    expect(
      db
        .requireTable("t1")
        .requireIndex("i1")
    ).toBeDefined();

    expect(
      updated
        .requireTable("t1")
        .getIndex("i1")
    ).toBeUndefined();

    expect(updated).not.toBe(db);

    expect(
      updated.requireTable("t1")
    ).not.toBe(
      db.requireTable("t1")
    );
  });

  it('preserves unrelated tables during index removal', () => {

    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createIndex(createIndexTestSpec({
        name: "IDX_Email",
        columns: ["email"],
      }));

    const roles = buildTable({name: "Roles"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }));

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
    const table = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }));

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
    const parent = buildTable({name: "Roles"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createIndex(createIndexTestSpec({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      }));

    const child = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "roleId",
        type: Number,
      }))
      .createIndex(createIndexTestSpec({
        name: "FKR_Id",
        columns: ["roleId"],
        unique: false,
      }));

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey("users", createForeignKeyTestSpec_Database({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        reverseIndex: "FKR_Id",
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      }));

    expect(() =>
      db.removeIndex(
        "Roles",
        "PK_Roles",
      )
    ).toThrow();
  });

  it('allows removing an index not referenced by a foreign key', () => {
    const parent = buildTable({name: "Roles"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createIndex(createIndexTestSpec({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      }))
      .createIndex(createIndexTestSpec({
        name: "IDX_Extra",
        columns: ["id"],
      }));

    const child = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "roleId",
        type: Number,
      }))
      .createIndex(createIndexTestSpec({
        name: "FKR_Id",
        columns: ["roleId"],
        unique: false,
      }));

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey("users", createForeignKeyTestSpec_Database({
        name: "FK_Users_Roles",
        columns: ["roleId"],
        reverseIndex: "FKR_Id",
        parentTable: "Roles",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      }));

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
    const employees = buildTable({name: "Employees"})
      .createColumn(createColumnTestSpec({
        name: "id",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "managerId",
        type: Number,
      }))
      .createIndex(createIndexTestSpec({
        name: "PK_Employees",
        columns: ["id"],
        unique: true,
      }))
      .createIndex(createIndexTestSpec({
        name: "FKR_Employees",
        columns: ["managerId"],
        unique: false,
      }));

    const db = new Database("DB1")
      .addTable(employees)
      .createForeignKey("employees", createForeignKeyTestSpec_Database({
        name: "FK_Manager",
        columns: ["managerId"],
        reverseIndex: "FKR_Employees",
        parentTable: "Employees",
        parentColumns: ["id"],
        onDelete: ReferentialAction.restrict,
        onUpdate: ReferentialAction.restrict,
      }));

    expect(() =>
      db.removeIndex(
        "Employees",
        "PK_Employees",
      )
    ).toThrow();
  });

  it('preserves existing rows after index removal', () => {
    let table = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createIndex(createIndexTestSpec({
        name: "IDX_Email",
        columns: ["email"],
      }));

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
    const table = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "email",
        type: String,
      }))
      .createIndex(createIndexTestSpec({
        name: "IDX_Email",
        columns: ["email"],
      }))
      .createIndex(createIndexTestSpec({
        name: "IDX_Email_2",
        columns: ["email"],
      }));

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