import { type Action } from "./Action.js";
import { type Databases } from "../schema/Databases.js";
import { type ColumnId } from "../schema/Column.js";
import { type Expression } from "../evaluation/expression/Expression.js";
import { type RowView } from "../schema/RowView.js";
import { type Predicate } from "../evaluation/predicate/Predicate.js";
import { FilterNode } from "../evaluation/plan/FilterNode.js";
import { TableScanNode } from "../evaluation/plan/TableScanNode.js";
import { type PlanNode } from "../evaluation/plan/PlanNode.js";
import { ResolvedUpdate } from "../types/ResolvedUpdate.js";

export class UpdateRowsAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private expressions: Map<ColumnId, Expression>,
    private predicate?: Predicate,
  ) {}

  apply(databases: Databases) {
    const db = databases.requireByName(this.dbName);

    const table = db
      .tables.requireByName(this.tableName);
      
    let node: PlanNode = new TableScanNode(table);

    if (this.predicate) {
      node = new FilterNode(
        this.predicate,
        node,
      );
    }

    //finds rows
    const affectedRows: IterableIterator<RowView> = node.execute();

    const updates: ResolvedUpdate[] = [];

    // evaluates expressions
    for (const row of affectedRows) {
      updates.push(
        table.resolveUpdateExpressions(
          this.expressions,
          row.index,
        )
      );
    }

    // performs bulk update
    const updatedDatabase =
      db.updateRows(
        this.tableName,
        updates
      );

    return databases.update(updatedDatabase);
  }
}