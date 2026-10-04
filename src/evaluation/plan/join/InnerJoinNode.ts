import type { RowView } from "../../../relational/RowView.js";
import type { Predicate } from "../../predicate/Predicate.js";
import type { PlanNode } from "../PlanNode.js";

export class InnerJoinPlanNode implements PlanNode {
  constructor(
    public left: PlanNode,
    public right: PlanNode,
    public predicate: Predicate,
  ) {}

  public *execute(): IterableIterator<RowView> {
    yield* innerJoin(this.left.execute(), this.right.execute(), this.predicate);
  }
}

function* innerJoin(
  left: IterableIterator<RowView>,
  right: IterableIterator<RowView>,
  predicate: Predicate,
): IterableIterator<RowView> {
  let index = 0;
  const rightRows = [...right];

  for (const leftRow of left) {
    for (const rightRow of rightRows) {
      const values = [...leftRow.values, ...rightRow.values];

      if (predicate.evaluate({ index, values })) {
        yield {
          index: index++,
          values,
        };
      }
    }
  }
}
