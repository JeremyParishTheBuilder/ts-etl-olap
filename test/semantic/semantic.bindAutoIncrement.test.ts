import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '../../src/relational/Database.js';
import { ExecutionContext } from '../../src/engine/ExecutionContext.js';
import { SemanticAnalyzer } from '../../src/semantic/SemanticAnalyzer.js';
import { InsertIntoBuilder, UpdateSetBuilder } from '../../src/statements/index.js';

import { Engine } from '../../src/engine/Engine.js';
import { buildDatabase, buildTable } from '../utils/buildSchema.js';
import { freshEngine } from '../utils/engineHelpers.js';
import { col } from '../../src/ast/dsl.js';
import { bindInsertInto } from '../../src/semantic/insertInto.js';
import { DEFAULT } from '../../src/dialect/keywords.js';
import { bindUpdateSet } from '../../src/semantic/updateSet.js';
import type { Table } from '../../src/relational/Table.js';
import type { ColumnPolicy } from '../../src/relational/Column.js';
import { SQL_DECIMAL, SQL_VARCHAR } from '../../src/types/SqlType.js';

let engine: Engine;

beforeEach(() => {
  engine = freshEngine();
});

function createSemantic(database: Database) {
  const ctx = new ExecutionContext(
    engine.requireTx(),
    engine.rules,
    database.name,
  );

  return new SemanticAnalyzer(ctx);
}

function installDatabase(table: Table): Database {
  const database = buildDatabase()
    .addTable(table);

  engine.databases = engine.databases.add(database);
  engine.beginTx();

  return database;
}

function createUsers(
  policy: Partial<ColumnPolicy>,
): Table {
  const users = buildTable({ name: "Users" })
    .createColumn(
      {
        name: "Id",
        type: SQL_DECIMAL,
        nullable: false,
        autoIncrementStep: 1,
        autoIncrementStart: 10,
      },
      {
        autoIncrementAllowsExplicitValue:
          policy.autoIncrementAllowsExplicitValue ?? false,
        autoIncrementAllowsExplicitDefault:
          policy.autoIncrementAllowsExplicitDefault ?? true,
      },
    )
    .createColumn({
      name: "Name",
      type: SQL_VARCHAR,
      nullable: false,
    });

  return users;
}


describe("INSERT", () => {
  it("rejects an explicit value when auto-increment explicit values are disallowed", () => {
    const users = createUsers({
      autoIncrementAllowsExplicitValue: false,
      autoIncrementAllowsExplicitDefault: true,
    });

    const database = installDatabase(users);
    const semantic = createSemantic(database);

    const builder = new InsertIntoBuilder(
      "Users",
      ["Id", "Name"],
    );

    builder.values([
      [42, "Bob"],
    ]);

    const stmt = builder.createStatement();

    expect(() => bindInsertInto(semantic, stmt)).toThrow();
  });

  it("allows an explicit value when auto-increment explicit values are allowed", () => {
    const users = createUsers({
      autoIncrementAllowsExplicitValue: true,
      autoIncrementAllowsExplicitDefault: true,
    });


    const database = installDatabase(users);
    const semantic = createSemantic(database);

    const builder = new InsertIntoBuilder(
      "Users",
      ["Id", "Name"],
    );

    builder.values([
      [42, "Bob"],
    ]);

    const stmt = builder.createStatement();

    expect(() => bindInsertInto(semantic, stmt)).not.toThrow();
  });

  it("rejects explicit DEFAULT when auto-increment DEFAULT is disallowed", () => {
    const users = createUsers({
      autoIncrementAllowsExplicitValue: true,
      autoIncrementAllowsExplicitDefault: false,
    });


    const database = installDatabase(users);
    const semantic = createSemantic(database);

    const builder = new InsertIntoBuilder(
      "Users",
      ["Id", "Name"],
    );

    builder.values([
      [DEFAULT, "Bob"],
    ]);

    const stmt = builder.createStatement();

    expect(() => bindInsertInto(semantic, stmt)).toThrow();
  });

  it("allows explicit DEFAULT when auto-increment DEFAULT is allowed", () => {
    const users = createUsers({
      autoIncrementAllowsExplicitValue: false,
      autoIncrementAllowsExplicitDefault: true,
    });


    const database = installDatabase(users);
    const semantic = createSemantic(database);

    const builder = new InsertIntoBuilder(
      "Users",
      ["Id", "Name"],
    );

    builder.values([
      [DEFAULT, "Bob"],
    ]);

    const stmt = builder.createStatement();

    expect(() => bindInsertInto(semantic, stmt)).not.toThrow();
  });
});

describe("UPDATE", () => {
  it("rejects an explicit value when auto-increment explicit values are disallowed", () => {
    const users = createUsers({
      autoIncrementAllowsExplicitValue: false,
      autoIncrementAllowsExplicitDefault: true,
    });


    const database = installDatabase(users);
    const semantic = createSemantic(database);

    const builder = new UpdateSetBuilder("Users");

    builder.set({
      Id: 42,
    });

    builder.where(
      col("Id").eq(10),
    );

    const stmt = builder.createStatement();

    expect(() => bindUpdateSet(semantic, stmt)).toThrow();
  });

  it("allows an explicit value when auto-increment explicit values are allowed", () => {
    const users = createUsers({
      autoIncrementAllowsExplicitValue: true,
      autoIncrementAllowsExplicitDefault: true,
    });


    const database = installDatabase(users);
    const semantic = createSemantic(database);

    const builder = new UpdateSetBuilder("Users");

    builder.set({
      Id: 42,
    });

    builder.where(
      col("Id").eq(10),
    );

    const stmt = builder.createStatement();

    expect(() => bindUpdateSet(semantic, stmt)).not.toThrow();
  });

  it("rejects explicit DEFAULT when auto-increment DEFAULT is disallowed", () => {
    const users = createUsers({
      autoIncrementAllowsExplicitValue: true,
      autoIncrementAllowsExplicitDefault: false,
    });


    const database = installDatabase(users);
    const semantic = createSemantic(database);

    const builder = new UpdateSetBuilder("Users");

    builder.set({
      Id: DEFAULT,
    });

    builder.where(
      col("Id").eq(10),
    );

    const stmt = builder.createStatement();

    expect(() => bindUpdateSet(semantic, stmt)).toThrow();
  });

  it("allows explicit DEFAULT when auto-increment DEFAULT is allowed", () => {
    const users = createUsers({
      autoIncrementAllowsExplicitValue: false,
      autoIncrementAllowsExplicitDefault: true,
    });

    const database = installDatabase(users);
    const semantic = createSemantic(database);

    const builder = new UpdateSetBuilder("Users");

    builder.set({
      Id: DEFAULT,
    });

    builder.where(
      col("Id").eq(10),
    );

    const stmt = builder.createStatement();

    expect(() => bindUpdateSet(semantic, stmt)).not.toThrow();
  });
});