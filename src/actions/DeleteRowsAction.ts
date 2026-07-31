import { type Action } from "./Action.js";
import { type Databases } from "../relational/Databases.js";
import { type RowView } from "../relational/RowView.js";
import { type Predicate } from "../evaluation/predicate/Predicate.js";
import { FilterNode } from "../evaluation/plan/FilterNode.js";
import { TableScanNode } from "../evaluation/plan/TableScanNode.js";
import { type PlanNode } from "../evaluation/plan/PlanNode.js";
import { type ResolvedDelete } from "../types/ResolvedDelete.js";

export class DeleteRowsAction implements Action {
  constructor(
    private dbName: string,
    private tableName: string,
    private predicate?: Predicate,
  ) {}

  apply(databases: Databases) {
    const db = databases.requireByName(this.dbName);

    const table = db.tables.requireByName(this.tableName);

    let node: PlanNode = new TableScanNode(table);

    if (this.predicate) {
      node = new FilterNode(this.predicate, node);
    }

    //finds rows
    const affectedRows: RowView[] = [...node.execute()];

    const deletedRows: ResolvedDelete[] = affectedRows.map((row) => ({
      tableId: table.id,
      rowNum: row.index,
      oldRow: [...row.values],
    }));

    // performs bulk update
    const updatedDatabase = db.removeRows(this.tableName, deletedRows);

    return databases.update(updatedDatabase);
  }
}
