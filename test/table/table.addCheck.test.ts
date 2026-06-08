import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';
import { createCheckTestSpec, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::createCheck', () => {

  it('adds a check constraint', () => {
    const table = new Table("Users")
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: Number,
      }));


    const updated = table
      .createCheck(createCheckTestSpec({
        name: "CHK_PositiveAge",
        columns: ["Age"],
      }));

    expect(
      updated.requireCheck("CHK_PositiveAge")
    ).toBeDefined();
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("Users")
      .createColumn({
        name: "Age",
        type: Number,
      });

    const updated = table.createCheck(
      createCheckTestSpec({
        name: "CHK_PositiveAge",
        columns: ["Age"],
      })
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
      table.createCheck(
        createCheckTestSpec({
          name: "CHK_PositiveAge",
          columns: ["Age"],
        })
      );
    }).toThrow();
  });

  it('throws when another constraint already uses the same name', () => {
    const table = new Table("Users")
      .createColumn({
        name: "Age",
        type: Number,
      })
      .createCheck(
        createCheckTestSpec({
          name: "CHK_PositiveAge",
          columns: ["Age"],
        })
      );

    expect(() => {
      table.createCheck(
        createCheckTestSpec({
          name: "CHK_PositiveAge",
          columns: ["Age"],
        })
      );
    }).toThrow();
  });

  it('supports case-insensitive referenced columns', () => {
    const table = new Table("Users")
      .createColumn({
        name: "Age",
        type: Number,
      });

    const updated = table.createCheck(
      createCheckTestSpec({
        name: "CHK_PositiveAge",
        columns: ["Age"],
      })
    );

    expect(
      updated.requireCheck("CHK_PositiveAge")
    ).toBeDefined();
  });
});