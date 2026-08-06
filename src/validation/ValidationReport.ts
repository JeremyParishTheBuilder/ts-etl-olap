import type { ValidationRuleResult } from "./ValidationRuleResult.js";
import type { ValidationViolation } from "./ValidationViolation.js";

export interface ValidationReportSpec {
  readonly ruleResults: readonly ValidationRuleResult[];
}

export class ValidationReport {
  readonly ruleResults: readonly ValidationRuleResult[];

  constructor(spec: ValidationReportSpec) {
    this.ruleResults = Object.freeze([...spec.ruleResults]);
  }

  get passed(): boolean {
    return this.ruleResults.every((result) => result.passed);
  }

  get failed(): boolean {
    return !this.passed;
  }

  get violationCount(): number {
    return this.ruleResults.reduce(
      (count, result) => count + result.violations.length,
      0,
    );
  }

  get violations(): readonly ValidationViolation[] {
    return this.ruleResults.flatMap((result) => result.violations);
  }

  get failedRules(): readonly ValidationRuleResult[] {
    return this.ruleResults.filter((result) => !result.passed);
  }

  toJSON() {
    return {
      passed: this.passed,
      ruleResults: this.ruleResults.map((result) => result.toJSON()),
    };
  }
}
