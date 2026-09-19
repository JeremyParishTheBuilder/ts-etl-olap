# Architecture

## Overall Flow

```text
External source
    ↓
Discovery
    ↓
Import
    ↓
Schema Inference
    ↓
Database Builder
    ↓
Relational Database
    ↓
Queries / Mutations
    ↓
Validation
    ↓
Export
```

The system is divided into three major layers:

* **Mapping** — converts external data into a relational representation.
* **Engine / Relational** — owns relational state, correctness, and execution.
* **Validation** — evaluates business rules independently of committed relational state.

---

# Mapping

The Mapping layer transforms external data into relational rows.

It consists of four stages:

* Discovery
* Import
* Schema Inference
* Database Construction

Discovery traverses arbitrary hierarchical data and produces immutable `DiscoveryResult`s. Discovery is composed of `DiscoveryNode`s, `DiscoveryNavigator`s, and optional `DiscoveryDecoder`s, allowing the same model to operate across filesystems, JSON, and other structured sources.

Import consumes discovery results using `ImportNode`s and `ImportMapping`s. Expressions transform captured values into relational fields while automatic inference handles common mapping scenarios.

Schema inference observes imported values to construct relational schema.

Finally, `DatabaseBuilder` combines schema and imported rows into immutable relational objects.

---

# Import Pipeline

`ImportPipeline` orchestrates the complete mapping process.

It returns an `ImportPipelineResult` containing:

* discoveries
* imports
* schema
* databases

This exposes intermediate stages for tooling and debugging while supporting installation through:

```ts
engine.install(result.databases);
```

---

# Engine and Relational

The Engine owns committed relational state and executes SQL.

The Relational module provides the immutable relational representation and structural correctness mechanisms used by the Engine.

Primary runtime components include:

* `Engine`
* `Transaction`
* `ExecutionContext`
* `Databases`
* `Database`
* `Table`

Semantic analysis resolves schema references and compiles expressions, predicates, mutations, and queries before execution.

Semantic analysis also resolves engine and dialect policy used by schema-modification actions.

Mutations produce immutable `Action`s.

Queries produce immutable `QueryPlan`s containing an executable plan root and `QueryColumn` metadata. Execution evaluates the plan against relational snapshots and produces `QueryResult`s containing the query metadata and resulting `RowView`s.

Relational constraints enforce structural integrity during execution.

---

### DDL and Query-Based Table Creation

DDL statements are analyzed semantically and converted into executable actions. `CREATE TABLE` may define columns and constraints explicitly, and supported dialects may also create and populate the table from a `SELECT` query (CTAS).

For CTAS, Semantic analysis binds the query into a `QueryPlan`, derives destination column metadata from its `QueryColumn[]`, and combines that metadata with any explicit column definitions according to dialect rules. Query output metadata describes only the query result; source defaults, auto-increment behavior, and constraints are not implicitly inherited.

Dialect rules determine which CTAS forms are permitted, including whether explicit column lists must match the query column count and whether constraints are allowed.

---

### Query Plans

SELECT and other query statements are semantically bound into immutable `QueryPlan`s.

A query plan contains:

- a plan root responsible for producing result rows
- `QueryColumn` metadata describing the query output

`QueryColumn` metadata contains the result name, SQL type, and nullability. Metadata is derived from resolved expressions rather than being limited to physical source-table columns.

Query statements can be composed. For example, `UNION ALL` binds its child queries independently, reconciles their output metadata positionally, and produces a combined query plan. Result names come from the left query, compatible types are reconciled through the common SQL type rules, and nullability is combined.

Query-plan metadata forms the schema contract for consumers such as `INSERT ... SELECT`, `CREATE TABLE AS SELECT`, and query results.

Query execution preserves this metadata in `QueryResult` alongside the evaluated `RowView`s.

---

`INSERT ... SELECT` combines these execution models: semantic analysis binds the source query into a `QueryPlan`, including its output metadata, and an `InsertSelectAction` evaluates that plan and inserts the resulting rows through the relational insertion path.

---

# DSL

The DSL provides fluent builders for:

* discovery
* import mappings
* SQL statements
* expressions
* predicates

Runtime builders evaluate directly against typed contexts, while SQL builders construct ASTs for semantic analysis.

Expression nodes provide reusable fluent operations for composing expressions and predicates. Expression-producing arithmetic operations and predicate-producing comparisons are available across applicable expression nodes rather than being limited to column references.

SQL query builders support composition through nested query expressions. Nested queries are constructed using independent input batches, allowing a query to be supplied as the source of another query or mutation without overwriting the outer statement's builder state.

`UNION ALL` is exposed as a fluent query operation, and `INSERT ... SELECT` accepts a query as its source.

---

# Validation

Validation is intentionally separate from relational storage and structural integrity.

The Relational layer enforces constraints required for relational correctness.

The Validation layer defines additional business rules and evaluates them against an existing relational database.

Validation rules reuse constraint statements and the existing SQL/semantic infrastructure. They execute inside transactions and roll back after evaluation, producing structured `ValidationReport`s rather than changing committed state.

---

# Core Invariants

* Tables and databases are immutable.
* Actions, query plans, expressions, and predicates operate without mutating committed state.
* Query execution does not mutate relational state.
* Schema references are resolved before execution.
* Referential propagation operates against immutable relational state.
* Structural validation belongs to the Relational/Engine layer.
* Business validation belongs to the Validation layer.
* Discovery is independent of import and relational schema.
* Query-plan metadata describes query output independently of physical source tables.

---

# Architectural Boundary

```text
External Data
      │
      ▼
  Mapping Layer
      │
      ▼
Relational Database
      │
      ▼
 Engine / Relational
      │
      ▼
 Validation
      │
      ▼
   Export
```

The Mapping layer is responsible for **representing external data**.

The Engine and Relational layers are responsible for **relational state, execution, and structural correctness**.

The Validation layer is responsible for **business correctness**.