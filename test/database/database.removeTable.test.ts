import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { ReferentialAction } from '../../src/schema/ReferentialAction.js';
import { createColumnTestSpec, createForeignKeyTestSpec_Database } from '../utils/buildSchema.js';

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
      .createColumn(createColumnTestSpec({
        name: "Id",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: true,
      });

    const posts = database.requireTable("Posts")
      .createColumn(createColumnTestSpec({
        name: "UserId",
        type: Number,
        nullable: false,
      }))
      .createIndex({
        name: "FKRI_Posts",
        columns: ["UserId"],
        unique: false,
      });

    const updated = database
      .updateTable(users)
      .updateTable(posts)
      .createForeignKey(
        "posts",
        createForeignKeyTestSpec_Database({
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI_Posts",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      ));

    expect(() => {
      updated.removeTable("Users");
    }).toThrow();
  });
});