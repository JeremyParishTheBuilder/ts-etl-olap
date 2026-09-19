# Semantic Module Overview

## Purpose

The Semantic module transforms AST statements into schema-aware, executable representations.

```text
AST -> Semantic -> Actions / QueryPlans -> Execution
```

Semantic resolves names, validates meaning, applies dialect and engine policies, and binds AST nodes to executable runtime objects.

It does not own AST definitions, relational storage, or execution.

## Responsibilities

Semantic owns:

* Schema/name resolution
* Semantic validation
* Dialect and engine policy application
* AST resolution
* Expression and predicate binding
* Statement binding
* Query-plan construction
* Query-result metadata derivation
* Query metadata reconciliation

It produces `Action`s for state-changing statements and `QueryPlan`s for queries.

## Resolution and Binding

AST nodes may contain unresolved names. Semantic resolution uses the current relational context to resolve referenced databases, tables, and columns.

The general progression is:

```text
AST -> Resolved AST -> Bound runtime object
```

`resolveExpression()` converts expression nodes into resolved nodes. `bindExpression()` converts resolved nodes into executable `Expression` objects.

Predicates follow the same resolution and binding model and produce executable `Predicate` objects.

Resolution is schema-dependent; AST construction is not.

## Expressions

Current expression forms include:

* Column references
* Binary expressions
* CASE
* Concatenation
* CAST
* Temporal expressions
* SQL functions
* Default values

Binding incorporates the runtime information required for evaluation.

Expressions evaluated against existing rows are bound with `RowView` context.

## SELECT

`bindSelect()` converts a `SelectStatement` into a `QueryPlan`.

SELECT items are expressions rather than being limited to physical columns. `*` expands to expressions for the source-table columns.

The resulting `QueryPlan` contains:

* `root`: executable `PlanNode`
* `columns`: output `QueryColumn[]`

Each `QueryColumn` contains:

* `name`
* `type`
* `nullable`

Metadata is derived from expression semantics. Direct column expressions may inherit source metadata; computed expressions derive metadata from their semantics.

Aliases take precedence over derived names. Expressions without suitable names receive generated result names.

Query metadata describes the query output independently of the physical source table.

Semantic binding constructs the plan but does not execute it.

## Query Statements

Queries are represented by `QueryStatement`.

Current query forms include:

* `SelectStatement`
* `UnionAllStatement`

`bindQuery()` dispatches query statements to their appropriate binders.

Child queries are bound independently before their plans are composed.

Nested query construction uses independent `InputBatch` instances so that constructing a child query does not overwrite the parent query's state.

## UNION ALL

`UNION ALL` combines two query plans positionally.

The child queries must produce the same number of columns.

For each corresponding column:

* The result name comes from the left query.
* Nullability is combined from both columns.
* The types must be mutually assignment-compatible.
* `commonSqlType()` determines the resulting type.

Assignment compatibility is checked in both directions because reconciliation is symmetric.

`commonSqlType()` is intentionally more permissive and determines a common representation after compatibility has been established.

`UnionAllNode` executes the left plan followed by the right plan and preserves duplicates.

The resulting `QueryPlan.columns` describes the complete UNION ALL output.

## Query Results

Execution converts a query plan into a `QueryResult` containing:

* `columns`: the plan's `QueryColumn[]`
* `rows`: evaluated `RowView[]`

This preserves the metadata established during semantic analysis alongside the query data.

Semantic produces the `QueryPlan`; execution produces the `QueryResult`.

## INSERT

INSERT supports VALUES input and query-based input.

### INSERT ... VALUES

Semantic resolves and binds input expressions and validates that they do not require existing row context.

`DEFAULT` is handled separately because its final value depends on the target column.

### INSERT ... SELECT

The source query is bound to a `QueryPlan`.

Semantic validates query output count and compatibility with the target columns. Mapping is positional.

