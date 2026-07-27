import { describe, it, expect } from 'vitest';
import { buildTable } from '../utils/buildSchema.js';


describe('Table::requireUnique', () => {
  it('returns the unique constraint', () => {
    const table = buildTable()
      .createColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "I1",
        columns: ["Id"],
        unique: true,
      })
      .createUnique({
        name: "U1",
        indexName: "I1",
        ownsIndex: true,
      });

    expect(
      table.uniques.requireByName("U1")
    ).toBeDefined();
  });

  it('throws when unique exists', () => {
    const table = buildTable();

    expect(() => {
      table.uniques.requireByName("U1");
    }).toThrow();
  });
});