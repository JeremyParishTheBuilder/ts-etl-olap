import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { Table } from '../../src/schema/Table.js';

describe('Database::renameTable', () => {
  it('propagates parent table rename to referencing foreign keys', () => {
    const users = new Table("Users")
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

    const posts = new Table("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      });

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts)
      .createForeignKey("posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        });

    const updated = database.renameTable(
      "Users",
      "Accounts"
    );

    const fk =
      updated
        .requireTable("Posts")
        .requireForeignKey("FK_Posts_Users");

    expect(fk.parentTable).toBe("accounts");
  });
});