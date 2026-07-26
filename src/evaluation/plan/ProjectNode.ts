import { type RowView } from "../../relational/RowView.js";
import { type PlanNode } from "./PlanNode.js";

export class ProjectNode implements PlanNode {
  constructor(
    public columnIndexes: number[],
    public source: PlanNode
  ) {}

  *execute(): IterableIterator<RowView> {
    for (const row of this.source.execute()) {
      yield {
        index: row.index,
        values: this.columnIndexes.map(i => row.values[i])
      };
    }
  }
}