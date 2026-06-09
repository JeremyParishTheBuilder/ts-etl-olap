import { describe, it, expect } from 'vitest';
import { buildTable, createCheckTestSpec, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::renameCheck', () => {
  function buildTableWithCheck() {
    return buildTable()
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: Number,
      }))
      .createCheck(
        createCheckTestSpec({
          name: "CHK_PositiveAge",
          columns: ["Age"],
          expression: undefined,
        })
      );
  }

  it('renames the check constraint', () => {
    const table = buildTableWithCheck();

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
    const table = buildTableWithCheck();

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
    const table = buildTableWithCheck();

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
    const table = buildTableWithCheck();

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
    const table = buildTableWithCheck();

    expect(() => {
      table.renameCheck(
        "MissingCheck",
        "CHK_New"
      );
    }).toThrow();
  });

  it('throws when another constraint already uses the new name', () => {
    const table = buildTableWithCheck()
      .createCheck(
        createCheckTestSpec({
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
    const table = buildTableWithCheck();

    const updated = table.renameCheck(
      "CHK_PositiveAge",
      "CHK_PositiveAge"
    );

    expect(updated).toBe(table);
  });
});