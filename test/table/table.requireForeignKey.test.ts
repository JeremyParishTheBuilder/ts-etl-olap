import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { ForeignKey } from '../../src/schema/ForeignKey.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';
import { Index } from '../../src/schema/Index.js';

describe('Table::requireForeignKey', () => {
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

  it('returns the foreign key', () => {
    const table = buildTable();

    expect(
      table.requireForeignKey("FK_Posts_Users")
    ).toBeDefined();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTable();

    expect(
      table.requireForeignKey("fk_posts_users")
    ).toBeDefined();
  });

  it('throws when foreign key does not exist', () => {
    const table = new Table("Posts");

    expect(() => {
      table.requireForeignKey("MissingFK");
    }).toThrow();
  });
});