import { describe, it, expect } from 'vitest';
import { Databases } from '../../src/schema/Databases.js';

describe('Databases::createDatabase', () => {
  it('creates a database', () => {
    const databases = new Databases();

    const updated = databases.create("DB1");

    expect(updated.require("DB1")).toBeDefined();
  });

  it('does not mutate original databases collection (immutability)', () => {
    const databases = new Databases();

    const updated = databases.create("DB1");

    expect(() => databases.require("DB1")).toThrow();
    expect(updated.require("DB1")).toBeDefined();
  });
});