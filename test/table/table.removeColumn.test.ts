import { describe, it, expect } from 'vitest';
import { buildTable, createCheckTestSpec } from '../utils/buildSchema.js';
import { ColumnExpressionNode } from '../../src/ast/expression/ColumnExpressionNode.js';
import { LiteralExpressionNode } from '../../src/ast/expression/LiteralExpressionNode.js';
import { ComparisonPredicateNode } from '../../src/ast/predicate/ComparisonPredicateNode.js';

describe('Table::removeColumn', () => {
  it('removes a column from the table', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number });

    const updated = table.removeColumn("C1");

    expect(() => updated.columns.requireByName("C1")).toThrow();
    expect(updated.columns.requireByName("C2")).toBeDefined();
  });

  it('reindexes remaining columns', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number })
      .createColumn({ name: "C3", type: Number });

    const updatedTable = table.removeColumn("C2");

    expect(updatedTable.columns.requireByName("C1").position).toBe(0);
    expect(updatedTable.columns.requireByName("C3").position).toBe(1);
  });

  it('preserves row values for remaining columns', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number });

    const withRow = table.addRows([
      [1, 2],
    ]);
    const updated = withRow.removeColumn("C1");

    const row = updated.requireRow(0);

    expect(row).toEqual([2]);
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number });

    const updatedTable = table.removeColumn("C1");

    expect(table.columns.requireByName("C1")).toBeDefined();
    expect(() => updatedTable.columns.requireByName("C1")).toThrow();
  });

  it('throws when removing non-existent column', () => {
    const table = buildTable();

    expect(() => {
      table.removeColumn("C1");
    }).toThrow();
  });

  it('throws if column is not droppable (constraint/index referenced)', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1"],
        unique: true,
      });

    expect(() => {
      table.removeColumn("C1");
    }).toThrow();
  });

  it('updates projected index bindings after column removal', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number })
      .createColumn({ name: "C3", type: Number })
      .createIndex({
        name: "IDX1",
        columns: ["C1", "C3"],
      });

    const updated = table.removeColumn("C2");

    const index =
      updated.indexes.requireByName("IDX1");

    expect(
      index.projectValues([10, 30])
    ).toEqual([10, 30]);
  });

  it('updates indexes` column position indexes', () => {
    const table = buildTable()
      .createColumn({ name: "C1", type: Number })
      .createColumn({ name: "C2", type: Number })
      .createColumn({ name: "C3", type: Number })
      .createIndex({
        name: "I1",
        columns: ["C1", "C3"],
        unique: true,
      });

    const index = table.indexes.requireByName("I1");

    expect(
      index.projectValues([10, 20, 30])
    ).toEqual([10, 30]);

    const updatedTable = table.removeColumn("C2");

    const updatedIndex = updatedTable.indexes.requireByName("I1");

    expect(
      updatedIndex.projectValues([10, 30])
    ).toEqual([10, 30]);
  });

  it('preserves unrelated indexes during column removal', () => {
    const table = buildTable()
      .createColumn({
        name: "C1",
        type: Number,
      })
      .createColumn({
        name: "C2",
        type: Number,
      })
      .createColumn({
        name: "C3",
        type: Number,
      })
      .createIndex({
        name: "IDX1",
        columns: ["C1"],
      })
      .createIndex({
        name: "IDX2",
        columns: ["C3"],
      });

    const updated = table.removeColumn("C2");

    expect(
      updated.indexes.requireByName("IDX1")
    ).toBeDefined();

    expect(
      updated.indexes.requireByName("IDX2")
    ).toBeDefined();
  });

  it('rejects removing columns referenced by checks', () => {
    const table = buildTable()
      .createColumn({
        name: "C1",
        type: Number,
      })
      .createCheck(createCheckTestSpec({
        name: "CHK_Adult",
        predicate: new ComparisonPredicateNode(
          new ColumnExpressionNode("C1"),
          "gte",
          new LiteralExpressionNode(18),
        ),
      }));

    expect(() => {
      table.removeColumn("C1");
    }).toThrow();
  });
});