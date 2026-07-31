import { describe, it, expect } from 'vitest';
import {
  addForeignKeyByName,
  buildTable,
  buildTableWithForeignKey,
  createColumnTestSpec,
  createIndexTestSpec
} from '../utils/buildSchema.js';

describe('Table::renameForeignKey', () => {
  it('renames the foreign key', () => {
    const table = buildTableWithForeignKey();

    const updated = table.renameForeignKey(
      "FK1",
      "FK2"
    );

    expect(
      updated.foreignKeys.requireByName(
        "FK2"
      )
    ).toBeDefined();
  });

  it('removes old foreign key name', () => {
    const table = buildTableWithForeignKey();

    const updated = table.renameForeignKey(
      "FK1",
      "FK2"
    );

    expect(() => {
      updated.foreignKeys.requireByName(
        "FK1"
      );
    }).toThrow();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTableWithForeignKey();

    const updated = table.renameForeignKey(
      "FK1",
      "FK2"
    );

    expect(
      table.foreignKeys.requireByName(
        "FK1"
      )
    ).toBeDefined();

    expect(
      updated.foreignKeys.requireByName(
        "FK2"
      )
    ).toBeDefined();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTableWithForeignKey();

    const updated = table.renameForeignKey(
      "fK1",
      "RenamedFK"
    );

    expect(
      updated.foreignKeys.requireByName(
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
    const table = buildTableWithForeignKey()
      .createColumn(createColumnTestSpec({
        name: "c2",
      }))
      .createIndex(createIndexTestSpec({
        name: "ri2",
        columns: ["c2"],
        unique: false,
      }));

    const updated = addForeignKeyByName(table, {
      name: "FK2",
      columns: ["c2"],
      reverseIndex: "ri2",
    });

    expect(() => {
      updated.renameForeignKey(
        "FK1",
        "FK2"
      );
    }).toThrow();
  });

  it('returns same table when renaming to same name', () => {
    const table = buildTableWithForeignKey();

    const updated = table.renameForeignKey(
      "FK1",
      "FK1"
    );

    expect(updated).toBe(table);
  });

});