# Architecture

## Overall Flow

```
Filesystem
    ↓
Discovery
    ↓
Import
    ↓
Schema Inference
    ↓
Database Builder
    ↓
ImportPipelineResult
    ↓
Engine.install(...)
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

- **Mapping** — converts external data into a relational representation.
- **Engine** — maintains relational correctness and executes SQL.
- **Validation** — applies business rules independently of storage.

---

# Mapping

The mapping layer transforms external data into relational rows.

It consists of four stages:

- Discovery
- Import
- Schema Inference
- Database Construction

Discovery traverses external sources and produces immutable `DiscoveryResult`s.

Import consumes discovery results using `ImportNode`s and `ImportMapping`s. Expressions compute fields and captures while automatic inference handles common cases such as nested objects, arrays, table names, and column prefixes.

Schema inference observes imported values to construct a `DatabaseSchema`.

Finally, `DatabaseBuilder` combines schema and imported rows into immutable relational objects.

---

# Import Pipeline

`ImportPipeline` orchestrates the complete mapping process.

It returns an `ImportPipelineResult` containing:

- discoveries
- imports
- schema
- databases

This exposes every intermediate stage for tooling and debugging while supporting a simple installation workflow:

```ts
engine.install(result.databases);
```

---

# Engine

The engine owns committed relational state and executes SQL.

Its primary components are:

- `Engine`
- `Transaction`
- `ExecutionContext`
- `Databases`
- `Database`
- `Table`

Semantic analysis resolves schema references and compiles expressions and predicates into executable runtime objects before execution.

Mutations produce immutable `Action`s.

Queries produce immutable `QueryPlan`s evaluated against `RowView`s.

---

# DSL

The DSL provides a fluent API for constructing SQL statements, expressions, and predicates.

Runtime builders evaluate directly against typed contexts, while SQL builders construct abstract syntax trees for semantic analysis.

---

# Validation

Validation is intentionally separate from storage.

The engine enforces structural relational rules such as:

- primary keys
- unique constraints
- foreign keys
- check constraints

Business rules are evaluated separately before export or publication.

---

# Core Invariants

- Tables and databases are immutable.
- Actions, query plans, expressions, and predicates are pure.
- Query execution never mutates committed state.
- Schema references are resolved before execution.
- Referential propagation operates against immutable snapshots.
- Structural validation belongs to the engine.
- Business validation belongs to the validation layer.

---

# Architectural Boundary

```
External Data
      │
      ▼
  Mapping Layer
      │
      ▼
Relational Database
      │
      ▼
 Engine
      │
      ▼
 Validation
      │
      ▼
   Export
```

The mapping layer is responsible for **representing** external data.

The engine is responsible for **relational correctness**.

The validation layer is responsible for **business correctness**.