The source may be a composed query, including UNION ALL. INSERT consumes the final query-plan metadata rather than requiring a physical source table.

Execution and relational insertion remain outside Semantic.

## UPDATE

UPDATE expressions may reference existing columns because they are evaluated against affected `RowView`s.

Semantic resolves and binds the assignments; execution evaluates them against the affected rows.

## CREATE TABLE and CTAS

`bindCreateTable()` validates explicit table definitions and produces schema-modification actions.

For CTAS, the SELECT is bound through the normal query-binding path.

`QueryColumn` supplies query-result metadata only. Source defaults, auto-increment behavior, constraints, and other physical column properties are not implicitly inherited.

Explicit CTAS definitions may provide destination names or additional metadata. Dialect rules determine how explicit definitions interact with query metadata.

CTAS creates the destination through normal schema actions and populates it separately.

Destination runtime identifiers cannot be resolved during semantic binding because the destination does not yet exist.

## Keywords and DEFAULT

Keywords and special expressions are represented separately from ordinary values.

Current categories include:

* `Keyword`
* `TemporalExpressionKeyword`
* `SqlFunctionKeyword`

Examples include `DEFAULT`, `CURRENT_TIMESTAMP`, `CURRENT_DATE`, `CURRENT_TIME`, `NOW`, and `GETDATE`.

Dialect rules determine which are permitted.

`DEFAULT` uses `DefaultValueNode`. Semantic validates whether it is legal; the target column remains responsible for resolving its actual default or auto-increment behavior.

## Policy Resolution

Semantic obtains active policies through the execution context.

Policies may originate from engine configuration, dialect defaults, or dialect-specific rules.

Examples include:

* `ColumnPolicy`
* `TablePolicy`
* CTAS rules
* Explicit-input rules

Semantic determines whether an operation is permitted. Relational enforces the resulting relational invariants.

## Dialect Rules

Dialect-sensitive semantic behavior is controlled through dialect configuration rather than hard-coded statement binders.

Rules may govern:

* Supported keywords and functions
* Statement capabilities
* Column-input behavior
* CTAS behavior
* Explicit column-name handling
* CTAS column-count requirements
* CTAS constraint support

## Statement Binding

`SemanticAnalyzer` dispatches statements to statement-specific binders.

Examples include:

* `bindQuery()`
* `bindSelect()`
* `bindInsertInto()`
* `bindInsertValues()`
* `bindInsertSelect()`
* `bindUpdateSet()`
* `bindCreateTable()`
* Delete and other schema binders

The general flow is:

```text
Statement
  -> validation
  -> resolution / binding
  -> Action or QueryPlan
```

Binders reuse existing semantic mechanisms where appropriate. For example, INSERT SELECT and CTAS both reuse normal query binding.

## Semantic vs Relational

Semantic determines whether a requested operation is meaningful and permitted.

Examples:

* Referenced object does not exist
* Unsupported dialect construct
* Invalid statement structure
* Invalid expression context
* Policy violation
* Unsupported CTAS combination

Relational remains responsible for persistent-state invariants such as:

* Keys and constraints
* Foreign-key behavior
* Row validity
* Index consistency
* Relational mutation

## Semantic vs Execution

The primary boundary is:

```text
Semantic
   |
   +--> Actions
   |
   +--> QueryPlans
            |
            v
         Execution
            |
            v
         Relational
```

Semantic does not mutate relational state or execute query plans.

Actions and query plans are the representations consumed by execution.

## Module Boundaries

Semantic consumes:

* AST nodes
* Relational schema information
* Dialect rules
* Engine execution context

Semantic produces:

* Resolved AST nodes
* Executable expressions and predicates
* Actions
* Query plans and query metadata

Semantic does not own:

* AST definitions
* Relational tables or persistent rows
* Relational mutation algorithms
* Action or query-plan execution
* Mapping-specific expression contexts

Its role is the translation boundary between statement structure and executable relational operations.
