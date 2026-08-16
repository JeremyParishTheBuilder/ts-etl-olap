import { EngineRegistry } from "../../src/engine/index.js";
import { Dialect } from "../../src/dialect/index.js";
import type { Engine } from "../../src/engine/Engine.ts";
import type { PostgresInputBatch } from "../../src/input/PostgresInputBatch.ts";
import type { SqlServerInputBatch } from "../../src/input/SqlServerInputBatch.ts";
import type { MySqlInputBatch } from "../../src/input/MySqlInputBatch.ts";

let engineId = 0;

export function freshEngine(dialect?: Dialect) {
  const registry = EngineRegistry.getInstance();
  const name = `E_${engineId++}`;

  registry.newEngine(name, dialect ?? Dialect.Postgres);
  registry.setDefaultEngine(name);

  return registry.engine();
}

export function createTestSql(engine?: Engine) {
  return (engine ?? freshEngine()).input();
}

export function createTestPostgresSql(
  engine?: Engine,
): PostgresInputBatch {
  return (engine ?? freshEngine()).input() as PostgresInputBatch;
}

export function createTestSqlServerSql(
  engine?: Engine,
): SqlServerInputBatch {
  return (engine ?? freshEngine()).input() as SqlServerInputBatch;
}

export function createTestMySqlSql(
  engine?: Engine,
): MySqlInputBatch {
  return (engine ?? freshEngine()).input() as MySqlInputBatch;
}