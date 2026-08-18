# Discovery Module Overview

## Purpose

The Discovery module locates and describes structured data within external sources.

It is responsible for:

* navigating hierarchical data
* matching values and structures
* decoding values when required
* capturing discovery metadata
* establishing stable discovery identities
* producing immutable `DiscoveryResult` trees

Discovery does not define relational tables, columns, business rules, or relational constraints.

Its output is consumed by Import.

---

# High-Level Architecture

```text
External Source
      │
      ▼
DiscoverySource
      │
      ▼
DiscoveryRoot
      │
      ▼
DiscoveryNode Graph
      │
      ▼
DiscoveryResult Tree
      │
      ▼
Import
```

A discovery source provides the initial value.

A discovery root combines that source with a root discovery node.

The discovery graph describes how values are navigated, matched, decoded, and captured.

Execution produces immutable discovery results.

---

# Discovery Sources

`DiscoverySource` abstracts the origin of discovered data.

Discovery depends on the source abstraction rather than on a particular physical storage medium.

Sources may represent:

* filesystem objects
* archives
* JSON documents
* HTTP resources
* databases
* in-memory structures

A source provides the root value from which discovery begins.

The source itself does not determine how that value is traversed.

---

# Discovery Roots

`DiscoveryRoot` defines an independent discovery operation.

A root combines:

* a `DiscoverySource`
* a root `DiscoveryNode`

Multiple roots may operate over different sources or provide different views of the same external data.

Discovery roots produce results independently of Import.

---

# Discovery Nodes

A `DiscoveryNode` describes one step in the discovery graph.

A node may define:

* navigation
* matching
* decoding
* captures
* child discoveries

Nodes describe the physical or structural process of locating data.

They do not define relational tables or relational columns.

---

# Navigation

`DiscoveryNavigator` moves from one value to related values.

Navigation may represent structures such as:

* object properties
* array elements
* filesystem children
* parent/child relationships
* other source-specific structures

Navigation is deliberately separate from decoding.

A navigator determines **where to go**.

A decoder determines **how a value is represented**.

---

# Decoding

`DiscoveryDecoder` converts a discovered value into a representation suitable for further discovery.

For example:

```text
File
  │
  ▼
Decoder
  │
  ▼
JSON object
```

Decoding is optional.

Discovery therefore remains independent of the representation used by the underlying source.

---

# Matching

Discovery nodes may restrict which navigated values participate in discovery.

Matching determines whether a value is eligible for a particular discovery step.

Matching belongs to Discovery because it concerns locating physical or structural data rather than shaping relational output.

---

# Captures

Captures preserve values or metadata discovered during traversal.

Captures are part of the discovery result context and may be consumed by downstream processing.

Discovery should capture information necessary to describe or identify discovered data.

Derived relational fields should generally be computed during Import rather than encoded as Discovery-specific transformations.

This distinction keeps Discovery focused on finding data while allowing Import to determine how discovered data becomes relational data.

---

# Discovery Results

`DiscoveryResult` is the immutable output of Discovery.

A result records information such as:

* result type
* discovered value
* captures
* stable identity
* child results

Results form a tree corresponding to the discovery graph.

Import consumes these results without performing Discovery again.

---

# Discovery Identity

Discovery establishes stable identities that can be preserved by downstream Import processing.

These identities are independent of relational business keys.

They allow multiple discovered values to be associated with the same logical imported entity without requiring Discovery to understand the eventual relational schema.

---

# Relationship to Import

Discovery answers:

> Where is the data, and what was discovered?

Import answers:

> How should discovered data become relational data?

The boundary is therefore:

```text
Discovery
    │
    │ DiscoveryResults
    ▼
Import
```

Discovery does not need to know whether a discovered value will become:

* a table
* a column
* a staging value
* an omitted value
* part of a child relation
* part of a derived expression

Those decisions belong to Import.

---

# Design Principles

* Discovery is independent of Import.
* Discovery is independent of relational schema.
* Discovery is independent of business validation.
* Navigation and decoding are separate concerns.
* Discovery is independent of physical storage medium.
* Discovery results are immutable.
* Stable discovery identities are independent of business keys.
* Discovery locates and describes data rather than interpreting its business meaning.
* Derived relational transformations belong to Import.
