# Current Focus

## Stable

Relational Engine:
* Database/Table/Column schema lifecycle implemented and tested
* PK, UNIQUE, FK, and index lifecycle behavior implemented and tested
* Immediate relational constraint enforcement stabilized
* Recursive referential actions implemented and validated:
  * RESTRICT
  * CASCADE
  * SET NULL
  * NO ACTION
* Recursive propagation supports cycles and self-references
* QueryPlan execution and predicate evaluation stabilized
* RowView-based execution model stabilized
* Stable schema identifiers (TableId, ColumnId, IndexId, FKId, etc.) introduced throughout the schema layer
* UNIQUE constraints separated from unique indexes and backed by explicit Unique schema objects
* Expression system implemented:
  * literals
  * column references
  * binary expressions
  * CASE expressions
* Predicate DSL implemented:
  * comparison predicates
  * logical predicates
* Semantic binding implemented for:
  * SELECT
  * UPDATE
  * DELETE
* Bulk mutation execution implemented:
  * INSERT
  * UPDATE
  * DELETE
* Referential propagation supports both update and delete operations
* Runtime execution operates on schema-bound column indexes rather than names
* CHECK constraint lifecycle implemented and tested
* CHECK validation integrated into INSERT, UPDATE, and schema evolution

Mapping Layer:
* Declarative filesystem discovery implemented
* ScopeNode / CollectionNode traversal model implemented
* Scoped capture propagation implemented through DiscoveryContext
* Discovery produces typed DiscoveryResults
* File import pipeline implemented
* Automatic property import
* Derived fields implemented
* Nested import mappings implemented
* ImportResult retains discovery metadata and scoped captures
* Automatic schema inference implemented
* DatabaseSchema / TableSchema / ColumnSchema generation implemented
* ImportSourceResolver and ValueResolver responsibilities separated

## Active Work

1. Database Builder
Construct immutable relational objects from:
- DatabaseSchema
- ImportResults

Focus areas:
- DatabaseBuilder
- Table construction
- Column construction
- Row creation
- Type conversion
- Efficient bulk loading
- Builder independence from SQL dialects

2. Validation Layer
Build explicit registry validation rules independently of import.
Examples:
- NOT NULL
- CHECK
- Foreign-key creation
- Cross-table consistency
- Registry-specific business rules

3. End-to-End Workflow Validation
- Import → mutate → validate → export
- Round-trip fidelity testing
- Referential integrity across imported data
- Export determinism
- Large-registry integration testing

## Recent Architectural Decisions

- Discovery and import are separate execution phases.
- Discovery produces immutable DiscoveryResults.
- Import produces immutable ImportResults.
- Schema inference is independent of database construction.
- Database construction is independent of SQL dialects.
- Import mappings automatically import matching properties by default.
- Nested import mappings consume portions of imported objects while avoiding duplicate parent storage.
- Scoped captures propagate independently from imported values.
- ImportSourceResolver resolves collections of imported objects.
- ValueResolver computes individual derived values.
- Relationships and constraints are intentionally defined by the validation layer rather than inferred automatically.
- Cross-table invariants remain Database responsibilities.
- Table-local invariants remain Table responsibilities.
- Runtime execution operates on schema-bound column indexes rather than names.
- Expressions are represented as AST nodes and bound into executable evaluators during semantic analysis.
- Predicate DSL remains independent of statement builders.
- Foreign keys reference indexes rather than storing column positions directly.
- Referential propagation dynamically re-evaluates references against current immutable state.
- Stable schema identifiers eliminate rename propagation throughout the runtime.

## Open Questions

- Representation of repeated primitive values (arrays vs flattened columns)
- Automatic discovery of import mappings vs explicitly declared mappings
- Builder APIs for constructing immutable relational objects efficiently
- Bulk-loading strategy for very large registries

## Deferred

* JOIN support
* ORDER BY / GROUP BY
* Aggregation
* Query optimization
