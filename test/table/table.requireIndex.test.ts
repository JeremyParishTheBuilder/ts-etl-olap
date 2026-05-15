import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Index } from '../../src/schema/Index.js';

describe('Table::requireIndex', () => {
  it('returns an existing index', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addIndex(
        Index.fromSpec({
          name: "I1",
          columns: ["C1"],
          unique: false,
        })
      );

    const index = table.requireIndex("I1");

    expect(index).toBeDefined();
    expect(index.name).toBe("I1");
  });

  it('throws when index does not exist', () => {
    const table = new Table("T1");

    expect(() => {
      table.requireIndex("I1");
    }).toThrow();
  });

  it('retrieves an index regardless of casing', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addIndex(
        Index.fromSpec({
          name: "UserLookup",
          columns: ["C1"],
          unique: false,
        })
      );

    expect(
      table.requireIndex("userlookup")
    ).toBeDefined();

    expect(
      table.requireIndex("USERLOOKUP")
    ).toBeDefined();

    expect(
      table.requireIndex("UsErLoOkUp")
    ).toBeDefined();
  });

  it('preserves original index casing', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addIndex(
        Index.fromSpec({
          name: "UserLookup",
          columns: ["C1"],
          unique: false,
        })
      );

    expect(
      table.requireIndex("userlookup").name
    ).toBe("UserLookup");
  });
});