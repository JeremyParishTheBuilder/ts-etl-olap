import { describe, it, expect } from 'vitest';
import { Databases } from '../../src/schema/Databases.js';
import { buildDatabase } from '../utils/buildSchema.js';

describe('Databases::update', () => {
  it('updates an existing database', () => {
    const databases = new Databases()
      .add(
        buildDatabase({name: "DB1"})
          .createTable({name: "T1"})
      );

    const database = databases.requireByName("DB1");

    const table1 = database.tables.requireByName("T1");

    const updatedDatabase = database
      .createTable({name: "T2"})
      .removeTableById(table1.id);

    const updatedDatabases = databases.update(updatedDatabase);

    expect(() => {
      updatedDatabases.requireByName("DB1")
        .tables.requireByName("T1");
    }).toThrow();

    expect(
      updatedDatabases.requireByName("DB1")
        .tables.requireByName("T2")
    ).toBeDefined();
  });
});