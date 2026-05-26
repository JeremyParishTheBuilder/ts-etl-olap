import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Check } from '../../src/schema/Check.js';
import { CONSTRAINT_KIND } from '../../src/schema/ConstraintKind.js';

describe('Table::removeCheck', () => {
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

  it('removes the check constraint', () => {
    const table = buildTable();

    const updated = table.removeCheck(
      "CHK_PositiveAge"
    );

    expect(() => {
      updated.requireCheck(
        "CHK_PositiveAge"
      );
    }).toThrow();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable();

    const updated = table.removeCheck(
      "CHK_PositiveAge"
    );

    expect(
      table.requireCheck(
        "CHK_PositiveAge"
      )
    ).toBeDefined();

    expect(() => {
      updated.requireCheck(
        "CHK_PositiveAge"
      );
    }).toThrow();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTable();

    const updated = table.removeCheck(
      "chk_positiveage"
    );

    expect(() => {
      updated.requireCheck(
        "CHK_PositiveAge"
      );
    }).toThrow();
  });

  it('throws when check constraint does not exist', () => {
    const table = new Table("Users");

    expect(() => {
      table.removeCheck("MissingCheck");
    }).toThrow();
  });
});