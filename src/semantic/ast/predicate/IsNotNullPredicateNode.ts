import type { ExpressionNode, ResolvedExpressionNode } from "../expression/ExpressionNode.js";

export class IsNotNullPredicateNode {
  readonly kind = "is_not_null" as const;

  constructor(public inner: ExpressionNode) {}
}

export class ResolvedIsNotNullPredicateNode {
  readonly kind = "is_not_null" as const;

  constructor(public inner: ResolvedExpressionNode) {}
}
