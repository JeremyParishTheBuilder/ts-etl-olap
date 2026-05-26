import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';

describe('Table::renameColumn', () => {
  it('renames an existing column', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const updated = table.renameColumn("C1", "C1_new");

    expect(updated.requireColumn("C1_new")).toBeDefined();
    expect(() => updated.requireColumn("C1")).toThrow();
  });

  it('preserves column position after rename', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addColumn({ name: "C2", type: Number });

    const updated = table.renameColumn("C1", "C1_new");

    expect(updated.requireColumn("C1_new").position).toBe(0);
    expect(updated.requireColumn("C2").position).toBe(1);
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const updated = table.renameColumn("C1", "C1_new");

    expect(table.requireColumn("C1")).toBeDefined();
    expect(() => table.requireColumn("C1_new")).toThrow();

    expect(updated.requireColumn("C1_new")).toBeDefined();
  });

  it('throws when renaming non-existent column', () => {
    const table = new Table("T1");

    expect(() => {
      table.renameColumn("C1", "C2");
    }).toThrow();
  });

  it('throws when new name already exists', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addColumn({ name: "C2", type: Number });

    expect(() => {
      table.renameColumn("C1", "C2");
    }).toThrow();
  });

  it('preserves row data after rename', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    const withRow = table.addRow([123]);
    const updated = withRow.renameColumn("C1", "C1_new");

    const row = updated.requireRow(0);

    expect(row).toEqual([123]);
  });

  it('updates index column references during rename', () => {
    const table = new Table("T1")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["email"],
      });

    const updated = table.renameColumn(
      "email",
      "emailAddress",
    );

    const index =
      updated.requireIndex("IDX_Email");

    expect(
      index.getProjectedValues([
        "a@test.com",
      ])
    ).toEqual([
      "a@test.com",
    ]);
  });

  it('updates composite index column references during rename', () => {
    const table = new Table("T1")
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
      });

    const updated = table.renameColumn(
      "lastName",
      "surname",
    );

    const index =
      updated.requireIndex("IDX_Name");

    expect(
      index.getProjectedValues([
        "John",
        "Smith",
      ])
    ).toEqual([
      "John",
      "Smith",
    ]);
  });

  it('updates child foreign key column references during rename', () => {
    const table = new Table("Child")
      .addColumn({
        name: "roleId",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Role",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        parentIndex: "pk_roles",
      });

    const updated = table.renameColumn(
      "roleId",
      "newRoleId",
    );

    const fk =
      updated.requireForeignKey("FK_Role");

    expect(
      fk.getProjectedValues([123])
    ).toEqual([123]);
  });

  it('updates composite child foreign key column references during rename', () => {
    const table = new Table("Child")
      .addColumn({
        name: "FA",
        type: Number,
      })
      .addColumn({
        name: "FB",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Composite",
        columns: ["FA", "FB"],
        parentTable: "Parent",
        parentColumns: ["PA", "PB"],
        parentIndex: "pk_roles",
      });

    const updated = table.renameColumn(
      "FB",
      "FC",
    );

    const fk =
      updated.requireForeignKey("FK_Composite");

    expect(
      fk.getProjectedValues([1, 2])
    ).toEqual([1, 2]);
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

  it('preserves foreign key projection behavior after rename', () => {
    const table = new Table("Child")
      .addColumn({
        name: "roleId",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Role",
        columns: ["roleId"],
        parentTable: "Roles",
        parentColumns: ["id"],
        parentIndex: "pk_roles",
      });

    const updated = table.renameColumn(
      "roleId",
      "newRoleId",
    );

    const fk =
      updated.requireForeignKey("FK_Role");

    expect(
      fk.getProjectedValues([5])
    ).toEqual([5]);
  });
});