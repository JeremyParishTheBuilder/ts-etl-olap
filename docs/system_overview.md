# System Overview

Embedded in-memory ETL and validation engine for structured datasets such as filesystem-based JSON registries.

The system treats external structured data as a relational database:

```text
Filesystem
    ↓
Discovery
    ↓
Import
    ↓
Schema Inference
    ↓
Database Construction
    ↓
Relational Database
    ↓
Mutation / Query
    ↓
Validation
    ↓
Export
```

## Capabilities

* Declarative filesystem discovery
* Typed discovery results with scoped captures and stable import identities
* Declarative import mappings from external data to relational tables
* Automatic flattening of nested objects
* Automatic inference of array mappings
* Automatic inference of table names and column prefixes
* Context-aware derived values during import
* Automatic relational schema inference
* Immutable relational database representation
* SQL-like mutation support (INSERT, UPDATE, DELETE, etc.)
* Deterministic query execution through compiled query plans
* Immediate relational constraint enforcement (PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK)
* Deferred business validation independent of import
* Referential actions (RESTRICT, CASCADE, SET NULL, NO ACTION)
* Expression evaluation
* Immutable transactional execution

## Design Principles

* Immutable persistent data structures
* Deterministic execution
* Discovery is independent of import
* Import is independent of validation
* Validation is independent of import structure
* Import identities are independent of business keys
* Automatic inference for common import scenarios
* Explicit configuration overrides inferred behavior
* Separation of discovery, import, schema inference, execution, validation, and export
* Stable runtime identifiers with case-insensitive user-facing names
* Pure execution over immutable database state

## Execution Model

* Discovery traverses external sources and produces immutable `DiscoveryResult`s.
* Import nodes consume discovery results to produce immutable `ImportResult`s.
* Import results sharing the same import identity are assembled into logical relational rows.
* Schema inference constructs a relational schema from imported data.
* Database construction builds immutable relational objects.
* `ImportPipeline` returns an `ImportPipelineResult` containing discoveries, imports, schema, and the constructed databases.
* The engine installs imported databases through `engine.install(...)`.
* Semantic analysis prepares executable mutations and queries.
* Mutations execute as immutable state transformations.
* Queries execute as compiled query plans over immutable database snapshots.
* Validation verifies business-specific rules independently of import.

## Interface Layer

* Fluent builder API for constructing structured statements
* Compile-time and runtime enforcement of valid builder sequences
* Structured AST-based representation rather than string generation

## Typical Use Cases

* Registry import and validation
* Configuration management
* Metadata repositories
* Structured filesystem datasets
* ETL pipelines requiring deterministic relational processing
* Safe editing and validation prior to export
