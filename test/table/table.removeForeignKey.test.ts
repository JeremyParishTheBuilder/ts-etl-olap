import { describe, it, expect } from 'vitest';
import { buildTable, createForeignKeyTestSpec_Table, createTestIdService } from '../utils/buildSchema.js';

describe('Table::removeForeignKey', () => {
  function buildTableWithForeignKey() {
    const table = buildTable()
      .createColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .createForeignKey(createForeignKeyTestSpec_Table({
        name: "FK_Posts_Users",
        //columns: [ids.nextColumnId()],
        //reverseIndex: ids.nextIndexId(),
      }));
    return table;
  }

  it('removes the foreign key', () => {
    const table = buildTableWithForeignKey();

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
    const table = buildTableWithForeignKey();

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
    const table = buildTableWithForeignKey();

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
    const table = buildTable();

    expect(() => {
      table.removeForeignKey("MissingFK");
    }).toThrow();
  });


  it('preserves unrelated foreign keys during foreign key removal', () => {
    const table = buildTable()
      .createForeignKey(createForeignKeyTestSpec_Table({
        name: "FK_Parent1",
      }))
      .createForeignKey(createForeignKeyTestSpec_Table({
        name: "FK_Parent2",
      }));
    

    const updated =
      table.removeForeignKey(
        "FK_Parent1"
      );

    expect(() => {
      updated.requireForeignKey("FK_Parent1");
    }).toThrow();

    expect(
      updated.requireForeignKey("FK_Parent2")
    ).toBeDefined();
  });

});