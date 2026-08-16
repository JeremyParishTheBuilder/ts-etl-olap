import { describe, it, expect } from 'vitest';
import { createTestMySqlSql, createTestPostgresSql, createTestSqlServerSql, freshEngine } from '../utils/engineHelpers.ts';
import { DEFAULT } from '../../src/dialect/keywords.ts';
import { Dialect } from '../../src/dialect/Dialect.ts';

describe("Integration::schema", () => {
  describe("ColumnPolicy", () => {
    it("inherits auto-increment explicit-value policy when creating a table", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitValue: false, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      expect(() => {
        sql
          .insertInto("Users", ["Id", "Name"])
          .values([[100, "Alice"]])
          .execute();
      }).toThrow();
    });

    it("inherits an enabled auto-increment explicit-value policy when creating a table", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitValue: true, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      expect(() => {
        sql
          .insertInto("Users", ["Id", "Name"])
          .values([[100, "Alice"]])
          .execute();
      }).not.toThrow();
    });

    it("retains the column policy after the engine policy changes", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitValue: false, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      // New engine policy should not retroactively modify the existing column.
      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitValue: true, 
        }
      });

      expect(() => {
        sql
          .insertInto("Users", ["Id", "Name"])
          .values([[100, "Alice"]])
          .execute();
      }).toThrow();
    });

    it("newly created columns inherit the current engine policy", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitValue: true, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitValue: true, 
        }
      });

      sql
        .alterTable("Users")
        .add("Sequence", {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        })
        .execute();

      expect(() => {
        sql
          .insertInto("Users", ["Id", "Name", "Sequence"])
          .values([[1, "Alice", 100]])
          .execute();
      }).not.toThrow();
    });

    it("inherits auto-increment explicit-default policy when creating a table", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitDefault: false, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      expect(() => {
        sql
          .insertInto("Users", ["Id", "Name"])
          .values([[DEFAULT, "Alice"]])
          .execute();
      }).toThrow();
    });

    it("allows explicit DEFAULT when the column policy permits it", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitDefault: true, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      expect(() => {
        sql
          .insertInto("Users", ["Id", "Name"])
          .values([[DEFAULT, "Alice"]])
          .execute();
      }).not.toThrow();
    });

    it("retains explicit-default policy after the engine policy changes", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitDefault: false, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitDefault: true, 
        }
      });

      expect(() => {
        sql
          .insertInto("Users", ["Id", "Name"])
          .values([[DEFAULT, "Alice"]])
          .execute();
      }).toThrow();
    });

    it("newly added columns inherit the current explicit-default policy", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitDefault: true, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      engine.updatePolicy({
        autoIncrementColumnPolicy: {
          autoIncrementAllowsExplicitDefault: false, 
        }
      });

      sql
        .alterTable("Users")
        .add("Sequence", {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        })
        .execute();

      expect(() => {
        sql
          .insertInto("Users", ["Id", "Name", "Sequence"])
          .values([[1, "Alice", DEFAULT]])
          .execute();
      }).toThrow();
    });
  });


  describe("TablePolicy", () => {
    it("allows multiple auto-increment columns when policy permits them", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        tablePolicy: {
          allowMultipleAutoIncrementColumns: true, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      expect(() => {
        sql.createTable("Users", {
          Id: {
            type: Number,
            nullable: false,
            autoIncrementStart: 1,
            autoIncrementStep: 1,
          },
          Sequence: {
            type: Number,
            nullable: false,
            autoIncrementStart: 100,
            autoIncrementStep: 1,
          },
        }).execute();
      }).not.toThrow();
    });

    it("rejects multiple auto-increment columns when policy disallows them", () => {
      const engine = freshEngine(Dialect.MySQL);
      const sql = createTestMySqlSql(engine);

      engine.updatePolicy({
        tablePolicy: {
          allowMultipleAutoIncrementColumns: false, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      expect(() => {
        sql.createTable("Users", {
          Id: {
            type: Number,
            nullable: false,
            autoIncrementStart: 1,
            autoIncrementStep: 1,
          },
          Sequence: {
            type: Number,
            nullable: false,
            autoIncrementStart: 100,
            autoIncrementStep: 1,
          },
        }).execute();
      }).toThrow();
    });

    it("allows one auto-increment column when multiple columns are disallowed", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        tablePolicy: {
          allowMultipleAutoIncrementColumns: false, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      expect(() => {
        sql.createTable("Users", {
          Id: {
            type: Number,
            nullable: false,
            autoIncrementStart: 1,
            autoIncrementStep: 1,
          },
          Name: {
            type: String,
            nullable: false,
          },
        }).execute();
      }).not.toThrow();
    });

    it("rejects adding a second auto-increment column when policy disallows them", () => {
      const engine = freshEngine(Dialect.SQLServer);
      const sql = createTestSqlServerSql(engine);

      engine.updatePolicy({
        tablePolicy: {
          allowMultipleAutoIncrementColumns: false, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      expect(() => {
        sql
          .alterTable("Users")
          .add("Sequence", {
            type: Number,
            nullable: false,
            autoIncrementStart: 100,
            autoIncrementStep: 1,
          })
          .execute();
      }).toThrow();
    });

    it("allows adding a second auto-increment column when policy permits them", () => {
      const engine = freshEngine();
      const sql = createTestPostgresSql(engine);

      engine.updatePolicy({
        tablePolicy: {
          allowMultipleAutoIncrementColumns: true, 
        }
      });

      sql.createDatabase("DB1").execute();
      sql.useDatabase("DB1").execute();

      sql.createTable("Users", {
        Id: {
          type: Number,
          nullable: false,
          autoIncrementStart: 1,
          autoIncrementStep: 1,
        },
        Name: {
          type: String,
          nullable: false,
        },
      }).execute();

      expect(() => {
        sql
          .alterTable("Users")
          .add("Sequence", {
            type: Number,
            nullable: false,
            autoIncrementStart: 100,
            autoIncrementStep: 1,
          })
          .execute();
      }).not.toThrow();
    });
  });
});