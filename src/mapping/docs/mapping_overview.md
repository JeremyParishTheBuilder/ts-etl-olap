# Mapping Overview

## Purpose

The Mapping module transforms external structured data into an immutable relational representation suitable for querying, mutation, validation, and export.

It intentionally separates three independent concerns:

1. **Discovery**

   * Locate data within an external source.
   * Navigate hierarchical structures.
   * Decode values when required.
   * Capture metadata.
   * Produce immutable `DiscoveryResult` trees.

2. **Import**

   * Traverse `DiscoveryResult` trees.
   * Select logical objects.
   * Transform values through expressions.
   * Produce immutable relational rows.

3. **Schema Inference**

   * Observe imported rows.
   * Infer relational tables, columns, and relationships.
   * Produce a `DatabaseSchema`.

The Mapping module is responsible only for representing external data relationally. It does not perform relational constraint enforcement or business validation.

---

# High-level architecture

```text
External source
      │
      ▼
 DiscoveryPipeline
      │
      ▼
 DiscoveryResults
      │
      ▼
 ImportPipeline
      │
      ▼
 ImportResults
      │
      ▼
 Schema Inference
      │
      ▼
 DatabaseBuilder
      │
      ▼
 Immutable Database
```

Each stage consumes immutable output from the previous stage and produces immutable results for the next stage.

---

# Discovery

Discovery is responsible only for locating and describing data.

A discovery is defined by a `DiscoveryRoot`, which combines:

* a `DiscoverySource`
* a root `DiscoveryNode`

The source determines where discovery begins, while the discovery graph determines how data is traversed.

Discovery is independent of relational concepts such as tables, columns, and keys.

Each `DiscoveryNode` describes:

* navigation
* matching
* optional decoding
* captures
* child discoveries

Executing one or more `DiscoveryRoot`s produces immutable `DiscoveryResult` trees.

Each `DiscoveryResult` contains:

* result type
* discovered value
* captures
* stable identity
* child results

Discovery understands physical structure but not logical schema.

---

# Discovery Sources

`DiscoverySource` abstracts the origin of discovered data.

The Mapping module depends only on this abstraction rather than any particular storage medium.

Examples include:

* filesystem objects
* archives
* JSON documents
* HTTP resources
* databases
* in-memory structures

Each source opens a root value from which discovery begins.

This separation allows the same discovery graph to operate over different kinds of external data.

---

# Import

Import transforms discovery results into logical relational rows.

Import is driven by `ImportRoot`s.

Each `ImportRoot` explicitly connects:

* one `DiscoveryRoot`
* one root `ImportMapping`

Import never performs discovery itself. It consumes the immutable discovery results produced by the discovery pipeline.

---

# Import Mapping

`ImportMapping` describes how logical objects become relational rows.

A mapping may specify:

* table name
* source
* fields
* child mappings
* flattening behaviour
* namespace prefix

Mappings without a table name act purely as navigation and grouping nodes.

They participate in traversal without producing rows.

---

# Import Sources

`ImportSource`s navigate within imported data.

Examples include:

* a discovery result
* the current object
* child paths

Navigation produces zero or more `ImportContext`s:

```text
navigate(context) → ImportContext[]
```

This naturally supports:

* arrays
* optional objects
* sibling discoveries
* repeated logical structures

without requiring special traversal logic.

---

# Import Context

`ImportContext` represents the current state during import.

It carries:

* current discovery result
* current value
* row identity
* current table
* current namespace

Contexts are immutable.

Methods such as `withValue(...)` or `withNamespace(...)` produce modified contexts while preserving the remaining state.

---

# Row Identities

Stable identities originate during discovery.

Import preserves an identity while contributing data to the same logical row.

Crossing into a different table adopts the identity of the discovered child object.

This allows:

* multiple mappings to assemble a single row
* child tables to produce independent rows
* imported rows to remain independent of business keys

---

# Namespaces

Namespaces determine relational column qualification.

Entering a new table resets the namespace.

Within a table, each mapping contributes either:

* an explicit namespace prefix, or
* an inferred namespace from its import source

This produces predictable column names such as:

```text
ChainFile.ChainName
ChainFile.Codebase.Version
```

while allowing intentionally shared columns where appropriate.

---

# Automatic Inference

Most logical objects are imported through explicit mappings.

Object arrays not claimed by explicit child mappings are imported automatically.

For each inferred object array, the Mapping module:

* infers a table name
* generates row identities
* creates rows
* flattens object properties into columns

Explicit mappings always override inferred behaviour.

---

# Flattening

Objects flatten into relational columns.

For example:

```text
Codebase.Version
Consensus.Type
```

Arrays are never flattened.

Instead, arrays become child tables.

This preserves the relational structure while avoiding repeated column groups.

---

# Expressions

Expressions provide a common language across discovery and import.

The primary entry point is:

```text
current()
```

Examples include:

```text
current().path("chain_name").scalar()

current().path("_basename")

capture("owner")

literal("Chain:")
```

Expressions are evaluated within strongly typed execution contexts and are reusable throughout the Mapping module.

---

# Design Principles

The Mapping module follows several core principles.

* Discovery locates data.
* Import shapes data.
* Schema inference derives relational structure.
* Validation is outside the Mapping module.
* Tables represent logical entities rather than physical storage.
* Discovery is independent of storage media.
* Import is independent of physical layout.
* Explicit configuration overrides inference.
* Automatic inference minimises boilerplate.
* Every stage operates over immutable data.
* Stable identities are independent of business keys.
* External data is represented relationally without interpreting business meaning.
