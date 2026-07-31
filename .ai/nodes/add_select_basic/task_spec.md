TASK_ID
add_select_basic

ROLE
Worker

OBJECTIVE
Implement basic SELECT … FROM query support that returns all rows
from a single table, with optional column projection, and no filtering.

----------------------------------------------------------------

IN SCOPE

FEATURE BEHAVIOR
- Support:
  - SELECT * FROM <table>
  - SELECT <column_list> FROM <table>
- Return rows in storage order
- Column order must match SELECT clause order
- All semantic validation must occur before execution

DIRECTORIES (ALLOWED)
- statements/
- semantic/
- engine/
- types/

DIRECTORIES (FORBIDDEN)
- actions/
- dialect/
- input/
- transaction-related code
- schema mutation logic

----------------------------------------------------------------

OUT OF SCOPE (NON-GOALS)

- WHERE clauses
- JOINs
- ORDER BY
- GROUP BY / aggregation
- LIMIT / OFFSET
- Index usage or optimization
- Dialect-specific SELECT syntax
- Schema changes

----------------------------------------------------------------

SEMANTIC REQUIREMENTS

- Unknown table → semantic error
- Unknown column → semantic error
- Duplicate column names in projection must be handled explicitly
- SELECT * must expand columns using schema metadata
- Semantic output must be a fully validated internal instruction
  suitable for direct execution

----------------------------------------------------------------

EXECUTION REQUIREMENTS

- Execution must:
  - operate only on semantic instructions
  - not re-validate syntax or names
  - not mutate schema or storage
- Table scan must be explicit and deterministic

----------------------------------------------------------------

TESTING REQUIREMENTS

The worker MUST add tests covering:

1. SELECT * FROM <table>
2. SELECT <subset_of_columns> FROM <table>
3. Error on unknown table
4. Error on unknown column
5. Column order preservation

Tests must:
- be deterministic
- assert both data and column metadata
- fail clearly on semantic vs execution errors
- Worker must add tests under tests/
- Tests must run via `npm test`

----------------------------------------------------------------

OUTPUT REQUIREMENTS

- Return ONLY a unified diff
- No explanations or commentary
- Do not rewrite entire files unless strictly necessary
- Changes must be minimal and scoped

----------------------------------------------------------------

TERMINATION CONDITIONS

The task is complete when:
- Code compiles
- All tests pass
- No changes outside allowed directories
- Behavior matches all requirements above

Stop immediately after producing code and tests.
