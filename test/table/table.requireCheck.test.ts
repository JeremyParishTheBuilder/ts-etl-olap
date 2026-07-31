import { describe, it, expect } from 'vitest';
import { buildTable, createCheckTestSpec } from '../utils/buildSchema.js';

describe('Table::requireCheck', () => {

  it('returns the check constraint', () => {
    const table = buildTable({
      columns: ["Age"]
    })
    .createCheck(createCheckTestSpec({
      name: "CHK_PositiveAge",
    }));

    expect(
      table.checks.requireByName("CHK_PositiveAge")
    ).toBeDefined();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTable({
      columns: ["Age"]
    });

    const tableWithCheck = table
    .createCheck(createCheckTestSpec({
      name: "CHK_PositiveAge",
    }));

    expect(
      tableWithCheck.checks.requireByName("chk_positiveage")
    ).toBeDefined();
  });

  it('throws when check constraint does not exist', () => {
    const table = buildTable();

    expect(() => {
      table.checks.requireByName("MissingCheck");
    }).toThrow();
  });
});