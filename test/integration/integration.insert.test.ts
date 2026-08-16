import { describe, it, expect } from 'vitest';
import { createTestPostgresSql } from '../utils/engineHelpers.ts';
import { col } from '../../src/ast/dsl.ts';

describe("Integration::insert", () => {
  it("rejects duplicate primary keys", () => {
    const sql = createTestPostgresSql();

    sql.createDatabase("DB1").execute();

    sql.useDatabase("DB1").execute();

    sql.begin().execute();

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

    sql.commit().execute();

    sql.begin().execute();

    sql
      .insertInto("Users", ["Id", "Name"])
      .values([
        [1, "Alice"],
      ])
      .execute();
    
    sql.commit().execute();

    expect(() => {
      sql
        .insertInto("Users", ["Id", "Name"])
        .values([
          [1, "Bob"],
        ])
        .execute();
    }).toThrow();
  });

  it("rejects inserts with missing foreign key parents", () => {
    const sql = createTestPostgresSql();

    sql.createDatabase("DB1").execute();

    sql.useDatabase("DB1").execute();

    sql.begin().execute();

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

    sql.commit().execute();

    expect(() => {
      sql
        .insertInto("Posts", ["Id", "UserId"])
        .values([
          [1, 999],
        ])
        .execute();
    }).toThrow();
  });

  it('rejects inserts violating checks', () => {

    const sql = createTestPostgresSql();

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
        col("Age").gte(18)
      )
      .execute();

    expect(() => {
      sql
        .insertInto("Users", ["Age"])
        .values([
          [10]
        ])
        .execute();
    }).toThrow();
  });

  it('allows inserts satisfying checks', () => {

    const sql = createTestPostgresSql();

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
        col("Age").gte(18)
      )
      .execute();

    expect(() => {
      sql
        .insertInto("Users", ["Age"])
        .values([
          [20]
        ])
        .execute();
    }).not.toThrow();
  });

  it("allows mutually-referencing rows to be inserted in a single statement", () => {
    const sql = createTestPostgresSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.begin().execute();

    sql.createTable("Employees", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
      ManagerId: {
        type: Number,
        nullable: false,
      },
    }).execute();

    sql.alterTable("Employees")
      .addConstraint("FK1")
      .foreignKey(
        ["ManagerId"]
      ).references(
        "Employees",
        ["Id"],
      )
      .execute();

    sql.commit().execute();

    expect(() => {
      sql.begin().execute();

      sql
        .insertInto("Employees", ["Id", "ManagerId"])
        .values([
          [1, 2],
          [2, 1],
        ])
        .execute();

      sql.commit().execute();
    }).not.toThrow();

    expect(
      sql.select("*").from("Employees").execute()[0]
    ).toEqual([
      { index: 0, values: [1, 2] },
      { index: 1, values: [2, 1] },
    ]);
  });

  it("uses the column default when an INSERT omits the column", () => {
    const sql = createTestPostgresSql();

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
        defaultValue: "Anonymous",
      },
    }).execute();

    sql
      .insertInto("Users", ["Id"])
      .values([[1]])
      .execute();

    const rows = sql
      .select("*")
      .from("Users")
      .execute();

    expect(rows).toEqual([[
      {
        index: 0,
        values: [1, "Anonymous"],
      },
    ]]);
  });

  it("uses DEFAULT explicitly in an insert", () => {
    const sql = createTestPostgresSql();

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
        defaultValue: "Anonymous",
      },
    }).execute();

    sql
      .insertInto("Users", ["Id", "Name"])
      .values([
        [1, sql.DEFAULT],
      ])
      .execute();

    const rows = sql
      .select("*")
      .from("Users")
      .execute();

    expect(rows).toEqual([[
      {
        index: 0,
        values: [1, "Anonymous"],
      },
    ]]);
  });

  it("uses CURRENT_TIMESTAMP in an insert", () => {
    const sql = createTestPostgresSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
      UpdatedAt: {
        type: String,
        nullable: false,
      },
    }).execute();

    sql
      .insertInto("Users", ["Id", "UpdatedAt"])
      .values([
        [1, sql.CURRENT_TIMESTAMP],
      ])
      .execute();

    const rows = sql
      .select("*")
      .from("Users")
      .execute();

    const value = rows[0][0].values[1];

    expect(typeof value).toBe("string");
    expect(value).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it("uses NOW() in an insert", () => {
    const sql = createTestPostgresSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
      UpdatedAt: {
        type: String,
        nullable: false,
      },
    }).execute();

    sql
      .insertInto("Users", ["Id", "UpdatedAt"])
      .values([
        [1, sql.NOW()],
      ])
      .execute();

    const rows = sql
      .select("*")
      .from("Users")
      .execute();

    const value = rows[0][0].values[1];

    expect(typeof value).toBe("string");
    expect(value).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
  });

  it("rejects SQL functions not supported by the dialect", () => {
    const sql = createTestPostgresSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
      },
      UpdatedAt: {
        type: String,
        nullable: false,
      },
    }).execute();

    expect(() =>
      sql
        .insertInto("Users", ["Id", "UpdatedAt"])
        .values([
          [1, sql.GETDATE()],
        ])
        .execute(),
    ).toThrow(/not allowed/i);
  });

  it("uses DEFAULT to generate an auto-incrementing value", () => {
    const sql = createTestPostgresSql();

    sql.createDatabase("DB1").execute();
    sql.useDatabase("DB1").execute();

    sql.createTable("Users", {
      Id: {
        type: Number,
        nullable: false,
        primaryKey: true,
        autoIncrementStart: 1,
        autoIncrementStep: 1,
      },
      Name: {
        type: String,
        nullable: false,
      },
    }).execute();

    sql
      .insertInto("Users", ["Id", "Name"])
      .values([
        [sql.DEFAULT, "Alice"],
      ])
      .execute();

    sql
      .insertInto("Users", ["Id", "Name"])
      .values([
        [sql.DEFAULT, "Bob"],
      ])
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
        values: [2, "Bob"],
      },
    ]]);
  });
});