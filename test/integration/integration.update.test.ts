import { describe, it, expect } from 'vitest';
import { PostgresInputBatch } from '../../src/input/PostgresInputBatch.js';
import { freshEngine } from '../engine/freshEngine.js';
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';

function createTestSql() {
  return freshEngine().input() as PostgresInputBatch;
}

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
        .where(
          sql.column("Id").eq(1)
        )
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
        .where(
          sql.column("Id").eq(1)
        )
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
        .where(
          sql.column("Id").eq(1)
        )
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
      .onUpdate("cascade")
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
      .where(
        sql.column("Id").eq(1)
      )
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

  it("updates PKs atomically using CASE expression", () => {
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: { type: Number, nullable: false, primaryKey: true },
      Name: { type: String },
    }).execute();

    sql
      .insertInto("Users", ["Id", "Name"])
      .values([
        [1, "A"],
        [2, "B"],
      ])
      .execute();

    sql
      .update("Users")
      .set({
        Id: sql.case()
          .when(sql.column("Id").eq(1)).then(2)
          .when(sql.column("Id").eq(2)).then(1)
          .else(sql.column("Id")),
      })
      .execute();

    const rows = sql.select("*").from("Users").execute();

    expect(rows).toEqual([[
      { index: 0, values: [2, "A"] },
      { index: 1, values: [1, "B"] },
    ]]);
  });

  it("updates using arithmetic expressions", () => {
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: { type: Number, nullable: false, primaryKey: true },
      Name: { type: String },
    }).execute();

    sql
      .insertInto("Users", ["Id", "Name"])
      .values([
        [1, "A"],
        [2, "B"],
      ])
      .execute();

    sql
    .update("Users")
    .set({
      Id: sql.column("Id").add(1),
    })
    .execute();

    const rows = sql.select("*").from("Users").execute();

    expect(rows).toEqual([[
      { index: 0, values: [2, "A"] },
      { index: 1, values: [3, "B"] },
    ]]);
  });

  it('rejects inserts violating checks', () => {
  
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();

    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Age: {
        type: Number,
        nullable: false,
      },
    }).execute();

    sql.alterTable("Users")
      .addConstraint("CHK_Adult")
      .check(
        sql.column("Age").gte(18)
      )
      .execute();

    sql
      .insertInto("Users", ["Age"])
      .values([
        [20]
      ])
      .execute();

    expect(() => {
      sql
        .update("Users")
        .set({
          Age: 10
        })
        .execute();
    }).toThrow();
  });

  it('allows updates satisfying checks', () => {

    const sql = createTestSql();

    sql.createDatabase("DB1").execute();

    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Age: {
        type: Number,
        nullable: false,
      },
    }).execute();

    sql.alterTable("Users")
      .addConstraint("CHK_Adult")
      .check(
        sql.column("Age").gte(18)
      )
      .execute();

    sql
      .insertInto("Users", ["Age"])
      .values([
        [20]
      ])
      .execute();

    expect(() => {
      sql
        .update("Users")
        .set({
          Age: 22
        })
        .execute();
    }).not.toThrow();
  });

  it('rejects entire update when one row violates a check', () => {
    const sql = createTestSql();

    sql.createDatabase("DB1").execute();

    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Age: {
        type: Number,
        nullable: false,
      },
    }).execute();

    sql.alterTable("Users")
      .addConstraint("CHK_Adult")
      .check(
        sql.column("Age").gte(18)
      )
      .execute();

    sql
      .insertInto("Users", ["Age"])
      .values([
        [20], [30]
      ])
      .execute();

    expect(() => {
      sql
        .update("Users")
        .set({
          Age: sql.column("Age").subtract(10)
        })
        .execute();
    }).toThrow();

    const users =
      sql.select("*")
        .from("Users")
        .execute();

    expect(users).toEqual([[
      {
        "index": 0,
        "values": [20],
      },
      {
        "index": 1,
        "values": [30],
      },
    ]]);
  });
});