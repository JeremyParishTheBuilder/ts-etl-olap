import { type PlanNode } from "./PlanNode.js";
import { type RowView } from "../../relational/RowView.js";
import { type Predicate } from "../predicate/Predicate.js";

export class FilterNode implements PlanNode {
  constructor(
    public predicate: Predicate,
    public source: PlanNode,
  ) {}

  public *execute(): IterableIterator<RowView> {
    for (const row of this.source.execute()) {
      if (this.predicate.evaluate(row)) yield row;
    }
  }
}