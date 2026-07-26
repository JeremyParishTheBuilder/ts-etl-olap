import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe("Table::removeUnique", () => {
  it("removes a unique constraint", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: String,
        nullable: false,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
      })
      .createUnique({
        name: "UQ_Email",
        indexName: "UQ_Email",
        ownsIndex: false,
      });

    const updated = table.removeUnique("UQ_Email");

    expect(() => {
      updated.uniques.requireByName("UQ_Email");
    }).toThrow();
  });

  it("does not mutate original table (immutability)", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: String,
        nullable: false,
      }))
      .createIndex({
        name: "UQ_Email",
        columns: ["Email"],
        unique: true,
      })
      .createUnique({
        name: "UQ_Email",
        indexName: "UQ_Email",
        ownsIndex: false,
      });

    const updated = table.removeUnique("UQ_Email");

    expect(
      table.uniques.requireByName("UQ_Email")
    ).toBeDefined();

    expect(() => {
      updated.uniques.requireByName("UQ_Email");
    }).toThrow();
  });

  it("throws when unique does not exist", () => {
    const table = buildTable();

    expect(() => {
      table.removeUnique("Missing");
    }).toThrow();
  });
});