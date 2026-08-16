# Relational Module Overview

## Purpose

The Relational module owns the immutable relational representation used throughout the engine.

It is responsible for:

- Relational objects and schema
- Column-oriented row storage
- Structural constraint enforcement
- Relational metadata
- Stable object identity allocation
- Immutable relational mutations

It does not perform discovery, import, SQL parsing, or business validation.

---

## Architecture

Databases
    │
    ▼
Database
    │
    ▼
Table
    ├── Columns
    ├── Indexes
    └── Constraints
         ├── PrimaryKey
         ├── Unique
         ├── ForeignKey
         └── Check

Ownership follows the relational hierarchy:

Databases owns Database objects.
Database owns Table objects.
Table owns columns, indexes, constraints, and row storage.

All relational objects are immutable.

## Databases

Databases is the root collection of relational state.

It owns:

Databases
Database identifier allocation

It provides immutable operations for creating, updating, removing, and locating databases.

## Database

Database represents one relational database and owns:

Tables
Table identifier allocation

Database-level operations handle concerns requiring knowledge of multiple tables, including:

Table creation and removal
Inter-table relationships
Foreign-key validation
Referential actions
Cross-table mutation coordination

Referential work is processed deterministically as immutable work until no additional dependent operations remain.

## Table

Table is the central relational object.

It owns:

Columns
Indexes
Primary key
Unique constraints
Foreign keys
Check constraints
Row metadata and storage

Table mutations are immutable batch operations. Structural indexes are rebuilt after row mutations and constraints are checked before the resulting table is returned.

Rows are stored column-oriented rather than as persistent row objects.

TablePolicy is distinct from user-facing table creation data.

Table retains table-level policy such as allowMultipleAutoIncrementColumns.

## Columns

A Column defines one table attribute.

It contains:

Name
Type
Nullability
Default value
Enumerated values
Auto-increment configuration
Column data

Column data is the physical row storage. A live row has exactly one stored datum for every column.

Adding a column therefore backfills its storage rather than requiring missing values to be reconstructed at read time.

Column mutation also handles column-specific input semantics such as defaults and auto-increment behaviour.

ColumnPolicy is distinct from user-facing ColumnSpec.

Column retains policies that affect its runtime behavior.

## Row Views

RowView is the temporary row representation used during execution.

It contains:

Row index
Ordered values

A row view is assembled from column storage and is not itself persistent storage.

It is used by queries, expressions, predicates, validation, indexes, and referential processing.

## Constraints

The module supports four structural constraint kinds:

PrimaryKey
Unique
ForeignKey
Check

Constraint specifications describe constraints before construction. Constructed constraints are immutable members of the relational model.

Structural constraint enforcement belongs entirely to this module.

## Primary Keys

A primary key uniquely identifies rows within a table.

Each table has at most one primary key.

Primary keys rely on unique indexing to enforce uniqueness.

## Unique Constraints

A Unique constraint requires one or more columns to contain unique keys.

Unique constraints use supporting unique indexes.

Indexes remain first-class objects and may exist independently of constraints.

NULL uniqueness behaviour is configurable through the relational/dialect rules.

## Foreign Keys

A foreign key relates child columns to parent columns.

It records:

Child columns
Parent table
Parent columns
Supporting indexes
Referential actions

Table owns the foreign-key definition. Database coordinates validation and propagation because those operations may span multiple tables.

## Check Constraints

A Check constraint validates rows against a predicate.

It stores the information required to evaluate that predicate and participates in structural validation during row mutations.

Checks protect relational integrity; business validation belongs to the separate Validation module.

## Indexes

Indexes are first-class relational objects.

They may be created independently of constraints and are used to support:

Primary keys
Unique constraints
Foreign keys
Other relational lookups

Indexes are rebuilt from the resulting table state after relevant mutations, ensuring synchronization with column storage.

## Referential Actions

Foreign keys may specify:

RESTRICT
CASCADE
SET NULL
NO ACTION

Referential actions are coordinated by Database.

Update and delete operations produce referential work that is processed iteratively rather than through recursive mutation calls.

Final foreign-key validation occurs after the complete operation has been processed.

## Row Mutation

Insert and update operations distinguish between input resolution and relational mutation.

Insert inputs may omit columns. Ordered input rows represent column-positioned inputs including values, DEFAULT, or undefined.

Update operations identify affected rows separately from their ordered inputs. Expressions are evaluated against the original RowView before relational mutation.

Resolved updates retain:

Row number
Original row
Resulting row

These resolved updates are used by referential-action processing.

## Structural Enforcement

The Relational module maintains invariants including:

Valid object references
Unique names within ownership scopes
Valid column definitions
Primary-key uniqueness
Unique-constraint enforcement
Foreign-key integrity
Check-constraint satisfaction
Index synchronization
Valid row storage

Operations that span multiple tables are coordinated by Database.

## Immutability

Relational objects are persistent immutable values.

Mutations produce new objects while preserving previous snapshots.

This applies to:

Databases
Tables
Columns
Constraints
Indexes
Relational metadata

Stable identifiers are allocated immutably and remain independent of user-facing names.

## Design Boundaries

The Relational module owns structural relational correctness, not domain correctness.

It therefore:

Enforces relational constraints.
Maintains indexes.
Resolves column-level storage semantics.
Coordinates cross-table relational effects.
Preserves immutable relational state.

It does not:

Discover external data.
Map external data into tables.
Parse SQL.
Perform semantic SQL binding.
Define business validation rules.
Export relational data.

Higher layers can therefore treat relational objects as structurally valid immutable state.

## Policy

Some Policy rules are captured by the relational object at creation time.

Therefore, later engine-policy changes affect future objects, not existing columns/tables.