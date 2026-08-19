import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec, createIndexTestSpec } from '../utils/buildSchema.js';
import { SQL_DECIMAL } from '../../src/types/SqlType.js';

describe('Table::createIndex', () => {
  it('adds an index to the table', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: SQL_DECIMAL }));

    const updated = table.createIndex(createIndexTestSpec({
      name: "I1",
      columns: ["C1"],
      unique: false,
    }));

    expect(
      updated.indexes.requireByName("I1")
    ).toBeDefined();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: SQL_DECIMAL }));

    const updated = table.createIndex(createIndexTestSpec({
      name: "I1",
      columns: ["C1"],
      unique: false,
    }));

    expect(() => {
      table.indexes.requireByName("I1");
    }).toThrow();

    expect(
      updated.indexes.requireByName("I1")
    ).toBeDefined();
  });

  it('throws when index name already exists', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: SQL_DECIMAL }))
      .createIndex(createIndexTestSpec({
        name: "I1",
        columns: ["C1"],
        unique: false,
      }));

    expect(() => {
      table.createIndex(createIndexTestSpec({
        name: "I1",
        columns: ["C1"],
        unique: false,
      }));
    }).toThrow();
  });

  it('throws when index references missing columns', () => {
    const table = buildTable();

    expect(() => {
      table.createIndex(createIndexTestSpec({
        name: "I1",
        columns: ["C1"],
        unique: false,
      }));
    }).toThrow();
  });

  it('preserves original index name casing', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: SQL_DECIMAL }));

    const updated = table.createIndex(createIndexTestSpec({
      name: "UserLookup",
      columns: ["C1"],
      unique: false,
    }));

    expect(
      updated.indexes.requireByName("userlookup").name
    ).toBe("UserLookup");
  });

  it('throws when adding duplicate unique column set', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: SQL_DECIMAL }))
      .createIndex(createIndexTestSpec({
        name: "I1",
        columns: ["C1"],
        unique: true,
      }));

    expect(() => {
      table.createIndex(createIndexTestSpec({
        name: "I2",
        columns: ["C1"],
        unique: true,
      }));
    }).toThrow();
  });

  it('throws when existing rows violate uniqueness', () => {
    let table = buildTable()
      .createColumn(createColumnTestSpec({ name: "C1", type: SQL_DECIMAL }));

    table = table.addRows([
      [1],
      [1],
    ]);

    expect(() => {
      table.createIndex(createIndexTestSpec({
        name: "UserLookup",
        columns: ["C1"],
        unique: true,
      }))
    }).toThrow();
  });
});