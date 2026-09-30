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
* AST resolution
* Expression and predicate binding
* Relation and column scope construction
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

`resolveExpression()` converts expression nodes into resolved nodes.
`bindExpression()` converts resolved nodes into executable `Expression`
objects.

Predicates follow the same resolution and binding model and produce
executable `Predicate` objects.

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

Expressions evaluated against existing rows are bound with `RowView` context.

## Relation Sources and Scope

Queries resolve against a `RelationSource`, which may be:

* A physical table
* A child query
* A join

Semantic binding converts a relation source into a `BoundRelation` containing
its executable plan and the relations visible at that level.

`RelationBinding` describes a relation's semantic column namespace.
`RelationScope` resolves column references across the visible relations.

Qualified references resolve the relation first and then the column.
Unqualified references must resolve to exactly one matching column.
Ambiguous references are rejected.

Identifier comparison uses normalized names while preserving display names.

## Relation Boundaries

A physical table exposes its columns as one relation.

A derived query creates a new relation boundary. Its outer query sees the
derived query under its alias rather than seeing the relations used inside
the child query.

For example:

```text
Users u JOIN Orders o
        |
        v
     query d
        |
        v
outer scope sees d
```

Columns from `u` and `o` therefore do not escape into the outer scope.

Duplicate output names may remain in a derived query where the active dialect
permits them. Explicit references to an ambiguous duplicate name are
rejected. Dialect policy may instead require unique derived-table column
names.

## JOIN

JOIN is a relation-source operation rather than a query statement.

Semantic recursively binds the left and right sources, then resolves the
join predicate against a scope containing both sides.

The resulting plan contains the left and right plans and the bound predicate.
Its output columns are ordered left-to-right.

The completed join exposes its constituent relations to subsequent SELECT
expressions and chained joins.

For example:

```text
A JOIN B ON ...
  JOIN C ON ...
```

The second join can reference relations from `A` and `B` as well as `C`.

Semantic resolves and binds the operation; execution evaluates the join and
produces its rows.

## SELECT

`bindSelect()` converts a `SelectStatement` into a `QueryPlan`.

SELECT items are expressions and are not limited to physical columns.

A `QueryPlan` contains:

* `root`: executable `PlanNode`
* `columns`: output `QueryColumn[]`

Each `QueryColumn` contains:

* `name`
* `type`
* `nullable`

Metadata is derived from expression semantics. Aliases take precedence over
derived names; expressions without suitable names receive generated names.

Query metadata describes the query output independently of physical source
schema.

### SELECT *

`*` expands from the bound relation source and preserves output positions.
It is not treated as a set of ordinary named column references.

This allows star expansion to preserve duplicate output names and joined
column positions without incorrectly resolving ambiguous names.

Semantic constructs the plan but does not execute it.

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
* Types must be mutually assignment-compatible.
* `commonSqlType()` determines the resulting type.

`UnionAllNode` executes the left plan followed by the right plan and
preserves duplicates.

The resulting `QueryPlan.columns` describes the complete UNION ALL output.

## Query Results

Execution converts a query plan into a `QueryResult` containing:

* `columns`: the plan's `QueryColumn[]`
* `rows`: evaluated `RowView[]`

Semantic establishes the query metadata; execution produces the data.

## INSERT

INSERT supports VALUES input and query-based input.

### INSERT ... VALUES

Semantic resolves and binds input expressions and validates their context.

`DEFAULT` is handled separately because its final value depends on the target
column.

### INSERT ... SELECT

The source query is bound to a `QueryPlan`.

Semantic validates output count and compatibility with the target columns.
Mapping is positional.

The source may be any supported composed query, including UNION ALL.

## UPDATE

UPDATE expressions may reference existing columns because they are evaluated
against affected `RowView`s.

Semantic resolves and binds the assignments; execution evaluates them against
the affected rows.

## CREATE TABLE and CTAS

`bindCreateTable()` validates explicit table definitions and produces
schema-modification actions.

For CTAS, the SELECT is bound through normal query binding.

`QueryColumn` supplies query-result metadata only. Source defaults,
auto-increment behavior, constraints, and other physical properties are not
implicitly inherited.

Dialect rules determine how explicit CTAS definitions interact with query
metadata.

The destination is created through normal schema actions and populated
separately.

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

Policies may originate from engine configuration, dialect defaults, or
dialect-specific rules.

They may govern:

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

## Semantic vs Relational

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

Its role is the translation boundary between statement structure and
executable relational operations.
