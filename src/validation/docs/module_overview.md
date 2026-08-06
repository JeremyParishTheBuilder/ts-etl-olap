# Validation Module Overview

## Purpose

The Validation module evaluates business-specific correctness against an existing relational database.

The Relational module enforces structural database integrity such as PRIMARY KEY, UNIQUE, FOREIGN KEY, and CHECK constraints. Validation defines additional project- or organization-specific rules without modifying committed database state.

Validation produces structured reports describing passed and failed rules and their violations.

The Validation module does **not** perform discovery, import, schema inference, relational mutation, or export.

---

## Responsibilities

The Validation module is responsible for:

* defining validation rules and rulesets
* evaluating rules against relational databases
* collecting constraint violations
* producing structured validation reports
* resolving relational identifiers to human-readable names for reporting

It reuses existing engine infrastructure for:

* SQL statement construction
* semantic analysis
* predicate evaluation
* relational constraint enforcement
* transaction management

---

## Validation Model

Validation rules reuse the existing SQL DSL rather than introducing a separate validation language.

A rule expresses a business requirement as a relational constraint statement.

Conceptually:

```text
Validation Rule
      │
      ▼
Constraint Statement
      │
      ▼
Semantic Analysis
      │
      ▼
Relational Constraint
      │
      ▼
Existing Database
      │
      ▼
ConstraintViolationError
      │
      ▼
ValidationViolation
```

The rule therefore asks whether the current database would satisfy the proposed constraint.

Validation evaluates rules inside transactions and rolls those transactions back after evaluation. Committed database state is never modified.

---

## ValidationRuleset

`ValidationRuleset` is the immutable collection of validation rules.

It contains:

* name
* optional description
* rules

Rules are added immutably using `withRule()`.

The ruleset describes **what should be validated**. It does not contain the logic required to execute the rules.

---

## ValidationRule

`ValidationRule` represents one business invariant.

A rule contains:

* name
* optional description
* one or more constraint statements

Example:

```ts
const rule = new ValidationRule({
  name: "ChainName Consistency",
  description: "Chain names must be consistent across imported files.",
  statements: [
    sql.alterTable("Chains")
      .addConstraint("ChainNameConsistency")
      .check(...)
      .asConstraintStatement(),
  ],
});
```

Rules currently use constraint statements representing UNIQUE, CHECK, and FOREIGN KEY requirements.

---

## ValidationEngine

`ValidationEngine` orchestrates validation.

It receives:

* an existing `Engine`
* a database name
* a `ValidationRuleset`

Example:

```ts
const report = ValidationEngine.validate({
  engine: EngineRegistry.getInstance().engine(),
  databaseName: "Test Registry",
  ruleset,
});
```

The supplied engine is reused rather than creating a separate engine or copying the database.

The validation engine:

1. resolves the requested database
2. evaluates each rule
3. collects violations
4. resolves relational identifiers for reporting
5. returns a `ValidationReport`

---

## Rule Evaluation

Rules are evaluated independently.

For each rule:

1. begin a transaction
2. execute its constraint statements
3. convert `ConstraintViolationError`s into validation violations
4. stop after the first failing statement
5. roll back the transaction
6. produce a `ValidationRuleResult`

Unexpected errors are not interpreted as validation failures and are allowed to propagate.

The initial implementation therefore favors predictable first-failure behavior rather than exhaustive violation discovery.

---

## Relational Error Boundary

The Validation module does not make the Relational module depend on Validation.

When relational constraint evaluation fails because of existing row data, the Relational module throws `ConstraintViolationError`.

The error contains relational information such as:

* constraint name and kind
* affected participants
* table and row identifiers
* relevant column identifiers and values
* referenced table and columns for foreign keys
* optional contextual message

Relational errors therefore describe the failure without knowing how it will be reported by Validation.

Validation converts this information into its own report model.

---

## Constraint Violation Participants

Constraint-level participants belong to the Relational module because they form part of the relational error contract.

They contain stable relational identifiers and stored values:

```text
table
rowId
columns
columnValues
referencedTable?
referencedColumns?
```

Validation resolves these identifiers against the database being validated and incorporates human-readable names into its report representation.

This keeps relational errors independent of the Validation module.

---

## ValidationViolation

A `ValidationViolation` represents a specific occurrence of a failed validation rule.

For a UNIQUE rule, a violation represents one conflicting key/projection and contains the rows participating in that conflict.

For a CHECK rule, a violation normally contains one affected row.

For a FOREIGN KEY rule, a violation normally contains one child row whose referenced parent does not exist.

Different conflicting values may represent separate violations of the same rule.

The current implementation stops after the first constraint failure encountered while evaluating a rule.

---

## Validation Results

`ValidationRuleResult` contains:

* the rule
* whether it passed
* its violations

`ValidationReport` contains:

* all rule results
* the overall pass/fail state

The overall report passes only when every rule passes.

Reports retain relational identifiers so that violations can be used for precise database queries while also exposing resolved names for maintainers.

---

## Constraint Evaluation

### UNIQUE

A UNIQUE validation rule creates or resolves an appropriate unique backing index.

If existing rows contain duplicate values, index construction produces an `IndexUniquenessError`. The relational layer converts this into a `ConstraintViolationError` containing the affected rows.

### CHECK

A CHECK validation rule evaluates its predicate against existing rows.

The `Check` object collects the columns referenced by its predicate. A failing row produces a `ConstraintViolationError` containing that row and the relevant values.

### FOREIGN KEY

A FOREIGN KEY validation rule checks existing child rows against the referenced parent index.

A missing parent reference produces a `ConstraintViolationError` identifying the child row and referenced columns.

---

## Immutability and Safety

Validation does not mutate committed relational state.

Relational objects are immutable, and proposed constraint operations execute within a transaction that is rolled back after evaluation.

The existing engine is reused so that validation observes the same database configuration and relational state as the caller.

---

## Design Principles

* Business validation is separate from relational integrity.
* Validation operates against existing relational data.
* Validation rules reuse the existing SQL and relational infrastructure.
* Validation does not modify committed state.
* Relational errors remain independent of Validation.
* Validation converts relational failures into structured results.
* Stable IDs remain available alongside human-readable names.
* Rules are independently defined and evaluated.
* Reporting data is separate from presentation formatting.
* The initial implementation favors first-failure evaluation over exhaustive violation discovery.

---

## Current Scope

The current implementation provides:

* validation rules and rulesets
* validation against an existing engine and database
* transaction-based rule evaluation
* UNIQUE, CHECK, and FOREIGN KEY validation
* structured constraint violation errors
* structured validation violations
* rule-level and report-level results
* identifier-to-name resolution
* JSON serialization of validation results

Future capabilities such as exhaustive violation collection, incremental validation, rule dependencies, severity levels, or richer reporting can be added without changing the basic separation between relational enforcement and business validation.
