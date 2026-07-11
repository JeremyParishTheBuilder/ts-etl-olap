# Mapping Layer Overview

The mapping layer converts external structured data (filesystem, JSON, and future formats such as XML) into relational tables. It is independent of both filesystem discovery and the relational database engine.

Most consumers interact only with **ImportPipeline**, which performs the complete import process.

```
Filesystem
    ↓
Discovery
    ↓
DiscoveryResults
    ↓
Import
    ↓
ImportResults
    ↓
Schema Inference
    ↓
DatabaseBuilder
    ↓
Database
```

`ImportPipeline.build()` returns an `ImportPipelineResult`, exposing each intermediate stage for inspection while still supporting a simple installation workflow.

---

# Discovery

Discovery traverses an external source and produces `DiscoveryResult`s.

Each result records:

- discovery node type
- import identity
- captured values
- discovered objects

Discovery is responsible only for locating entities and recording context. It does not interpret JSON structure or relational schema.

---

# Import Nodes

Import nodes transform `DiscoveryResult`s into relational rows.

Current implementations are:

- `FileImportNode`
- `DiscoveryImportNode`

`FileImportNode` reads an external source (such as JSON) before applying an `ImportMapping`.

`DiscoveryImportNode` imports information already contained within a `DiscoveryResult`, allowing discovery metadata to become relational data.

---

# Import Mappings

An `ImportMapping` describes how one source object contributes to a relational table.

Mappings define:

- import source
- fields
- captures
- nested mappings
- optional table name
- optional column prefix

Mappings are recursive, allowing hierarchical source data to be flattened into relational tables with relatively little configuration.

---

# Import Sources

An import source selects which portion of a source object a mapping operates on.

Current implementations include:

- `IdentitySource`
- `JsonPath`

Import sources also expose enough structural information for the mapping layer to infer sensible defaults such as table names.

---

# Expressions

Both imported fields and captures are computed using expressions.

Expressions evaluate against an import context, allowing values to be composed from source data, captures, literals, and other expressions.

Examples include:

- `json("base")`
- `capture("networkKind")`
- `literal("Chain:")`
- `concat(...)`

This provides a consistent mechanism for computed values throughout the mapping layer.

---

# Automatic Inference

The mapping layer infers much of the import structure automatically.

This includes:

- nested object flattening
- array mappings
- table names
- column prefixes

Explicit mappings always override inferred behavior.

---

# Import Identity

Every imported row has an `ImportRowIdentity`.

Identity is built incrementally as discovery and nested mappings descend through the source hierarchy, allowing independent import operations to contribute to the same logical relational row.

Import identity is an internal import concern and is not part of the relational schema.

---

# Schema Inference

Schema inference observes imported values and constructs a relational schema automatically.

Column types are inferred from observed values, while business validation remains a separate concern.

---

# Logical Row Assembly

Import produces many partial `ImportResult`s.

Rows are assembled by table and `ImportRowIdentity` before being written into the relational database.

This allows multiple discovery nodes, files, and nested mappings to cooperate while remaining loosely coupled.