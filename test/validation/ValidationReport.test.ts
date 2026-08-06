import { describe, expect, it } from "vitest";
import { ValidationReport } from "../../src/validation/ValidationReport.js";
import { ValidationRule } from "../../src/validation/ValidationRule.js";
import { ValidationRuleResult } from "../../src/validation/ValidationRuleResult.js";
import { ValidationViolation } from "../../src/validation/ValidationViolation.js";
import {
  createTestConstraintStatement,
} from "./helpers.js";

function createTestRule(name: string): ValidationRule {
  return new ValidationRule({
    name,
    statements: [createTestConstraintStatement()],
  });
}

function createPassingResult(name = "Test Rule"): ValidationRuleResult {
  return new ValidationRuleResult({
    rule: createTestRule(name),
    violations: [],
  });
}

function createViolation(): ValidationViolation {
  return new ValidationViolation({
    participants: [],
  });
}

function createFailingResult(
  name = "Test Rule",
  violationCount = 1,
): ValidationRuleResult {
  return new ValidationRuleResult({
    rule: createTestRule(name),
    violations: Array.from(
      { length: violationCount },
      () => createViolation(),
    ),
  });
}

describe("ValidationReport", () => {
  it("passes when all rules pass", () => {
    const first = createPassingResult("First Rule");
    const second = createPassingResult("Second Rule");

    const report = new ValidationReport({
      ruleResults: [first, second],
    });

    expect(report.passed).toBe(true);
    expect(report.failed).toBe(false);
  });

  it("fails when any rule fails", () => {
    const passing = createPassingResult("Passing Rule");
    const failing = createFailingResult("Failing Rule");

    const report = new ValidationReport({
      ruleResults: [passing, failing],
    });

    expect(report.passed).toBe(false);
    expect(report.failed).toBe(true);
  });

  it("counts violations across rules", () => {
    const first = createFailingResult("First Rule", 2);
    const second = createFailingResult("Second Rule", 3);

    const report = new ValidationReport({
      ruleResults: [first, second],
    });

    expect(report.violationCount).toBe(5);
  });

  it("returns all violations", () => {
    const firstViolation = createViolation();
    const secondViolation = createViolation();
    const thirdViolation = createViolation();

    const firstResult = new ValidationRuleResult({
      rule: createTestRule("First Rule"),
      violations: [firstViolation, secondViolation],
    });

    const secondResult = new ValidationRuleResult({
      rule: createTestRule("Second Rule"),
      violations: [thirdViolation],
    });

    const report = new ValidationReport({
      ruleResults: [firstResult, secondResult],
    });

    expect(report.violations).toEqual([
      firstViolation,
      secondViolation,
      thirdViolation,
    ]);
  });

  it("returns only failed rules", () => {
    const passing = createPassingResult("Passing Rule");
    const failing = createFailingResult("Failing Rule");

    const report = new ValidationReport({
      ruleResults: [passing, failing],
    });

    expect(report.failedRules).toEqual([failing]);
  });

  it("preserves rule result order", () => {
    const first = createPassingResult("First Rule");
    const second = createFailingResult("Second Rule");
    const third = createPassingResult("Third Rule");

    const report = new ValidationReport({
      ruleResults: [first, second, third],
    });

    expect(report.ruleResults).toEqual([
      first,
      second,
      third,
    ]);
  });

  it("serializes to JSON", () => {
    const passing = createPassingResult("Passing Rule");
    const failing = createFailingResult("Failing Rule");

    const report = new ValidationReport({
      ruleResults: [passing, failing],
    });

    expect(report.toJSON()).toEqual({
      passed: false,
      ruleResults: [
        {
          rule: "Passing Rule",
          description: undefined,
          passed: true,
          violations: [],
        },
        {
          rule: "Failing Rule",
          description: undefined,
          passed: false,
          violations: [
            {
              participants: [],
            },
          ],
        },
      ],
    });
  });
});

describe("ValidationRuleResult", () => {
  it("passes when there are no violations", () => {
    const result = createPassingResult();

    expect(result.passed).toBe(true);
    expect(result.failed).toBe(false);
  });

  it("fails when there are violations", () => {
    const result = createFailingResult();

    expect(result.passed).toBe(false);
    expect(result.failed).toBe(true);
  });

  it("serializes to JSON", () => {
    const result = createFailingResult("Test Rule");

    expect(result.toJSON()).toEqual({
      rule: "Test Rule",
      description: undefined,
      passed: false,
      violations: [
        {
          participants: [],
        },
      ],
    });
  });
});