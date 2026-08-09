# Semantic Module Overview

## Purpose

The Semantic module transforms AST statements into validated, schema-aware representations that can be executed.

```text
AST
 ↓
Semantic Analysis
 ↓
Actions / Query Plans
 ↓
Execution
```

Semantic analysis resolves names, validates statement meaning, applies dialect rules, and binds AST nodes to executable runtime objects.

It does not own AST definitions, relational storage, or execution.

---

## Responsibilities

The Semantic module owns:

* resolving database, table, and column references
* validating AST constructs against relational schema
* validating dialect-specific input
* resolving input keywords and special expressions
* converting AST nodes into resolved nodes
* binding resolved nodes to executable expressions and predicates
* converting statements into `Action`s or query plans

---

## AST Resolution

AST nodes describe user intent and may contain unresolved names.

Semantic resolution uses the current relational context to resolve those names and verify that referenced objects exist.

The general distinction is:

```text
AST node
  ↓
Resolved AST node
  ↓
Bound runtime object
```

For example, a column reference progresses conceptually from a column name to a `ColumnId`, and finally to the physical column information required by runtime evaluation.

Resolution is schema-dependent; AST construction is not.

---

## Expression Resolution and Binding

`resolveExpression()` converts an `ExpressionNode` into a `ResolvedExpressionNode`.

It resolves schema-dependent references and recursively resolves nested expressions such as:

* binary expressions
* `CASE`
* concatenation
* predicates used by expressions

Expressions that do not depend on schema resolution may remain otherwise unchanged.

`bindExpression()` converts resolved nodes into executable `Expression` objects.

For example:

```text
ResolvedColumnExpressionNode
        ↓
ColumnExpression
        ↓
column position
```

Binding incorporates runtime information needed for efficient evaluation.

---

## Input Keywords

Input keywords are represented separately from ordinary expression values.

Current categories are:

* `Keyword`
* `TemporalExpressionKeyword`
* `SqlFunctionKeyword`

Examples include:

```text
DEFAULT
CURRENT_TIMESTAMP
CURRENT_DATE
CURRENT_TIME
NOW
GETDATE
```

Dialect rules determine which values are permitted.

Keyword representations are converted into AST nodes and subsequently into executable expressions where appropriate.

```text
keyword
  ↓
AST node
  ↓
resolved/bound representation
  ↓
runtime expression
```

---

## DEFAULT

`DEFAULT` is represented by `DefaultValueNode` rather than as a general expression.

Semantic analysis verifies that the dialect permits `DEFAULT` and resolves it against the target `Column`.

The column remains responsible for the actual default semantics through `resolveDefaultOrThrow()`.

This supports both:

* explicit `DEFAULT` supplied by a statement
* implicit default resolution caused by an omitted column

These occur at different stages but ultimately use the same column-level default behavior.

---

## INSERT

`INSERT ... VALUES` may contain expressions, but those expressions must not reference columns.

Insert expressions are therefore validated to ensure that they are independent of `RowView`.

The semantic flow is:

```text
InsertInput
    ↓
AST expression
    ↓
assert no column references
    ↓
bind insert expression
    ↓
evaluate
    ↓
ColumnValue
```

The resulting values are stored in the insert action.

`DEFAULT` is handled separately because it requires the target column's default-resolution behavior.

---

## UPDATE

`UPDATE` expressions may reference columns because they are evaluated against existing rows.

The general flow is:

```text
UpdateInput
    ↓
AST node
    ↓
resolve
    ↓
bind
    ↓
Expression<RowView>
    ↓
UpdateRowsAction
```

`DEFAULT` is resolved against the target column.

Temporal expressions and SQL functions are converted into executable expressions and evaluated when the update executes.

---

## Predicates

Predicates are resolved and bound using the same general pattern as expressions.

Column references are resolved against the relevant table.

Nested predicates and expressions are processed recursively.

Predicate binding produces executable `Predicate` objects consumed by filtering and other execution operations.

---

## Statement Binding

`SemanticAnalyzer` dispatches statements to statement-specific binders.

Examples include:

* `bindInsertInto()`
* `bindUpdateSet()`
* `bindSelect()`
* delete and schema-related binders

Statement binders produce execution representations such as:

```text
Statement
   ↓
semantic validation
   ↓
resolution / binding
   ↓
Action or QueryPlan
```

Semantic analysis does not execute the resulting operation.

---

## Dialect Rules

Dialect-sensitive input is controlled through the active dialect rules.

Input rules include:

```ts
input: {
  keywords?: ReadonlySet<Keyword>;
  temporalExpressions?: ReadonlySet<TemporalExpressionKeyword>;
  functions?: ReadonlySet<SqlFunctionKeyword>;
}
```

Semantic analysis obtains these through the engine's rule-resolution system rather than hard-coding dialect-specific behavior.

This allows the same AST representation to be interpreted according to the active dialect.

---

## Semantic vs Relational Validation

Semantic validation determines whether a requested operation is meaningful and executable.

Examples:

* referenced table does not exist
* referenced column does not exist
* unsupported dialect keyword
* column reference in an `INSERT` value
* invalid statement structure

The Relational module remains responsible for relational-state invariants such as:

* primary keys
* unique constraints
* foreign keys
* check constraints
* row validity

Semantic analysis prepares an operation; relational execution enforces resulting relational correctness.

---

## Semantic vs Execution

The boundary is:

```text
Semantic
   ↓
Action / QueryPlan
   ↓
Execution
```

Semantic analysis may resolve a default value or bind a column position, but it does not perform the mutation or evaluate expressions over affected rows.

Execution consumes the representations produced by Semantic.

---

## Module Boundaries

Semantic depends on and coordinates with:

```text
AST
 ↓
Semantic
 ↓
Evaluation / Execution
 ↓
Relational
```

It also consumes dialect rules.

Semantic does not own:

* AST node definitions
* relational tables or rows
* persistent relational state
* execution of actions
* query-plan execution
* mapping-specific expression contexts

Its role is the translation boundary between statement structure and executable relational operations.
