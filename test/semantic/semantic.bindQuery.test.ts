import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '../../src/relational/Database.js';
import { ExecutionContext } from '../../src/engine/ExecutionContext.js';
import { SemanticAnalyzer } from '../../src/semantic/SemanticAnalyzer.js';
import { Engine } from '../../src/engine/Engine.js';
import { freshEngine } from '../utils/engineHelpers.js';
import { SelectBuilder } from '../../src/statements/index.ts';
import { bindQuery } from '../../src/semantic/query.ts';
import { buildDatabase, buildTable, createColumnTestSpec } from '../utils/buildSchema.ts';
import { SQL_INTEGER, SQL_VARCHAR } from '../../src/types/SqlType.ts';
import { col, table } from '../../src/ast/dsl.ts';
import { UnionAllBuilder } from '../../src/statements/dql/QueryStatementBuilder.ts';

describe('SemanticAnalyzer::bindQuery', () => {
  let engine: Engine;

  beforeEach(() => {
    engine = freshEngine();
  });

  function createSemantic(database: Database) {
    const ctx = new ExecutionContext(
      engine.requireTx(),
      engine.rules,
      database.name
    );

    return new SemanticAnalyzer(ctx);
  }

  describe("query statement kind dispatch", () => {
    it("binds select queries", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1]]);

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([col("Id")]);
      select.from("Users");

      const statement = select.createStatement();
      const plan = bindQuery(semantic, statement);

      expect(plan.columns).toEqual([
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
      ]);
    });

    it("binds Union All queries", () => {
      const usersA = buildTable({ name: "UsersA" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1]]);

      const usersB = buildTable({ name: "UsersB" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[3]]);

      const database = buildDatabase()
        .addTable(usersA)
        .addTable(usersB);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const left = new SelectBuilder([col("Id")]);
      left.from("UsersA");

      const right = new SelectBuilder([col("Id")]);
      right.from("UsersB");

      const union = new UnionAllBuilder(
        left.createStatement(),
        right.createStatement(),
      );

      const statement = union.createStatement();
      const plan = bindQuery(semantic, statement);

      expect(plan.columns).toEqual([
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
      ]);
    });
  });

  describe("union all queries", () => {
    it("rejects union all queries with different column counts", () => {
      const usersA = buildTable({ name: "UsersA" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1, 10]]);

      const usersB = buildTable({ name: "UsersB" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[3]]);

      const database = buildDatabase()
        .addTable(usersA)
        .addTable(usersB);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const left = new SelectBuilder([col("Id"), col("Age")]);
      left.from("UsersA");

      const right = new SelectBuilder([col("Id")]);
      right.from("UsersB");

      const union = new UnionAllBuilder(
        left.createStatement(),
        right.createStatement(),
      );

      const statement = union.createStatement();

      expect(() =>
        bindQuery(semantic, statement)
      ).toThrow();
    });
  });

  describe("derived query sources", () => {
    it("treats a derived query as one relation", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        }))
        .addRows([[1, "Alice"]]);

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const inner = new SelectBuilder([
        col("Id"),
        col("Name"),
      ]);

      inner.from("Users");

      const outer = new SelectBuilder([
        col("u.Id"),
        col("u.Name"),
      ]);

      outer.from(inner.createStatement());
      outer.as("u");

      const statement = outer.createStatement();

      expect(() => bindQuery(semantic, statement)).not.toThrow();
    });

    it("does not expose inner relations through a derived query", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        }))
        .addRows([[1, "Alice"]]);

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const inner = new SelectBuilder([
        col("Id"),
      ]);

      inner.from("Users");

      const outer = new SelectBuilder([
        col("Users.Id"),
      ]);

      outer.from(inner.createStatement());
      outer.as("u");

      const statement = outer.createStatement();

      expect(() =>
        bindQuery(semantic, statement)
      ).toThrow();
    });
  });

  describe("joins", () => {
    it("exposes both joined relations to the join predicate", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        }))
        .addRows([
          [1, "Alice"],
        ]);

      const orders = buildTable({ name: "Orders" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "UserId",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([
          [10, 1],
        ]);

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("u.Id"),
        col("o.UserId"),
      ]);

      select.from("Users");
      select.as("u");
      select
        .innerJoin( table("Orders").as("o") )
        .on(
          col("u.Id").eq(col("o.UserId"))
        );

      const statement = select.createStatement();

      expect(() =>
        bindQuery(semantic, statement)
      ).not.toThrow();
    });
  });
});