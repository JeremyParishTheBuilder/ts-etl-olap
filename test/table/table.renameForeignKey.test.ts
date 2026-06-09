import { describe, it, expect } from 'vitest';
import { addForeignKeyByName, buildTable } from '../utils/buildSchema.js';

describe('Table::renameForeignKey', () => {

  it('renames the foreign key', () => {
    const table = buildTable({
      columns: 1,
      foreignKeys: [
        {name: "FK_Posts_Users", columns: ["c1"]}
      ]
    });

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
    const table = buildTable({
      columns: 1,
      foreignKeys: [
        {name: "FK_Posts_Users", columns: ["c1"]}
      ]
    });

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
    const table = buildTable({
      columns: 1,
      foreignKeys: [
        {name: "FK_Posts_Users", columns: ["c1"]}
      ]
    });

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
    const table = buildTable({
      columns: 1,
      foreignKeys: [
        {name: "FK_Posts_Users", columns: ["c1"]}
      ]
    });

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
    const table = buildTable();

    expect(() => {
      table.renameForeignKey(
        "MissingFK",
        "RenamedFK"
      );
    }).toThrow();
  });

  it('throws when another foreign key already uses the new name', () => {
    let table = buildTable({
      columns: 1,
      foreignKeys: [
        {name: "FK_Posts_Users", columns: ["c1"]}
      ]
    });
    table = table
      .createColumn({
        name: "CategoryId",
        type: Number,
        nullable: false,
      });
    table = addForeignKeyByName(table, {
      name: "FK_Posts_Categories",
      columns: ["CategoryId"],
    });

    expect(() => {
      table.renameForeignKey(
        "FK_Posts_Users",
        "FK_Posts_Categories"
      );
    }).toThrow();
  });

  it('returns same table when renaming to same name', () => {
    const table = buildTable({
      columns: 1,
      foreignKeys: [
        {name: "FK_Posts_Users", columns: ["c1"]}
      ]
    });

    const updated = table.renameForeignKey(
      "FK_Posts_Users",
      "FK_Posts_Users"
    );

    expect(updated).toBe(table);
  });

});