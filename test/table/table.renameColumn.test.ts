import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { addForeignKeyByName, createColumnTestSpec, createForeignKeyTestSpec_Table } from '../utils/buildSchema.js';

describe('Table::renameColumn', () => {
  it('renames an existing column', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const updated = table.renameColumn("C1", "C1_new");

    expect(updated.requireColumn("C1_new")).toBeDefined();
    expect(() => updated.requireColumn("C1")).toThrow();
  });

  it('preserves column position after rename', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    const updated = table.renameColumn("C1", "C1_new");

    expect(updated.requireColumn("C1_new").position).toBe(0);
    expect(updated.requireColumn("C2").position).toBe(1);
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const updated = table.renameColumn("C1", "C1_new");

    expect(table.requireColumn("C1")).toBeDefined();
    expect(() => table.requireColumn("C1_new")).toThrow();

    expect(updated.requireColumn("C1_new")).toBeDefined();
  });

  it('throws when renaming non-existent column', () => {
    const table = new Table("T1");

    expect(() => {
      table.renameColumn("C1", "C2");
    }).toThrow();
  });

  it('throws when new name already exists', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    expect(() => {
      table.renameColumn("C1", "C2");
    }).toThrow();
  });

  it('preserves row data after rename', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const withRow = table.addRow([123]);
    const updated = withRow.renameColumn("C1", "C1_new");

    const row = updated.requireRow(0);

    expect(row).toEqual([123]);
  });

});