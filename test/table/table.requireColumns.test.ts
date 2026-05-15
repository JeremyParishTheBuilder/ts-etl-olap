import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';

describe('Table::requireColumns', () => {
  it('returns requested columns in order', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addColumn({ name: "C2", type: String });

    const columns = table.requireColumns(["C2", "C1"]);

    expect(columns.map(c => c.name)).toEqual([
      "C2",
      "C1",
    ]);
  });

  it('retrieves columns regardless of casing', () => {
    const table = new Table("T1")
      .addColumn({ name: "UserId", type: Number });

    const columns = table.requireColumns([
      "userid"
    ]);

    expect(columns[0].name).toBe("UserId");
  });

  it('throws if any column does not exist', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number });

    expect(() => {
      table.requireColumns([
        "C1",
        "C2",
      ]);
    }).toThrow();
  });

  it('returns an empty array when requiring no columns', () => {
    const table = new Table("T1");

    expect(
      table.requireColumns([])
    ).toEqual([]);
  });
});