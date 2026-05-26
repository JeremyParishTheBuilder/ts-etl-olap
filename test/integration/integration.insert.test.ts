import { describe, it, expect } from 'vitest';
import { PostgresInputBatch } from '../../src/input/PostgresInputBatch.js';
import { freshEngine } from '../engine/freshEngine.js';

function createTestSql() {
  return freshEngine().input() as PostgresInputBatch;
}

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
});