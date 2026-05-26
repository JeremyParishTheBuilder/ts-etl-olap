import { describe, it, expect } from "vitest";

import { Database } from "../../src/schema/Database.js";
import { Table } from "../../src/schema/Table.js";

import { ReferentialAction } from "../../src/schema/ReferentialAction.js";

describe("Database Referential Actions", () => {

  it("rejects deleting parent row under RESTRICT", () => {
    const parent = new Table("Parent")
      .addColumn({ name: "ID", type: Number })
      .createIndex({
        name: "PK_PARENT",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1]);

    const child = new Table("Child")
      .addColumn({ name: "ParentID", type: Number })
      .addRow([1]);

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: ReferentialAction.restrict,
          onUpdate: ReferentialAction.restrict,
        }
      );

    expect(() =>
      db.removeRow("Parent", 0)
    ).toThrow();
  });

  it("cascades delete to child rows", () => {
    const parent = new Table("Parent")
      .addColumn({ name: "ID", type: Number })
      .createIndex({
        name: "PK_PARENT",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1]);

    const child = new Table("Child")
      .addColumn({ name: "ParentID", type: Number })
      .addRow([1]);

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: ReferentialAction.cascade,
          onUpdate: ReferentialAction.restrict,
        }
      );

    const updated = db.removeRow("Parent", 0);

    expect(
      updated.requireTable("Child").rowAlive[0]
    ).toBe(false);
  });

  it("sets child foreign key values to null during SET NULL delete", () => {
    const parent = new Table("Parent")
      .addColumn({ name: "ID", type: Number })
      .createIndex({
        name: "PK_PARENT",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1]);

    const child = new Table("Child")
      .addColumn({
        name: "ParentID",
        type: Number,
        nullable: true,
      })
      .addRow([1]);

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: ReferentialAction.setNull,
          onUpdate: ReferentialAction.restrict,
        }
      );

    const updated = db.removeRow("Parent", 0);

    expect(
      updated.requireTable("Child").requireRow(0)
    ).toEqual([null]);
  });

  it("cascades updates to child rows", () => {
    const parent = new Table("Parent")
      .addColumn({ name: "ID", type: Number })
      .createIndex({
        name: "PK_PARENT",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1]);

    const child = new Table("Child")
      .addColumn({ name: "ParentID", type: Number })
      .addRow([1]);

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: ReferentialAction.restrict,
          onUpdate: ReferentialAction.cascade,
        }
      );

    const updates = new Map<number, number>();
    updates.set(0, 2);

    const updated = db.updateRow(
      "Parent",
      0,
      updates,
    );

    expect(
      updated.requireTable("Child").requireRow(0)
    ).toEqual([2]);
  });

  it("supports self-referencing cascade deletes", () => {
    const table = new Table("Node")
      .addColumn({ name: "ID", type: Number })
      .addColumn({
        name: "ParentID",
        type: Number,
        nullable: true,
      })
      .createIndex({
        name: "PK_NODE",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1, null])
      .addRow([2, 1]);

    const db = new Database("DB1")
      .addTable(table)
      .createForeignKey(
        "Node",
        {
          name: "FK_NODE_PARENT",
          columns: ["ParentID"],
          parentTable: "Node",
          parentColumns: ["ID"],
          onDelete: ReferentialAction.cascade,
          onUpdate: ReferentialAction.cascade,
        }
      );

    const updated = db.removeRow("Node", 0);

    expect(
      updated.requireTable("Node").rowAlive[0]
    ).toBe(false);

    expect(
      updated.requireTable("Node").rowAlive[1]
    ).toBe(false);
  });

  it("supports cyclic cascading updates", () => {
    const table = new Table("Node")
      .addColumn({ name: "ID", type: Number })
      .addColumn({
        name: "RefID",
        type: Number,
        nullable: true,
      })
      .createIndex({
        name: "PK_NODE",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1, 2])
      .addRow([2, 1]);

    const db = new Database("DB1")
      .addTable(table)
      .createForeignKey(
        "Node",
        {
          name: "FK_NODE_REF",
          columns: ["RefID"],
          parentTable: "Node",
          parentColumns: ["ID"],
          onDelete: ReferentialAction.cascade,
          onUpdate: ReferentialAction.cascade,
        }
      );

    const updates = new Map<number, number>();
    updates.set(0, 3);

    const updated = db.updateRow(
      "Node",
      0,
      updates,
    );

    expect(
      updated.requireTable("Node").requireRow(1)
    ).toEqual([2, 3]);
  });

  it("supports composite foreign key cascading updates", () => {
    const parent = new Table("Parent")
      .addColumn({ name: "A", type: Number })
      .addColumn({ name: "B", type: Number })
      .createIndex({
        name: "PK_PARENT",
        columns: ["A", "B"],
        unique: true,
      })
      .addRow([1, 2]);

    const child = new Table("Child")
      .addColumn({ name: "FA", type: Number })
      .addColumn({ name: "FB", type: Number })
      .addRow([1, 2]);

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["FA", "FB"],
          parentTable: "Parent",
          parentColumns: ["A", "B"],
          onDelete: ReferentialAction.cascade,
          onUpdate: ReferentialAction.cascade,
        }
      );

    const updates = new Map<number, number>();
    updates.set(0, 10);
    updates.set(1, 20);

    const updated = db.updateRow(
      "Parent",
      0,
      updates,
    );

    expect(
      updated.requireTable("Child").requireRow(0)
    ).toEqual([10, 20]);
  });

  it("sets all composite foreign key columns to null during SET NULL", () => {
    const parent = new Table("Parent")
      .addColumn({ name: "A", type: Number })
      .addColumn({ name: "B", type: Number })
      .createIndex({
        name: "PK_PARENT",
        columns: ["A", "B"],
        unique: true,
      })
      .addRow([1, 2]);

    const child = new Table("Child")
      .addColumn({
        name: "FA",
        type: Number,
        nullable: true,
      })
      .addColumn({
        name: "FB",
        type: Number,
        nullable: true,
      })
      .addRow([1, 2]);

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["FA", "FB"],
          parentTable: "Parent",
          parentColumns: ["A", "B"],
          onDelete: ReferentialAction.setNull,
          onUpdate: ReferentialAction.setNull,
        }
      );

    const updated = db.removeRow("Parent", 0);

    expect(
      updated.requireTable("Child").requireRow(0)
    ).toEqual([null, null]);
  });

  it("supports multi-level cascade chains", () => {
    const a = new Table("A")
      .addColumn({ name: "ID", type: Number })
      .createIndex({
        name: "PK_A",
        columns: ["ID"],
        unique: true,
      })
      .addRow([1]);

    const b = new Table("B")
      .addColumn({ name: "AID", type: Number })
      .createIndex({
        name: "PK_B",
        columns: ["AID"],
        unique: true,
      })
      .addRow([1]);

    const c = new Table("C")
      .addColumn({ name: "BID", type: Number })
      .addRow([1]);

    const db = new Database("DB1")
      .addTable(a)
      .addTable(b)
      .addTable(c)
      .createForeignKey(
        "B",
        {
          name: "FK_B_A",
          columns: ["AID"],
          parentTable: "A",
          parentColumns: ["ID"],
          onDelete: ReferentialAction.cascade,
          onUpdate: ReferentialAction.cascade,
        }
      )
      .createForeignKey(
        "C",
        {
          name: "FK_C_B",
          columns: ["BID"],
          parentTable: "B",
          parentColumns: ["AID"],
          onDelete: ReferentialAction.cascade,
          onUpdate: ReferentialAction.cascade,
        }
      );

    const updated = db.removeRow("A", 0);

    expect(
      updated.requireTable("B").rowAlive[0]
    ).toBe(false);

    expect(
      updated.requireTable("C").rowAlive[0]
    ).toBe(false);
  });

  it("preserves immutable database state during cascading operations", () => {
    const parent = new Table("Parent")
      .addColumn({ name: "ID", type: Number, nullable: false })
      .createIndex({name: "pk_parent", columns: ["id"], unique: true})
      .createPrimaryKey({
        name: "PK_PARENT",
        columns: ["ID"],
      })
      .addRow([1]);

    const child = new Table("Child")
      .addColumn({ name: "ParentID", type: Number })
      .addRow([1]);

    const db = new Database("DB1")
      .addTable(parent)
      .addTable(child)
      .createForeignKey(
        "Child",
        {
          name: "FK_CHILD_PARENT",
          columns: ["ParentID"],
          parentTable: "Parent",
          parentColumns: ["ID"],
          onDelete: ReferentialAction.cascade,
          onUpdate: ReferentialAction.cascade,
        }
      );

    const updated = db.removeRow("Parent", 0);

    expect(() => {
      db.requireTable("Parent").assertRowAlive(0)
    }).not.toThrow();

    expect(() => {
      db.requireTable("Child").assertRowAlive(0)
    }).not.toThrow();

    expect(
      updated.requireTable("Parent").rowAlive[0]
    ).toBe(false);

    expect(
      updated.requireTable("Child").rowAlive[0]
    ).toBe(false);
  });

