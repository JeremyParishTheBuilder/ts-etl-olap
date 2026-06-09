import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::requireColumn', () => {
  it('returns an existing column', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const column = table.requireColumn("C1");

    expect(column).toBeDefined();
    expect(column.name).toBe("C1");
  });

  it('throws when column does not exist', () => {
    const table = buildTable();

    expect(() => {
      table.requireColumn("C1");
    }).toThrow();
  });

  it('retrieves a column regardless of casing', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "UserId", type: Number }));

    expect(
      table.requireColumn("userid")
    ).toBeDefined();

    expect(
      table.requireColumn("USERID")
    ).toBeDefined();

    expect(
      table.requireColumn("UsErId")
    ).toBeDefined();
  });

  it('preserves original column casing', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "UserId", type: Number }));

    expect(
      table.requireColumn("userid").name
    ).toBe("UserId");
  });
});