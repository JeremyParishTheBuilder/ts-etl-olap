import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';

describe('Table::removeForeignKey', () => {
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
        parentIndex: "idx_email",
      });
  }

  it('removes the foreign key', () => {
    const table = buildTable();

    const updated = table.removeForeignKey(
      "FK_Posts_Users"
    );

    expect(() => {
      updated.requireForeignKey(
        "FK_Posts_Users"
      );
    }).toThrow();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable();

    const updated = table.removeForeignKey(
      "FK_Posts_Users"
    );

    expect(
      table.requireForeignKey(
        "FK_Posts_Users"
      )
    ).toBeDefined();

    expect(() => {
      updated.requireForeignKey(
        "FK_Posts_Users"
      );
    }).toThrow();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTable();

    const updated = table.removeForeignKey(
      "fk_posts_users"
    );

    expect(() => {
      updated.requireForeignKey(
        "FK_Posts_Users"
      );
    }).toThrow();
  });

  it('throws when foreign key does not exist', () => {
    const table = new Table("Posts");

    expect(() => {
      table.removeForeignKey("MissingFK");
    }).toThrow();
  });

  it('removes the corresponding reverse index', () => {
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
        parentIndex: "idx_email",
      });

    const updated =
      table.removeForeignKey(
        "FK_Parent"
      );

    expect(() => {
      updated.requireForeignKey("FK_Parent");
    }).toThrow();

    expect(
      updated.getIndex("FK_Parent")
    ).toBeUndefined();
  });

  it('preserves unrelated indexes during foreign key removal', () => {
    const table = new Table("Child")
      .addColumn({
        name: "ParentId",
        type: Number,
      })
      .addColumn({
        name: "Email",
        type: String,
      })
      .createIndex({
        name: "IDX_Email",
        columns: ["Email"],
      })
      .createForeignKey({
        name: "FK_Parent",
        columns: ["ParentId"],
        parentTable: "Parent",
        parentColumns: ["Id"],
        parentIndex: "idx_email",
      });

    const updated =
      table.removeForeignKey(
        "FK_Parent"
      );

    expect(
      updated.requireIndex(
        "IDX_Email"
      )
    ).toBeDefined();
  });

  it('preserves unrelated foreign keys during foreign key removal', () => {
    const table = new Table("Child")
      .addColumn({
        name: "ParentId1",
        type: Number,
      })
      .addColumn({
        name: "ParentId2",
        type: Number,
      })
      .createForeignKey({
        name: "FK_Parent1",
        columns: ["ParentId1"],
        parentTable: "Parent1",
        parentColumns: ["Id"],
        parentIndex: "pk_roles",
      })
      .createForeignKey({
        name: "FK_Parent2",
        columns: ["ParentId2"],
        parentTable: "Parent2",
        parentColumns: ["Id"],
        parentIndex: "pk_roles",
      });

    const updated =
      table.removeForeignKey(
        "FK_Parent1"
      );

    expect(() => {
      updated.requireForeignKey("FK_Parent1");
    }).toThrow();

    expect(
      updated.requireForeignKey(
        "FK_Parent2"
      )
    ).toBeDefined();

    expect(
      updated.requireIndex(
        "FK_Parent2"
      )
    ).toBeDefined();
  });
});