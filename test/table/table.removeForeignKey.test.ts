import { describe, it, expect } from 'vitest';
import {
  addForeignKeyByName,
  buildTable,
  buildTableWithForeignKey,
  createForeignKeyTestSpec_Table,
} from '../utils/buildSchema.js';

describe('Table::removeForeignKey', () => {
  it('removes the foreign key', () => {
    const table = buildTableWithForeignKey();

    const updated = table.removeForeignKey(
      "FK1"
    );

    expect(() => {
      updated.foreignKeys.requireByName(
        "FK1"
      );
    }).toThrow();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTableWithForeignKey();

    const updated = table.removeForeignKey(
      "FK1"
    );

    expect(
      table.foreignKeys.requireByName(
        "FK1"
      )
    ).toBeDefined();

    expect(() => {
      updated.foreignKeys.requireByName(
        "FK1"
      );
    }).toThrow();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTableWithForeignKey();

    const updated = table.removeForeignKey(
      "fK1"
    );

    expect(() => {
      updated.foreignKeys.requireByName(
        "FK1"
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
    const table = addForeignKeyByName(buildTableWithForeignKey(), {
        name: "FK2",
        columns: ["c1"],
        reverseIndex: "ri",
      });

    const updated =
      table.removeForeignKey(
        "FK2"
      );

    expect(() => {
      updated.foreignKeys.requireByName("FK2");
    }).toThrow();

    expect(
      updated.foreignKeys.requireByName("FK1")
    ).toBeDefined();
  });

});