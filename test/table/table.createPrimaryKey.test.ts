import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Table::createPrimaryKey', () => {
  it('adds a primary key to the table', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      });

    const updated = table.createPrimaryKey({
      name: "PK_T1",
      index: "PK_T1",
    });

    expect(
      updated.requirePrimaryKey()
    ).toBeDefined();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      });

    const updated = table.createPrimaryKey({
      name: "PK_T1",
      index: "PK_T1",
    });

    expect(table.primaryKey).toBeUndefined();

    expect(
      updated.requirePrimaryKey()
    ).toBeDefined();
  });

  it('throws when a primary key already exists', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      })
      .createPrimaryKey({
        name: "PK_T1",
        index: "PK_T1",
      });

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T2",
        index: "PK_T1",
      });
    }).toThrow();
  });

  it('throws when referenced index does not exist', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }));

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T1",
        index: "PK_T1",
      });
    }).toThrow();
  });

  it('throws when primary key columns are nullable', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: true,
      }))
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      });

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T1",
        index: "PK_T1",
      });
    }).toThrow();
  });

  it('allows primary key name to match backing index name', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      });

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T1",
        index: "PK_T1",
      });
    }).not.toThrow();
  });

  it('throws when another constraint with the same name exists', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "OtherId",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "UQ_1",
        columns: ["OtherId"],
        unique: true,
      })
      .createIndex({
        name: "UQ_2",
        columns: ["Id"],
        unique: true,
      });

    expect(() => {
      table.createPrimaryKey({
        name: "UQ_1",
        index: "UQ_2",
      });
    }).toThrow();
  });

  it('throws when primary key index is not unique', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: false,
      });

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T1",
        index: "PK_T1",
      });
    }).toThrow();
  });
});