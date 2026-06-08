import { describe, it, expect } from 'vitest';
import { buildCompositeKeyDatabase, buildDatabase, buildParentChildDatabase, buildTable } from '../utils/buildSchema.js';

describe('Database::removeColumn', () => {

  it('removes a column from the correct table', () => {
    // const table = new Table("T1")
    //   .addColumn({ name: "C1", type: Number });

    // const db = new Database("DB1")
    //   .addTable(table);

    const db = buildDatabase();

    const updatedDb = db.removeColumn("T1", "C1");

    const updatedTable = updatedDb.requireTable("T1");

    expect(() => updatedTable.requireColumn("C1")).toThrow();
  });

  it('does not affect other tables', () => {
    // const table1 = new Table("T1")
    //   .addColumn({ name: "C1", type: Number });

    // const table2 = new Table("T2")
    //   .addColumn({ name: "C1", type: Number });

    // const db = new Database("DB1")
    //   .addTable(table1)
    //   .addTable(table2);

    const db = buildDatabase({tables: 2});

    const updatedDb = db.removeColumn("T1", "C1");

    const updatedTable2 = updatedDb.requireTable("T2");

    expect(updatedTable2.requireColumn("C1")).toBeDefined();
  });

  it('throws when parent column is referenced by a foreign key', () => {
    const db = buildParentChildDatabase();

    expect(() =>
      db.removeColumn(
        "Parent",
        "id",
      )
    ).toThrow();
  });

  it('throws when child column is referenced by a foreign key', () => {
    const db = buildParentChildDatabase();

    expect(() =>
      db.removeColumn(
        "Child",
        "ref",
      )
    ).toThrow();
  });

  it('rejects removing parent columns used by composite foreign keys', () => {

    const db = buildCompositeKeyDatabase();

    expect(() =>
      db.removeColumn(
        "Parent",
        "c1",
      )
    ).toThrow();
  });

  it('rejects removing parent columns used by composite foreign keys', () => {

    const db = buildCompositeKeyDatabase();

    expect(() =>
      db.removeColumn(
        "Child",
        "c1",
      )
    ).toThrow();
  });

  it('allows removal when no foreign key references exist', () => {

    const db = buildDatabase();

    const updatedDb = db.removeColumn("t1", "c1");

    const updatedTable = updatedDb.requireTable("t1");

    expect(() => updatedTable.requireColumn("a")).toThrow();
  });

  it('does not mutate original database (immutability)', () => {
    // const table = new Table("T1")
    //   .addColumn({ name: "C1", type: Number });

    // const db = new Database("DB1")
    //   .addTable(table);

    const db = buildDatabase();

    const updatedDb = db.removeColumn("t1", "c1");

    const originalTable = db.requireTable("t1");
    const updatedTable = updatedDb.requireTable("t1");

    expect(originalTable.requireColumn("c1")).toBeDefined();
    expect(() => updatedTable.requireColumn("c1")).toThrow();
  });

});