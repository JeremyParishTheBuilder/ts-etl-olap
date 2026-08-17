# Import Module Overview

## Purpose

The Import module transforms discovered data into an immutable relational representation.

It consumes the immutable results produced by Discovery and determines how those results become relational rows, tables, columns, and identities.

The Import module is responsible for:

* selecting logical objects from Discovery results
* transforming discovered values
* preserving and combining import identities
* inferring relational structure where appropriate
* applying explicit import configuration
* constructing the relational representation from imported data

Import does not perform physical discovery or business validation.

---

# High-Level Architecture

```text
Discovery
    │
    ▼
DiscoveryResults
    │
    ▼
Import
    │
    ├── Explicit import definitions
    ├── Automatic inference
    └── Schema inference
    │
    ▼
Relational Representation
```

Import is the boundary between external structured data and the relational model.

---

# Import Inputs

Import consumes immutable `DiscoveryResult`s.

Discovery results may contain:

* discovered values
* captures
* discovery identities
* parent/child relationships
* source metadata

Import interprets these results without performing discovery itself.

The Import layer may expose discovered data through an intermediate staging representation suitable for relational expressions and SQL-based transformation.

---

# Import Roots

An `ImportRoot` connects discovered results to an import operation.

Historically, an import root connects:

* a `DiscoveryRoot`
* an import definition

The purpose of this relationship is to identify which discovered results participate in an import.

Import does not execute discovery as part of its own traversal.

---

# Relational Transformation

Import determines how discovered data becomes relational data.

A transformation may:

* select values
* derive values
* cast values
* flatten objects
* create child rows
* combine contributions from multiple discovered sources
* preserve import identity
* explicitly override inferred behaviour

The long-term direction is for these transformations to use the system's standard SQL expression and statement infrastructure rather than a separate Import-specific expression language.

This allows Import to share semantic analysis and execution capabilities with ordinary SQL.

---

# Import Identity

Import identities connect discovered contributions that belong to the same logical relational row.

Import identity is independent of the eventual business key.

For example:

```text
chain.json
     │
     ├── identity A ──┐
     │                │
assetlist.json       ├── logical Chain row
     │                │
     └── identity A ──┘
```

Multiple discovered sources may therefore contribute values to one logical row.

Crossing into a distinct logical child entity may establish a different identity for the child relation.

This mechanism allows relational row assembly without requiring business keys to exist during import.

---

# Explicit Import

Maintainers may explicitly define how discovered data maps to relational structures.

Explicit configuration may specify:

* target table
* source discovery
* selected fields
* derived expressions
* child relationships
* namespace or column naming
* other mapping behaviour

Explicit configuration takes precedence over automatic inference.

The long-term goal is for explicit transformations to be expressed through the common SQL AST and DSL where practical.

---

# Automatic Inference

Import retains automatic inference for common structured-data scenarios.

Inference allows maintainers to import substantial portions of a discovered document without specifying every column individually.

Typical inference includes:

* object properties becoming columns
* nested objects becoming flattened columns
* object arrays becoming child relational structures
* inferred table names
* inferred column names or prefixes
* inferred row identities

Explicit mappings override inferred behaviour.

For example, a document may be imported broadly while explicitly assigning a property such as `images` to a separate table.

An inferred array that has not been explicitly claimed may likewise become a child relation.

This allows Import to support both:

```text
Explicit projection
```

and:

```text
Broad import + selective overrides
```

without requiring either extreme as the only import style.

---

# Flattening

Objects may be flattened into relational columns.

For example:

```text
Codebase.Version
Consensus.Type
```

represent nested object properties within a relational row.

Arrays are treated differently.

An array represents a repeated structure and may become a child relation rather than a group of repeated columns.

Explicit configuration can override inferred handling where required.

---

# Multiple Sources

Multiple discovered sources may contribute to one relational row when their import identities establish the same logical entity.

Conceptually:

```text
chain.json
     │
     ├──────────────┐
     │              │
assetlist.json      │
     │              │
     └──── same ────┘
          identity
             │
             ▼
         Chain row
```

The relational implementation may express these relationships through joins or other relational operations over a staging representation.

This is important for imports in which related documents contribute different fields to the same business entity.

---

# Staging Representation

The long-term Import architecture may expose Discovery results through a relational staging representation.

Conceptually:

```text
Discovery Results
       │
       ▼
Staging Relations
       │
       ▼
SQL expressions / statements
       │
       ▼
Relational data
```

The staging representation should expose the information required for Import without making Discovery itself dependent on the relational model.

It may include information such as:

* discovered value or document
* discovery identity
* import identity
* source metadata
* captures
* parent/child relationships

The exact staging schema is an implementation concern and should remain separate from the physical Discovery model.

---

# SQL-Based Import Direction

Import is moving toward using the common SQL language rather than maintaining a parallel transformation language.

The intended model is conceptually:

```sql
INSERT INTO Assets (...)
SELECT ...
FROM discovery_results
WHERE ...;
```

rather than requiring an Import-specific expression such as:

```text
capture(...)
    .path(...)
    .scalar()
```

The SQL-based approach allows Import to reuse capabilities such as:

* expressions
* predicates
* `CASE`
* `CAST`
* JSON extraction
* `UNION ALL`
* joins
* `INSERT ... SELECT`
* other relational operations

As this transition progresses, Import-specific AST and expression concepts should be removed when equivalent standard SQL concepts are sufficient.

---

# Schema Inference

Schema inference belongs to Import because it determines how imported structured data becomes relational schema.

Inference may determine:

* tables
* columns
* column names
* column types
* nested-object flattening
* array relations
* inferred relationships

Explicit configuration overrides inferred structure.

The implementation may eventually generate or use SQL-oriented schema operations such as `CREATE TABLE AS SELECT`, but schema inference remains a domain-specific concern rather than being assumed to be identical to ordinary SQL query execution.

---

# Database Construction

Import ultimately produces the relational representation consumed by the Relational and Engine layers.

Database construction is responsible for materializing the inferred or explicitly defined relational structure into immutable relational objects.

The resulting database is independent of the Discovery objects that produced it.

---

# Relationship to Discovery

Discovery and Import have deliberately different responsibilities.

```text
Discovery
    │
    │ locate, navigate, decode, identify
    ▼
DiscoveryResults
    │
    │ select, transform, infer, assemble
    ▼
Import
    │
    ▼
Relational Database
```

Discovery describes what exists in the external source.

Import determines how that information is represented relationally.

---

# Relationship to Relational

Import produces data for the Relational layer but does not own relational correctness.

The Relational layer owns:

* immutable relational objects
* structural constraints
* indexes
* relational invariants
* relational state

Import determines what relational structure and data should be constructed.

---

# Relationship to Validation

Import does not perform business validation.

Validation operates after relational data exists and evaluates business rules against relational state.

The boundary is:

```text
Discovery
    ↓
Import
    ↓
Relational Database
    ↓
Validation
```

---

# Design Principles

* Import is independent of physical discovery.
* Import consumes immutable Discovery results.
* Explicit configuration overrides inference.
* Automatic inference minimizes unnecessary configuration.
* Import identity is independent of business keys.
* Multiple discovered sources may contribute to one logical row.
* Relational transformations should use standard SQL concepts where practical.
* Import-specific expression and AST concepts should not be retained when equivalent SQL concepts are sufficient.
* Schema inference remains responsible for domain-specific structured-data inference.
* Relational structural correctness belongs to the Relational/Engine layer.
* Business validation belongs to the Validation layer.
* The resulting relational representation is independent of the source representation.
