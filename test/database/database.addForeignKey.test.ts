import { describe, it, expect } from 'vitest';
import { Database } from '../../src/schema/Database.js';
import { Table } from '../../src/schema/Table.js';
import { Index } from '../../src/schema/Index.js';
import { PrimaryKey } from '../../src/schema/PrimaryKey.js';
import { ForeignKey } from '../../src/schema/ForeignKey.js';
import { CONSTRAINT_KIND } from '../../src/schema/Constraint.js';

describe('Database::addForeignKey', () => {
  function buildDatabase(): Database {
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
      )
      .addPrimaryKey(
        PrimaryKey.fromSpec({
          kind: CONSTRAINT_KIND.primaryKey,
          name: "PK_Users",
          columns: ["Id"],
          index: "PK_Users",
        })
      );

    const posts = new Table("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      });

    return new Database("DB1")
      .addTable(users)
      .addTable(posts);
  }

  it('adds a foreign key to the child table', () => {
    const database = buildDatabase();

    const updated = database.addForeignKey(
      "Posts",
      ForeignKey.fromSpec({
        kind: CONSTRAINT_KIND.foreignKey,
        name: "FK_Posts_Users",
        columns: ["UserId"],
        parentTable: "Users",
        parentColumns: ["Id"],
      })
    );

    expect(
      updated
        .requireTable("Posts")
        .requireForeignKey("FK_Posts_Users")
    ).toBeDefined();
  });

  it('does not mutate original database (immutability)', () => {
    const database = buildDatabase();

    const updated = database.addForeignKey(
      "Posts",
      ForeignKey.fromSpec({
        kind: CONSTRAINT_KIND.foreignKey,
        name: "FK_Posts_Users",
        columns: ["UserId"],
        parentTable: "Users",
        parentColumns: ["Id"],
      })
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

    const updated = database.addForeignKey(
      "Posts",
      ForeignKey.fromSpec({
        kind: CONSTRAINT_KIND.foreignKey,
        name: "FK_Posts_Users",
        columns: ["UserId"],
        parentTable: "Users",
        parentColumns: ["Id"],
      })
    );

    expect(
      updated.requireTable("Users")
    ).toBe(originalParent);
  });

  it('throws when child table does not exist', () => {
    const database = buildDatabase();

    expect(() => {
      database.addForeignKey(
        "MissingTable",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );
    }).toThrow();
  });

  it('throws when parent table does not exist', () => {
    const database = buildDatabase();

    expect(() => {
      database.addForeignKey(
        "Posts",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "MissingTable",
          parentColumns: ["Id"],
        })
      );
    }).toThrow();
  });

  it('throws when child columns do not exist', () => {
    const database = buildDatabase();

    expect(() => {
      database.addForeignKey(
        "Posts",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["MissingColumn"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );
    }).toThrow();
  });

  it('throws when parent columns do not exist', () => {
    const database = buildDatabase();

    expect(() => {
      database.addForeignKey(
        "Posts",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["MissingColumn"],
        })
      );
    }).toThrow();
  });

  it('throws when parent columns are not uniquely indexed', () => {
    const users = new Table("Users")
      .addColumn({
        name: "Id",
        type: Number,
        nullable: false,
      });

    const posts = new Table("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      });

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

    expect(() => {
      database.addForeignKey(
        "Posts",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );
    }).toThrow();
  });

  it('throws when child and parent column counts differ', () => {
    const users = new Table("Users")
      .addColumn({
        name: "Id1",
        type: Number,
        nullable: false,
      })
      .addColumn({
        name: "Id2",
        type: Number,
        nullable: false,
      })
      .addIndex(
        Index.fromSpec({
          name: "PK_Users",
          columns: ["Id1", "Id2"],
          unique: true,
        })
      );

    const posts = new Table("Posts")
      .addColumn({
        name: "UserId",
        type: Number,
        nullable: false,
      });

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

    expect(() => {
      database.addForeignKey(
        "Posts",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id1", "Id2"],
        })
      );
    }).toThrow();
  });

  it('throws when child and parent column types differ', () => {
    const users = new Table("Users")
      .addColumn({
        name: "Id",
        type: String,
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
      });

    const database = new Database("DB1")
      .addTable(users)
      .addTable(posts);

    expect(() => {
      database.addForeignKey(
        "Posts",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );
    }).toThrow();
  });

  it('supports case-insensitive table and column references', () => {
    const database = buildDatabase();

    const updated = database.addForeignKey(
      "posts",
      ForeignKey.fromSpec({
        kind: CONSTRAINT_KIND.foreignKey,
        name: "FK_Posts_Users",
        columns: ["userid"],
        parentTable: "users",
        parentColumns: ["id"],
      })
    );

    expect(
      updated
        .requireTable("Posts")
        .requireForeignKey("FK_Posts_Users")
    ).toBeDefined();
  });

  it('throws when foreign key name already exists', () => {
    const database = buildDatabase()
      .addForeignKey(
        "Posts",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );

    expect(() => {
      database.addForeignKey(
        "Posts",
        ForeignKey.fromSpec({
          kind: CONSTRAINT_KIND.foreignKey,
          name: "FK_Posts_Users",
          columns: ["UserId"],
          parentTable: "Users",
          parentColumns: ["Id"],
        })
      );
    }).toThrow();
  });
});