import type { ColumnValue } from "../../types/ColumnValue.js";
import { asExpressionNode } from "../expression/asExpressionNode.js";
import {
  type ResolvedExpressionNode,
  type ExpressionNode,
} from "../expression/ExpressionNode.js";

export class ComparisonPredicateNode {
  readonly kind = "comparison" as const;

  public readonly left: ExpressionNode;
  public readonly right: ExpressionNode;

  constructor(
    left: ExpressionNode | ColumnValue,
    public operator: ComparisonOperator,
    right: ExpressionNode | ColumnValue,
  ) {
    this.left = asExpressionNode(left);
    this.right = asExpressionNode(right);
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
