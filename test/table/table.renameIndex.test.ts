import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::renameIndex', () => {
  it('renames an index', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      });

    const updated = table.renameIndex("I1", "I2");

    expect(() => {
      updated.requireIndex("I1");
    }).toThrow();

    expect(
      updated.requireIndex("I2")
    ).toBeDefined();
  });

  it('preserves index properties during rename', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: true,
      });

    const columnsBeforeUpdate = table.requireIndex("I1").columns;

    const updated = table.renameIndex("I1", "I2");

    const index = updated.requireIndex("I2");

    expect(index.unique).toBe(true);
    expect(index.columns).toEqual(columnsBeforeUpdate);
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      });

    const updated = table.renameIndex("I1", "I2");

    expect(
      table.requireIndex("I1")
    ).toBeDefined();

    expect(() => {
      table.requireIndex("I2");
    }).toThrow();

    expect(
      updated.requireIndex("I2")
    ).toBeDefined();
  });

  it('throws when renaming non-existent index', () => {
    const table = buildTable();

    expect(() => {
      table.renameIndex("I1", "I2");
    }).toThrow();
  });

  it('throws when target index name already exists', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: false,
      })
      .createIndex({
        name: "I2",
        columns: ["C1"],
        unique: false,
      });

    expect(() => {
      table.renameIndex("I1", "I2");
    }).toThrow();
  });

  it('renames regardless of casing', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createIndex({
        name: "UserLookup",
        columns: ["C1"],
        unique: false,
      });

    const updated = table.renameIndex(
      "userlookup",
      "I2"
    );

    expect(
      updated.requireIndex("I2")
    ).toBeDefined();
  });

});