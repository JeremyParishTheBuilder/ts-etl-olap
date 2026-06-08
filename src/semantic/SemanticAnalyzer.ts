import { type ExecutionContext } from "../engine/ExecutionContext.js";
import { type Statement } from "../statements/index.js";

import { bindCreateDatabase } from "./createDatabase.js";
import { bindCreateTable } from "./createTable.js";
import { bindInsertInto } from "./insertInto.js";
import { bindSelect } from "./select.js";
import { bindAlterTable } from "./alterTable.js";
import { type BindResult } from "../engine/BindResult.js";

export class SemanticAnalyzer {

  constructor(public readonly ctx: ExecutionContext) {}

  public bindStatement(stmt: Statement): BindResult {
    switch (stmt.kind) {
      case "create_database":
        return { kind: "actions", actions: bindCreateDatabase(this, stmt) };

      case "create_table":
        return { kind: "actions", actions: bindCreateTable(this, stmt) };

      case "alter_table":
        return { kind: "actions", actions: bindAlterTable(this, stmt) };

      case "insert_into":
        return { kind: "actions", actions: bindInsertInto(this, stmt) };

      case "select":
        return { kind: "query", plan: bindSelect(this, stmt) };

      default:
        throw new Error(`Unsupported statement`);
    }
  }
}

// SemanticAnalyzer responsibilities:
//
// - resolve existing schema references when available
//   (databases, tables, columns, constraints)
//
// - validate semantic correctness
//   (statement structure, identifier existence,
//    legal operation forms, dialect rules)
//
// - derive operation intent
//   (insert/update/delete semantics,
//    target mappings, ordered column mappings)
//
// - preserve semantic input states
//   (value/default/null/missing)
//
// - produce executable queries/actions
//   (may contain unresolved references to
//    objects created within the same statement)
//
// Semantic binding does NOT:
//
// - allocate runtime identities
//   (column ids, index ids, foreign key ids)
//
// - resolve references to objects not yet created
//
// - resolve runtime values
//   (defaults, autoIncrement, generated values)
//
// - validate runtime data constraints
//   (NOT NULL, ENUM, CHECK, FK)
//
// - mutate execution state
//
// Runtime execution responsibilities:
//
// - materialize schema objects and allocate ids
//
// - resolve deferred references
//   (name -> id)
//
// - resolve semantic values into concrete runtime values
//
// - validate resolved values against schema constraints
//
// - execute mutations against immutable state