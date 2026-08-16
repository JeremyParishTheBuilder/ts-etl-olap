import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";
import { type ColumnId } from "../relational/Column.js";
import { type RowView } from "../relational/RowView.js";
import { type Predicate } from "../evaluation/predicate/Predicate.js";
import { FilterNode } from "../evaluation/plan/FilterNode.js";
import { TableScanNode } from "../evaluation/plan/TableScanNode.js";
import { type PlanNode } from "../evaluation/plan/PlanNode.js";
import type { UpdateAssignment } from "../types/UpdateAssignment.js";

export class UpdateRowsAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private assignments: Map<ColumnId, UpdateAssignment>,
    private predicate?: Predicate,
  ) {}

  apply(databases: Databases) {
    const db = databases.requireByName(this.dbName);

    const table = db.tables.requireByName(this.tableName);

    let node: PlanNode = new TableScanNode(table);

    if (this.predicate) {
      node = new FilterNode(this.predicate, node);
    }

    const affectedRows: IterableIterator<RowView> = node.execute();

    const updatedDatabase = db.resolveAndUpdateRows(
      this.tableName,
      affectedRows,
      this.assignments,
    );

    return databases.update(updatedDatabase);
  }
}
