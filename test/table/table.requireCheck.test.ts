import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Check } from '../../src/schema/Check.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Table::requireCheck', () => {
  function buildTable(): Table {
    return new Table("Users")
      .addColumn({
        name: "Age",
        type: Number,
      })
      .addCheck(
        Check.fromSpec({
          kind: CONSTRAINT_KIND.check,
          name: "CHK_PositiveAge",
          columns: ["Age"],
          expression: undefined,
        })
      );
  }

  it('returns the check constraint', () => {
    const table = buildTable();

    expect(
      table.requireCheck("CHK_PositiveAge")
    ).toBeDefined();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTable();

    expect(
      table.requireCheck("chk_positiveage")
    ).toBeDefined();
  });

  it('throws when check constraint does not exist', () => {
    const table = new Table("Users");

    expect(() => {
      table.requireCheck("MissingCheck");
    }).toThrow();
  });
});