# Mapping Module Overview

The mapping module transforms hierarchical external data (filesystem, JSON, and future formats such as XML) into relational databases. It separates the process into distinct stages so that discovery, import, and schema inference remain independent concerns.

Most consumers interact only with `ImportPipeline`, which orchestrates the complete process.

```text
Filesystem
    ↓
Discovery
    ↓
Discovery Tree
    ↓
Import
    ↓
Import Results
    ↓
Schema Inference
    ↓
DatabaseBuilder
    ↓
Database
```

`ImportPipeline.build()` returns an `ImportPipelineResult`, exposing each intermediate stage for inspection while still providing a simple end-to-end import workflow.

---

# Discovery

Discovery traverses arbitrary hierarchical data and produces a tree of `DiscoveryResult`s.

Each `DiscoveryResult` represents a discovered object and records:

- discovery node type
- discovery identity
- discovered value
- captured values
- child discoveries

Discovery is composed from three independent concepts:

- **DiscoveryNode** — defines one step in the discovery graph.
- **DiscoveryNavigator** — navigates from one value to another.
- **DiscoveryDecoder** — converts values between representations (for example `File → JsonObject`).

These abstractions allow discovery to operate across filesystems, structured documents, and future data sources without coupling discovery logic to any particular format.

---

# Import

Import walks the discovery tree and produces relational rows.

Import is described declaratively using `ImportMapping`s.

Each mapping defines:

- which discovery node begins an import subtree (`accepts`)
- which structured value contributes columns (`source`)
- computed fields
- child mappings
- destination table

Import mappings form their own tree, independent of the discovery tree.

A mapping may contribute additional columns to an existing relational row or establish rows for additional tables. Multiple mappings may contribute to the same logical row before schema inference merges them.

`source` is an expression evaluated against the current `ImportContext`. It typically references captured values or navigates within previously selected structured data.

Examples:

```ts
source: capture("chain")

source: path("logo_URIs")
```

---

# Expressions

Expressions provide a strongly-typed DSL for computing values during both discovery and import.

Specialized builders distinguish between:

- discovery values
- structured values
- scalar column values
- predicates

allowing fluent navigation while preserving type safety.

For example:

```ts
capture("chain")
    .path("pretty_name")
    .scalar()
```

Expressions are used for:

- captures during discovery
- import sources
- computed fields
- predicates
- arithmetic and comparison operations

---

# Import Context

Import evaluates mappings using an `ImportContext`.

The context contains:

- current discovery
- current row identity
- current source value

Child mappings inherit their parent's context while selecting new sources through expressions.

This allows multiple mappings to contribute to the same logical row while evaluating against different structured objects.

---

# Row Identity

Each imported row has an `ImportRowIdentity`.

Identity determines which partial imports are merged together during schema inference.

Discovery identities describe where data was found.

Import identities describe which relational row receives imported values.

Although discovery identity often provides the initial identity, child import mappings may continue contributing to the same row while evaluating different discovery nodes.

---

# Schema Inference

Schema inference observes imported values to construct relational tables automatically.

Rows are grouped by:

- table name
- `ImportRowIdentity`

Partial rows sharing the same identity are merged before producing the final relational schema.

This allows information originating from multiple discovery nodes (for example a directory and its decoded JSON file) to become a single relational row.

---

# Design Philosophy

The mapping module intentionally separates several independent concerns:

- **Discovery** locates data.
- **Import** decides how discovered data becomes relational data.
- **Expressions** describe value selection and computation.
- **Schema inference** determines the final relational structure.

Keeping these responsibilities separate allows new navigators, decoders, expression types, and import strategies to be added without requiring changes throughout the pipeline.