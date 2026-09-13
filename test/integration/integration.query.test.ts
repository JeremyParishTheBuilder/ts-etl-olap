import { describe, it, expect } from 'vitest';
import { createTestPostgresSql } from '../utils/engineHelpers.ts';
import { SQL_DECIMAL, SQL_VARCHAR } from '../../src/types/SqlType.ts';
import { createTableTestSpec } from '../utils/buildSchema.ts';

describe('Integration::query', () => {
  describe("Union All", () => {
    it("executes union all queries end-to-end", () => {
      const sql = createTestPostgresSql();

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.begin().execute();

      sql.createTable(...createTableTestSpec("UsersA", {
        Id: {
          type: SQL_DECIMAL,
          nullable: false,
        },
        Name: {
          type: SQL_VARCHAR,
          nullable: false,
        },
      })).execute();

      sql.createTable(...createTableTestSpec("UsersB", {
        Id: {
          type: SQL_DECIMAL,
          nullable: false,
        },
        Name: {
          type: SQL_VARCHAR,
          nullable: false,
        },
      })).execute();

      sql.commit().execute();

      sql.begin().execute();

      sql
        .insertInto("UsersA", ["Id", "Name"])
        .values([
          [1, "Alice"],
          [2, "Bob"],
        ])
        .execute();

      sql
        .insertInto("UsersB", ["Id", "Name"])
        .values([
          [3, "Carol"],
          [4, "Dave"],
        ])
        .execute();

      sql.commit().execute();

      const rows = sql
        .select(["Id", "Name"])
        .from("UsersA")
        .unionAll(
          sql
            .select(["Id", "Name"])
            .from("UsersB")
            .asQueryStatement(),
        )
        .execute();

      expect(rows).toEqual([
        {
          index: 0,
          values: [1, "Alice"],
        },
        {
          index: 1,
          values: [2, "Bob"],
        },
        {
          index: 0,
          values: [3, "Carol"],
        },
        {
          index: 1,
          values: [4, "Dave"],
        },
      ]);
    });

    it("retains duplicate rows with union all", () => {
      const sql = createTestPostgresSql();

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.begin().execute();

      sql.createTable(...createTableTestSpec("Users", {
        Id: {
          type: SQL_DECIMAL,
          nullable: false,
        },
        Name: {
          type: SQL_VARCHAR,
          nullable: false,
        },
      })).execute();

      sql.commit().execute();

      sql.begin().execute();

      sql
        .insertInto("Users", ["Id", "Name"])
        .values([
          [1, "Alice"],
          [2, "Bob"],
        ])
        .execute();

      sql.commit().execute();

      const rows = sql
        .select(["Id", "Name"])
        .from("Users")
        .unionAll(
          sql
            .select(["Id", "Name"])
            .from("Users")
            .asQueryStatement(),
        )
        .execute();

      expect(rows).toEqual([
        { index: 0, values: [1, "Alice"] },
        { index: 1, values: [2, "Bob"] },
        { index: 0, values: [1, "Alice"] },
        { index: 1, values: [2, "Bob"] },
      ]);
    });

    it("uses the left query column names for union all", () => {
      const sql = createTestPostgresSql();

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.begin().execute();

      sql.createTable(...createTableTestSpec("UsersA", {
        Id: {
          type: SQL_DECIMAL,
          nullable: false,
        },
      })).execute();

      sql.createTable(...createTableTestSpec("UsersB", {
        UserId: {
          type: SQL_DECIMAL,
          nullable: false,
        },
      })).execute();

      sql.commit().execute();

      sql.begin().execute();

      sql
        .insertInto("UsersA", ["Id"])
        .values([[1]])
        .execute();

      sql
        .insertInto("UsersB", ["UserId"])
        .values([[2]])
        .execute();

      sql.commit().execute();

      const rows = sql
        .select(["Id"])
        .from("UsersA")
        .unionAll(
          sql
            .select(["UserId"])
            .from("UsersB")
            .asQueryStatement(),
        )
        .execute();

      expect(rows).toEqual([
        { index: 0, values: [1] },
        { index: 0, values: [2] },
      ]);
    });

    it("executes chained union all queries", () => {
      const sql = createTestPostgresSql();

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.begin().execute();

      sql.createTable(...createTableTestSpec("UsersA", {
        Id: {
          type: SQL_DECIMAL,
          nullable: false,
        },
      })).execute();

      sql.createTable(...createTableTestSpec("UsersB", {
        UserId: {
          type: SQL_DECIMAL,
          nullable: false,
        },
      })).execute();

      sql.createTable(...createTableTestSpec("UsersC", {
        UserId: {
          type: SQL_DECIMAL,
          nullable: false,
        },
      })).execute();

      sql.commit().execute();

      sql
        .insertInto("UsersA", ["Id"])
        .values([[1]])
        .execute();

      sql
        .insertInto("UsersB", ["UserId"])
        .values([[2]])
        .execute();

      sql
        .insertInto("UsersC", ["UserId"])
        .values([[4]])
        .execute();

      const rows = sql
        .select(["Id"])
        .from("UsersA")
        .unionAll(
          sql
            .select(["Id"])
            .from("UsersB")
            .asQueryStatement(),
        )
        .unionAll(
          sql
            .select(["Id"])
            .from("UsersC")
            .asQueryStatement(),
        )
        .execute();

      expect(rows).toEqual([
        { index: 0, values: [1] },
        { index: 0, values: [2] },
        { index: 0, values: [3] },
      ]);
    });
  });
});