Relational Module Overview
Purpose

The Relational module owns the immutable relational representation used throughout the engine.

It defines the relational model, maintains structural correctness, and provides the immutable operations used to construct and modify relational databases.

The module is responsible for:

immutable relational objects
relational schema definition
column-oriented row storage
structural constraint enforcement
relational metadata
object identity allocation

The Relational module does not perform discovery, import, business validation, or SQL parsing. It provides the relational foundation upon which those layers operate.

High-level architecture
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

Ownership follows the relational hierarchy:

Databases own databases.
Database objects own tables.
Table objects own columns, indexes, and constraints.

Every structural modification produces new immutable objects.

Databases

Databases represents the collection of relational databases managed by the engine.

It owns:

databases
database identifier allocation

It provides immutable operations for:

creating databases
updating databases
removing databases
locating databases by identifier or name

Databases forms the root of the immutable relational state maintained by the engine.

Database

Database represents a single relational database.

A database owns:

tables
table identifier allocation

The database is responsible for operations requiring knowledge of multiple tables.

Examples include:

creating, removing, and renaming tables
creating inter-table relationships
validating foreign-key compatibility
executing referential actions
validating foreign-key integrity after structural mutations

Mutations affecting multiple tables are coordinated at the database level before producing a new immutable database instance.

Table

Table is the central relational object.

A table owns:

columns
indexes
primary key
unique constraints
foreign keys
check constraints

It also owns the metadata required to manage relational data, including:

row liveness
row count
column ordering
identifier allocation for relational objects

Tables provide immutable operations for creating, updating, renaming, altering, and removing the relational objects they own.

Row mutations are applied as immutable batch operations. Once structural changes have been applied, indexes are rebuilt and structural constraints are revalidated before the updated table is returned.

Although relational data is viewed as rows during execution, storage is column-oriented.

Columns

A column defines one attribute of a table.

Columns describe:

name
type
nullability
default values
enumerated values
auto-increment behaviour

Column data is stored within the column itself rather than within row objects.

This organisation allows structural operations such as altering or removing columns without changing the underlying storage model.

Row Views

Rows are represented during execution by RowView.

A RowView is a lightweight, temporary projection of a single logical row assembled from the underlying column storage.

It consists of:

row index
ordered column values

Row views are used by query execution, predicates, expressions, validation, indexing, and referential processing.

They are transient execution objects rather than the physical storage format of relational data.

Constraints

Constraints define structural rules for relational correctness.

The module supports four constraint kinds:

Primary Key
Unique
Foreign Key
Check

Constraint specifications describe constraints declaratively before they are created.

Once constructed, constraint objects become immutable members of the relational model.

Structural correctness is enforced entirely within the Relational module.

Primary Keys

A primary key uniquely identifies each row within a table.

A primary key references a unique index that enforces row identity.

Each table owns at most one primary key.

Unique Constraints

Unique constraints require one or more columns to contain unique values.

A unique constraint references a supporting unique index.

Indexes may exist independently of unique constraints, allowing indexing and uniqueness to remain separate concepts.

Foreign Keys

Foreign keys define relationships between tables.

A foreign key records:

child columns
parent table
parent columns
supporting indexes
referential actions

The database coordinates foreign-key validation and referential actions across related tables, while tables store the foreign-key definitions themselves.

Check Constraints

Check constraints enforce predicates over individual rows.

A check stores:

resolved predicate
executable predicate
referenced columns

Checks participate in structural validation during row mutations and ensure existing data continues to satisfy the constraint.

Indexes

Indexes are first-class relational objects.

They may exist independently of constraints.

Primary keys, unique constraints, and foreign keys reference indexes to implement relational behaviour.

Indexes are rebuilt following structural row mutations, ensuring that the relational representation remains consistent with the underlying column data.

Referential Actions

Referential actions describe how modifications propagate across foreign-key relationships.

Supported actions include:

RESTRICT
CASCADE
SET NULL
NO ACTION

Referential actions are coordinated by the database during update and delete operations before final foreign-key validation.

Structural Enforcement

The Relational module owns the algorithms responsible for maintaining relational correctness.

Structural operations enforce rules including:

unique object names
valid object references
primary key rules
unique constraints
foreign-key relationships
check constraints
referential actions

Higher layers operate on relational objects with the expectation that these invariants have already been preserved.

Immutability

Every relational object is immutable.

Creating, updating, renaming, altering, or removing relational objects produces new immutable instances while preserving previous snapshots.

Identifier allocation is also immutable, ensuring stable object identities independent of user-visible names.

Design Principles

The Relational module follows several core principles.

Relational objects are immutable.
Structural correctness is enforced by the Relational module.
Business correctness belongs outside the Relational module.
Databases own tables.
Tables own columns, indexes, constraints, and row storage.
Cross-table operations belong to Database.
Indexes are first-class relational objects.
Constraints define relational correctness rather than business rules.
Data is stored by column and viewed through transient row projections.
Structural mutations execute as immutable batch operations.
Stable identifiers are independent of user-facing names.
Object ownership follows the relational hierarchy.