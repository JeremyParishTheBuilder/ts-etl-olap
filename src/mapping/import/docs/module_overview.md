# Import Module Overview

## Purpose

The Import module transforms immutable `DiscoveryResult`s into relational data.

It is responsible for:

* selecting discovered data for import
* transforming discovered values
* preserving import identities
* assembling logical rows
* inferring relational structure
* applying explicit import configuration

Import does not perform physical discovery, relational constraint enforcement, or business validation.

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
    ├── Explicit configuration
    └── Automatic inference
    │
    ▼
Relational Data
```

Import is the boundary between external structured data and the relational model.

---

# Import and Discovery

Import consumes Discovery results rather than performing discovery itself.

Discovery answers:

> Where is the data, and what was discovered?

Import answers:

> How should discovered data become relational data?

The boundary is:

```text
Discovery
    │
    │ DiscoveryResults
    ▼
Import
```

---

# Import Identity

Import identities associate discovered contributions with logical relational rows.

Import identity is independent of business keys.

Multiple discovered sources may therefore contribute to the same logical row:

```text
chain.json ───────┐
                  ├── logical row
assetlist.json ──┘
```

Child entities may establish independent identities for child tables.

This allows row assembly without requiring business keys to exist during import.

---

# Explicit Import

Import supports explicit configuration for cases where the maintainer needs to control relational representation.

Explicit configuration may determine:

* target tables
* selected or derived fields
* child relationships
* naming or namespaces
* other mapping behaviour

Explicit configuration overrides automatic inference.

---

# Automatic Inference

Import retains inference for common structured-data scenarios.

Inference may:

* turn object properties into columns
* flatten nested objects
* turn repeated arrays into child relations
* infer table and column names
* infer appropriate row identities

An entire discovered document can therefore be imported without requiring every column to be specified manually.

Explicit mappings can selectively override inferred behaviour or assign structures to separate tables.

---

# Schema Inference

Schema inference belongs to Import because it determines how structured imported data becomes relational schema.

It may infer:

* tables
* columns
* types
* flattened object structure
* array relations
* related relational structure

The resulting schema and data are materialized through the Relational layer.

---

# SQL-Based Direction

Import is moving toward using the common SQL AST, DSL, semantic analysis, and execution infrastructure rather than maintaining a parallel transformation language.

The intended model is conceptually:

```sql
INSERT INTO Assets (...)
SELECT ...
FROM discovery_results
WHERE ...;
```

This allows Import to reuse common SQL capabilities such as:

* expressions and predicates
* `CASE`
* `CAST`
* JSON extraction
* `UNION ALL`
* joins
* `INSERT ... SELECT`

Import-specific AST or expression concepts should be removed when equivalent SQL concepts are sufficient.

---

# Staging

The long-term architecture may expose Discovery results through relational staging structures.

Conceptually:

```text
DiscoveryResults
      │
      ▼
Staging
      │
      ▼
SQL Import
      │
      ▼
Relational Data
```

Staging must preserve the information Import requires, including discovered values, identities, captures, and relevant source relationships, without making Discovery itself dependent on the relational model.

---

# Architectural Boundaries

* Discovery owns physical traversal and discovery.
* Import owns relational transformation and inference.
* Relational owns immutable relational state and structural correctness.
* Validation owns business correctness.
* Import identity remains independent of business keys.
* Explicit configuration overrides inference.
* Automatic inference remains available; Import is not restricted to column-by-column mappings.
* SQL is the long-term common transformation language for Import where practical.
