import { type Action } from "../actions/Action.js";
import { DeleteRowsAction } from "../actions/DeleteRowsAction.js";
import { type DeleteFromStatement } from "../statements/index.js";
import { type SemanticAnalyzer } from "./SemanticAnalyzer.js";
import { bindPredicate, resolvePredicate } from "./predicate.js";
import { relationBindingFromTable } from "./relation/RelationBinding.js";
import { RelationScope } from "./relation/RelationScope.js";

export function bindDeleteFrom(
  semantic: SemanticAnalyzer,
  stmt: DeleteFromStatement,
) {
  const stmtActions: Action[] = [];

  const database = semantic.ctx.requireDatabase();
  const dbName = database.name;

  const tableName: string = stmt.table;
  const table = database.tables.requireByName(tableName);

  const scope = new RelationScope([relationBindingFromTable(table)]);

  const whereClause = stmt.where
    ? bindPredicate(resolvePredicate(stmt.where, scope), scope)
    : undefined;

  stmtActions.push(new DeleteRowsAction(dbName, tableName, whereClause));

  return stmtActions;
}