//});

// import { describe, it, expect } from "vitest";

// import { Database } from "../../src/schema/Database.js";
// import { Table } from "../../src/schema/Table.js";

// import { ReferentialAction } from "../../src/schema/ReferentialAction.js";

// describe("Database::referentialActions", () => {

  it("handles overlapping propagation paths deterministically", () => {
    /*
      A -> B
      A -> C
      B,C -> D

      deleting A cascades into B and C.
      D references both B and C.

      D must only be deleted once.
    */

    const db = new Database("DB1")
      .addTable(
        new Table("A")
          .addColumn({ name: "ID", type: Number, nullable: false })
          .createIndex({
            name: "pk_a",
            columns: ["id"],
            unique: true,
          })
          .createPrimaryKey({
            name: "PK_A",
            columns: ["ID"],
          })
          .addRow([1])
      )
      .addTable(
        new Table("B")
          .addColumn({ name: "ID", type: Number, nullable: false })
          .addColumn({ name: "A_ID", type: Number })
          .createIndex({
            name: "pk_b",
            columns: ["id"],
            unique: true,
          })
          .createPrimaryKey({
            name: "PK_B",
            columns: ["ID"],
          })
          .addRow([10, 1])
      )
      .addTable(
        new Table("C")
          .addColumn({ name: "ID", type: Number, nullable: false })
          .addColumn({ name: "A_ID", type: Number })
          .createIndex({
            name: "pk_c",
            columns: ["id"],
            unique: true,
          })
          .createPrimaryKey({
            name: "PK_C",
            columns: ["ID"],
          })
          .addRow([20, 1])
      )
      .addTable(
        new Table("D")
          .addColumn({ name: "B_ID", type: Number })
          .addColumn({ name: "C_ID", type: Number })
          .addRow([10, 20])
      )

      .createForeignKey("B", {
        name: "FK_B_A",
        columns: ["A_ID"],
        parentTable: "A",
        parentColumns: ["ID"],
        onDelete: ReferentialAction.cascade,
        onUpdate: ReferentialAction.restrict,
      })

      .createForeignKey("C", {
        name: "FK_C_A",
        columns: ["A_ID"],
        parentTable: "A",
        parentColumns: ["ID"],
        onDelete: ReferentialAction.cascade,
        onUpdate: ReferentialAction.restrict,
      })

      .createForeignKey("D", {
        name: "FK_D_B",
        columns: ["B_ID"],
        parentTable: "B",
        parentColumns: ["ID"],
        onDelete: ReferentialAction.cascade,
        onUpdate: ReferentialAction.restrict,
      })

      .createForeignKey("D", {
        name: "FK_D_C",
        columns: ["C_ID"],
        parentTable: "C",
        parentColumns: ["ID"],
        onDelete: ReferentialAction.cascade,
        onUpdate: ReferentialAction.restrict,
      });

    const updated = db.removeRow("A", 0);

    expect(updated.requireTable("A").rowAlive[0]).toBe(false);
    expect(updated.requireTable("B").rowAlive[0]).toBe(false);
    expect(updated.requireTable("C").rowAlive[0]).toBe(false);
    expect(updated.requireTable("D").rowAlive[0]).toBe(false);
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

    const db = new Database("DB1")
      .addTable(
        new Table("A")
          .addColumn({ name: "ID", type: Number, nullable: false })
          .createIndex({
            name: "pk_a",
            columns: ["id"],
            unique: true,
          })
          .createPrimaryKey({
            name: "PK_A",
            columns: ["ID"],
          })
          .addRow([1])
      )
      .addTable(
        new Table("B")
          .addColumn({ name: "ID", type: Number, nullable: false })
          .addColumn({ name: "A_ID", type: Number })
          .createIndex({
            name: "pk_b",
            columns: ["id"],
            unique: true,
          })
          .createPrimaryKey({
            name: "PK_B",
            columns: ["ID"],
          })
          .addRow([2, 1])
      )
      .addTable(
        new Table("C")
          .addColumn({ name: "B_ID", type: Number })
          .addRow([2])
      )

      .createForeignKey("B", {
        name: "FK_B_A",
        columns: ["A_ID"],
        parentTable: "A",
        parentColumns: ["ID"],
        onDelete: ReferentialAction.cascade,
        onUpdate: ReferentialAction.restrict,
      })

      .createForeignKey("C", {
        name: "FK_C_B",
        columns: ["B_ID"],
        parentTable: "B",
        parentColumns: ["ID"],
        onDelete: ReferentialAction.cascade,
        onUpdate: ReferentialAction.restrict,
      });

    const updated = db.removeRow("A", 0);

    expect(updated.requireTable("A").rowAlive[0]).toBe(false);
    expect(updated.requireTable("B").rowAlive[0]).toBe(false);
    expect(updated.requireTable("C").rowAlive[0]).toBe(false);
  });

  it("prevents infinite recursion during cyclic propagation", () => {
    /*
      A -> B
      B -> A

      delete A

      should terminate safely.
    */

    const db = new Database("DB1")
      .addTable(
        new Table("A")
          .addColumn({ name: "ID", type: Number, nullable: false })
          .addColumn({ name: "B_ID", type: Number })
          .createIndex({
            name: "pk_a",
            columns: ["id"],
            unique: true,
          })
          .createPrimaryKey({
            name: "PK_A",
            columns: ["ID"],
          })
      )
      .addTable(
        new Table("B")
          .addColumn({ name: "ID", type: Number, nullable: false })
          .addColumn({ name: "A_ID", type: Number })
          .createIndex({
            name: "pk_b",
            columns: ["id"],
            unique: true,
          })
          .createPrimaryKey({
            name: "PK_B",
            columns: ["ID"],
          })
      )

      .createForeignKey("A", {
        name: "FK_A_B",
        columns: ["B_ID"],
        parentTable: "B",
        parentColumns: ["ID"],
        onDelete: ReferentialAction.cascade,
        onUpdate: ReferentialAction.restrict,
      })

      .createForeignKey("B", {
        name: "FK_B_A",
        columns: ["A_ID"],
        parentTable: "A",
        parentColumns: ["ID"],
        onDelete: ReferentialAction.cascade,
        onUpdate: ReferentialAction.restrict,
      });

    const withRows = db
      .addRow("A", [1, null])
      .addRow("B", [2, 1])
      .updateRow(
        "A",
        0,
        new Map([[1, 2]])
      );

    const updated = withRows.removeRow("A", 0);

    expect(updated.requireTable("A").rowAlive[0]).toBe(false);
    expect(updated.requireTable("B").rowAlive[0]).toBe(false);
  });

  it("keeps reverse indexes synchronized during cascading deletes", () => {
    const db = new Database("DB1")
      .addTable(
        new Table("Parent")
          .addColumn({ name: "ID", type: Number, nullable: false })
          .createIndex({
            name: "pk_parent",
            columns: ["id"],
            unique: true,
          })
          .createPrimaryKey({
            name: "PK_PARENT",
            columns: ["ID"],
          })
          .addRow([1])
      )
      .addTable(
        new Table("Child")
          .addColumn({ name: "PARENT_ID", type: Number })
          .addRow([1])
      )

      .createForeignKey("Child", {
        name: "FK_CHILD_PARENT",
        columns: ["PARENT_ID"],
        parentTable: "Parent",
        parentColumns: ["ID"],
        onDelete: ReferentialAction.cascade,
        onUpdate: ReferentialAction.restrict,
      });

    const updated = db.removeRow("Parent", 0);

    const child = updated.requireTable("Child");

    const reverseIndex =
      child.requireIndex("fk_child_parent");

    expect(
      reverseIndex.getRowNumsFromProjection([1])
    ).toEqual(undefined);
  });

});