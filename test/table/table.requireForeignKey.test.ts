import { describe, it, expect } from 'vitest';
import { buildTable } from '../utils/buildSchema.js';

describe('Table::requireForeignKey', () => {
  function buildTableWithForeignKey() {
    return buildTable({
      columns: ["c1"],
      foreignKeys: [{
        name: "FK1",
        columns: ["c1"],
      }]
    });
  }

  it('returns the foreign key', () => {
    const table = buildTableWithForeignKey();

    expect(
      table.foreignKeys.requireByName("FK1")
    ).toBeDefined();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTableWithForeignKey();

    expect(
      table.foreignKeys.requireByName("fk1")
    ).toBeDefined();
  });

  it('throws when foreign key does not exist', () => {
    const table = buildTableWithForeignKey();

    expect(() => {
      table.foreignKeys.requireByName("fk2");
    }).toThrow();
  });
});