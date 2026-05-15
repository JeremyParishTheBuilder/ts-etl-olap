import { type PlanNode } from "./PlanNode.js";
import { type RowView } from "../../schema/RowView.js";
import { type Table } from "../../schema/Table.js";

export class TableScanNode implements PlanNode {
  constructor(
    public table: Table,
  ) {}

  public *execute(): IterableIterator<RowView> {
    yield* this.table.iterateAliveRows();
  }
}