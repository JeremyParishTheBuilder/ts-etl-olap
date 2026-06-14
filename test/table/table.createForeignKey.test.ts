import { describe, it, expect, } from 'vitest';
import { addForeignKeyByName, buildTable, buildTableWithForeignKey, createForeignKeyTestSpec_Table, } from '../utils/buildSchema.js';

describe('Table::createForeignKey', () => {
  it('adds a foreign key to the table', () => {
    const table = buildTableWithForeignKey();

    expect(
      table.foreignKeys.requireByName("FK1")
    ).toBeDefined();
  });

  it('allows a reverse index matching the foreign key columns', () => {
  const table = buildTable()
    .createColumn({ name: "C1", type: Number })
    .createIndex({
      name: "IDX1",
      columns: ["C1"],
    });

  const updated = addForeignKeyByName(table, {
      name: "FK1",
      columns: ["c1"],
      reverseIndex: "idx1",
    });

  expect(
    updated.foreignKeys.requireByName("FK1")
  ).toBeDefined();
});

  it('throws when reverse index columns do not match foreign key columns', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number })
      .createIndex({
        name: "IDX1",
        columns: ["C1"],
      });

    expect(() => {
      addForeignKeyByName(table, {
        name: "FK1",
        columns: ["c2"],
        reverseIndex: "idx1",
      });
    }).toThrow();
  });

  it('allows foreign keys when column order matches reverse index', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number })
      .createIndex({
        name: "IDX1",
        columns: ["C1", "C2"],
      });

    const updated = addForeignKeyByName(table, {
      name: "FK1",
      columns: ["c1", "c2"],
      reverseIndex: "idx1",
    });

    expect(updated.foreignKeys.requireByName("FK1")).toBeDefined();
  });

  it('rejects foreign keys when column order does not match reverse index', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number })
      .createIndex({
        name: "IDX1",
        columns: ["C1", "C2"],
      });

    expect(() => {
      addForeignKeyByName(table, {
        name: "FK1",
        columns: ["c2", "c1"], // reversed order
        reverseIndex: "idx1",
      });
    }).toThrow();
  });

  it('requires reverse index to be non-unique', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createIndex({
        name: "IDX1",
        columns: ["C1"],
        unique: true,
      });

    expect(() => {
      addForeignKeyByName(table, {
        name: "FK1",
        columns: ["C1"],
        reverseIndex: "IDX1",
      });
    }).toThrow();
  });
});