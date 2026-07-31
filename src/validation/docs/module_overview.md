# Validation Module Overview

## Purpose

The Validation module evaluates business-specific rules against relational data independently of import, schema inference, and structural relational correctness.

Unlike the engine, which permanently enforces relational integrity (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, etc.), validation evaluates higher-level business rules that may be temporarily violated while data is being edited.

Validation produces diagnostics rather than mutating the database.

---

## Responsibilities

The validation module is responsible for:

- Executing user-defined business validation rules
- Reporting validation failures without aborting execution
- Producing structured validation diagnostics
- Isolating validation from committed database state
- Supporting incremental and full validation in the future

The validation module is **not** responsible for:

- Relational integrity
- Schema inference
- Import
- Database mutation
- Export

---

## Validation Model

Validation operates by evaluating business rules against an immutable relational database.

A validation run executes inside an isolated transaction.

Rules may internally perform operations that would normally fail if business constraints are violated, but any resulting failures are captured as validation diagnostics rather than terminating execution.

Once validation completes, the transaction is discarded.

Committed database state is never modified.

---

## Validation Rules

Validation rules are user-defined using the same fluent SQL API used elsewhere throughout the system.

This provides a familiar and expressive language while allowing validation rules to share semantic analysis, expressions, predicates, and query infrastructure with the engine.

Future versions may support rule grouping, severity levels, incremental execution, and additional validation metadata.

---

## Diagnostics

Validation produces structured results describing detected business rule violations.

Diagnostics are intended for tooling, editors, automation, and command-line reporting.

Rather than simply indicating success or failure, validation reports all detected problems whenever practical.

---

## Design Principles

- Business validation is independent of structural validation.
- Validation never modifies committed database state.
- Validation executes deterministically.
- Validation reuses the engine's SQL, expression, and semantic analysis infrastructure.
- Validation reports diagnostics instead of propagating execution failures.
- Validation rules remain declarative.

---

## Future Direction

The long-term goal is for validation to become continuously available rather than being limited to explicit validation runs.

As data changes, affected validation rules may be re-evaluated incrementally, allowing editors and tooling to immediately identify newly introduced business rule violations while still permitting temporary invalid states during editing.

This enables validation to function as continuous feedback rather than a mandatory execution step.