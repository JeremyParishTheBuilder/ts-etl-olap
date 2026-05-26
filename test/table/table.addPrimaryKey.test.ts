import { describe, it, expect } from 'vitest';
import { Table } from '../../src/schema/Table.js';

describe('Table::addPrimaryKey', () => {
  it('adds a primary key to the table', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      });

    const updated = table.createPrimaryKey({
      name: "PK_T1",
      columns: ["Id"],
      index: "PK_T1",
    });

    expect(
      updated.requirePrimaryKey()
    ).toBeDefined();
  });

  it('does not mutate original table (immutability)', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      });

    const updated = table.createPrimaryKey({
      name: "PK_T1",
      columns: ["Id"],
      index: "PK_T1",
    });

    expect(table.primaryKey).toBeUndefined();

    expect(
      updated.requirePrimaryKey()
    ).toBeDefined();
  });

  it('throws when a primary key already exists', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      })
      .createPrimaryKey({
        name: "PK_T1",
        columns: ["Id"],
        index: "PK_T1",
      });

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T2",
        columns: ["Id"],
        index: "PK_T1",
      });
    }).toThrow();
  });

  it('throws when referenced index does not exist', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      });

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T1",
        columns: ["Id"],
        index: "PK_T1",
      });
    }).toThrow();
  });

  it('throws when primary key columns are nullable', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: true,
      })
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      });

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T1",
        columns: ["Id"],
        index: "PK_T1",
      });
    }).toThrow();
  });

  it('normalizes referenced column names', () => {
    const table = new Table("T1")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_T1",
        columns: ["UserId"],
        unique: true,
      });

    const updated = table.createPrimaryKey({
      name: "PK_T1",
      columns: ["UserId"],
      index: "PK_T1",
    });

    expect(
      updated.requirePrimaryKey().columns
    ).toEqual(["userid"]);
  });

  it('allows primary key name to match backing index name', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: true,
      });

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T1",
        columns: ["Id"],
        index: "PK_T1",
      });
    }).not.toThrow();
  });

  it('throws when another constraint with the same name exists', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .addColumn({
        name: "OtherId",
        type: Number,
        nullable: false,
      })
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
        columns: ["Id"],
        index: "UQ_2",
      });
    }).toThrow();
  });

  it('throws when primary key index is not unique', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_T1",
        columns: ["Id"],
        unique: false,
      });

    expect(() => {
      table.createPrimaryKey({
        name: "PK_T1",
        columns: ["Id"],
        index: "PK_T1",
      });
    }).toThrow();
  });

  it('throws when columns do not match index columns', () => {
    const table = new Table("T1")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .addColumn({
        name: "OtherId",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "UQ_1",
        columns: ["Id"],
        unique: true,
      });

    expect(() => {
      table.createPrimaryKey({
        name: "UQ_1",
        columns: ["OtherId"],
        index: "UQ_1",
      });
    }).toThrow();
  });
});