import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Check } from '../../src/schema/Check.js';
import { CONSTRAINT_KIND } from '../../src/schema/ConstraintKind.js';

describe('Table::renameCheck', () => {
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

  it('renames the check constraint', () => {
    const table = buildTable();

    const updated = table.renameCheck(
      "CHK_PositiveAge",
      "CHK_AdultAge"
    );

    expect(
      updated.requireCheck(
        "CHK_AdultAge"
      )
    ).toBeDefined();
  });

  it('removes old check name', () => {
    const table = buildTable();

    const updated = table.renameCheck(
      "CHK_PositiveAge",
      "CHK_AdultAge"
    );

    expect(() => {
      updated.requireCheck(
        "CHK_PositiveAge"
      );
    }).toThrow();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable();

    const updated = table.renameCheck(
      "CHK_PositiveAge",
      "CHK_AdultAge"
    );

    expect(
      table.requireCheck(
        "CHK_PositiveAge"
      )
    ).toBeDefined();

    expect(
      updated.requireCheck(
        "CHK_AdultAge"
      )
    ).toBeDefined();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTable();

    const updated = table.renameCheck(
      "chk_positiveage",
      "CHK_AdultAge"
    );

    expect(
      updated.requireCheck(
        "CHK_AdultAge"
      )
    ).toBeDefined();
  });

  it('throws when check constraint does not exist', () => {
    const table = new Table("Users");

    expect(() => {
      table.renameCheck(
        "MissingCheck",
        "CHK_New"
      );
    }).toThrow();
  });

  it('throws when another constraint already uses the new name', () => {
    const table = buildTable()
      .addCheck(
        Check.fromSpec({
          kind: CONSTRAINT_KIND.check,
          name: "CHK_AdultAge",
          columns: ["Age"],
          expression: undefined,
        })
      );

    expect(() => {
      table.renameCheck(
        "CHK_PositiveAge",
        "CHK_AdultAge"
      );
    }).toThrow();
  });

  it('returns same table when renaming to same name', () => {
    const table = buildTable();

    const updated = table.renameCheck(
      "CHK_PositiveAge",
      "CHK_PositiveAge"
    );

    expect(updated).toBe(table);
  });
});