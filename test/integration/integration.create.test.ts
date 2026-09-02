import { describe, it, expect } from 'vitest';
import { createTestPostgresSql, freshEngine } from '../utils/engineHelpers.ts';
import { SQL_INTEGER, SQL_VARCHAR } from '../../src/types/SqlType.ts';
import { col } from '../../src/ast/dsl.ts';

describe("Integration::create", () => {
  describe("CTAS", () => {
    it("creates a table from a SELECT query", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql
        .createTable("Users", {
          Id: {
            type: SQL_INTEGER,
            nullable: false,
          },
          Name: {
            type: SQL_VARCHAR,
            nullable: false,
          },
        })
        .execute();

      sql
        .insertInto("Users", ["Id", "Name"])
        .values([
          [1, "Alice"],
          [2, "Bob"],
        ])
        .execute();

      sql
        .createTable("ActiveUsers")
        .as(
          sql
            .select([col("Id"), col("Name")])
            .from("Users")
            .asQueryStatement(),
        )
        .execute();

      const result = sql
        .select([col("Id"), col("Name")])
        .from("ActiveUsers")
        .execute();

      expect(result).toEqual([[
        {
          "index": 0,
          "values": [1, "Alice"],
        },
        {
          "index": 1,
          "values": [2, "Bob"],
        }
      ]]);
    });
  });
});