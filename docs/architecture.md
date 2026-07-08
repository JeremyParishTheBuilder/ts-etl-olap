# Architecture

Flow:
Filesystem -> Discovery -> Import -> Schema Inference -> Database Builder -> ImportPipelineResult -> Engine.install(...)Relational Database -> Mutations / Queries -> Validation -> Export

Core components:

Mapping:
- Discovery graph (ScopeNodes and CollectionNodes)
- DiscoveryContext carries captures and import identity
- Discovery produces immutable DiscoveryResults
- ImportNodes consume DiscoveryResults
- FileImportNodes import external structured data
- DiscoveryImportNodes import discovery metadata
- ImportMappings describe relational projections
- Automatic inference handles:
  - nested object flattening
  - array mappings
  - table names
  - column prefixes
- Import produces immutable ImportResults
- Schema inference observes ImportResults
- DatabaseBuilder constructs relational objects

Engine:
- Engine: owns committed state, manages transactions, dispatches statements
- Transaction: immutable working Databases snapshot + accumulated Actions
- ExecutionContext: schema/rule resolution during semantic binding
- Databases -> Database -> Table: immutable data hierarchy
- Table: row storage, schema-local invariants, CHECK enforcement, and index maintenance
- Database: cross-table relational coordination, FK validation, recursive referential propagation

Discovery:
- Declarative graph of ScopeNodes and CollectionNodes
- Lazy filesystem traversal
- DiscoveryContext carries:
  - current location
  - captures
  - import identity
- Discovery produces immutable DiscoveryResults
- Discovery is independent of import and schema inference

Import:
- ImportNodes consume DiscoveryResults
- File readers parse external formats
- ImportMappings define relational projections
- Objects are flattened automatically
- Arrays are inferred automatically
- Table names are inferred when omitted
- Prefixes are inferred when omitted
- Explicit mappings override inferred mappings
- Derived fields compute additional values
- ImportResults retain discovery context and row identity
- Import remains independent of schema inference

Schema inference:
- DatabaseSchema inferred from ImportResults
- TableSchema observes imported values
- ColumnSchema observes value types
- Relationships and constraints are intentionally not inferred
- Validation layer defines relational constraints explicitly

Import Pipeline:
ImportPipeline orchestrates:
- discovery
- import
- schema inference
- database construction
It returns ImportPipelineResult containing:
- discoveries
- imports
- schema
- databases
This allows inspection of intermediate stages while providing a simple installation API:
engine.install(result.databases)

Database construction:
- DatabaseBuilder constructs immutable relational objects
- DatabaseSchema defines structure
- ImportResults provide row data
- Construction is independent of SQL dialect

Execution (Mutation):
Statement -> SemanticAnalyzer (binding/validation) -> Action[] -> applied to tx.databases
- Semantic binding resolves schema references and compiles expressions/predicates into executable evaluators

Execution (Query):
Statement -> SemanticAnalyzer (binding) -> QueryPlan -> evaluated against tx.databases -> Result
- QueryPlan is a tree of pure PlanNodes evaluated over RowViews
- QueryPlans are fully schema-bound before execution
- PlanNodes are pure evaluators over RowViews
- QueryPlans are fully schema-bound before execution

Actions:
- Pure immutable transforms: Databases -> Databases
- Applied sequentially against transactional state

Referential actions:
- FK constraints reference parent and reverse indexes
- Reverse indexes accelerate parent->child propagation
- Supported actions: RESTRICT, CASCADE, SET NULL, NO ACTION
- Referential propagation executes recursively against immutable Database snapshots
- Propagation re-evaluates references dynamically to avoid stale traversal state

Predicates:
- Represented as immutable predicate ASTs
- May be resolved against schema metadata and compiled into executable predicates
- Evaluated against RowViews during execution
- Used by query filtering, mutations, and CHECK constraints
- Types:
  - Comparison (eq, ne, gt, etc.)
  - Logical (and, or, xor, not)

Builder Layer (DSL):
- Fluent API builds Statements, not Actions or Plans
- Enforced via:
  - getNextCalls() (allowed transitions)
  - InputBatch (runtime validation)
- Separation:
  - StatementBuilder -> produces Statement
  - Fragment builders (e.g., WhereBuilder) -> produce clause parts
- DSL expression builders produce AST nodes
- Predicates are composable independently of statement builders

Validation:
- Structural (immediate): PK, UNIQUE, FK, CHECK, and column validation
- Domain (deferred):
  - Explicit validation phase before export
  - Registry/business-specific rules expressed independently of import

Invariants:
- Tables are immutable
- Actions, QueryPlans, and predicates are pure and deterministic
- Query execution never mutates committed state
- PK/UNIQUE enforced through indexes
- FK requires exact column match (order-sensitive)
- FK validation bypasses rows containing NULL FK components
- Identifiers compare case-insensitively while preserving original casing
- No orphaned references
- Indexes operate on projected RowView values using schema-bound column indexes
- Referential propagation must converge deterministically
- Referential propagation operates against latest immutable state snapshots
- CHECK constraints must hold for all stored rows
- Schema mutations must not invalidate existing CHECK constraints

Schema references:
- User-facing statements reference schema objects by name
- Runtime relationships are maintained through stable identifiers

Key boundary:
Mapping = external data -> relational representation
Engine = relational correctness
Validation = business correctness