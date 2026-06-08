import { describe, it, expect, } from 'vitest';
import { Table } from "../../src/schema/Table.js";
import { buildTable, createColumnTestSpec, } from '../utils/buildSchema.js';

describe('Table::addColumn', () => {

  it('adds a column to an empty table', () => {
    const table = new Table("T1");

    const updated = table.createColumn(createColumnTestSpec({
      name: "C1",
      type: Number,
    }));

    const col = updated.requireColumn("C1");

    expect(col).toBeDefined();
    expect(col.position).toBe(0);
  });

  it('assigns increasing column positions', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }))
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    expect(table.requireColumn("C1").position).toBe(0);
    expect(table.requireColumn("C2").position).toBe(1);
  });

  it('does not mutate the original table (immutability)', () => {
    const table = new Table("T1");

    const updated = table.createColumn(createColumnTestSpec({
      name: "C1",
      type: Number,
    }));

    expect(() => table.requireColumn("C1")).toThrow();
    expect(updated.requireColumn("C1")).toBeDefined();
  });

  it('throws when adding a duplicate column name', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    expect(() => {
      table.createColumn(createColumnTestSpec({ name: "C1", type: Number }));
    }).toThrow();
  });

  it('preserves existing columns when adding a new one', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const updated = table.createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    expect(updated.requireColumn("C1").position).toBe(0);
    expect(updated.requireColumn("C2").position).toBe(1);
  });

  it('throws when adding duplicate column names with different casing', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({ name: "UserId", type: Number }));

    expect(() => {
      table.createColumn(createColumnTestSpec({ name: "userid", type: Number }));
    }).toThrow();
  });

  it('throws when adding a non-nullable column without default to a populated table', () => {
    const table = new Table("T1")
      .createColumn(createColumnTestSpec({
        name: "C1",
        type: Number,
      }));

    const withRow = table.addRow([
      1
    ]);

    expect(() => {
      withRow.createColumn(createColumnTestSpec({
        name: "C2",
        type: Number,
        nullable: false,
      }));
    }).toThrow();
  });

  it('allows adding a non-nullable column without default to an empty table', () => {
    const table = new Table("T1");

    const updated = table.createColumn({
      name: "C1",
      type: Number,
      nullable: false,
    });

    expect(
      updated.requireColumn("C1")
    ).toBeDefined();
  });

  it('allows adding a non-nullable column with default to a populated table', () => {
    const table = new Table("T1")
      .createColumn({
        name: "C1",
        type: Number,
      });

    const withRow = table.addRow([
      1
    ]);

    const updated = withRow.createColumn({
      name: "C2",
      type: Number,
      nullable: false,
      defaultValue: 0,
    });

    expect(
      updated.requireColumn("C2")
    ).toBeDefined();
  });

  it('allows falsy default values when adding non-nullable columns', () => {
    const table = buildTable({columns: 1});

    const withRow = table.addRow([
      1
    ]);

    expect(() => {
      withRow.createColumn(createColumnTestSpec({
        name: "C2",
        type: Number,
        nullable: false,
        defaultValue: 0,
      }));
    }).not.toThrow();
  });
});