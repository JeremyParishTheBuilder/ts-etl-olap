# Semantic Module Overview

## Purpose

The Semantic module transforms AST statements into schema-aware, executable
representations.

```text
AST -> Semantic -> Actions / QueryPlans -> Execution
```

Semantic resolves names, validates meaning, applies dialect and engine
policies, and binds AST nodes to executable runtime objects.

It does not own AST definitions, relational storage, or execution.

## Responsibilities

Semantic owns:

* Schema and name resolution
* Semantic validation
* Dialect and engine policy application
* Expression and predicate binding
* Tabular-expression and relation scope construction
* Statement binding
* Query-plan construction
* Query-result metadata derivation
* Query metadata reconciliation

It produces `Action`s for state-changing statements and `QueryPlan`s for
queries.

## Resolution and Binding

The general progression is:

```text
AST -> Resolved AST -> Bound runtime object
```

`resolveExpression()` resolves schema-dependent expression references.
`bindExpression()` converts resolved expressions into executable
`Expression` objects.

Predicates follow the same resolution and binding model and produce
executable `Predicate` objects.

AST construction does not require a schema; semantic resolution does.

## Expressions

Expression forms include:

* Column references
* Binary expressions
* CASE
* Concatenation
* CAST
* Temporal expressions
* SQL functions
* JSON extraction
* DEFAULT and other special values

Expressions evaluated against existing rows use `RowView` context.

## Tabular Expressions and Relation Scope

Query sources are represented by `TabularExpressionNode` and its projection
wrapper, `TabularExpressionProjection`.

Current tabular expression forms include:

* Physical table references
* Query references
* Joins

Semantic binding converts a tabular expression into a `BoundRelation`
containing its executable plan and the relations visible at that query level.

`RelationBinding` describes a relation's semantic column namespace.
`RelationScope` resolves column references across visible relations.

Qualified references resolve the relation first and then the column.
Unqualified references must resolve to exactly one matching column.
Ambiguous references are rejected.

Identifier comparison uses normalized names while preserving display names.

## Relation Boundaries and Aliases

A physical table exposes its columns as one relation.

A derived query creates a new relation boundary. Its outer query sees the
derived query under its alias rather than seeing the relations used inside
the child query.

Likewise, an aliased join becomes one relation at the parent query level.

For example:

```text
Users u JOIN Orders o
        |
        v
     join a
        |
        v
outer scope sees a
```

The join predicate is resolved while `u` and `o` are both visible. Once the
join is aliased as `a`, the parent scope sees one relation named `a` whose
columns are the complete join output. `u` and `o` do not escape that boundary.

This preserves SQL-style relation scoping and prevents an alias from creating
multiple bindings with the same relation name.

Duplicate output column names may remain where the active dialect permits
them. Referencing an ambiguous duplicate column is rejected.

## JOIN

JOIN is a tabular expression rather than a query statement.

Semantic recursively binds the left and right tabular expressions, then
resolves the join predicate against a scope containing both sides.

The resulting plan contains the two child plans and the bound predicate.
Output columns are ordered left-to-right.

Unaliased joins expose their constituent relations to the surrounding query.
An aliased join exposes one combined relation at the parent level.

Chained joins are bound recursively, allowing each join predicate to
reference the relations visible at that stage.

## SELECT

`bindSelect()` converts a `SelectStatement` into a `QueryPlan`.

SELECT projections contain expressions and are not limited to physical
columns.

A `QueryPlan` contains:

* `root`: executable `PlanNode`
* `columns`: output `QueryColumn[]`

Each `QueryColumn` contains:

* `name`
* `type`
* `nullable`

Metadata is derived from expression semantics. Projection aliases take
precedence over derived names; expressions without suitable names receive
generated names.

Query metadata describes query output independently of physical source
schema.

### SELECT *

`*` expands from the bound tabular source and preserves output positions.
It is not treated as a set of ordinary named column references.

This allows star expansion to preserve duplicate output names and joined
column positions without incorrectly resolving ambiguous names.

## Query Statements

Queries are represented by `QueryStatement`.

Current query forms include:

* `SelectStatement`
* `UnionAllStatement`

`bindQuery()` dispatches to the appropriate binder.

Child queries are bound independently before their plans are composed.
Nested query construction uses independent `InputBatch` instances so that a
child query does not overwrite the parent query's state.

## UNION ALL

`UNION ALL` combines two query plans positionally.

The child queries must produce the same number of columns.

For each position:

* The result name comes from the left query.
* Nullability is combined from both columns.
* Types are reconciled through `commonSqlType()`.

The resulting `QueryPlan.columns` describes the complete UNION ALL output.

## INSERT

INSERT has a `TableReferenceNode` as its destination. The destination is
therefore structurally restricted to a table rather than an arbitrary
tabular expression.

INSERT supports:

* `INSERT ... VALUES`
* `INSERT ... DEFAULT VALUES`
* `INSERT ... SELECT`

For VALUES input, semantic resolves and binds input expressions and validates
their context. `DEFAULT` is handled separately because its final value
depends on the target column.

For INSERT SELECT, the source query is bound through normal query binding.
Output count and type compatibility are validated positionally.

The source may be any supported composed query, including `UNION ALL`.

## UPDATE and DELETE

UPDATE expressions may reference existing columns because they are evaluated
against affected `RowView`s.

Semantic resolves and binds assignments and predicates; execution evaluates
them against affected rows.

DELETE predicates follow the same expression and relation-scope binding
rules.

## CREATE TABLE and CTAS

`bindCreateTable()` validates explicit table definitions and produces
schema-modification actions.

For CTAS, the SELECT is bound through normal query binding.

`QueryColumn` supplies query-result metadata only. Source defaults,
auto-increment behavior, constraints, and other physical properties are not
implicitly inherited.

Dialect rules determine how explicit CTAS definitions interact with query
metadata.

## Keywords and DEFAULT

Keywords and special expressions are represented separately from ordinary
values.

Current categories include:

* `Keyword`
* `TemporalExpressionKeyword`
* `SqlFunctionKeyword`

Examples include `DEFAULT`, `CURRENT_TIMESTAMP`, `CURRENT_DATE`,
`CURRENT_TIME`, `NOW`, and `GETDATE`.

Dialect rules determine which are permitted.

`DEFAULT` uses `DefaultValueNode`. Semantic validates its use; the target
column remains responsible for resolving its actual default or
auto-increment behavior.

## Policy and Dialect Rules

Semantic obtains active policies through the execution context.

Policies may govern:

* Supported keywords and functions
* Statement capabilities
* Column-input behavior
* CTAS behavior
* Explicit column-name handling
* CTAS column-count requirements
* CTAS constraint support
* Duplicate derived-table column names

Semantic determines whether an operation is permitted. Relational enforces
persistent relational invariants.

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

Binders reuse existing semantic mechanisms where appropriate. INSERT SELECT
and CTAS, for example, reuse normal query binding.

## Semantic Boundaries

Semantic determines whether an operation is meaningful and permitted.

Examples include:

* Referenced object does not exist
* Ambiguous column reference
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

Semantic does not execute plans or mutate relational state.

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
* Discovery or Import-specific expression contexts

Its role is the translation boundary between statement structure and
executable relational operations.
