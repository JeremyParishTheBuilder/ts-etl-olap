import { type ExecutionContext } from "../engine/ExecutionContext.js";
import { type Statement } from "../statements/index.js";

import { type BindResult } from "../engine/BindResult.js";
import { bindCreateDatabase } from "./createDatabase.js";
import { bindCreateTable } from "./createTable.js";
import { bindInsertInto } from "./insertInto.js";
import { bindSelect } from "./select.js";
import { bindAlterTable } from "./alterTable.js";
import { bindUpdateSet } from "./updateSet.js";
import { bindDeleteFrom } from "./deleteFrom.js";

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

      case "update_set":
        return { kind: "actions", actions: bindUpdateSet(this, stmt) };

      case "delete_from":
        return { kind: "actions", actions: bindDeleteFrom(this, stmt) };

      case "select":
        return { kind: "query", plan: bindSelect(this, stmt) };

      default:
        throw new Error(`Unsupported statement`);
    }
  }
}
