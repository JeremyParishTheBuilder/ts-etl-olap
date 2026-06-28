# System Overview

Embedded in-memory ETL + validation engine for structured file data (JSON/FS).

Core idea:
Treat a file-based registry as a relational database:

filesystem
-> discovery
-> import mapping
-> relational schema
-> relational data
-> mutation
-> validation
-> export

Capabilities:
- Declarative filesystem discovery
- Hierarchical scope-based discovery with typed discovery results
- Declarative import mapping (filesystem/JSON -> relational tables)
- Automatic schema inference from imported data
- Nested import mappings for arrays and object hierarchies
- Derived values during import
- SQL-like transformations (INSERT/UPDATE/etc.)
- Deterministic query execution via compiled QueryPlans over RowViews
- Predicate-based filtering (comparison + logical)
- Immediate index-backed relational constraint enforcement (PK, UNIQUE, FK)
- Deferred domain validation (explicit post-mutation validation phase)
- Referential actions with recursive propagation (RESTRICT, CASCADE, SET NULL, NO ACTION)
- Index-backed foreign-key enforcement and parent->child propagation
- Expression evaluation (literal, column, binary, CASE)
- Bulk immutable mutation execution (INSERT/UPDATE/DELETE)
- Schema-level CHECK constraints with predicate-based row validation

Design principles:
- Immutable state (persistent structures)
- Deterministic execution (given input + state)
- Lazy discovery and import (only traverse/import what is requested)
- Discovery is separate from import
- Import is separate from validation
- Validation is declarative and independent of import
- Table-owned schema invariants (column, CHECK, UNIQUE, index maintenance)
- Database-owned cross-table relational invariants and propagation (FKs)
- Separation of discovery / import / mutation / validation / query
- Identifiers preserve original casing but compare case-insensitively
- Schema objects use stable identifiers for runtime relationships and name-based lookup for user-facing access
- Row-oriented execution via immutable RowViews
- Runtime execution operates on schema-bound column indexes, not identifiers
- Foreign-key propagation uses recursive immutable graph traversal

Execution Model:
- Discovery produces typed DiscoveryResults representing filesystem entities.
- Importers consume DiscoveryResults to produce ImportResults.
- Schema inference observes ImportResults to construct DatabaseSchema.
- Database builders construct relational objects from DatabaseSchema.
- Semantic analysis validates schema references and prepares executable operations.
- Mutations compile to Actions (pure transforms).
- Queries compile to QueryPlans (pure evaluators).
- Statement predicates are schema-bound during semantic analysis and evaluated against RowViews at execution time.
- CHECK predicates are stored as schema-bound predicate definitions and maintained as part of table schema lifecycle.
- Referential propagation operates on reverse FK indexes rather than full table scans.

Interface Layer (DSL):
- Fluent builder API constructs statements.
- Enforces valid call sequences (no invalid intermediate states).
- Produces structured statements (not strings).

Use case:
Safe, deterministic discovery, import, editing, validation, and export of structured, versioned registries and similar file-based datasets.