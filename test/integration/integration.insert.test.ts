import { describe, it, expect } from 'vitest';
import { createTestSql } from '../utils/engineHelpers.ts';
import { col } from '../../src/semantic/ast/dsl.ts';

describe("Integration::insert", () => {
  it("rejects duplicate primary keys", () => {
    const sql = createTestSql();

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
    const sql = createTestSql();

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
    const sql = createTestSql();

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
});