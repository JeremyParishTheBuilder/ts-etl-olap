import { describe, it, expect } from "vitest";
import {
  buildDatabase,
  buildTable,
  createColumnTestSpec,
  createDelete,
  createUpdate
} from "../utils/buildSchema.js";

describe("Database Referential Actions", () => {

  it("rejects deleting parent row under RESTRICT", () => {
    const parent = buildTable({name: "Parent"})
      .createColumn(createColumnTestSpec({ name: "ID", type: Number }))
      .createIndex({
        name: "PK_PARENT",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1]);

    const child = buildTable({name: "Child"})
      .createColumn(createColumnTestSpec({ name: "ParentID", type: Number }))
      .createIndex({
        name: "FKRI_Id",
        columns: ["ParentID"],
        unique: false,
      })
      .addRow([1]);

    const db = buildDatabase()
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          reverseIndex: "FKRI_Id",
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: "restrict",
          onUpdate: "restrict",
        }
      );

    expect(() =>
      db.removeRows("Parent", [createDelete(parent, 0)])
    ).toThrow();
  });

  it("cascades delete to child rows", () => {
    const parent = buildTable({name: "Parent"})
      .createColumn(createColumnTestSpec({ name: "ID", type: Number }))
      .createIndex({
        name: "PK_PARENT",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1]);

    const child = buildTable({name: "Child"})
      .createColumn(createColumnTestSpec({ name: "ParentID", type: Number }))
      .createIndex({
        name: "FKRI_Id",
        columns: ["ParentID"],
        unique: false,
      })
      .addRow([1]);

    const db = buildDatabase()
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          reverseIndex: "FKRI_Id",
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: "cascade",
          onUpdate: "restrict",
        }
      );

    const updated = db.removeRows("Parent", [createDelete(parent, 0)]);

    expect(
      updated.tables.requireByName("Child").rowAlive[0]
    ).toBe(false);
  });

  it("sets child foreign key values to null during SET NULL delete", () => {
    const parent = buildTable({name: "Parent"})
      .createColumn(createColumnTestSpec({ name: "ID", type: Number }))
      .createIndex({
        name: "PK_Roles",
        columns: ["id"],
        unique: true,
      })
      .addRow([1]);

    const child = buildTable({name: "Child"})
      .createColumn(createColumnTestSpec({
        name: "ParentID",
        type: Number,
        nullable: true,
      }))
      .createIndex({
        name: "FKRI_Id",
        columns: ["ParentID"],
        unique: false,
      })
      .addRow([1]);

    const db = buildDatabase()
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          reverseIndex: "FKRI_Id",
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: "setNull",
          onUpdate: "restrict",
        }
      );

    const updated = db.removeRows("Parent", [createDelete(parent, 0)]);

    expect(
      updated.tables.requireByName("Child").requireRow(0)
    ).toEqual([null]);
  });

  it("cascades updates to child rows", () => {
    const parent = buildTable({name: "Parent"})
      .createColumn(createColumnTestSpec({ name: "ID", type: Number }))
      .createIndex({
        name: "PK_PARENT",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1]);

    const child = buildTable({name: "Child"})
      .createColumn(createColumnTestSpec({ name: "ParentID", type: Number }))
      .createIndex({
        name: "FKRI_Id",
        columns: ["ParentID"],
        unique: false,
      })
      .addRow([1]);

    const db = buildDatabase()
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          reverseIndex: "FKRI_Id",
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: "restrict",
          onUpdate: "cascade",
        }
      );

    const updates = [2];

    const updated = db.updateRows(
      "Parent",
      [createUpdate(parent, 0, updates)]
    );

    expect(
      updated.tables.requireByName("Child").requireRow(0)
    ).toEqual([2]);
  });

  it("supports self-referencing cascade deletes", () => {
    const table = buildTable({name: "Node"})
      .createColumn(createColumnTestSpec({ name: "ID", type: Number }))
      .createColumn(createColumnTestSpec({
        name: "ParentID",
        type: Number,
        nullable: true,
      }))
      .createIndex({
        name: "PK_NODE",
        columns: ["ID"],
        unique: true,
      })
      .createIndex({
        name: "FKRI_Id",
        columns: ["ParentID"],
        unique: false,
      })
      .addRow([1, null])
      .addRow([2, 1]);

    const db = buildDatabase()
      .addTable(table)
      .createForeignKey(
        "Node",
        {
          name: "FK_NODE_PARENT",
          columns: ["ParentID"],
          reverseIndex: "FKRI_Id",
          parentTable: "Node",
          parentColumns: ["ID"],
          onDelete: "cascade",
          onUpdate: "cascade",
        }
      );

    const updated = db.removeRows("Node", [createDelete(table, 0)]);

    expect(
      updated.tables.requireByName("Node").rowAlive[0]
    ).toBe(false);

    expect(
      updated.tables.requireByName("Node").rowAlive[1]
    ).toBe(false);
  });

  it("supports cyclic cascading updates", () => {
    const table = buildTable({name: "Node"})
      .createColumn(createColumnTestSpec({ name: "ID", type: Number }))
      .createColumn(createColumnTestSpec({
        name: "RefID",
        type: Number,
        nullable: true,
      }))
      .createIndex({
        name: "PK_NODE",
        columns: ["ID"],
        unique: true,
      })
      .createIndex({
        name: "FKRI_Id",
        columns: ["RefID"],
        unique: false,
      })
      .addRow([1, 2])
      .addRow([2, 1]);

    const db = buildDatabase()
      .addTable(table)
      .createForeignKey(
        "Node",
        {
          name: "FK_NODE_REF",
          columns: ["RefID"],
          reverseIndex: "FKRI_Id",
          parentTable: "Node",
          parentColumns: ["ID"],
          onDelete: "cascade",
          onUpdate: "cascade",
        }
      );

    const updates = [3, 2];

    const updated = db.updateRows(
      "Node",
      [createUpdate(table, 0, updates)]
    );

    expect(
      updated.tables.requireByName("Node").requireRow(1)
    ).toEqual([2, 3]);
  });

  it("supports composite foreign key cascading updates", () => {
    const parent = buildTable({name: "Parent"})
      .createColumn(createColumnTestSpec({ name: "A", type: Number }))
      .createColumn(createColumnTestSpec({ name: "B", type: Number }))
      .createIndex({
        name: "PK_PARENT",
        columns: ["A", "B"],
        unique: true,
      })
      .addRow([1, 2]);

    const child = buildTable({name: "Child"})
      .createColumn(createColumnTestSpec({ name: "FA", type: Number }))
      .createColumn(createColumnTestSpec({ name: "FB", type: Number }))
      .createIndex({
        name: "FKRI_CHILD",
        columns: ["FA", "FB"],
        unique: false,
      })
      .addRow([1, 2]);

    const db = buildDatabase()
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["FA", "FB"],
          reverseIndex: "FKRI_CHILD",
          parentTable: "Parent",
          parentColumns: ["A", "B"],
          onDelete: "cascade",
          onUpdate: "cascade",
        }
      );
    
    const updates = [10, 20];

    const updated = db.updateRows(
      "Parent",
      [createUpdate(parent, 0, updates)]
    );

    expect(
      updated.tables.requireByName("Child").requireRow(0)
    ).toEqual([10, 20]);
  });

  it("sets all composite foreign key columns to null during SET NULL", () => {
    const parent = buildTable({name: "Parent"})
      .createColumn(createColumnTestSpec({ name: "A", type: Number }))
      .createColumn(createColumnTestSpec({ name: "B", type: Number }))
      .createIndex({
        name: "PK_PARENT",
        columns: ["A", "B"],
        unique: true,
      })
      .addRow([1, 2]);

    const child = buildTable({name: "Child"})
      .createColumn(createColumnTestSpec({
        name: "FA",
        type: Number,
        nullable: true,
      }))
      .createColumn(createColumnTestSpec({
        name: "FB",
        type: Number,
        nullable: true,
      }))
      .createIndex({
        name: "FKRI_CHILD",
        columns: ["FA", "FB"],
        unique: false,
      })
      .addRow([1, 2]);

    const db = buildDatabase()
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["FA", "FB"],
          reverseIndex: "FKRI_CHILD",
          parentTable: "Parent",
          parentColumns: ["A", "B"],
          onDelete: "setNull",
          onUpdate: "setNull",
        }
      );

    const updated = db.removeRows("Parent", [createDelete(parent, 0)]);

    expect(
      updated.tables.requireByName("Child").requireRow(0)
    ).toEqual([null, null]);
  });

  it("supports multi-level cascade chains", () => {
    const a = buildTable({name: "A"})
      .createColumn(createColumnTestSpec({ name: "ID", type: Number }))
      .createIndex({
        name: "PK_A",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1]);

    const b = buildTable({name: "B"})
      .createColumn(createColumnTestSpec({ name: "AID", type: Number }))
      .createIndex({
        name: "PK_B",
        columns: ["AID"],
        unique: true,
      })
      .createIndex({
        name: "FKRI_CHILD",
        columns: ["AID"],
        unique: false,
      })
      .addRow([1]);

    const c = buildTable({name: "C"})
      .createColumn(createColumnTestSpec({ name: "BID", type: Number }))
      .createIndex({
        name: "FKRI_CHILD",
        columns: ["BID"],
        unique: false,
      })
      .addRow([1]);

    const db = buildDatabase()
      .addTable(a)
      .addTable(b)
      .addTable(c)
      .createForeignKey(
        "B",
        {
          name: "FK_B_A",
          columns: ["AID"],
          reverseIndex: "FKRI_CHILD",
          parentTable: "A",
          parentColumns: ["ID"],
          onDelete: "cascade",
          onUpdate: "cascade",
        }
      )
      .createForeignKey(
        "C",
        {
          name: "FK_C_B",
          columns: ["BID"],
          reverseIndex: "FKRI_CHILD",
          parentTable: "B",
          parentColumns: ["AID"],
          onDelete: "cascade",
          onUpdate: "cascade",
        }
      );

    const updated = db.removeRows("A", [createDelete(a, 0)]);

    expect(
      updated.tables.requireByName("B").rowAlive[0]
    ).toBe(false);

    expect(
      updated.tables.requireByName("C").rowAlive[0]
    ).toBe(false);
  });

  it("preserves immutable database state during cascading operations", () => {
    const parent = buildTable({name: "Parent"})
      .createColumn(createColumnTestSpec({ name: "ID", type: Number, nullable: false }))
      .createIndex({name: "pk_parent", columns: ["id"], unique: true})
      .addRow([1]);

    const child = buildTable({name: "Child"})
      .createColumn(createColumnTestSpec({ name: "ParentID", type: Number }))
      .createIndex({
        name: "FKRI_CHILD",
        columns: ["ParentID"],
        unique: false,
      })
      .addRow([1]);

    const db = buildDatabase()
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          reverseIndex: "FKRI_CHILD",
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: "cascade",
          onUpdate: "cascade",
        }
      );

    const updated = db.removeRows("Parent", [createDelete(parent, 0)]);

    expect(() => {
      db.tables.requireByName("Parent").assertRowAlive(0)
    }).not.toThrow();

    expect(() => {
      db.tables.requireByName("Child").assertRowAlive(0)
    }).not.toThrow();

    expect(
      updated.tables.requireByName("Parent").rowAlive[0]
    ).toBe(false);

    expect(
      updated.tables.requireByName("Child").rowAlive[0]
    ).toBe(false);
  });

  it("handles overlapping propagation paths deterministically", () => {
    /*
      A -> B
      A -> C
      B,C -> D

      deleting A cascades into B and C.
      D references both B and C.

      D must only be deleted once.
    */
    const a = buildTable({name: "A"})
          .createColumn(createColumnTestSpec({
            name: "ID",
            type: Number,
            nullable: false
          }))
          .createIndex({
            name: "pk_a",
            columns: ["id"],
            unique: true,
          })
          .addRow([1]);

    const db = buildDatabase()
      .addTable(
        a
      )
      .addTable(
        buildTable({name: "B"})
          .createColumn(createColumnTestSpec({
            name: "ID",
            type: Number,
            nullable: false
          }))
          .createColumn(createColumnTestSpec({ name: "A_ID", type: Number }))
          .createIndex({
            name: "pk_b",
            columns: ["id"],
            unique: true,
          })
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["a_id"],
            unique: false,
          })
          .addRow([10, 1])
      )
      .addTable(
        buildTable({name: "C"})
          .createColumn(createColumnTestSpec({
            name: "ID",
            type: Number,
            nullable: false }))
          .createColumn(createColumnTestSpec({ name: "A_ID", type: Number }))
          .createIndex({
            name: "pk_c",
            columns: ["id"],
            unique: true,
          })
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["a_id"],
            unique: false,
          })
          .addRow([20, 1])
      )
      .addTable(
        buildTable({name: "D"})
          .createColumn(createColumnTestSpec({ name: "B_ID", type: Number }))
          .createColumn(createColumnTestSpec({ name: "C_ID", type: Number }))
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["b_id"],
            unique: false,
          })
          .createIndex({
            name: "FKRI_CHILD2",
            columns: ["c_id"],
            unique: false,
          })
          .addRow([10, 20])
      )

      .createForeignKey("B", {
        name: "FK_B_A",
        columns: ["A_ID"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "A",
        parentColumns: ["ID"],
        onDelete: "cascade",
        onUpdate: "restrict",
      })

      .createForeignKey("C", {
        name: "FK_C_A",
        columns: ["A_ID"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "A",
        parentColumns: ["ID"],
        onDelete: "cascade",
        onUpdate: "restrict",
      })

      .createForeignKey("D", {
        name: "FK_D_B",
        columns: ["B_ID"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "B",
        parentColumns: ["ID"],
        onDelete: "cascade",
        onUpdate: "restrict",
      })

      .createForeignKey("D", {
        name: "FK_D_C",
        columns: ["C_ID"],
        reverseIndex: "FKRI_CHILD2",
        parentTable: "C",
        parentColumns: ["ID"],
        onDelete: "cascade",
        onUpdate: "restrict",
      });

    const updated = db.removeRows("A", [createDelete(a, 0)]);

    expect(updated.tables.requireByName("A").rowAlive[0]).toBe(false);
    expect(updated.tables.requireByName("B").rowAlive[0]).toBe(false);
    expect(updated.tables.requireByName("C").rowAlive[0]).toBe(false);
    expect(updated.tables.requireByName("D").rowAlive[0]).toBe(false);
  });

  it("converges propagation without stale references", () => {
    /*
      A -> B -> C

      delete A
      delete B
      delete C

      no second pass should fail because
      reverse indexes were updated correctly.
    */

    const a = buildTable({name: "A"})
          .createColumn(createColumnTestSpec({ name: "ID", type: Number, nullable: false }))
          .createIndex({
            name: "pk_a",
            columns: ["id"],
            unique: true,
          })
          .addRow([1]);

    const db = buildDatabase()
      .addTable(
        a
      )
      .addTable(
        buildTable({name: "B"})
          .createColumn(createColumnTestSpec({ name: "ID", type: Number, nullable: false }))
          .createColumn(createColumnTestSpec({ name: "A_ID", type: Number }))
          .createIndex({
            name: "pk_b",
            columns: ["id"],
            unique: true,
          })
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["a_id"],
            unique: false,
          })
          .addRow([2, 1])
      )
      .addTable(
        buildTable({name: "C"})
          .createColumn(createColumnTestSpec({ name: "B_ID", type: Number }))
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["b_id"],
            unique: false,
          })
          .addRow([2])
      )

      .createForeignKey("B", {
        name: "FK_B_A",
        columns: ["A_ID"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "A",
        parentColumns: ["ID"],
        onDelete: "cascade",
        onUpdate: "restrict",
      })

      .createForeignKey("C", {
        name: "FK_C_B",
        columns: ["B_ID"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "B",
        parentColumns: ["ID"],
        onDelete: "cascade",
        onUpdate: "restrict",
      });

    const updated = db.removeRows("A", [createDelete(a, 0)]);

    expect(updated.tables.requireByName("A").rowAlive[0]).toBe(false);
    expect(updated.tables.requireByName("B").rowAlive[0]).toBe(false);
    expect(updated.tables.requireByName("C").rowAlive[0]).toBe(false);
  });

  it("prevents infinite recursion during cyclic propagation", () => {
    /*
      A -> B
      B -> A

      delete A

      should terminate safely.
    */

    const a = buildTable({name: "A"})
          .createColumn(createColumnTestSpec({ name: "ID", type: Number, nullable: false }))
          .createColumn(createColumnTestSpec({ name: "B_ID", type: Number }))
          .createIndex({
            name: "pk_a",
            columns: ["id"],
            unique: true,
          })
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["b_id"],
            unique: false,
          })

    const db = buildDatabase()
      .addTable(
        a
      )
      .addTable(
        buildTable({name: "B"})
          .createColumn(createColumnTestSpec({ name: "ID", type: Number, nullable: false }))
          .createColumn(createColumnTestSpec({ name: "A_ID", type: Number }))
          .createIndex({
            name: "pk_b",
            columns: ["id"],
            unique: true,
          })
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["a_id"],
            unique: false,
          })
      )

      .createForeignKey("A", {
        name: "FK_A_B",
        columns: ["B_ID"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "B",
        parentColumns: ["ID"],
        onDelete: "cascade",
        onUpdate: "restrict",
      })

      .createForeignKey("B", {
        name: "FK_B_A",
        columns: ["A_ID"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "A",
        parentColumns: ["ID"],
        onDelete: "cascade",
        onUpdate: "restrict",
      });

    const withRows = db
      .addRow("A", [1, null])
      .addRow("B", [2, 1]);

    const aWithRows = withRows.tables.require(a.id);

    const withUpdate = withRows.updateRows(
        "A",
        [createUpdate(aWithRows, 0, [1, 2])]
      );

    const updated = withUpdate.removeRows("A", [createDelete(aWithRows, 0)]);

    expect(updated.tables.requireByName("A").rowAlive[0]).toBe(false);
    expect(updated.tables.requireByName("B").rowAlive[0]).toBe(false);
  });

  it("keeps reverse indexes synchronized during cascading deletes", () => {
    const parent = buildTable({name: "Parent"})
          .createColumn(createColumnTestSpec({ name: "ID", type: Number, nullable: false }))
          .createIndex({
            name: "pk_parent",
            columns: ["id"],
            unique: true,
          })
          .addRow([1]);

    const db = buildDatabase()
      .addTable(parent)
      .addTable(
        buildTable({name: "Child"})
          .createColumn(createColumnTestSpec({ name: "PARENT_ID", type: Number }))
          .createIndex({
            name: "FKRI_CHILD",
            columns: ["Parent_ID"],
            unique: false,
          })
          .addRow([1])
      )

      .createForeignKey("Child", {
        name: "FK_CHILD_PARENT",
        columns: ["PARENT_ID"],
        reverseIndex: "FKRI_CHILD",
        parentTable: "Parent",
        parentColumns: ["ID"],
        onDelete: "cascade",
        onUpdate: "restrict",
      });

    const updated = db.removeRows(
      "Parent",
      [createDelete(parent, 0)]
    );

    const child = updated.tables.requireByName("Child");

    const reverseIndex =
      child.indexes.requireByName("FKRI_CHILD");

    expect(
      reverseIndex.getRowNumsFromProjection([1])
    ).toEqual(undefined);
  });

});