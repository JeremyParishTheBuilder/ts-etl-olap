import { describe, it, expect, beforeEach } from 'vitest';
import { PostgresInputBatch } from '../../src/input/PostgresInputBatch.js';
import { freshEngine } from '../engine/freshEngine.js';
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';

function createTestSql() {
  return freshEngine().input() as PostgresInputBatch;
}

beforeEach(() => {
  
});

describe("Integration::update", () => {
  it("updates a single row", () => {
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
      .values([[1, "Alice"]])
      .execute();

    sql
      .update("Users")
      .set({
        Name: "Bob",
      })
      .where("Id")
      .eq(1)
      .execute();

    const rows = sql
      .select("*")
      .from("Users")
      .execute();

    expect(rows).toEqual([[
      {
        "index": 0,
        "values": [1, "Bob"],
      },
    ]]);
  });

  it("updates all rows matching a predicate", () => {
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
      .values([
        [1, "Alice"],
        [2, "Bob"],
        [3, "Charlie"],
      ])
      .execute();

    sql
      .update("Users")
      .set({
        Name: "Updated",
      })
      .where("Id")
      .gt(1)
      .execute();

    const rows = sql
      .select("*")
      .from("Users")
      .execute();

    expect(rows).toEqual([[
      {
        index: 0,
        values: [1, "Alice"],
      },
      {
        index: 1,
        values: [2, "Updated"],
      },
      {
        index: 2,
        values: [3, "Updated"],
      },
    ]]);
  });

  it("rejects updates that create duplicate primary keys", () => {
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
      .values([
        [1, "Alice"],
        [2, "Bob"],
      ])
      .execute();

    expect(() => {
      sql
        .update("Users")
        .set({
          Id: 2,
        })
        .where("Id")
        .eq(1)
        .execute();
    }).toThrow();
  });

  it("rejects updates that violate unique constraints", () => {
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
      Email: {
        type: String,
        nullable: false,
        unique: true,
      },
    }).execute();

    sql
      .insertInto("Users", ["Id", "Email"])
      .values([
        [1, "alice@test.com"],
        [2, "bob@test.com"],
      ])
      .execute();

    expect(() => {
      sql
        .update("Users")
        .set({
          Email: "bob@test.com",
        })
        .where("Id")
        .eq(1)
        .execute();
    }).toThrow();
  });

  it("rejects updates with missing foreign key parents", () => {
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

    sql.createTable("Posts", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
      UserId: {
        type: Number,
        nullable: false,
      },
    }).execute();

    sql.alterTable("Posts")
      .addConstraint("Posts_FK")
      .foreignKey(["UserId"])
      .references("Users", ["Id"])
      .execute();

    sql
      .insertInto("Users", ["Id"])
      .values([[1]])
      .execute();

    sql
      .insertInto("Posts", ["Id", "UserId"])
      .values([[1, 1]])
      .execute();

    expect(() => {
      sql
        .update("Posts")
        .set({
          UserId: 999,
        })
        .where("Id")
        .eq(1)
        .execute();
    }).toThrow();
  });

  it("cascades foreign key updates", () => {
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

    sql.createTable("Posts", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
      UserId: {
        type: Number,
        nullable: false,
      },
    }).execute();

    sql.alterTable("Posts")
      .addConstraint("Posts_FK")
      .foreignKey(["UserId"])
      .references("Users", ["Id"])
      .onUpdate(ReferentialAction.cascade)
      .execute();

    sql
      .insertInto("Users", ["Id"])
      .values([[1]])
      .execute();

    sql
      .insertInto("Posts", ["Id", "UserId"])
      .values([[1, 1]])
      .execute();

    sql
      .update("Users")
      .set({
        Id: 2,
      })
      .where("Id")
      .eq(1)
      .execute();

    const rows = sql
      .select("*")
      .from("Posts")
      .execute();

    expect(rows).toEqual([[
      {
        index: 0,
        values: [1, 2],
      },
    ]]);
  });
});