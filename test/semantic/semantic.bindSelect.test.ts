import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '../../src/relational/Database.js';
import { ExecutionContext } from '../../src/engine/ExecutionContext.js';
import { SemanticAnalyzer } from '../../src/semantic/SemanticAnalyzer.js';
import { SelectBuilder } from '../../src/statements/index.js';
import { bindSelect } from '../../src/semantic/select.js';
import { Engine } from '../../src/engine/Engine.js';
import { buildDatabase, buildTable, createColumnTestSpec } from '../utils/buildSchema.js';
import { ColumnExpressionNode } from '../../src/ast/expression/ColumnExpressionNode.js';
import { freshEngine } from '../utils/engineHelpers.js';
import { SQL_DECIMAL, SQL_INTEGER, SQL_VARCHAR } from '../../src/types/SqlType.js';

describe('SemanticAnalyzer::bindSelect', () => {
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

  it("binds selected columns correctly", () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
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

    const builder = new SelectBuilder([
      new ColumnExpressionNode("Name")
    ]);
    builder.from("Users");
    const stmt = builder.createStatement();

    const result = bindSelect(semantic, stmt);

    const rows = [...result.root.execute()];

    expect(rows).toEqual([
      {
        index: 0,
        values: ["Alice"],
      },
    ]);
  });

  it("supports wildcard selection", () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
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

    const builder = new SelectBuilder("*");
    builder.from("Users");
    const stmt = builder.createStatement();

    const result = bindSelect(semantic, stmt);

    const rows = [...result.root.execute()];

    expect(rows).toEqual([
      {
        index: 0,
        values: [1, "Alice"],
      },
    ]);
  });

  it("binds where predicates correctly", () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .addRows([[10],[20],[30]]);

    const database = buildDatabase()
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    
    const builder = new SelectBuilder("*");
    builder.from("Users");
    builder.where(
      new ColumnExpressionNode("Age").gt(15)
    );

    const stmt = builder.createStatement();

    const result = bindSelect(semantic, stmt);

    const rows = [...result.root.execute()];

    expect(rows).toEqual([
      {
        index: 1,
        values: [20],
      },
      {
        index: 2,
        values: [30],
      },
    ]);
  });

  it("resolves column identifiers case-insensitively", () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "UserId",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .addRows([[1]]);

    const database = buildDatabase()
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    const builder = new SelectBuilder([
      new ColumnExpressionNode("userid")
    ]);
    builder.from("users");
    const stmt = builder.createStatement();

    const result = bindSelect(semantic, stmt);

    const rows = [...result.root.execute()];

    expect(rows).toEqual([
      {
        index: 0,
        values: [1],
      },
    ]);
  });

  it("throws for missing selected columns", () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
      }));

    const database = buildDatabase()
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    const builder = new SelectBuilder([
      new ColumnExpressionNode("MissingColumn")
    ]);
    builder.from("users");
    const stmt = builder.createStatement();

    expect(() => {
      bindSelect(semantic, stmt);
    }).toThrow();
  });

  it("throws for missing where columns", () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
      }));

    const database = buildDatabase()
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    const builder = new SelectBuilder("*");
    builder.from("users");
    builder.where(
          new ColumnExpressionNode("MissingColumn").eq(1)
        );
    const stmt = builder.createStatement();

    expect(() => {
      bindSelect(semantic, stmt);
    }).toThrow();
  });

  it("produces deterministic execution results", () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
      }))
      .addRows([[1],[2]]);

    const database = buildDatabase()
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    const builder = new SelectBuilder("*");
    builder.from("Users");
    const stmt = builder.createStatement();

    const result = bindSelect(semantic, stmt);

    const first = [...result.root.execute()];
    const second = [...result.root.execute()];

    expect(first).toEqual(second);
  });

  describe('metadata', () => {
    it("returns metadata for selected columns", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(
          createColumnTestSpec({
            name: "Id",
            type: SQL_INTEGER,
            nullable: false,
          })
        )
        .createColumn(
          createColumnTestSpec({
            name: "Name",
            type: SQL_VARCHAR,
            nullable: true,
          })
        )
        .addRows([[1, "Alice"]]);

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);

      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        new ColumnExpressionNode("Name"),
        new ColumnExpressionNode("Id"),
      ]);
      builder.from("Users");

      const stmt = builder.createStatement();

      const result = bindSelect(semantic, stmt);

      expect(result.columns).toEqual([
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        },
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
      ]);
    });

    it("returns metadata for SELECT *", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(
          createColumnTestSpec({
            name: "Id",
            type: SQL_INTEGER,
            nullable: false,
          })
        )
        .createColumn(
          createColumnTestSpec({
            name: "Name",
            type: SQL_VARCHAR,
            nullable: true,
          })
        )
        .addRows([[1, "Alice"]]);

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);

      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder("*");
      builder.from("Users");

      const stmt = builder.createStatement();

      const result = bindSelect(semantic, stmt);

      expect(result.columns).toEqual([
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        },
      ]);
    });

    it("returns metadata in projection order", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(
          createColumnTestSpec({
            name: "Id",
            type: SQL_INTEGER,
            nullable: false,
          })
        )
        .createColumn(
          createColumnTestSpec({
            name: "Name",
            type: SQL_VARCHAR,
            nullable: false,
          })
        )
        .createColumn(
          createColumnTestSpec({
            name: "Age",
            type: SQL_INTEGER,
            nullable: false,
          })
        )
        .addRows([[1, "Alice", 30]]);

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);

      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        new ColumnExpressionNode("Age"),
        new ColumnExpressionNode("Name"),
      ]);
      builder.from("Users");

      const stmt = builder.createStatement();

      const result = bindSelect(semantic, stmt);

      expect(result.columns).toEqual([
        {
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        },
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        },
      ]);
    });

    it("provides metadata even when the query returns no rows", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(
          createColumnTestSpec({
            name: "Id",
            type: SQL_INTEGER,
            nullable: false,
          })
        )
        .createColumn(
          createColumnTestSpec({
            name: "Name",
            type: SQL_VARCHAR,
            nullable: true,
          })
        )
        .addRows([[1, "Alice"]]);

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);

      engine.beginTx();

      const semantic = createSemantic(database);
      
      const builder = new SelectBuilder([
        new ColumnExpressionNode("Id"),
        new ColumnExpressionNode("Name"),
      ]);
      builder.from("Users");
      builder.where(new ColumnExpressionNode("Id").gt(100));

      const result = bindSelect(semantic, builder.createStatement());

      expect(result.columns).toEqual([
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        },
      ]);

      expect([...result.root.execute()]).toEqual([]);
    });
  });
});