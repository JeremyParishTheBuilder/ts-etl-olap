import type { ColumnValue } from "../../types/ColumnValue.js";
import type {
  ExpressionNode,
  ResolvedExpressionNode,
} from "../expression/ExpressionNode.js";

export class IsNullPredicateNode {
  readonly kind = "is_null" as const;

  public readonly inner: ExpressionNode | ColumnValue;

  constructor(inner: ExpressionNode | ColumnValue) {
    this.inner = inner;
  }
}

export class ResolvedIsNullPredicateNode {
  readonly kind = "is_null" as const;

  constructor(public inner: ResolvedExpressionNode) {}
}
