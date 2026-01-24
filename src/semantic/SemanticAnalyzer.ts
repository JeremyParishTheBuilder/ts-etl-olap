import { DatabaseContainer } from "../types/DatabaseContainer.js";
import { Database } from "../types/Database.js";
import { EngineContext } from "../engine/EngineContext.js";
import {
  type Statement,
  type CreateTableStatement,
} from "../statements/index.js";
import { type Action } from "../actions/Action.js";

import { createTableHandler } from "./createTable.js";
//import { insertHandler } from "./insert";

// planner does:
// - validate syntax
// - validate semantic intent against the planner schema
// - produce corresponding Actions
export class SemanticAnalyzer {

  constructor(public readonly ctx: EngineContext) {}

  public bindStatement(stmt: Statement): Action[] {
    switch (stmt.kind) {
      // case "begin":
      //   return this.begin();
      // case "commit":
      //   return this.commit();
      // case "create_database":
      //   return this.createDatabase(stmt);
      // case "use_database":
      //   return this.useDatabase(stmt);
      case "create_table":
        return this.createTable(stmt);
      //case AlterTableStatement:
      // case InsertIntoStatement:
      //   const semanticInsert = convertInsert(stmt, planner);
      //   actions.push(new InsertRowAction(stmt.table, semanticInsert));
      //   break;
      // ...
      default:
        throw new Error(`Unsupported statement`);
    }
  }

  private createTable(stmt: CreateTableStatement) {
    return createTableHandler(this, stmt);
  }

  // private insert(stmt: InsertIntoStatement) {
  //   return insertHandler(this, stmt);
  // }

}