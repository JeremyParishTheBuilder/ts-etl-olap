import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Index } from '../../src/schema/Index.js';

describe('Table::removeIndex', () => {
  it('removes an index from the table', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addIndex(
        Index.fromSpec({
          name: "I1",
          columns: ["C1"],
          unique: false,
        })
      );

    const updated = table.removeIndex("I1");

    expect(() => {
      updated.requireIndex("I1");
    }).toThrow();
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .addColumn({ name: "C1", type: Number })
      .addIndex(
        Index.fromSpec({
          name: "I1",
          columns: ["C1"],
          unique: false,
        })
      );

    const updated = table.removeIndex("I1");

    expect(
      table.requireIndex("I1")
    ).toBeDefined();

    expect(() => {
      updated.requireIndex("I1");
    }).toThrow();
  });

  it('throws when removing non-existent index', () => {
    const table = new Table("T1");

    expect(() => {
      table.removeIndex("I1");
    }).toThrow();
  });
});