import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';

describe('Table::renameForeignKey', () => {
  function buildTable(): Table {
    return new Table("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .createForeignKey({
        name: "FK_Posts_Users",
        columns: ["UserId"],
        parentTable: "Users",
        parentColumns: ["Id"],
        parentIndex: "pk_roles",
      });
  }

  it('renames the foreign key', () => {
    const table = buildTable();

    const updated = table.renameForeignKey(
      "FK_Posts_Users",
      "FK_Posts_Authors"
    );

    expect(
      updated.requireForeignKey(
        "FK_Posts_Authors"
      )
    ).toBeDefined();
  });

  it('removes old foreign key name', () => {
    const table = buildTable();

    const updated = table.renameForeignKey(
      "FK_Posts_Users",
      "FK_Posts_Authors"
    );

    expect(() => {
      updated.requireForeignKey(
        "FK_Posts_Users"
      );
    }).toThrow();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable();

    const updated = table.renameForeignKey(
      "FK_Posts_Users",
      "FK_Posts_Authors"
    );

    expect(
      table.requireForeignKey(
        "FK_Posts_Users"
      )
    ).toBeDefined();

    expect(
      updated.requireForeignKey(
        "FK_Posts_Authors"
      )
    ).toBeDefined();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTable();

    const updated = table.renameForeignKey(
      "fk_posts_users",
      "RenamedFK"
    );

    expect(
      updated.requireForeignKey(
        "RenamedFK"
      )
    ).toBeDefined();
  });

  it('throws when foreign key does not exist', () => {
    const table = new Table("Posts");

    expect(() => {
      table.renameForeignKey(
        "MissingFK",
        "RenamedFK"
      );
    }).toThrow();
  });

  it('throws when another foreign key already uses the new name', () => {
    const table = buildTable()
      .addColumn({
        name: "CategoryId",
        type: Number,
        nullable: false,
      })
      .createForeignKey({
        name: "FK_Posts_Categories",
        columns: ["CategoryId"],
        parentTable: "Categories",
        parentColumns: ["Id"],
        parentIndex: "pk_roles",
      });

    expect(() => {
      table.renameForeignKey(
        "FK_Posts_Users",
        "FK_Posts_Categories"
      );
    }).toThrow();
  });

  it('returns same table when renaming to same name', () => {
    const table = buildTable();

    const updated = table.renameForeignKey(
      "FK_Posts_Users",
      "FK_Posts_Users"
    );

    expect(updated).toBe(table);
  });

  it('renames the corresponding reverse index', () => {
    const table = new Table("Child")
      .addColumn({
        name: "ParentId",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Parent",
        columns: ["ParentId"],
        parentTable: "Parent",
        parentColumns: ["Id"],
        parentIndex: "pk_roles",
      });

    const updated =
      table.renameForeignKey(
        "FK_Parent",
        "FK_Parent_New",
      );

    expect(
      updated.getIndex("FK_Parent")
    ).toBeUndefined();

    expect(
      updated.requireIndex("FK_Parent_New")
    ).toBeDefined();
  });

  it('updates foreignKey.reverseIndex during rename', () => {
    const table = new Table("Child")
      .addColumn({
        name: "ParentId",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Parent",
        columns: ["ParentId"],
        parentTable: "Parent",
        parentColumns: ["Id"],
        parentIndex: "pk_roles",
      });

    const updated =
      table.renameForeignKey(
        "FK_Parent",
        "FK_Parent_New",
      );

    const fk =
      updated.requireForeignKey(
        "FK_Parent_New"
      );

    expect(
      fk.reverseIndex
    ).toBe("fk_parent_new");
  });

  it('preserves reverse index ownership during rename', () => {
    const table = new Table("Child")
      .addColumn({
        name: "ParentId",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Parent",
        columns: ["ParentId"],
        parentTable: "Parent",
        parentColumns: ["Id"],
        parentIndex: "pk_roles",
      });

    const updated =
      table.renameForeignKey(
        "FK_Parent",
        "FK_Parent_New",
      );

    const index =
      updated.requireIndex(
        "FK_Parent_New"
      );

    expect(
      index.ownerConstraint
    ).toBe("fk_parent_new");
  });

  it('preserves reverse index row mappings during rename', () => {
    let table = new Table("Child")
      .addColumn({
        name: "ParentId",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Parent",
        columns: ["ParentId"],
        parentTable: "Parent",
        parentColumns: ["Id"],
        parentIndex: "pk_roles",
      });

    table = table.addRow([1]);
    table = table.addRow([2]);

    const originalIndex =
      table.requireIndex("FK_Parent");

    expect(
      originalIndex.hasRow([1])
    ).toBe(true);

    expect(
      originalIndex.hasRow([2])
    ).toBe(true);

    const updated =
      table.renameForeignKey(
        "FK_Parent",
        "FK_Parent_New",
      );

    const updatedIndex =
      updated.requireIndex(
        "FK_Parent_New"
      );

    expect(
      updatedIndex.hasRow([1])
    ).toBe(true);

    expect(
      updatedIndex.hasRow([2])
    ).toBe(true);
  });
});