import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Index } from '../../src/schema/Index.js';

describe('Table::removeColumn', () => {
  it('removes a column from the table', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addColumn({ name: "C2", type: Number });

    const updated = table.removeColumn("C1");

    expect(() => updated.requireColumn("C1")).toThrow();
    expect(updated.requireColumn("C2")).toBeDefined();
  });

  it('reindexes remaining columns', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addColumn({ name: "C2", type: Number })
      .addColumn({ name: "C3", type: Number });

    const updatedTable = table.removeColumn("C2");

    expect(updatedTable.requireColumn("C1").position).toBe(0);
    expect(updatedTable.requireColumn("C3").position).toBe(1);
  });

  it('preserves row values for remaining columns', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addColumn({ name: "C2", type: Number });

    const withRow = table.insertNormalizedRow([1, 2]);
    const updated = withRow.removeColumn("C1");

    const row = updated.requireRow(0);

    expect(row).toEqual([2]);
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

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
      .addColumn({ name: "C1", type: Number })
      .addIndex(
        Index.fromSpec({
          name: "I1",
          columns: ["C1"],
          unique: true,
        })
      );

    expect(() => {
      table.removeColumn("C1");
    }).toThrow();
  });
});