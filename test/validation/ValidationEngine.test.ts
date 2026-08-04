import { freshEngine } from "../engine/freshEngine.js";
import { PostgresInputBatch } from "../../src/input/PostgresInputBatch.js";
import { ValidationRule } from "../../src/validation/ValidationRule.js";
import { ValidationRuleset } from "../../src/validation/ValidationRuleset.js";
import { ValidationEngine } from "../../src/validation/ValidationEngine.js";
import { describe, expect, it } from "vitest";
import type { Engine } from "../../src/engine/Engine.js";

function createTestSql(engine?: Engine) {
  return (engine ?? freshEngine())
    .input() as PostgresInputBatch;
}

describe("ValidationEngine::validate", () => {
  it("passes when a UNIQUE validation rule is satisfied", () => {
    const engine = freshEngine();

    const sql = createTestSql(engine);

    sql.createDatabase("DB1").execute();

    sql.useDatabase("DB1").execute();

    sql.begin().execute();

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

    sql
      .insertInto("Users", ["Id", "Name"])
      .values([
        [1, "Alice"],
        [2, "Bob"],
      ])
      .execute();

    sql.commit().execute();

    const rule = new ValidationRule({
      name: "Unique User IDs",
      statements: [
        sql
          .alterTable("Users")
          .addConstraint("UniqueUserIds")
          .unique(["Id"])
          .asConstraintStatement(),
      ],
    });

    const ruleset = ValidationRuleset
      .create({ name: "User Validation" })
      .withRule(rule);

    const report = ValidationEngine.validate({
      engine: engine,
      databaseName: "DB1",
      ruleset,
    });

    expect(report.passed).toBe(true);
    expect(report.failed).toBe(false);
    expect(report.violationCount).toBe(0);
    expect(report.violations).toHaveLength(0);
    expect(report.failedRules).toHaveLength(0);
  });
});