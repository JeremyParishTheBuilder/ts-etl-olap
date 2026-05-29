import { describe, it, expect } from 'vitest';
import { Table } from "../../src/schema/Table.js";

describe('Table::removeRow', () => {

  it('marks a row as not alive', () => {
    let table = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    table = table.addRow([1]);

    const updated = table.removeRow(0);

    expect(updated.isRowAlive(0)).toBe(false);
  });

  it('removes row entries from indexes', () => {
    let table = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRow(["a@test.com"]);

    const updated = table.removeRow(0);

    const index =
      updated.requireIndex("UQ_Email");

    expect(
      index.hasProjectedValues(["a@test.com"])
    ).toBe(false);
  });

  it('preserves unrelated index entries', () => {
    let table = new Table("Users")
      .addColumn({
        name: "email",
        type: String,
      })
      .createIndex({
        name: "UQ_Email",
        columns: ["email"],
        unique: true,
      });

    table = table.addRow(["a@test.com"]);
    table = table.addRow(["b@test.com"]);
    table = table.addRow(["c@test.com"]);

    const updated = table.removeRow(1);

    const index =
      updated.requireIndex("UQ_Email");

    expect(
      index.hasProjectedValues(["a@test.com"])
    ).toBe(true);

    expect(
      index.hasProjectedValues(["b@test.com"])
    ).toBe(false);

    expect(
      index.hasProjectedValues(["c@test.com"])
    ).toBe(true);
  });

  it('preserves row numbers of remaining rows', () => {
    let table = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    table = table.addRow([1]);
    table = table.addRow([2]);
    table = table.addRow([3]);

    const updated = table.removeRow(1);

    expect(
      updated.requireRowView(0).index
    ).toBe(0);

    expect(
      updated.requireRowView(2).index
    ).toBe(2);
  });

  it('rejects removing already deleted rows', () => {
    let table = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    table = table.addRow([1]);

    table = table.removeRow(0);

    expect(() =>
      table.removeRow(0)
    ).toThrow();
  });

  it('rejects invalid row indexes', () => {
    const table = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    expect(() =>
      table.removeRow(99)
    ).toThrow();
  });

  it('prevents deleted rows from being fetched', () => {
    let table = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    table = table.addRow([1]);

    const updated = table.removeRow(0);

    expect(
      updated.getRow(0)
    ).toBeUndefined();

    expect(() =>
      updated.requireRow(0)
    ).toThrow();

    expect(
      updated.getRowView(0)
    ).toBeUndefined();

    expect(() =>
      updated.requireRowView(0)
    ).toThrow();
  });

  it('prevents deleted rows from being iterated', () => {
    let table = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    table = table.addRow([1]);
    table = table.addRow([2]);
    table = table.addRow([3]);

    const updated = table.removeRow(1);

    const rows = [
      ...updated.iterateAliveRows(),
    ];

    expect(rows).toEqual([
      {
        index: 0,
        values: [1],
      },
      {
        index: 2,
        values: [3],
      },
    ]);
  });

  it('preserves immutable table state during removal', () => {
    let table = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    table = table.addRow([1]);

    const updated = table.removeRow(0);

    expect(
      table.requireRow(0)
    ).toEqual([1]);

    expect(
      updated.getRow(0)
    ).toBeUndefined();

    expect(updated).not.toBe(table);
    expect(updated.columns).toBe(table.columns);
    expect(updated.rowAlive).not.toBe(table.rowAlive);
  });

  it('does not decrement numRows after deletion', () => {
    let table = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    table = table.addRow([1]);

    expect(table.numRows).toBe(1);

    const updated = table.removeRow(0);

    expect(updated.numRows).toBe(1);
  });

  it('allows new rows after deletion using new row numbers', () => {
    let table = new Table("Users")
      .addColumn({
        name: "id",
        type: Number,
      });

    table = table.addRow([1]);
    table = table.addRow([2]);

    table = table.removeRow(0);

    const updated = table.addRow([3]);

    expect(
      updated.requireRowView(2)
    ).toEqual({
      index: 2,
      values: [3],
    });
  });

});