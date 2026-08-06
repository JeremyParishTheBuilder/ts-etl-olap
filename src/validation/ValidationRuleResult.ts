import type { ValidationRule } from "./ValidationRule.js";
import type { ValidationViolation } from "./ValidationViolation.js";

export interface ValidationRuleResultSpec {
  readonly rule: ValidationRule;

  readonly violations: readonly ValidationViolation[];
}

export class ValidationRuleResult {
  readonly rule: ValidationRule;

  readonly violations: readonly ValidationViolation[];

  constructor(spec: ValidationRuleResultSpec) {
    this.rule = spec.rule;
    this.violations = Object.freeze([...spec.violations]);
  }

  get passed(): boolean {
    return this.violations.length === 0;
  }

  get failed(): boolean {
    return !this.passed;
  }

  toJSON() {
    return {
      rule: this.rule.name,
      description: this.rule.description,
      passed: this.passed,
      violations: this.violations.map((violation) => violation.toJSON()),
    };
  }
}
