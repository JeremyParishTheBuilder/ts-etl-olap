import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { buildTable, createColumnTestSpec } from '../utils/buildSchema.js';

describe('Database::updateTable', () => {
  it('replaces an existing table with using same name', () => {
    const table = buildTable({name: "T1"})
      .createColumn(createColumnTestSpec({ name: "C1", type: Number }));

    const updatedTable = table
      .createColumn(createColumnTestSpec({ name: "C2", type: Number }));

    const database = new Database("DB1")
      .addTable(table);

    const updatedDb = database.updateTable(updatedTable);

    expect(
      updatedDb.tables.requireByName("T1").columns.requireByName("C2")
    ).toBeDefined();
  });
});