import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint';
import { ForeignKey } from '../../src/schema/ForeignKey';
import { Table } from '../../src/schema/Table';
import { Index } from '../../src/schema/Index';

describe('Database::renameTable', () => {
  it('propagates parent table rename to referencing foreign keys', () => {
    const users = new Table("Users")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .addIndex(
        Index.fromSpec({
          name: "PK_Users",
          columns: ["Id"],
          unique: true,
        })
      );

    const posts = new Table("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .addForeignKey(
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

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