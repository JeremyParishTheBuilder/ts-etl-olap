import { describe, it, expect } from 'vitest';

import { Dialect } from "../../src/dialect/index.js";
import { EngineRegistry } from '../../src/engine/index.js';
import { freshEngine } from './freshEngine.js';

describe('EngineRegistry', () => {
  it('creates and retrieves engine', () => {
    const registry = EngineRegistry.getInstance();

    //registry.newEngine("E1", Dialect.Postgres);
    //const engine = registry.engine("E1");'
    const engine = freshEngine();

    expect(engine).toBeDefined();
    expect(engine.dialect).toBe(Dialect.Postgres);
  });
});