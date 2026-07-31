import { describe, it, expect } from 'vitest';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe("Table::renameUnique", () => {
  it("renames a unique constraint", () => {
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

    const updated = table.renameUnique(
      "UQ_Email",
      "UQ_Email_New"
    );

    expect(() => {
      updated.uniques.requireByName("UQ_Email");
    }).toThrow();

    expect(
      updated.uniques.requireByName("UQ_Email_New")
    ).toBeDefined();
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

    const updated = table.renameUnique(
      "UQ_Email",
      "UQ_Email_New"
    );

    expect(
      table.uniques.requireByName("UQ_Email")
    ).toBeDefined();

    expect(
      updated.uniques.requireByName("UQ_Email_New")
    ).toBeDefined();
  });

  it("returns same table when name is unchanged", () => {
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

    expect(
      table.renameUnique(
        "UQ_Email",
        "UQ_Email"
      )
    ).toBe(table);
  });

  it("throws when unique does not exist", () => {
    const table = buildTable();

    expect(() => {
      table.renameUnique(
        "Missing",
        "NewName"
      );
    }).toThrow();
  });

  it("throws when another constraint already has the new name", () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Email",
        type: String,
        nullable: false,
      }))
      .createIndex({
        name: "PK_Test",
        columns: ["Id"],
        unique: true,
      })
      .createPrimaryKey({
        name: "PK_Test",
        columns: ["Id"],
      })
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

    expect(() => {
      table.renameUnique(
        "UQ_Email",
        "PK_Test"
      );
    }).toThrow();
  });
});