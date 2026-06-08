import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { buildTable, createCheckTestSpec } from '../utils/buildSchema.js';

describe('Table::requireCheck', () => {

  it('returns the check constraint', () => {
    const table = buildTable({
      columns: ["Age"]
    })
    .createCheck(createCheckTestSpec({
      name: "CHK_PositiveAge",
      columns: ["Age"]
    }));

    expect(
      table.requireCheck("CHK_PositiveAge")
    ).toBeDefined();
  });

  it('supports case-insensitive lookup', () => {
    const table = buildTable({
      columns: ["Age"]
    });

    const tableWithCheck = table
    .createCheck(createCheckTestSpec({
      name: "CHK_PositiveAge",
      columns: ["Age"]
    }));

    console.log(tableWithCheck);
    console.log(tableWithCheck.requireCheck("chk_positiveage"));

    expect(
      tableWithCheck.requireCheck("chk_positiveage")
    ).toBeDefined();
  });

  it('throws when check constraint does not exist', () => {
    const table = new Table("Users");

    expect(() => {
      table.requireCheck("MissingCheck");
    }).toThrow();
  });
});