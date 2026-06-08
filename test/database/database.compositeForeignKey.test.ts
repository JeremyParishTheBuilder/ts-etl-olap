import { describe, it, expect } from 'vitest';
import { Database } from "../../src/schema/Database.js";
import { Table } from "../../src/schema/Table.js";
import { testColumnId } from '../utils/testIds.js';
import { createColumnTestSpec } from '../utils/buildSchema.js';

describe('Composite Foreign Keys', () => {

  it('rejects foreign keys whose parent columns lack an exact ordered unique index', () => {
    const parent = new Table("Parent")
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
      }))
      .createIndex({
        name: "IDX_Parent",
        columns: ["B", "A"],
        unique: true,
      });

    expect(() =>
      new Database("DB1")
        .addTable(parent)
        .addTable(
          new Table("Child")
            .createColumn(createColumnTestSpec({
              name: "FA",
              type: Number,
            }))
            .createColumn(createColumnTestSpec({
              name: "FB",
              type: Number,
            }))
            .createIndex({
            name: "FKRI_CHILD",
            columns: ["FA", "FB"],
            unique: false,
          })
        )
        .createForeignKey(
          "Child",
          {
            name: "FK1",
            columns: ["FA", "FB"],
            reverseIndex: "FKRI_CHILD",
            parentTable: "Parent",
            parentColumns: ["A", "B"],
          }
        )
    ).toThrow();
  });

  it('allows inserting rows with valid composite foreign keys', () => {
    let parent = new Table("Parent")
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
      }))
      .createIndex({
        name: "PK_Parent",
        columns: ["A", "B"],
        unique: true,
      });

    parent = parent.addRow([1, 2]);

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(
        new Table("Child")
          .createColumn(createColumnTestSpec({
            name: "FA",
            type: Number,
          }))
          .createColumn(createColumnTestSpec({
            name: "FB",
            type: Number,
          }))
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["FA", "FB"],
            unique: false,
          })
      );

    db = db.createForeignKey(
      "Child",
      {
        name: "FK1",
        columns: ["FA", "FB"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "Parent",
        parentColumns: ["A", "B"],
      }
    );

    db = db.addRow(
      "Child",
      [1, 2],
    );

    expect(
      db
        .requireTable("Child")
        .requireRow(0)
    ).toEqual([1, 2]);
  });

  it('rejects inserting rows with invalid composite foreign keys', () => {
    let parent = new Table("Parent")
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
      }))
      .createIndex({
        name: "PK_Parent",
        columns: ["A", "B"],
        unique: true,
      });

    parent = parent.addRow([1, 2]);

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(
        new Table("Child")
          .createColumn(createColumnTestSpec({
            name: "FA",
            type: Number,
          }))
          .createColumn(createColumnTestSpec({
            name: "FB",
            type: Number,
          }))
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["FA", "FB"],
            unique: false,
          })
      );

    db = db.createForeignKey(
      "Child",
      {
        name: "FK1",
        columns: ["FA", "FB"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "Parent",
        parentColumns: ["A", "B"],
      }
    );

    expect(() =>
      db.addRow(
        "Child",
        [1, 999],
      )
    ).toThrow();
  });

  it('rejects partial composite matches', () => {
    let parent = new Table("Parent")
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
      }))
      .createIndex({
        name: "PK_Parent",
        columns: ["A", "B"],
        unique: true,
      });

    parent = parent.addRow([1, 2]);
    parent = parent.addRow([3, 4]);

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(
        new Table("Child")
          .createColumn(createColumnTestSpec({
            name: "FA",
            type: Number,
          }))
          .createColumn(createColumnTestSpec({
            name: "FB",
            type: Number,
          }))
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["FA", "FB"],
            unique: false,
          })
      );

    db = db.createForeignKey(
      "Child",
      {
        name: "FK1",
        columns: ["FA", "FB"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "Parent",
        parentColumns: ["A", "B"],
      }
    );

    expect(() =>
      db.addRow(
        "Child",
        [1, 4],
      )
    ).toThrow();
  });

  it('allows updating to another valid composite foreign key', () => {
    let parent = new Table("Parent")
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
      }))
      .createIndex({
        name: "PK_Parent",
        columns: ["A", "B"],
        unique: true,
      });

    parent = parent.addRow([1, 2]);
    parent = parent.addRow([3, 4]);

    let child = new Table("Child")
      .createColumn(createColumnTestSpec({
        name: "FA",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "FB",
        type: Number,
      }))
      .createIndex({
        name: "FKRI_CHILD",
        columns: ["FA", "FB"],
        unique: false,
      });

    child = child.addRow([1, 2]);

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(child);

    db = db.createForeignKey(
      "Child",
      {
        name: "FK1",
        columns: ["FA", "FB"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "Parent",
        parentColumns: ["A", "B"],
      }
    );

    const updates = [3, 4];

    const updated = db.updateRow(
      "Child",
      0,
      updates,
    );

    expect(
      updated
        .requireTable("Child")
        .requireRow(0)
    ).toEqual([3, 4]);
  });

  it('rejects updating to invalid composite foreign key', () => {
    let parent = new Table("Parent")
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
      }))
      .createIndex({
        name: "PK_Parent",
        columns: ["A", "B"],
        unique: true,
      });

    parent = parent.addRow([1, 2]);

    let child = new Table("Child")
      .createColumn(createColumnTestSpec({
        name: "FA",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "FB",
        type: Number,
      }))
      .createIndex({
        name: "FKRI_CHILD",
        columns: ["FA", "FB"],
        unique: false,
      });

    child = child.addRow([1, 2]);

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(child);

    db = db.createForeignKey(
      "Child",
      {
        name: "FK1",
        columns: ["FA", "FB"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "Parent",
        parentColumns: ["A", "B"],
      }
    );

    const updates = [5, 6];

    expect(() =>
      db.updateRow(
        "Child",
        0,
        updates,
      )
    ).toThrow();
  });

  it('rejects parent updates that orphan composite child rows', () => {
    let parent = new Table("Parent")
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
      }))
      .createIndex({
        name: "PK_Parent",
        columns: ["A", "B"],
        unique: true,
      });

    parent = parent.addRow([1, 2]);

    let child = new Table("Child")
      .createColumn(createColumnTestSpec({
        name: "FA",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "FB",
        type: Number,
      }))
      .createIndex({
        name: "FKRI_CHILD",
        columns: ["FA", "FB"],
        unique: false,
      });

    child = child.addRow([1, 2]);

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(child);

    db = db.createForeignKey(
      "Child",
      {
        name: "FK1",
        columns: ["FA", "FB"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "Parent",
        parentColumns: ["A", "B"],
      }
    );

    const updates = [9, 9];

    expect(() =>
      db.updateRow(
        "Parent",
        0,
        updates,
      )
    ).toThrow();
  });

  it('bypasses validation when any composite foreign key component is NULL', () => {
    let parent = new Table("Parent")
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
      }))
      .createIndex({
        name: "PK_Parent",
        columns: ["A", "B"],
        unique: true,
      });

    parent = parent.addRow([1, 2]);

    let db = new Database("DB1")
      .addTable(parent)
      .addTable(
        new Table("Child")
          .createColumn(createColumnTestSpec({
            name: "FA",
            type: Number,
          }))
          .createColumn(createColumnTestSpec({
            name: "FB",
            type: Number,
          }))
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["FA", "FB"],
            unique: false,
          })
      );

    db = db.createForeignKey(
      "Child",
      {
        name: "FK1",
        columns: ["FA", "FB"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "Parent",
        parentColumns: ["A", "B"],
      }
    );

    expect(() =>
      db.addRow(
        "Child",
        [1, null],
      )
    ).not.toThrow();
  });

  it('requires exact ordered parent index match for composite foreign keys', () => {
    const parent = new Table("Parent")
      .createColumn(createColumnTestSpec({
        name: "A",
        type: Number,
      }))
      .createColumn(createColumnTestSpec({
        name: "B",
        type: Number,
      }))
      .createIndex({
        name: "IDX_Parent",
        columns: ["B", "A"],
        unique: true,
      });

    expect(() =>
      new Database("DB1")
        .addTable(parent)
        .addTable(
          new Table("Child")
            .createColumn(createColumnTestSpec({
              name: "FA",
              type: Number,
            }))
            .createColumn(createColumnTestSpec({
              name: "FB",
              type: Number,
            }))
            .createIndex({
              name: "FKRI_CHILD",
              columns: ["FA", "FB"],
              unique: false,
            })
        )
        .createForeignKey(
          "Child",
          {
            name: "FK1",
            columns: ["FA", "FB"],
            reverseIndex: "FKRI_CHILD",
            parentTable: "Parent",
            parentColumns: ["A", "B"],
          }
        )
    ).toThrow();
  });

});