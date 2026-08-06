import { describe, expect, it } from "vitest";
import { ValidationRuleset } from "../../src/validation/ValidationRuleset.ts";
import { createTestConstraintStatement, createTestRule } from "./helpers.ts";

describe("ValidationRuleset::create", () => {
  it("creates an empty ruleset", () => {
    const ruleset = ValidationRuleset.create({
      name: "Test Rules",
    });

    expect(ruleset.name).toBe("Test Rules");
    expect(ruleset.description).toBeUndefined();
    expect(ruleset.rules).toEqual([]);
  });
});

describe("ValidationRuleset::withRule", () => {
  it("adds a ValidationRule", () => {
    const ruleset = ValidationRuleset.create({
      name: "Test Rules",
    });

    const rule = createTestRule();

    const updated = ruleset.withRule(rule);

    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0]).toBe(rule);
  });

  it("accepts a ValidationRuleSpec", () => {
    const ruleset = ValidationRuleset.create({
      name: "Test Rules",
    });

    const updated = ruleset.withRule({
      name: "Test Rule",
      description: "A test rule",
      statements: [createTestConstraintStatement()],
    });

    expect(updated.rules).toHaveLength(1);
    expect(updated.rules[0].name).toBe("Test Rule");
    expect(updated.rules[0].description).toBe("A test rule");
  });

  it("does not mutate the original ruleset", () => {
    const ruleset = ValidationRuleset.create({
      name: "Test Rules",
    });

    const rule = createTestRule();

    const updated = ruleset.withRule(rule);

    expect(ruleset.rules).toHaveLength(0);
    expect(updated.rules).toHaveLength(1);
  });

  it("preserves existing rules", () => {
    const firstRule =  createTestRule();

    const secondRule = createTestRule();

    const ruleset = ValidationRuleset
      .create({ name: "Test Rules" })
      .withRule(firstRule);

    const updated = ruleset.withRule(secondRule);

    expect(updated.rules).toEqual([firstRule, secondRule]);
  });
});

describe("ValidationRuleset::getRule", () => {
  it("returns a rule by name", () => {
    const rule = createTestRule();

    const ruleset = ValidationRuleset
      .create({ name: "Test Rules" })
      .withRule(rule);

    expect(ruleset.getRule("Test Rule")).toBe(rule);
  });

  it("returns undefined for an unknown rule", () => {
    const ruleset = ValidationRuleset.create({
      name: "Test Rules",
    });

    expect(ruleset.getRule("Missing Rule")).toBeUndefined();
  });
});

describe("ValidationRuleset::requireRule", () => {
  it("returns a rule by name", () => {
    const rule = createTestRule();

    const ruleset = ValidationRuleset
      .create({ name: "Test Rules" })
      .withRule(rule);

    expect(ruleset.requireRule("Test Rule")).toBe(rule);
  });

  it("throws for an unknown rule", () => {
    const ruleset = ValidationRuleset.create({
      name: "Test Rules",
    });

    expect(() => ruleset.requireRule("Missing Rule")).toThrow(
      'Validation rule "Missing Rule" does not exist.',
    );
  });
});

describe("ValidationRuleset validation", () => {
  it("rejects a blank name", () => {
    expect(() =>
      ValidationRuleset.create({
        name: "   ",
      }),
    ).toThrow("ValidationRuleset requires a name.");
  });
});