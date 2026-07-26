import { describe, it, expect } from 'vitest';
import {
  buildDatabase,
  buildTable,
} from '../utils/buildSchema.js';

describe("Database::alterColumn", () => {

  it("rejects altering a parent column to an incompatible type", () => {
    const users = buildTable({ name: "Users" })
      .createColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: true,
      });

    const posts = buildTable({ name: "Posts" })
      .createColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "FKRI",
        columns: ["UserId"],
        unique: false,
      });

    const database = buildDatabase()
      .addTable(users)
      .addTable(posts)
      .createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );

    expect(() => {
      database.alterColumn(
        "Users",
        "Id",
        String
      );
    }).toThrow();
  });

  it("rejects altering a child column to an incompatible type", () => {
    // identical setup
    const users = buildTable({ name: "Users" })
      .createColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: true,
      });

    const posts = buildTable({ name: "Posts" })
      .createColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "FKRI",
        columns: ["UserId"],
        unique: false,
      });

    const database = buildDatabase()
      .addTable(users)
      .addTable(posts)
      .createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );

    expect(() => {
      database.alterColumn(
        "Posts",
        "UserId",
        String
      );
    }).toThrow();
  });

  it("allows altering when foreign-key types remain compatible", () => {
    // identical setup

    const users = buildTable({ name: "Users" })
      .createColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: true,
      });

    const posts = buildTable({ name: "Posts" })
      .createColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "FKRI",
        columns: ["UserId"],
        unique: false,
      });

    const database = buildDatabase()
      .addTable(users)
      .addTable(posts)
      .createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );

    expect(() => {
      database.alterColumn(
        "Users",
        "Id",
        Number
      );
    }).not.toThrow();
  });

  it("matches corresponding columns in a composite foreign key", () => {
    const users = buildTable({ name: "Users" })
      .createColumn({
        name: "FirstId",
        type: Number,
        nullable: false,
      })
      .createColumn({
        name: "SecondId",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_Users",
        columns: ["FirstId", "SecondId"],
        unique: true,
      });

    const posts = buildTable({ name: "Posts" })
      .createColumn({
        name: "UserFirstId",
        type: Number,
        nullable: false,
      })
      .createColumn({
        name: "UserSecondId",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "FKRI",
        columns: ["UserFirstId", "UserSecondId"],
        unique: false,
      });

    const database = buildDatabase()
      .addTable(users)
      .addTable(posts)
      .createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserFirstId", "UserSecondId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["FirstId", "SecondId"],
        }
      );

    expect(() => {
      database.alterColumn(
        "Users",
        "SecondId",
        String
      );
    }).toThrow();
  });

});