# DSL Overview

The DSL provides a fluent, strongly typed API for constructing expressions, predicates, and SQL statements.

Rather than exposing internal implementation details, the DSL builds higher-level objects that can later be evaluated directly or translated into other representations such as SQL abstract syntax trees.

---

# Expressions

An `Expression<TContext, TValue>` computes a value from a context.

Expressions are used throughout the system, including:

- relational queries
- discovery
- import mappings
- computed fields
- captures

Common expression helpers include:

- `literal(...)`
- `capture(...)`
- `json(...)`
- `basename()`
- `directoryName()`
- `concat(...)`

Expressions may be composed arbitrarily.

---

# Predicates

A `Predicate<TContext>` computes a boolean result.

Predicates are built from expressions and may be combined using logical operators.

Examples include:

- `eq()`
- `gt()`
- `lt()`
- `every(...)`
- `some(...)`
- `not(...)`

Predicates are used by both the runtime evaluation system and SQL query construction.

---

# Builders

The fluent API is provided by builder types rather than the expressions or predicates themselves.

Current builders include:

- `ExpressionBuilder`
- `PredicateBuilder`

Builders expose chainable operations while wrapping the underlying runtime objects.

---

# Contexts

Expressions and predicates are parameterized by the context they evaluate against.

Current contexts include:

- `RowView` for relational evaluation
- `CaptureContext` for import evaluation
- `FsObject` for discovery

This allows the same expression model to be reused across multiple subsystems while preserving type safety.

---

# Runtime vs SQL

The runtime DSL evaluates expressions and predicates directly.

The SQL DSL constructs abstract syntax trees that are later analyzed, bound, and executed by the relational engine.

Although both expose similar fluent APIs, they intentionally produce different underlying representations.