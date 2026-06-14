import { describe, it, expect } from 'vitest';
import { buildTableWithForeignKey } from '../utils/buildSchema.js';

describe('Table::requireForeignKey', () => {
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