# Semantic Module Overview

## Purpose

The Semantic module transforms AST statements into schema-aware, executable representations.

AST
 ↓
Semantic Analysis
 ↓
Actions / Query Plans
 ↓
Execution

Semantic analysis resolves names, validates statement meaning, applies dialect rules, and binds AST nodes to executable runtime objects.

It does not own AST definitions, relational storage, or execution.

## Responsibilities

The Semantic module owns:

Resolving database, table, and column references
Validating AST constructs against relational schema
Applying dialect-specific input rules
Resolving keywords and special expressions
Converting AST nodes into resolved nodes
Binding resolved nodes to executable expressions and predicates
Converting statements into Actions or query plans

## Policy Resolution

Semantic analysis resolves the active engine policy through the execution context.

Policies may originate from:

- engine configuration
- dialect defaults
- dialect-specific strict rules

The resolved policy is supplied to relational construction actions when creating tables or columns.

Column and table policies are therefore determined during semantic analysis rather than inferred independently by the Relational module.

For example:

- `ColumnPolicy` controls auto-increment behavior for a newly created column.
- `TablePolicy` controls table-level creation rules such as whether multiple auto-increment columns are permitted.

Once supplied to relational construction, the policy becomes part of the created relational object's behavior.

## AST Resolution

AST nodes describe user intent and may contain unresolved names.

Semantic resolution uses the current relational context to resolve schema references and verify that referenced objects exist.

The general progression is:

AST node
   ↓
Resolved AST node
   ↓
Bound runtime object

For example, a column reference progresses from a column name to a ColumnId, then to the runtime information required for evaluation.

Resolution is schema-dependent; AST construction is not.

## Expression Resolution and Binding

resolveExpression() converts an ExpressionNode into a ResolvedExpressionNode.

Resolution recursively processes nested expressions and resolves schema-dependent references.

Expression forms include:

Column references
Binary expressions
CASE
Concatenation
Temporal expressions
SQL functions
Default values

bindExpression() converts resolved nodes into executable Expression objects.

For example:

ResolvedColumnExpressionNode
        ↓
ColumnExpression
        ↓
Column position

Binding incorporates runtime information needed for efficient evaluation.

## Predicates

Predicates follow the same resolution and binding model as expressions.

Column references are resolved against the relevant table, and nested expressions and predicates are processed recursively.

Binding produces executable Predicate objects used by query and mutation execution.

## SELECT Binding

`bindSelect()` converts a `SelectStatement` into a `QueryPlan`.

SELECT items contain expressions rather than being limited to physical column
references. Each expression is resolved against the source table and then
bound to an executable `Expression<RowView>`.

The general flow is:

SELECT expressions
    ↓
Resolve expressions
    ↓
Bind expressions
    ↓
EvaluateNode
    ↓
QueryPlan

`*` is expanded into SELECT items representing all source-table columns.

The resulting `QueryPlan` also contains `QueryColumn` metadata for each result
column. Metadata includes:

- result name
- SQL type
- nullability

Result metadata is derived from the resolved expressions. A direct column
expression can inherit metadata from its source column, while expressions such
as literals, CAST, CASE, and computed expressions derive metadata from their
expression semantics.

SELECT aliases take precedence over names derived from expressions. Expressions
without a suitable name receive a generated result-column name.

Semantic binding does not execute the query. The resulting `QueryPlan` is
evaluated later against the relational state.

## Keywords and Special Expressions

Input keywords are represented separately from ordinary expression values.

Current categories include:

Keyword
TemporalExpressionKeyword
SqlFunctionKeyword

Examples include:

DEFAULT
CURRENT_TIMESTAMP
CURRENT_DATE
CURRENT_TIME
NOW
GETDATE

Dialect rules determine which keywords and special expressions are permitted.

Keyword values are converted into AST representations and subsequently resolved or bound according to their semantics.

## DEFAULT

DEFAULT is represented by DefaultValueNode rather than as an ordinary expression.

Semantic analysis validates whether DEFAULT is legal in the relevant statement and column context.

The Semantic module determines whether the operation is permitted; Column remains responsible for resolving the actual column default and auto-increment behavior.

This distinguishes:

Explicit DEFAULT
An omitted insert value
Column-specific default resolution

## INSERT

INSERT supports both VALUES and query-based input.

INSERT ... VALUES

