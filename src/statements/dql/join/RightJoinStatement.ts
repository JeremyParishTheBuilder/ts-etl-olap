import type { PredicateNode } from "../../../ast/predicate/PredicateNode.js";
import type { TabularExpressionProjection } from "../../../ast/tabular/TabularExpressionNode.js";

export interface RightJoinStatement {
  kind: "rightJoin";
  left: TabularExpressionProjection;
  right: TabularExpressionProjection;
  on: PredicateNode;
}
