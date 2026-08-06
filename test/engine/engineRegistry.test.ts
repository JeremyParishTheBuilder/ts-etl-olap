import { describe, it, expect } from 'vitest';
import { Dialect } from "../../src/dialect/index.js";
import { freshEngine } from '../utils/engineHelpers.js';

describe('EngineRegistry', () => {
  it('creates and retrieves engine', () => {
    const engine = freshEngine();

    expect(engine).toBeDefined();
    expect(engine.dialect).toBe(Dialect.Postgres);
  });
});