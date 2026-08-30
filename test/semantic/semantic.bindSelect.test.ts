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
import { case_, cast, col, selectAs, val } from '../../src/ast/dsl.js';

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
        selectAs(col("Name"), "UserName"),
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
        selectAs(col("Age").add(1), "Age"),
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
  });
});