INSERT ... VALUES may contain expressions, but insert expressions cannot reference existing row values.

Semantic analysis therefore validates that insert expressions do not require a RowView.

The general flow is:

Insert input

↓

AST expression

↓

Semantic validation

↓

Resolve / bind

↓

Column input

↓

Execution

DEFAULT is handled separately because its final value depends on the target column.

Insert input is ultimately ordered by column before relational insertion.

INSERT ... SELECT

INSERT ... SELECT uses a bound QueryPlan as its row source.

The SELECT is semantically bound but is not executed during semantic analysis.

The general flow is:

INSERT ... SELECT

↓

Bind source SELECT

↓

QueryPlan + target column metadata

↓

InsertSelectAction

↓

Query execution

↓

Relational insertion

Semantic analysis validates that the query produces the required number of output columns and that their types are compatible with the target columns.

The query result is mapped positionally to the resolved target ColumnIds. The resulting rows are then passed through the normal relational addRows() path.

This keeps query execution and relational insertion separate from semantic analysis while allowing INSERT ... SELECT to reuse the existing query-plan execution path.

## UPDATE

UPDATE expressions may reference existing columns because they are evaluated against affected RowViews.

The general flow is:

Update assignment
    ↓
AST expression
    ↓
Resolve
    ↓
Bind
    ↓
Expression<RowView>
    ↓
Execution

DEFAULT is represented separately and ultimately resolved by the target column.

Temporal expressions and SQL functions become executable expressions and are evaluated when the update executes.

## Statement Binding

SemanticAnalyzer dispatches statements to statement-specific binders.

Examples include:

bindInsertInto()
bindInsertValues()
bindInsertSelect()
bindUpdateSet()
bindSelect()
Delete binders
Schema-related binders

The general flow is:

Statement
   ↓
Semantic validation
   ↓
Resolution / binding
   ↓
Action or QueryPlan

For INSERT ... SELECT, statement binding composes the two execution models: bindSelect() produces the source QueryPlan, while the INSERT binder validates its output against the target columns and produces an InsertSelectAction containing that plan.

Semantic analysis prepares an operation but does not execute it.

Statement binders also resolve the applicable engine policy when producing schema-modification actions.

## Dialect Rules

Dialect-sensitive behavior is controlled through the active dialect rules.

Input rules include categories such as:

input: {
  keywords?: ReadonlySet<Keyword>;
  temporalExpressions?: ReadonlySet<TemporalExpressionKeyword>;
  functions?: ReadonlySet<SqlFunctionKeyword>;
}

Other dialect rules may govern semantic legality, including statement and column-input behavior.

Semantic analysis obtains these rules through the engine's dialect configuration rather than hard-coding dialect-specific behavior.

The same AST representation can therefore be interpreted according to the active dialect.

## Semantic vs Relational Validation

Semantic validation determines whether a requested operation is meaningful and executable.

Examples include:

Referenced database, table, or column does not exist
Unsupported dialect keyword
Invalid statement structure
Column reference used where a row context is unavailable
Explicit input prohibited by a dialect rule

The Relational module remains responsible for relational-state invariants such as:

Primary keys
Unique constraints
Foreign keys
Check constraints
Row validity
Index consistency

Semantic analysis determines whether statement input is permitted by the active policy.

The Relational module enforces the resulting object-level policy when constructing or mutating relational objects.

Semantic analysis validates statement input against the target column's stored policy.

For auto-increment columns, this includes whether explicit values and explicit `DEFAULT` are permitted.

## Semantic vs Execution

The primary boundary is:

Semantic
   ↓
Action / QueryPlan
   ↓
Execution

Semantic analysis may resolve names, validate inputs, bind executable expressions, and construct query plans, but it does not mutate relational state or execute query plans over relational rows.

Execution consumes the representations produced by Semantic.

## Module Boundaries

Semantic sits between statement representation and execution:

AST
 ↓
Semantic
 ↓
Actions / QueryPlans
 ↓
Execution
 ↓
Relational

Semantic consumes:

AST nodes
Relational schema information
Dialect rules

Semantic produces:

Resolved AST nodes
Executable expressions and predicates
Actions
Query plans

Semantic does not own:

AST node definitions
Relational tables or persistent rows
Relational mutation algorithms
Action or query-plan execution
Mapping-specific expression contexts

Its role is the translation boundary between statement structure and executable relational operations.