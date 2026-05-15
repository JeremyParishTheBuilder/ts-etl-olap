import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { ForeignKey } from '../../src/schema/ForeignKey.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Table::renameForeignKey', () => {
  function buildTable(): Table {
    return new Table("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .addForeignKey(
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );
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
      .addForeignKey(
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Categories",
          columns: ["CategoryId"],
          parentTable: "Categories",
          parentColumns: ["Id"],
        })
      );

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
});