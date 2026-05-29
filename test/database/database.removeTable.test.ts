import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';

describe('Database::removeTable', () => {
  it('removes a table from the database', () => {
    const database = new Database("DB1")
      .createTable("T1");

    const updated = database.removeTable("T1");

    expect(() => {
      updated.requireTable("T1");
    }).toThrow();
  });

  it('does not mutate original database (immutability)', () => {
    const database = new Database("DB1")
      .createTable("T1");

    const updated = database.removeTable("T1");

    expect(database.requireTable("T1")).toBeDefined();

    expect(() => {
      updated.requireTable("T1");
    }).toThrow();
  });

  it('throws when table is referenced by a foreign key', () => {
    const database = new Database("DB1")
      .createTable("Users")
      .createTable("Posts");
      
    const users = database.requireTable("Users")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: true,
      });

    const posts = database.requireTable("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      });

    const updated = database
      .updateTable(users)
      .updateTable(posts)
      .createForeignKey(
        "posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
          onDelete: ReferentialAction.restrict,
          onUpdate: ReferentialAction.restrict,
        }
      );

    expect(() => {
      updated.removeTable("Users");
    }).toThrow();
  });
});