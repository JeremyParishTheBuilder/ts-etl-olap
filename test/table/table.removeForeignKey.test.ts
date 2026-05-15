import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { ForeignKey } from '../../src/schema/ForeignKey.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Table::removeForeignKey', () => {
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
});