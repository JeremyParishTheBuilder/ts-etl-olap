# Relational Module Overview

## Purpose

The Relational module owns the immutable relational representation used throughout the engine.

It defines the relational model, maintains structural correctness, and provides the immutable operations used to construct and modify relational databases.

The module is responsible for:

* Immutable relational objects
* Relational schema definition
* Column-oriented row storage
* Structural constraint enforcement
* Relational metadata
* Stable object identity allocation

The Relational module does not perform discovery, import, business validation, or SQL parsing. It provides the relational foundation upon which those layers operate.

---

## High-level Architecture

```text
Databases
    │
    ▼
Database
    │
    ▼
Table
    │
    ├─────────────┐
    ▼             ▼
Columns      Constraints
                  │
      ┌───────────┼─────────────┬────────────┐
      ▼           ▼             ▼            ▼
 PrimaryKey   Unique      ForeignKey      Check
                  │
                  ▼
               Indexes
```

Ownership follows the relational hierarchy:

* `Databases` owns databases.
* `Database` owns tables.
* `Table` owns columns, indexes, and constraints.

Every structural modification produces new immutable objects.

---

## Databases

`Databases` represents the collection of relational databases managed by the engine.

It owns:

* Databases
* Database identifier allocation

It provides immutable operations for:

* Creating databases
* Updating databases
* Removing databases
* Locating databases by identifier or name

`Databases` forms the root of the immutable relational state maintained by the engine.

---

## Database

`Database` represents a single relational database.

A database owns:

* Tables
* Table identifier allocation

The database is responsible for operations requiring knowledge of multiple tables.

Examples include:

* Creating, removing, and renaming tables
* Creating inter-table relationships
* Validating foreign-key compatibility
* Coordinating referential actions
* Validating foreign-key integrity after structural mutations

Mutations affecting multiple tables are coordinated at the database level before producing a new immutable database instance.

---

## Table

`Table` is the central relational object.

A table owns:

* Columns
* Indexes
* Primary key
* Unique constraints
* Foreign keys
* Check constraints

It also owns the metadata required to manage relational data, including:

* Row liveness
* Row count
* Column ordering
* Identifier allocation for relational objects

Tables provide immutable operations for creating, updating, renaming, altering, and removing the relational objects they own.

Row mutations are applied as immutable batch operations. After structural or row mutations are complete, indexes are rebuilt and structural constraints are revalidated before the updated table is returned.

Although relational data is viewed as rows during execution, storage is column-oriented.

---

## Columns

A column defines one attribute of a table.

Columns describe:

* Name
* Type
* Nullability
* Default value
* Enumerated values
* Auto-increment behaviour

Column data is stored within the column itself rather than within row objects.

When a column is added to an existing table, its storage is backfilled so that every live row contains exactly one stored datum for every column. This preserves a simple storage invariant while avoiding runtime reconstruction of missing values.

This organization allows structural operations such as altering or removing columns without changing the underlying storage model.

---

## Row Views

Rows are represented during execution by `RowView`.

A `RowView` is a lightweight, temporary projection of a single logical row assembled from the underlying column storage.

It consists of:

* Row index
* Ordered column values

Row views are used by query execution, predicates, expressions, validation, indexing, and referential processing.

They are transient execution objects rather than the physical storage format of relational data.

---

## Constraints

Constraints define structural rules for relational correctness.

The module supports four constraint kinds:

* Primary Key
* Unique
* Foreign Key
* Check

Constraint specifications describe constraints declaratively before they are created.

Once constructed, constraint objects become immutable members of the relational model.

Structural correctness is enforced entirely within the Relational module.

---

## Primary Keys

A primary key uniquely identifies each row within a table.

A primary key references a unique index that enforces row identity.

Each table owns at most one primary key.

---

## Unique Constraints

Unique constraints require one or more columns to contain unique values.

A unique constraint references a supporting unique index.

Indexes may exist independently of unique constraints, allowing indexing and uniqueness to remain separate concepts.

Unique indexes also support configurable NULL semantics, allowing multiple NULL-containing keys when appropriate.

---

## Foreign Keys

Foreign keys define relationships between tables.

A foreign key records:

* Child columns
* Parent table
* Parent columns
* Supporting indexes
* Referential actions

The database coordinates foreign-key validation and referential actions across related tables, while tables store the foreign-key definitions themselves.

Referential actions are propagated as deterministic batches of immutable work until no additional actions remain.

---

## Check Constraints

Check constraints enforce predicates over individual rows.

A check stores:

* Resolved predicate
* Executable predicate
* Referenced columns

Checks participate in structural validation during row mutations and ensure existing data continues to satisfy the constraint.

---

## Indexes

Indexes are first-class relational objects.

They may exist independently of constraints.

Primary keys, unique constraints, and foreign keys reference indexes to implement relational behaviour.

Indexes are rebuilt following structural row mutations, ensuring that the relational representation remains consistent with the underlying column data.

---

## Referential Actions

Referential actions describe how modifications propagate across foreign-key relationships.

Supported actions include:

* RESTRICT
* CASCADE
* SET NULL
* NO ACTION

Referential actions are coordinated by the database during update and delete operations before final foreign-key validation.

Propagation executes deterministically over immutable database snapshots until all dependent work has been processed.

---

## Structural Enforcement

The Relational module owns the algorithms responsible for maintaining relational correctness.

Structural operations enforce rules including:

* Unique object names
* Valid object references
* Primary key rules
* Unique constraints
* Foreign-key relationships
* Check constraints
* Referential actions

Higher layers operate on relational objects with the expectation that these invariants have already been preserved.

---

## Immutability

Every relational object is immutable.

Creating, updating, renaming, altering, or removing relational objects produces new immutable instances while preserving previous snapshots.

Identifier allocation is also immutable, ensuring stable object identities independent of user-visible names.

---

## Design Principles

The Relational module follows several core principles.

* Relational objects are immutable.
* Structural correctness is enforced by the Relational module.
* Business correctness belongs outside the Relational module.
* Databases own tables.
* Tables own columns, indexes, constraints, and row storage.
* Cross-table operations belong to `Database`.
* Indexes are first-class relational objects.
* Constraints define relational correctness rather than business rules.
* Data is stored by column and viewed through transient row projections.
* Every live row contains one stored datum for every column.
* Structural mutations execute as immutable batch operations.
* Referential actions execute deterministically over immutable work queues.
* Stable identifiers are independent of user-facing names.
* Object ownership follows the relational hierarchy.
