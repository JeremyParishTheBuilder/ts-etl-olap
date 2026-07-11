import { describe, it, expect } from 'vitest';
import { PostgresInputBatch } from '../../src/input/PostgresInputBatch.js';
import { freshEngine } from '../engine/freshEngine.js';
import { CONSTRAINT_KIND } from '../../src/schema/ConstraintKind.js';

function createTestSql() {
  return freshEngine().input() as PostgresInputBatch;
}

describe("Integration::delete", () => {
  it("deletes a single row", () => {
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();

    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
      Name: {
        type: String,
        nullable: false,
      },
    }).execute();

    sql
      .insertInto("Users", ["Id", "Name"])
      .values([[1, "Alice"], [2, "Bob"]])
      .execute();

    sql
      .deleteFrom("Users")
      .where(
        sql.column("Id").eq(1)
      )
      .execute();

    const rows = sql
      .select("*")
      .from("Users")
      .execute();

    expect(rows).toEqual([[
      {
        "index": 1,
        "values": [2, "Bob"],
      },
    ]]);
  });

  it("deletes all rows when no WHERE clause is specified", () => {
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
    }).execute();

    sql
      .insertInto("Users", ["Id"])
      .values([[1], [2], [3]])
      .execute();

    sql
      .deleteFrom("Users")
      .execute();

    const rows = sql
      .select("*")
      .from("Users")
      .execute();

    expect(rows).toEqual([[]]);
  });

  it("deletes multiple rows matching a predicate", () => {
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
    }).execute();

    sql
      .insertInto("Users", ["Id"])
      .values([[1], [2], [3]])
      .execute();

    sql
      .deleteFrom("Users")
      .where(
        sql.column("Id").gt(1)
      )
      .execute();

    const rows = sql
      .select("*")
      .from("Users")
      .execute();

    expect(rows).toEqual([[
      {
        index: 0,
        values: [1],
      },
    ]]);
  });

  it("prevents deleting a parent row referenced by a child", () => {
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Roles", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
    }).execute();

    sql.createTable("Users",
      {
        RoleId: {
          type: Number,
          nullable: false,
        }
      },
      {
        role_fk: {
          kind: CONSTRAINT_KIND.foreignKey,
          name: "role_fk",
          columns: ["RoleId"],
          parentTable: "Roles",
          parentColumns: ["Id"],
          onDelete: "restrict",
        },
      }
    ).execute();

    sql
      .insertInto("Roles", ["Id"])
      .values([[1]])
      .execute();

    sql
      .insertInto("Users", ["RoleId"])
      .values([[1]])
      .execute();

    expect(() =>
      sql
        .deleteFrom("Roles")
        .where(
          sql.column("Id").eq(1)
        )
        .execute()
    ).toThrow();
  });

  it("cascades deletes to child rows", () => {
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Roles", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
    }).execute();

    sql.createTable("Users",
      {
        RoleId: {
          type: Number,
          nullable: false,
        }
      },
      {
        role_fk: {
          kind: CONSTRAINT_KIND.foreignKey,
          name: "role_fk",
          columns: ["RoleId"],
          parentTable: "Roles",
          parentColumns: ["Id"],
          onDelete: "cascade",
        },
      }
    ).execute();

    sql
      .insertInto("Roles", ["Id"])
      .values([[1]])
      .execute();

    sql
      .insertInto("Users", ["RoleId"])
      .values([[1]])
      .execute();

    sql
      .deleteFrom("Roles")
      .where(
        sql.column("Id").eq(1)
      )
      .execute();

    const roles = sql
      .select("*")
      .from("Roles")
      .execute();

    const users = sql
      .select("*")
      .from("Users")
      .execute();

    expect(roles).toEqual([[]]);
    expect(users).toEqual([[]]);
  });
});