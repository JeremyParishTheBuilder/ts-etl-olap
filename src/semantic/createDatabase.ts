import { type Action } from "../actions/Action.js";
import { CreateDatabaseAction } from "../actions/CreateDatabaseAction.js";
import { type CreateDatabaseStatement } from "../statements/index.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";

export function bindCreateDatabase(
  semantic: SemanticAnalyzer,
  stmt: CreateDatabaseStatement
) {
  const stmtActions: Action[] = [];
  const dbName: string = stmt.dbName;

  if (semantic.ctx.getDatabase(dbName)) {
    throw new Error(`Database ${dbName} already exists.`);
  }

  stmtActions.push(new CreateDatabaseAction(dbName));

  return stmtActions;
}