import type { ColumnValue } from "../../types/ColumnValue.js";
import type {
  ExpressionNode,
  ResolvedExpressionNode,
} from "../expression/ExpressionNode.js";

export class IsNotNullPredicateNode {
  readonly kind = "is_not_null" as const;

  public readonly inner: ExpressionNode | ColumnValue;

  constructor(inner: ExpressionNode | ColumnValue) {
    this.inner = inner;
  }
}

export class ResolvedIsNotNullPredicateNode {
  readonly kind = "is_not_null" as const;

  constructor(public inner: ResolvedExpressionNode) {}
}
