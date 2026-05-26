import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { Check } from '../../src/schema/Check.js';
import { CONSTRAINT_KIND } from '../../src/schema/ConstraintKind.js';

describe('Table::addCheck', () => {
  function buildCheck(): Check {
    return Check.fromSpec({
      kind: CONSTRAINT_KIND.check,
      name: "CHK_PositiveAge",
      columns: ["Age"],
      expression: undefined,
    });
  }

  it('adds a check constraint', () => {
    const table = new Table("Users")
      .addColumn({
        name: "Age",
        type: Number,
      });

    const updated = table.addCheck(
      buildCheck()
    );

    expect(
      updated.requireCheck("CHK_PositiveAge")
    ).toBeDefined();
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("Users")
      .addColumn({
        name: "Age",
        type: Number,
      });

    const updated = table.addCheck(
      buildCheck()
    );

    expect(() => {
      table.requireCheck("CHK_PositiveAge");
    }).toThrow();

    expect(
      updated.requireCheck("CHK_PositiveAge")
    ).toBeDefined();
  });

  it('throws when referenced columns do not exist', () => {
    const table = new Table("Users");

    expect(() => {
      table.addCheck(
        buildCheck()
      );
    }).toThrow();
  });

  it('throws when another constraint already uses the same name', () => {
    const table = new Table("Users")
      .addColumn({
        name: "Age",
        type: Number,
      })
      .addCheck(
        buildCheck()
      );

    expect(() => {
      table.addCheck(
        buildCheck()
      );
    }).toThrow();
  });

  it('supports case-insensitive referenced columns', () => {
    const table = new Table("Users")
      .addColumn({
        name: "Age",
        type: Number,
      });

    const updated = table.addCheck(
      Check.fromSpec({
        kind: CONSTRAINT_KIND.check,
        name: "CHK_PositiveAge",
        columns: ["age"],
        expression: undefined,
      })
    );

    expect(
      updated.requireCheck("CHK_PositiveAge")
    ).toBeDefined();
  });
});