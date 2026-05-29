import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { Table } from '../../src/schema/Table.js';
import { CONSTRAINT_KIND } from '../../src/schema/ConstraintKind.js';
import { Check } from '../../src/schema/Check.js';
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';

describe('Database::renameColumn', () => {
  it('renames column in the correct table', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(table);

    const updatedDb = db.renameColumn("T1", "C1", "C1_new");

    const updatedTable = updatedDb.requireTable("T1");

    expect(updatedTable.requireColumn("C1_new")).toBeDefined();
    expect(() => updatedTable.requireColumn("C1")).toThrow();
  });

  it('does not affect other tables', () => {
    const t1 = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const t2 = new Table("T2")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(t1)
      .addTable(t2);

    const updatedDb = db.renameColumn("T1", "C1", "C1_new");

    const updatedT2 = updatedDb.requireTable("T2");

    expect(updatedT2.requireColumn("C1")).toBeDefined();
    expect(() => updatedT2.requireColumn("C1_new")).toThrow();
  });

  it('updates parent columns in foreign keys', () => {
    const parent = new Table("Parent")
      .addColumn({ name: "id", type: Number })
      .createIndex({ name: "id", columns: ["id"], unique: true });

    const child = new Table("Child")
      .addColumn({ name: "parent_id", type: Number });

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey("child",
        {
          name: "fk_parent",
          columns: ["parent_id"],
          parentTable: "Parent",
          parentColumns: ["id"],
          onDelete: ReferentialAction.restrict,
          onUpdate: ReferentialAction.restrict,
        }
      );

    const updatedDb = db.renameColumn("Parent", "id", "id_new");

    const updatedChildTable = updatedDb.requireTable("Child");
    const fk = updatedChildTable.requireForeignKey("fk_parent");

    expect(fk.parentColumns).toEqual(["id_new"]);
  });

  it('does not mutate original database (immutability)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const db = new Database("DB1")
      .addTable(table);

    const updatedDb = db.renameColumn("T1", "C1", "C1_new");

    const original = db.requireTable("T1");
    const modified = updatedDb.requireTable("T1");

    expect(original.requireColumn("C1")).toBeDefined();
    expect(() => original.requireColumn("C1_new")).toThrow();

    expect(modified.requireColumn("C1_new")).toBeDefined();
  });

  it('updates composite parent columns in foreign keys', () => {
    const parent = new Table("Parent")
      .addColumn({
        name: "A",
        type: Number,
      })
      .addColumn({
        name: "B",
        type: Number,
      })
      .createIndex({
        name: "PK_Parent",
        columns: ["A", "B"],
        unique: true,
      });

    const child = new Table("Child")
      .addColumn({
        name: "FA",
        type: Number,
      })
      .addColumn({
        name: "FB",
        type: Number,
      });

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(child);

    db = db.createForeignKey(
      "Child",
      {
        name: "FK_Composite",
        columns: ["FA", "FB"],
        parentTable: "Parent",
        parentColumns: ["A", "B"],
      }
    );

    const updated = db.renameColumn(
      "Parent",
      "B",
      "C",
    );

    const fk =
      updated
        .requireTable("Child")
        .requireForeignKey("FK_Composite");

    expect(
      fk.parentColumns
    ).toEqual([
      "a",
      "c",
    ]);
  });

  it('preserves foreign key validity after parent column rename', () => {
    let parent = new Table("Roles")
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

    let child = new Table("Users")
      .addColumn({
        name: "roleId",
        type: Number,
      });

    child = child.addRow([1]);

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(child);

    db = db.createForeignKey(
      "Users",
      {
        name: "FK_Users_Roles",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
      }
    );

    const updated = db.renameColumn(
      "Roles",
      "id",
      "roleId",
    );

    expect(
      updated
        .requireTable("Users")
        .requireForeignKey("FK_Users_Roles")
        .parentColumns
    ).toEqual([
      "roleid",
    ]);

    expect(() =>
      updated.addRow(
        "Users",
        [1],
      )
    ).not.toThrow();
  });

  it('preserves composite foreign key validity after parent column rename', () => {
    let parent = new Table("Parent")
      .addColumn({
        name: "A",
        type: Number,
      })
      .addColumn({
        name: "B",
        type: Number,
      })
      .createIndex({
        name: "PK_Parent",
        columns: ["A", "B"],
        unique: true,
      });

    parent = parent.addRow([1, 2]);

    let child = new Table("Child")
      .addColumn({
        name: "FA",
        type: Number,
      })
      .addColumn({
        name: "FB",
        type: Number,
      });

    child = child.addRow([1, 2]);

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(child);

    db = db.createForeignKey(
      "Child",
      {
        name: "FK_Composite",
        columns: ["FA", "FB"],
        parentTable: "Parent",
        parentColumns: ["A", "B"],
      }
    );

    const updated = db.renameColumn(
      "Parent",
      "B",
      "C",
    );

    expect(
      updated
        .requireTable("Child")
        .requireForeignKey("FK_Composite")
        .parentColumns
    ).toEqual([
      "a",
      "c",
    ]);

    expect(() =>
      updated.addRow(
        "Child",
        [1, 2],
      )
    ).not.toThrow();
  });

  it('updates index column references during rename', () => {
    const table = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["email"],
        unique: true,
      });

    const updated = table.renameColumn(
      "email",
      "emailAddress",
    );

    const index =
      updated.requireIndex("IDX_Email");

    expect(
      index.projectValues([
        "a@test.com",
      ])
    ).toEqual([
      "a@test.com",
    ]);
  });

  it('updates composite index column references during rename', () => {
    const table = new Table("Users")
      .addColumn({
        name: "firstName",
        type: String,
      })
      .addColumn({
        name: "lastName",
        type: String,
      })
      .createIndex({
        name: "IDX_Name",
        columns: [
          "firstName",
          "lastName",
        ],
        unique: true,
      });

    const updated = table.renameColumn(
      "lastName",
      "surname",
    );

    const index =
      updated.requireIndex("IDX_Name");

    expect(
      index.projectValues([
        "John",
        "Smith",
      ])
    ).toEqual([
      "John",
      "Smith",
    ]);
  });

  it('preserves composite index uniqueness after rename', () => {
    let table = new Table("Users")
      .addColumn({
        name: "firstName",
        type: String,
      })
      .addColumn({
        name: "lastName",
        type: String,
      })
      .createIndex({
        name: "IDX_Name",
        columns: [
          "firstName",
          "lastName",
        ],
        unique: true,
      });

    table = table.addRow([
      "John",
      "Smith",
    ]);

    const updated = table.renameColumn(
      "lastName",
      "surname",
    );

    expect(() =>
      updated.addRow([
        "John",
        "Smith",
      ])
    ).toThrow();
  });

  it('updates check constraint column references during rename', () => {
    const table = new Table("Users")
      .addColumn({
        name: "age",
        type: Number,
      })
      .addCheck(
        Check.fromSpec({
          kind: CONSTRAINT_KIND.check,
          name: "CHK_Age",
          columns: ["Age"],
          expression: undefined,
        })
      );

    const updated = table.renameColumn(
      "age",
      "userAge",
    );

    const check =
      updated.requireCheck("CHK_Age");

    expect(() =>
      updated.addRow([10])
    ).not.toThrow();

    //TODO, enable later once Check is implemented
    // expect(() =>
    //   updated.addRow([-1])
    // ).toThrow();
  });

  it('preserves check constraint enforcement after rename', () => {
    const table = new Table("Users")
      .addColumn({
        name: "score",
        type: Number,
      })
      .addCheck(
        Check.fromSpec({
          kind: CONSTRAINT_KIND.check,
          name: "CHK_Score",
          columns: ["Score"],
          expression: undefined,
        })
      );

    const updated = table.renameColumn(
      "score",
      "points",
    );

    expect(() =>
      updated.addRow([100])
    ).not.toThrow();

    //TODO, enable later once Check is implemented
    // expect(() =>
    //   updated.addRow([-5])
    // ).toThrow();
  });

  it('preserves index functionality after rename', () => {
    let table = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRow([
      "a@test.com",
    ]);

    const updated = table.renameColumn(
      "email",
      "emailAddress",
    );

    expect(() =>
      updated.addRow([
        "a@test.com",
      ])
    ).toThrow();
  });
});