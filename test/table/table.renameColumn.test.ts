import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::renameColumn', () => {
  it('renames an existing column', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const updated = table.renameColumn("C1", "C1_new");

    expect(updated.columns.requireByName("C1_new")).toBeDefined();
    expect(() => updated.columns.requireByName("C1")).toThrow();
  });

  it('preserves column position after rename', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    const updated = table.renameColumn("C1", "C1_new");

    expect(updated.columns.requireByName("C1_new").position).toBe(0);
    expect(updated.columns.requireByName("C2").position).toBe(1);
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const updated = table.renameColumn("C1", "C1_new");

    expect(table.columns.requireByName("C1")).toBeDefined();
    expect(() => table.columns.requireByName("C1_new")).toThrow();

    expect(updated.columns.requireByName("C1_new")).toBeDefined();
  });

  it('throws when renaming non-existent column', () => {
    const table = buildTable();

    expect(() => {
      table.renameColumn("C1", "C2");
    }).toThrow();
  });

  it('throws when new name already exists', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    expect(() => {
      table.renameColumn("C1", "C2");
    }).toThrow();
  });

  it('preserves row data after rename', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const withRow = table.addRows([
      [123]
    ]);
    
    const updated = withRow.renameColumn("C1", "C1_new");

    const row = updated.requireRow(0);

    expect(row).toEqual([123]);
  });

});