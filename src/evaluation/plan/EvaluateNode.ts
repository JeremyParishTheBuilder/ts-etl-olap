import { type RowView } from "../../relational/RowView.js";
import type { Expression } from "../expression/Expression.js";
import { type PlanNode } from "./PlanNode.js";

export class EvaluateNode implements PlanNode {
  constructor(
    public expressions: Expression<RowView>[],
    public source: PlanNode,
  ) {}

  *execute(): IterableIterator<RowView> {
    for (const row of this.source.execute()) {
      yield {
        index: row.index,
        values: this.expressions.map((expression) =>
          expression.evaluate(row)),
      };
    }
  }
}
