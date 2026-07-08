# Mapping Layer Overview

The mapping layer converts external structured data (filesystem, JSON, and future formats such as XML) into relational tables. It is intentionally independent of both filesystem discovery and the relational database engine.

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

`ImportPipeline.build()` returns an `ImportPipelineResult`, containing the intermediate results in addition to the finished database.

```text
ImportPipelineResult
    discoveries
    imports
    schema
    databases
```

This allows callers to inspect any stage of the import process for debugging or tooling while still exposing a simple `engine.install(result.databases)` workflow.

---

# Discovery

Discovery traverses an external source and produces `DiscoveryResult`s.

Discovery is responsible only for locating entities and recording contextual information.

Examples include:

* network kind
* network type
* chain directory
* discovered files
* filesystem objects

Discovery intentionally does **not** understand JSON structure or relational schemas.

Each `DiscoveryResult` contains:

* its discovery node type
* its import identity
* captured contextual values
* discovered filesystem objects

---

# Import Nodes

Import nodes convert `DiscoveryResult`s into relational rows.

Two import node implementations currently exist:

* `FileImportNode`
* `DiscoveryImportNode`

A `FileImportNode` reads an external file (such as JSON) before applying an `ImportMapping`.

A `DiscoveryImportNode` imports information already contained within a `DiscoveryResult`, making directory-level metadata available as ordinary relational rows.

---

# Import Mappings

An `ImportMapping` describes how one source object contributes columns to one relational table.

Mappings may define:

* source resolver
* derived fields
* nested mappings
* optional table name override
* optional prefix override

Mappings are recursive, allowing hierarchical source data to be flattened into relational tables.

Most mappings are intentionally very small because much of the boilerplate is now inferred automatically.

---

# Source Resolution

A source resolver determines which portion of the source object a mapping operates on.

Current implementations include:

* `IdentitySourceResolver`
* `JsonPathResolver`

Resolvers also expose enough structural information for the mapping layer to infer sensible defaults such as table names.

---

# Automatic Inference

The mapping layer automatically infers much of the import structure.

## Nested object flattening

JSON objects are flattened automatically.

For example:

```json
{
  "codebase": {
    "git_repo": "...",
    "consensus": {
      "version": "..."
    }
}
```

produces columns similar to:

```
Codebase.git_repo
Codebase.consensus.version
```

without requiring explicit mappings.

---

## Array mappings

Arrays of primitives or objects are automatically discovered.

If no explicit nested mapping exists, an inferred mapping is created.

For example:

```json
"compatible_versions": [
    "v25.1.1"
]
```

automatically produces a table similar to:

```
CodebaseCompatibleVersions
```

Likewise,

```json
"peers": {
    "seeds": [...]
}
```

produces

```
PeersSeeds
```

without requiring explicit configuration.

Explicit mappings always take precedence over inferred mappings.

---

## Table names

Table names may be specified explicitly.

If omitted, they are inferred from the resolver path.

For example:

```
logo_URIs
```

becomes

```
LogoURIs
```

and

```
peers.seeds
```

becomes

```
PeersSeeds
```

---

## Column prefixes

Column prefixes may also be omitted.

For file imports, prefixes are inferred from the filename.

For example:

```
chain.json
```

becomes

```
Chain.json.
```

Similarly,

```
assetlist.json
```

becomes

```
Assetlist.json.
```

Discovery imports infer prefixes from the accepted discovery node type.

For example:

```
chainDirectory
```

becomes

```
ChainDirectory.
```

This prevents collisions between similarly named fields originating from different sources.

---

# Derived Fields

Mappings may define derived fields.

Derived fields are computed using `ValueResolver`s.

Resolvers receive a `ValueResolverContext`, providing access to:

* the current source object
* captured values

Convenience helpers such as `CaptureField()` and `fromCapture()` simplify common cases.

Derived fields participate in prefix inference exactly like ordinary imported fields.

---

# Captures

Captures provide contextual information to descendant discovery and import operations.

Typical captures include:

* chain directory name
* network kind
* network type

Captures are available during value resolution but are **not** automatically imported as relational columns.

Mappings decide explicitly which captures become columns.

This separation keeps discovery context independent from relational schema design.

---

# Import Identity

Every imported row has an `ImportRowIdentity`.

Its purpose is to identify the logical destination row while import results are still independent.

Import identities are built incrementally as discovery and nested mappings descend through the source hierarchy.

Typical identity components include:

* source identity
* directory names
* filenames
* array indices

Import identity is an internal import concern and is not part of the relational schema.

---

# Schema Inference

Schema inference observes all imported values and constructs a relational schema automatically.

Column types are inferred from observed primitive values.

Business validation remains separate from schema inference.

---

# Logical Row Assembly

Import produces many partial `ImportResult`s.

Multiple files, nested mappings, or discovery imports may all contribute columns to the same logical row.

Rows are assembled by table and `ImportRowIdentity` before being written into the relational database.

This allows independent import operations to cooperate while remaining loosely coupled.
