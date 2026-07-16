# Mapping Layer Overview

The mapping layer converts structured external data (filesystem, JSON, and future formats such as XML) into relational tables. Discovery, import, and schema inference are separate stages, allowing each concern to evolve independently.

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

Discovery traverses hierarchical data and produces `DiscoveryResult`s.

Each result records:

- discovery node type
- import identity
- captured values
- discovered objects

Discovery is built from three independent concepts:

- **DiscoveryNode** — describes one step in the discovery graph.
- **DiscoveryNavigator** — navigates from one value to the next.
- **DiscoveryDecoder** — converts values between representations (for example `File → JsonObject`).

Together these allow discovery to operate across filesystems, JSON, XML, and future data sources.

---

# Import

Import transforms `DiscoveryResult`s into relational rows.

Current implementations are:

- `DiscoveryImportNode`
- `FileImportNode` (legacy)

An `ImportMapping` describes how captured values contribute to relational tables through fields, nested mappings, and import sources.

---

# Expressions

Expressions compute values during both discovery and import.

Specialized builders distinguish between structured discovery values and relational column values, allowing fluent traversal of captured data:

```ts
capture("chain")
    .path("pretty_name")
    .scalar()
```

---

# Import Identity

Each imported row has an `ImportRowIdentity`.

Identity is accumulated during discovery, allowing multiple discovery nodes and import mappings to contribute to the same logical relational row.

---

# Schema Inference

Schema inference observes imported values to construct relational tables automatically.

Partial `ImportResult`s are merged by table and `ImportRowIdentity` before being written into the final database.