import type { ColumnValue } from "../../types/ColumnValue.js";
import { asExpressionNode } from "../expression/asExpressionNode.js";
import type {
  ExpressionNode,
  ResolvedExpressionNode,
} from "../expression/ExpressionNode.js";

export class IsNullPredicateNode {
  readonly kind = "is_null" as const;

  public readonly inner: ExpressionNode;

  constructor(inner: ExpressionNode | ColumnValue) {
    this.inner = asExpressionNode(inner);
  }
}

export class ResolvedIsNullPredicateNode {
  readonly kind = "is_null" as const;

  constructor(public inner: ResolvedExpressionNode) {}
}
