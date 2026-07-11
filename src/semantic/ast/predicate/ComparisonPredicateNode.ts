import {
  type ResolvedExpressionNode,
  type ExpressionNode
} from "../expression/ExpressionNode.js";

export class ComparisonPredicateNode {
  readonly kind = "comparison" as const;

  constructor(
    public left: ExpressionNode,
    public operator: ComparisonOperator,
    public right: ExpressionNode,
  ) {}
}

export class ResolvedComparisonPredicateNode {
  readonly kind = "comparison" as const;

  constructor(
    public left: ResolvedExpressionNode,
    public operator: ComparisonOperator,
    public right: ResolvedExpressionNode,
  ) {}
}

export type ComparisonOperator = "eq" | "ne" | "gt" | "lt" | "gte" | "lte";