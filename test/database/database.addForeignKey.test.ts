import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { Table } from '../../src/schema/Table.js';
import { createColumnTestSpec } from '../utils/buildSchema.js';

describe('Database::createForeignKey', () => {
  function buildDatabase() {
    let users = new Table("Users")
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

    const posts = new Table("Posts")
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

    return new Database("DB1")
      .addTable(users)
      .addTable(posts);
  }

  it('adds a foreign key to the child table', () => {
    const database = buildDatabase();

    const updated = database.createForeignKey(
      "Posts",
      {
        name: "FK_Posts_Users",
        columns: ["UserId"],
        reverseIndex: "FKRI",
        parentTable: "Users",
        parentColumns: ["Id"],
      },
    );

    expect(
      updated
        .requireTable("Posts")
        .requireForeignKey("FK_Posts_Users")
    ).toBeDefined();
  });

  it('does not mutate original database (immutability)', () => {
    const database = buildDatabase();

    const updated = database.createForeignKey(
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
      database
        .requireTable("Posts")
        .requireForeignKey("FK_Posts_Users");
    }).toThrow();

    expect(
      updated
        .requireTable("Posts")
        .requireForeignKey("FK_Posts_Users")
    ).toBeDefined();
  });

  it('does not mutate parent table', () => {
    const database = buildDatabase();

    const originalParent =
      database.requireTable("Users");

    const updated = database.createForeignKey(
      "Posts",
      {
        name: "FK_Posts_Users",
        columns: ["UserId"],
        reverseIndex: "FKRI",
        parentTable: "Users",
        parentColumns: ["Id"],
      }
    );

    expect(
      updated.requireTable("Users")
    ).toBe(originalParent);
  });

  it('throws when child table does not exist', () => {
    const database = buildDatabase();

    expect(() => {
      database.createForeignKey(
        "MissingTable",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );
    }).toThrow();
  });

  it('throws when parent table does not exist', () => {
    const database = buildDatabase();

    expect(() => {
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "MissingTable",
          parentColumns: ["Id"],
        }
      );
    }).toThrow();
  });

  it('throws when child columns do not exist', () => {
    const database = buildDatabase();

    expect(() => {
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["MissingColumn"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );
    }).toThrow();
  });

  it('throws when parent columns do not exist', () => {
    const database = buildDatabase();

    expect(() => {
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["MissingColumn"],
        }
      );
    }).toThrow();
  });

  it('throws when parent columns are not uniquely indexed', () => {
    let users = new Table("Users")
      .createColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: false,
      });

    const posts = new Table("Posts")
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

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

    expect(() => {
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );
    }).toThrow();
  });

  it('throws when child and parent column counts differ', () => {
    let database = buildDatabase();
    
    let users = database.requireTable("Users");
    users = users
      .createColumn(createColumnTestSpec({name: "Id2"}))
      .createIndex({
        name: "PK_Users2",
        columns: ["Id", "Id2"],
        unique: true,
      });

    database = database.updateTable(users);

    expect(() => {
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id", "Id2"],
        }
      );
    }).toThrow();
  });

  it('throws when child and parent column types differ', () => {
    const users = new Table("Users")
      .createColumn({
        name: "Id",
        type: String,
        nullable: false,
      })
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: true,
      });

    const posts = new Table("Posts")
      .createColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      });

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

    expect(() => {
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );
    }).toThrow();
  });

  it('supports case-insensitive table and column references', () => {
    const database = buildDatabase();

    const updated = database.createForeignKey(
      "posts",
      {
        name: "FK_Posts_Users",
        columns: ["userid"],
        reverseIndex: "FKRI",
        parentTable: "users",
        parentColumns: ["id"],
      }
    );

    expect(
      updated
        .requireTable("Posts")
        .requireForeignKey("FK_Posts_Users")
    ).toBeDefined();
  });

  it('throws when foreign key name already exists', () => {
    const database = buildDatabase()
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
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );
    }).toThrow();
  });

  it("throws when existing child rows violate the foreign key", () => {
    const users = new Table("Users")
      .createColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .addRow([1])
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: true,
      });

    const posts = new Table("Posts")
      .createColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "FKRI",
        columns: ["UserId"],
        unique: false,
      })
      .addRow([999]);

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

    expect(() => {
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );
    }).toThrow();
  });

  it("allows adding a foreign key when existing child rows are valid", () => {
    const users = new Table("Users")
      .createColumn({
        name: "Id",
        type: Number,
        nullable: false,
      })
      .addRow([1])
      .createIndex({
        name: "PK_Users",
        columns: ["Id"],
        unique: true,
      });

    const posts = new Table("Posts")
      .createColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      })
      .createIndex({
        name: "FKRI",
        columns: ["UserId"],
        unique: false,
      })
      .addRow([1])

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

    expect(() => {
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );
    }).not.toThrow();
  });

  it("ignores existing rows with null foreign key components", () => {
    const users = new Table("Users")
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

    const posts = new Table("Posts")
      .createColumn({
        name: "UserId",
        type: Number,
        nullable: true,
      })
      .createIndex({
        name: "FKRI",
        columns: ["UserId"],
        unique: false,
      })
      .addRow([null]);

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

    expect(() => {
      database.createForeignKey(
        "Posts",
        {
          name: "FK_Posts_Users",
          columns: ["UserId"],
          reverseIndex: "FKRI",
          parentTable: "Users",
          parentColumns: ["Id"],
        }
      );
    }).not.toThrow();
  });
});