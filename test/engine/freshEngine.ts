import { EngineRegistry } from "../../src/engine/index.js";
import { Dialect } from "../../src/dialect/index.js";

let engineId = 0;

export function freshEngine() {
  const registry = EngineRegistry.getInstance();
  const name = `E_${engineId++}`;

  registry.newEngine(name, Dialect.Postgres);
  registry.setDefaultEngine(name);

  return registry.engine();
}