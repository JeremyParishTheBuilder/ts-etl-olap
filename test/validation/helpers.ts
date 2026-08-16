import { ValidationRule } from "../../src/validation/ValidationRule.ts";
import { createTestPostgresSql, freshEngine } from "../utils/engineHelpers.ts";

export function createTestRule(name = "Test Rule") {
  return new ValidationRule({
    name,
    statements: [createTestConstraintStatement()],
  });
}

export function createTestConstraintStatement() {
  const engine = freshEngine();
  const sql = createTestPostgresSql(engine);

  return sql
    .alterTable("Test")
    .addConstraint("TestConstraint")
    .unique(["id"])
    .asConstraintStatement();
}