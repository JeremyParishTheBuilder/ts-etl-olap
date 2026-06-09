import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { ExecutionContext } from '../../src/engine/ExecutionContext.js';
import { SemanticAnalyzer } from '../../src/semantic/SemanticAnalyzer.js';
import { SelectBuilder } from '../../src/statements/index.js';
import { bindSelect } from '../../src/semantic/select.js';
import { freshEngine } from '../engine/freshEngine.js';
import { Engine } from '../../src/engine/Engine.js';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('SemanticAnalyzer::bindSelect', () => {
  let engine: Engine;

  const dbName = "DB1";

  beforeEach(() => {
    engine = freshEngine();
  });

  function createSemantic(database: Database) {
    const ctx = new ExecutionContext(
      engine.requireTx(),
      engine.rules,
      dbName
    );

    return new SemanticAnalyzer(ctx);
  }

  it("binds selected columns correctly", () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Name",
        type: String,
        nullable: false,
      }))
      .addRow([1, "Alice"]);

    
    const database = new Database("DB1")
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    const builder = new SelectBuilder(["Name"]);
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
        type: Number,
        nullable: false,
      }))
      .createColumn(createColumnTestSpec({
        name: "Name",
        type: String,
        nullable: false,
      }))
      .addRow([1, "Alice"]);

    const database = new Database("DB1")
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
        type: Number,
        nullable: false,
      }))
      .addRow([10])
      .addRow([20])
      .addRow([30]);

    const database = new Database("DB1")
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    const builder = new SelectBuilder("*");
    builder.from("Users");
    builder.where("Age").gt(15);

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
        type: Number,
        nullable: false,
      }))
      .addRow([1]);

    const database = new Database("DB1")
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    const builder = new SelectBuilder(["userid"]);
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
        type: Number,
        nullable: false,
      }));

    const database = new Database("DB1")
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    const builder = new SelectBuilder(["MissingColumn"]);
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
        type: Number,
        nullable: false,
      }));

    const database = new Database("DB1")
      .addTable(users);

    engine.databases = engine.databases.add(database);

    engine.beginTx();

    const semantic = createSemantic(database);

    const builder = new SelectBuilder("*");
    builder.from("users");
    builder.where("MissingColumn").eq(1);
    const stmt = builder.createStatement();

    expect(() => {
      bindSelect(semantic, stmt);
    }).toThrow();
  });

  it("produces deterministic execution results", () => {
    const users = buildTable({name: "Users"})
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .addRow([1])
      .addRow([2]);

    const database = new Database("DB1")
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
});