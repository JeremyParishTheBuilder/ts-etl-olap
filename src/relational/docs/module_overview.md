# Relational Module Overview

## Purpose

The Relational module owns the immutable relational representation used throughout the engine.

It defines the relational model, maintains structural correctness, and provides the immutable operations used to construct and modify relational databases.

The module is responsible for:

* immutable relational objects
* relational schema definition
* row storage
* structural constraint enforcement
* relational metadata
* object identity allocation

The Relational module does **not** perform discovery, import, business validation, or SQL parsing. It provides the relational foundation upon which those layers operate.

---

# High-level architecture

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
      ┌───────────┼────────────┐
      ▼           ▼            ▼
 PrimaryKey   ForeignKey    Check
                  │
                  ▼
               Indexes
```

Databases own databases.

Databases own tables.

Tables own columns, indexes, and constraints.

All structural modifications produce new immutable objects.

---

# Databases

`Databases` represents the collection of relational databases managed by the engine.

It owns:

* databases
* database identifier allocation

It provides immutable operations for:

* creating databases
* updating databases
* removing databases
* locating databases by identifier or name

---

# Database

`Database` represents a single relational database.

A database owns:

* tables
* table identifier allocation

The database is responsible for operations that span multiple tables, including operations requiring knowledge of relationships between tables.

Examples include:

* creating tables
* removing tables
* renaming tables
* resolving inter-table references
* creating foreign keys

A database forms the boundary within which relational objects exist.

---

# Table

`Table` is the central relational object.

A table owns:

* columns
* indexes
* primary key
* unique constraints
* foreign keys
* check constraints

It also owns the metadata required to manage relational data, including:

* row liveness
* row count
* column ordering
* identifier allocation for relational objects

Tables provide immutable operations for creating, updating, renaming, and removing the relational objects they own, together with row-oriented operations that maintain structural correctness.

Although relational data is viewed as rows during execution, storage is column-oriented.

---

# Columns

A column defines one attribute of a table.

Columns describe:

* name
* type
* nullability
* default values
* enumerated values
* auto-increment behaviour

Column data is stored within the column itself.

This allows structural operations such as removing a column without rewriting every row in the table.

---

# Row Views

Rows are represented by `RowView`.

A `RowView` is a temporary view over the values belonging to a single row.

It consists of:

* row index
* ordered column values

Row views exist for execution and validation.

They are not the physical storage format of relational data.

---

# Constraints

Constraints define structural rules for relational correctness.

The module supports four constraint kinds:

* Primary Key
* Foreign Key
* Unique
* Check

Constraint specifications describe constraints declaratively before they are created.

Once constructed, constraint objects become immutable members of the relational model.

Structural correctness is enforced by the Relational module itself rather than by higher layers.

---

# Primary Keys

A primary key identifies each row within a table.

Primary keys reference an underlying index and provide the unique identity constraint for the table.

Each table owns at most one primary key.

---

# Unique Constraints

Unique constraints require a set of columns to contain unique values.

A unique constraint references an underlying index.

Indexes may exist independently of unique constraints, allowing indexing and uniqueness to remain separate concepts.

---

# Foreign Keys

Foreign keys define relationships between tables.

A foreign key records:

* child columns
* parent table
* parent columns
* supporting indexes
* referential actions

Referential actions determine how updates and deletions propagate through related data.

The Relational module is responsible for enforcing these relationships.

---

# Check Constraints

Check constraints enforce predicates over table data.

A check stores:

* resolved predicate
* executable predicate
* referenced columns

Checks operate entirely within the relational model and participate in structural validation.

---

# Indexes

Indexes are first-class relational objects.

They may exist independently of constraints.

Constraints such as primary keys, unique constraints, and foreign keys may reference indexes to implement relational behaviour.

This separation allows indexes to exist both as optimisation structures and as implementation components for constraint enforcement.

---

# Referential Actions

Referential actions describe how modifications propagate across foreign-key relationships.

Supported actions include:

* RESTRICT
* CASCADE
* SET NULL
* NO ACTION

These actions are enforced by the Relational module during structural modifications.

---

# Structural Enforcement

The Relational module owns the algorithms responsible for maintaining relational correctness.

Structural operations enforce rules such as:

* unique object names
* valid object references
* primary key rules
* foreign key relationships
* check constraints
* referential actions

Higher layers operate on relational objects with the expectation that these invariants have already been preserved.

---

# Immutability

Every relational object is immutable.

Creating, updating, renaming, or removing relational objects produces new immutable instances while preserving existing snapshots.

Identifier allocation is also immutable, ensuring stable object identities across versions.

---

# Design Principles

The Relational module follows several core principles.

* Relational objects are immutable.
* Structural correctness is enforced by the relational layer.
* Business correctness belongs outside the relational layer.
* Databases own tables.
* Tables own columns, indexes, and constraints.
* Indexes are first-class relational objects.
* Constraints define relational correctness rather than business rules.
* Data is stored by column and viewed by row.
* Stable identifiers are independent of user-facing names.
* Object ownership follows the relational hierarchy.
