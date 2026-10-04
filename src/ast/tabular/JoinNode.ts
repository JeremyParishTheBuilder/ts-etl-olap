import type { PredicateNode } from "../predicate/PredicateNode.js";
import {
  TabularExpressionNode,
  type TabularExpressionProjection,
} from "./TabularExpressionNode.js";

export type JoinType = "inner" | "left" | "right" | "full";

export class JoinNode extends TabularExpressionNode {
  readonly kind = "join";

  constructor(
    public readonly type: JoinType,
    public readonly left: TabularExpressionProjection,
    public readonly right: TabularExpressionProjection,
    public readonly on: PredicateNode,
  ) {
    super();
  }
}
