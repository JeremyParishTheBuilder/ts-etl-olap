import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { buildTable } from '../utils/buildSchema.js';

describe('Table::removeCheck', () => {
  function buildTableWithCheck(): Table {
    return buildTable()
      .createColumn({
        name: "Age",
        type: Number,
      })
      .createCheck({
        name: "CHK_PositiveAge",
        columns: ["Age"],
        expression: undefined,
      });
  }

  it('removes the check constraint', () => {
    const table = buildTableWithCheck();

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
    const table = buildTableWithCheck();

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
    const table = buildTableWithCheck();

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
    const table = buildTableWithCheck();

    expect(() => {
      table.removeCheck("MissingCheck");
    }).toThrow();
  });
});