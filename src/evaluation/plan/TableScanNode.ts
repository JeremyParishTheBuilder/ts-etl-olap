import { type PlanNode } from "./PlanNode.js";
import { type RowView } from "../../relational/RowView.js";
import { type Table } from "../../relational/Table.js";

export class TableScanNode implements PlanNode {
  constructor(public table: Table) {}

  public *execute(): IterableIterator<RowView> {
    yield* this.table.iterateAliveRows();
  }
}
