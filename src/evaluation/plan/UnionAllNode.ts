import type { RowView } from "../../relational/RowView.js";
import type { PlanNode } from "./PlanNode.js";

export class UnionAllNode implements PlanNode {
  constructor(
    public left: PlanNode,
    public right: PlanNode,
  ) {}

  public *execute(): IterableIterator<RowView> {
    yield* this.left.execute();
    yield* this.right.execute();
  }
}