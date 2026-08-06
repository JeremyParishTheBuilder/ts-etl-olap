import { EngineRegistry } from "../../src/engine/index.js";
import { Dialect } from "../../src/dialect/index.js";
import type { Engine } from "../../src/engine/Engine.ts";
import type { PostgresInputBatch } from "../../src/input/PostgresInputBatch.ts";

let engineId = 0;

export function freshEngine() {
  const registry = EngineRegistry.getInstance();
  const name = `E_${engineId++}`;

  registry.newEngine(name, Dialect.Postgres);
  registry.setDefaultEngine(name);

  return registry.engine();
}

export function createTestSql(engine?: Engine) {
  return (engine ?? freshEngine())
    .input() as PostgresInputBatch;
}
