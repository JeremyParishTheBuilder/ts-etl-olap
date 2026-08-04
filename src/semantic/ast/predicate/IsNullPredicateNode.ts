import type { ExpressionNode, ResolvedExpressionNode } from "../expression/ExpressionNode.js";

export class IsNullPredicateNode {
  readonly kind = "is_null" as const;

  constructor(public inner: ExpressionNode) {}
}

export class ResolvedIsNullPredicateNode {
  readonly kind = "is_null" as const;

  constructor(public inner: ResolvedExpressionNode) {}
}
