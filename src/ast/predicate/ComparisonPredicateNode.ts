import type { ColumnValue } from "../../types/ColumnValue.js";
import {
  type ExpressionNode,
  type ResolvedExpressionNode,
} from "../expression/ExpressionNode.js";

export class ComparisonPredicateNode {
  readonly kind = "comparison" as const;

  public readonly left: ExpressionNode;
  public readonly right: ExpressionNode | ColumnValue;

  constructor(
    left: ExpressionNode,
    public operator: ComparisonOperator,
    right: ExpressionNode | ColumnValue,
  ) {
    this.left = left;
    this.right = right;
  }
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
