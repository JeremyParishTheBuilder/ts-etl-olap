import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '../../src/relational/Database.js';
import { ExecutionContext } from '../../src/engine/ExecutionContext.js';
import { SemanticAnalyzer } from '../../src/semantic/SemanticAnalyzer.js';
import { SelectBuilder } from '../../src/statements/index.js';
import { bindSelect } from '../../src/semantic/select.js';
import { Engine } from '../../src/engine/Engine.js';
import { buildDatabase, buildTable, createColumnTestSpec } from '../utils/buildSchema.js';
import { ColumnExpressionNode } from '../../src/ast/expression/ColumnExpressionNode.js';
import { createTestTableProjection, freshEngine } from '../utils/engineHelpers.js';
import { SQL_DECIMAL, SQL_INTEGER, SQL_VARCHAR } from '../../src/types/SqlType.js';
import { case_, cast, col, val } from '../../src/ast/dsl.js';
import { bindQuery } from '../../src/semantic/query.js';
import type { ExpressionNode } from '../../src/ast/expression/ExpressionNode.js';

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

    it("derives metadata for SELECT *", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        }))
        .addRows([[1, "Alice"]]);

      const database = buildDatabase().addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder("*");
      builder.from("Users");

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
    });

    it("derives metadata from a selected column expression", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        }))
        .addRows([[1, "Alice"]]);

      const database = buildDatabase().addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        new ColumnExpressionNode("Name"),
      ]);

      builder.from("Users");

      const result = bindSelect(semantic, builder.createStatement());

      expect(result.columns).toEqual([
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        },
      ]);
    });

    it("uses a SELECT alias as the result column name", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        }))
        .addRows([[1, "Alice"]]);

      const database = buildDatabase().addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        col("Name").as("UserName"),
      ]);

      builder.from("Users");

      const result = bindSelect(semantic, builder.createStatement());

      expect(result.columns).toEqual([
        {
          name: "UserName",
          type: SQL_VARCHAR,
          nullable: true,
        },
      ]);
    });

    it("derives metadata for a computed expression", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        }))
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1, "Alice", 18]]);

      const database = buildDatabase().addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        col("Age").add(1),
      ]);

      builder.from("Users");

      const result = bindSelect(semantic, builder.createStatement());

      expect(result.columns[0].type).toEqual(SQL_INTEGER);
    });

    it("derives the result type from CAST", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        }))
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1, "Alice", 18]]);

      const database = buildDatabase().addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        cast(col("Age")).as(SQL_VARCHAR),
      ]);

      builder.from("Users");

      const result = bindSelect(semantic, builder.createStatement());

      expect(result.columns[0].type).toEqual(SQL_VARCHAR);
    });

    it("derives a common type for CASE branches", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        }))
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1, "Alice", 18]]);

      const database = buildDatabase().addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        case_().when(val(true).isNotNull()).then(col("Age")).else(0)
      ]);

      builder.from("Users");

      const result = bindSelect(semantic, builder.createStatement());
      // CASE WHEN ... THEN Age ELSE 0 END

      expect(result.columns[0].type).toEqual(SQL_INTEGER);
    });

    it("derives metadata from a literal expression", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        }))
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1, "Alice", 18]]);

      const database = buildDatabase().addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        42,
      ]);

      builder.from("Users");

      const result = bindSelect(semantic, builder.createStatement());

      expect(result.columns[0].type).toEqual(SQL_INTEGER);
    });

    it("generates a default name for an unnamed expression", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        }))
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1, "Alice", 18]]);

      const database = buildDatabase().addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        42,
      ]);

      builder.from("Users");

      const result = bindSelect(semantic, builder.createStatement());

      expect(result.columns[0].name).toBe("__DEFAULT_COLUMN:1");
    });

    it("generates distinct names for multiple unnamed expressions", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "Name",
          type: SQL_VARCHAR,
          nullable: true,
        }))
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1, "Alice", 18]]);

      const database = buildDatabase().addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        1,
        2,
        3,
      ]);

      builder.from("Users");

      const result = bindSelect(semantic, builder.createStatement());

      expect(result.columns.map(c => c.name)).toEqual([
        "__DEFAULT_COLUMN:1",
        "__DEFAULT_COLUMN:2",
        "__DEFAULT_COLUMN:3",
      ]);
    });

    it("aligns result metadata with result values positionally", () => {
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
        .createColumn(createColumnTestSpec({
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1, "Alice", 30]]);

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const builder = new SelectBuilder([
        col("Name"),
        col("Age").add(1).as("Age"),
      ]);
      builder.from("Users");

      const result = bindSelect(semantic, builder.createStatement());

      expect(result.columns).toEqual([
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        },
        {
          name: "Age",
          type: SQL_INTEGER,
          nullable: false,
        },
      ]);

      const rows = [...result.root.execute()];

      expect(rows).toEqual([
        {
          index: 0,
          values: ["Alice", 31],
        },
      ]);
    });

    it("allows duplicate result column names", () => {
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

      const select = new SelectBuilder([
        col("u.Id"),
        col("u.Id"),
      ]);

      select.from("Users");
      select.as("u");

      const statement = select.createStatement();
      const plan = bindQuery(semantic, statement);

      expect(plan.columns.map((column) => column.name)).toEqual([
        "Id",
        "Id",
      ]);
    });

    it("allows multiple result columns with the same explicit alias", () => {
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

      const select = new SelectBuilder([
        col("u.Id").as("Value"),
        col("u.Id").as("Value"),
      ]);

      select.from("Users");
      select.as("u");

      const statement = select.createStatement();
      const plan = bindQuery(semantic, statement);

      expect(plan.columns.map((column) => column.name)).toEqual([
        "Value",
        "Value",
      ]);
    });

    it("rejects ambiguous references to duplicate columns in a derived relation", () => {
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

      const inner = new SelectBuilder([
        col("Id"),
        col("Id"),
      ]);

      inner.from("Users");

      const outer = new SelectBuilder([
        col("d.Id"),
      ]);

      outer.from(inner.createStatement());
      outer.as("d");

      const statement = outer.createStatement();

      console.log(statement);

      expect(() =>
        bindQuery(semantic, statement)
      ).toThrow(/ambiguous/i);
    });

    it("allows SELECT * from a derived relation with duplicate column names", () => {
      const users = buildTable({ name: "Users" })
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
        .addRows([[1, 18]]);

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const inner = new SelectBuilder([
        col("Id").as("a"),
        col("Age").as("a"),
      ]);

      inner.from("Users");

      const outer = new SelectBuilder(["*"]);

      outer.from(inner.createStatement());
      outer.as("d");

      expect(() => {
        bindQuery(semantic, outer.createStatement());
      }).not.toThrow();
    });

    it("does not expose the left inner relation through a derived table", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1]]);

      const orders = buildTable({ name: "Orders" })
        .createColumn(createColumnTestSpec({
          name: "UserId",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[2]]);

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const inner = new SelectBuilder([
        col("u.Id"),
        col("o.UserId"),
      ]);

      inner.from("Users");
      inner.as("u")
      inner.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      const outer = new SelectBuilder([
        col("u.Id"),
      ]);

      outer.from(inner.createStatement());
      outer.as("d");

      expect(() => {
        bindQuery(semantic, outer.createStatement());
      }).toThrow(/no relation binding matches/i);
    });

    it("does not expose the right inner relation through a derived table", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1]]);

      const orders = buildTable({ name: "Orders" })
        .createColumn(createColumnTestSpec({
          name: "UserId",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[2]]);

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const inner = new SelectBuilder([
        col("u.Id"),
        col("o.UserId"),
      ]);

      inner.from( createTestTableProjection("Users", "u") );
      inner.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      const outer = new SelectBuilder([
        col("o.UserId"),
      ]);

      outer.from(inner.createStatement());
      outer.as("d");

      expect(() => {
        bindQuery(semantic, outer.createStatement());
      }).toThrow(/no relation binding matches/i);
    });

    it("exposes the derived query only under its outer relation name", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[1]]);

      const orders = buildTable({ name: "Orders" })
        .createColumn(createColumnTestSpec({
          name: "UserId",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .addRows([[2]]);

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const inner = new SelectBuilder([
        col("u.Id"),
        col("o.UserId"),
      ]);

      inner.from("Users");
      inner.as("u")
      inner.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      const outer = new SelectBuilder([
        col("d.Id"),
      ]);

      outer.from(inner.createStatement());
      outer.as("d");

      expect(() => {
        bindQuery(semantic, outer.createStatement());
      }).not.toThrow();
    });
  });

  describe("JOIN", () => {
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
        }));

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
        }));

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

      select.from( createTestTableProjection("Users", "u") );
      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      expect(() => {
        bindQuery(semantic, select.createStatement());
      }).not.toThrow();
    });

    it("rejects an ambiguous unqualified column in a join predicate", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const orders = buildTable({ name: "Orders" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("u.Id"),
      ]);

      select.from( createTestTableProjection("Users", "u") );
      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("Id").eq(col("o.Id")));

      expect(() => {
        bindQuery(semantic, select.createStatement());
      }).toThrow(/ambiguous/i);
    });

    it("resolves qualified columns to the correct joined relation", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

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
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("u.Id"),
        col("o.Id"),
      ]);

      select.from( createTestTableProjection("Users", "u") );
      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      const plan = bindQuery(semantic, select.createStatement());

      expect(plan.columns).toEqual([
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
      ]);
    });

    it("produces joined output columns in left-to-right relation order", () => {
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
        }));

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
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder("*");

      select.from( createTestTableProjection("Users", "u") );
      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      const plan = bindQuery(semantic, select.createStatement());

      expect(plan.columns).toEqual([
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        },
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
        {
          name: "UserId",
          type: SQL_INTEGER,
          nullable: false,
        },
      ]);
    });

    it("allows the select projection to reference either joined relation", () => {
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
        }));

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
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("u.Name"),
        col("o.Id"),
      ]);

      select.from( createTestTableProjection("Users", "u") );
      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      const plan = bindQuery(semantic, select.createStatement());

      expect(plan.columns).toEqual([
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        },
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
      ]);
    });

    it("rejects a qualified column from a relation outside the join scope", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const orders = buildTable({ name: "Orders" })
        .createColumn(createColumnTestSpec({
          name: "UserId",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("x.Id"),
      ]);

      select.from( createTestTableProjection("Users", "u") );
      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      expect(() => {
        bindQuery(semantic, select.createStatement());
      }).toThrow(/relation/i);
    });

    it("supports multiple joins in a single select", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

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
        }));

      const items = buildTable({ name: "Items" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "OrderId",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders)
        .addTable(items);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("u.Id"),
        col("o.Id"),
        col("i.Id"),
      ]);

      select.from( createTestTableProjection("Users", "u") );

      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      select.innerJoin( createTestTableProjection("Items", "i") )
        .on(col("o.Id").eq(col("i.OrderId")));

      expect(() => {
        bindQuery(semantic, select.createStatement());
      }).not.toThrow();
    });

    it("allows a later join predicate to reference relations from earlier joins", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

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
        }));

      const items = buildTable({ name: "Items" })
        .createColumn(createColumnTestSpec({
          name: "OrderId",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders)
        .addTable(items);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("u.Id"),
        col("o.Id"),
        col("i.OrderId"),
      ]);

      select.from( createTestTableProjection("Users", "u") );

      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      select.innerJoin( createTestTableProjection("Items", "i") )
        .on(col("o.Id").eq(col("i.OrderId")));

      const plan = bindQuery(semantic, select.createStatement());

      expect(plan.columns).toEqual([
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
        {
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        },
        {
          name: "OrderId",
          type: SQL_INTEGER,
          nullable: false,
        },
      ]);
    });

    it("rejects an ambiguous column in a later join predicate", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

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
        }));

      const items = buildTable({ name: "Items" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders)
        .addTable(items);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("u.Id"),
      ]);

      select.from( createTestTableProjection("Users", "u") );

      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      select.innerJoin( createTestTableProjection("Items", "i") )
        .on(col("Id").eq(col("i.Id")));

      expect(() => {
        bindQuery(semantic, select.createStatement());
      }).toThrow(/ambiguous/i);
    });

    it("preserves all relations in scope across multiple joins", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

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
        }));

      const items = buildTable({ name: "Items" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }))
        .createColumn(createColumnTestSpec({
          name: "OrderId",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders)
        .addTable(items);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("u.Id"),
        col("o.Id"),
        col("i.Id"),
      ]);

      select.from( createTestTableProjection("Users", "u") );

      select.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      select.innerJoin( createTestTableProjection("Items", "i") )
        .on(col("o.Id").eq(col("i.OrderId")));

      const plan = bindQuery(semantic, select.createStatement());

      expect(plan.columns).toHaveLength(3);
    });

    it("treats a joined derived query as a single outer relation", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const orders = buildTable({ name: "Orders" })
        .createColumn(createColumnTestSpec({
          name: "UserId",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const items = buildTable({ name: "Items" })
        .createColumn(createColumnTestSpec({
          name: "OrderId",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders)
        .addTable(items);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const inner = new SelectBuilder([
        col("u.Id"),
        col("o.UserId"),
      ]);

      inner.from( createTestTableProjection("Users", "u") );
      inner.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      const outer = new SelectBuilder([
        col("j.Id"),
        col("i.OrderId"),
      ]);

      outer.from(inner.createStatement());
      outer.as("j");
      outer.innerJoin( createTestTableProjection("Items", "i") )
        .on(col("j.Id").eq(col("i.OrderId")));

      expect(() => {
        bindQuery(semantic, outer.createStatement());
      }).not.toThrow();
    });

    it("does not expose inner join relations outside a derived query", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const orders = buildTable({ name: "Orders" })
        .createColumn(createColumnTestSpec({
          name: "UserId",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const inner = new SelectBuilder([
        col("u.Id"),
        col("o.UserId"),
      ]);

      inner.from( createTestTableProjection("Users", "u") );
      inner.innerJoin( createTestTableProjection("Orders", "o") )
        .on(col("u.Id").eq(col("o.UserId")));

      const outer = new SelectBuilder([
        col("u.Id"),
      ]);

      outer.from(inner.createStatement());
      outer.as("j");

      expect(() => {
        bindQuery(semantic, outer.createStatement());
      }).toThrow(/relation/i);
    });
  });

  describe("tabular expression binding", () => {
    it("binds an unaliased table reference", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("Id"),
      ]);

      select.from(createTestTableProjection("Users"));

      expect(() => {
        bindQuery(semantic, select.createStatement());
      }).not.toThrow();
    });

    it("binds an unaliased table reference", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

      const database = buildDatabase()
        .addTable(users);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const select = new SelectBuilder([
        col("Id"),
      ]);

      select.from(createTestTableProjection("Users"));

      expect(() => {
        bindQuery(semantic, select.createStatement());
      }).not.toThrow();
    });

    it("does not expose internal join aliases through an outer join alias", () => {
      const users = buildTable({ name: "Users" })
        .createColumn(createColumnTestSpec({
          name: "Id",
          type: SQL_INTEGER,
          nullable: false,
        }));

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
        }));

      const database = buildDatabase()
        .addTable(users)
        .addTable(orders);

      engine.databases = engine.databases.add(database);
      engine.beginTx();

      const semantic = createSemantic(database);

      const createSelect = (
        expression: ExpressionNode,
      ): SelectBuilder => {
        const select = new SelectBuilder([expression]);

        select.from(createTestTableProjection("Users", "u"));

        const joinBuilder = select.innerJoin(
          createTestTableProjection("Orders", "o"),
        );

        joinBuilder.on(
          col("u.Id").eq(col("o.UserId")),
        );

        select.as("a");

        return select;
      };

      expect(() => {
        bindQuery(
          semantic,
          createSelect(col("o.Id")).createStatement(),
        );
      }).toThrow(/No relation binding matches given relation name/i);

      expect(() => {
        bindQuery(
          semantic,
          createSelect(col("a.Id")).createStatement(),
        );
      }).toThrow(/ambiguous/i);

      expect(() => {
        bindQuery(
          semantic,
          createSelect(col("a.UserId")).createStatement(),
        );
      }).not.toThrow();
    });
  });
});