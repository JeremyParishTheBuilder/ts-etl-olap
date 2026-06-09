import { describe, it, expect } from 'vitest';
import { Databases } from '../../src/schema/Databases.js';
import { Database } from '../../src/schema/Database.js';

describe('Databases::update', () => {
  it('updates an existing database', () => {
    const databases = new Databases()
      .add(
        new Database("DB1")
          .createTable({name: "T1"})
      );

    const updated = databases.update(
      new Database("DB1")
        .createTable({name: "T2"})
    );

    expect(() => {
      updated.require("DB1")
        .requireTable("T1");
    }).toThrow();

    expect(
      updated.require("DB1")
        .requireTable("T2")
    ).toBeDefined();
  });
});