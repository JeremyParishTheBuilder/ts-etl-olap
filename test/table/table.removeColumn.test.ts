import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { createForeignKeyTestSpec_Table, createTestIdService } from '../utils/buildSchema.js';

describe('Table::removeColumn', () => {
  it('removes a column from the table', () => {
    const table = new Table("T1")
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number });

    const updated = table.removeColumn("C1");

    expect(() => updated.requireColumn("C1")).toThrow();
    expect(updated.requireColumn("C2")).toBeDefined();
  });

  it('reindexes remaining columns', () => {
    const table = new Table("T1")
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number })
      .createColumn({ name: "C3", type: Number });

    const updatedTable = table.removeColumn("C2");

    expect(updatedTable.requireColumn("C1").position).toBe(0);
    expect(updatedTable.requireColumn("C3").position).toBe(1);
  });

  it('preserves row values for remaining columns', () => {
    const table = new Table("T1")
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number });

    const withRow = table.addRow([1, 2]);
    const updated = withRow.removeColumn("C1");

    const row = updated.requireRow(0);

    expect(row).toEqual([2]);
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .createColumn({ name: "C1", type: Number });

    const updatedTable = table.removeColumn("C1");

    expect(table.requireColumn("C1")).toBeDefined();
    expect(() => updatedTable.requireColumn("C1")).toThrow();
  });

  it('throws when removing non-existent column', () => {
    const table = new Table("T1");

    expect(() => {
      table.removeColumn("C1");
    }).toThrow();
  });

  it('throws if column is not droppable (constraint/index referenced)', () => {
    const table = new Table("T1")
      .createColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: true,
      });

    expect(() => {
      table.removeColumn("C1");
    }).toThrow();
  });

  it('updates projected index bindings after column removal', () => {
    const table = new Table("T1")
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number })
      .createColumn({ name: "C3", type: Number })
      .createIndex({
        name: "IDX1",
        columns: ["C1", "C3"],
      });

    const updated = table.removeColumn("C2");

    const index =
      updated.requireIndex("IDX1");

    expect(
      index.projectValues([10, 30])
    ).toEqual([10, 30]);
  });

  it('updates indexes` column position indexes', () => {
    const table = new Table("T1")
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number })
      .createColumn({ name: "C3", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1", "C3"],
        unique: true,
      });

    const index = table.requireIndex("I1");

    expect(
      index.projectValues([10, 20, 30])
    ).toEqual([10, 30]);

    const updatedTable = table.removeColumn("C2");

    const updatedIndex = updatedTable.requireIndex("I1");

    expect(
      updatedIndex.projectValues([10, 30])
    ).toEqual([10, 30]);
  });

  it('preserves unrelated indexes during column removal', () => {
    const table = new Table("T1")
      .createColumn({
        name: "C1",
        type: Number,
      })
      .createColumn({
        name: "C2",
        type: Number,
      })
      .createColumn({
        name: "C3",
        type: Number,
      })
      .createIndex({
        name: "IDX1",
        columns: ["C1"],
      })
      .createIndex({
        name: "IDX2",
        columns: ["C3"],
      });

    const updated = table.removeColumn("C2");

    expect(
      updated.requireIndex("IDX1")
    ).toBeDefined();

    expect(
      updated.requireIndex("IDX2")
    ).toBeDefined();
  });
});