# Mapping Overview

The `/mapping/` directory contains the two modules responsible for converting external structured data into relational data:

* **Discovery** — locates, navigates, decodes, and identifies external data.
* **Import** — consumes Discovery results and determines how they become relational data.

These are separate modules with a deliberate boundary between them.

```text
External Source
      │
      ▼
  Discovery
      │
      │ DiscoveryResults
      ▼
    Import
      │
      ▼
Relational Data
```

## Module Boundary

Discovery answers:

> Where is the data, and what was discovered?

Import answers:

> How should discovered data become relational data?

Discovery does not depend on relational schema or Import-specific transformation rules.

Import does not perform physical discovery. It consumes the immutable results produced by Discovery.

## Directory Structure

```text
mapping/
├── discovery/
└── import/
```

The `mapping` directory is an organizational grouping, not an architectural module. Its subdirectories represent the actual Discovery and Import modules.

## Architectural Direction

Import currently contains specialized transformation and inference mechanisms. The long-term direction is to reuse the common SQL AST, DSL, semantic analysis, and execution infrastructure for relational transformation wherever practical.

Automatic inference remains part of Import; it is not being replaced by mandatory column-by-column mappings.

The boundary between Discovery and Import should remain stable regardless of how Import's transformation and inference mechanisms evolve.
