import { type Predicate } from "./Predicate.js";
import { type RowView } from "../../schema/RowView.js";
import { type ComparisonOperator } from "../../statements/WhereClause.js";
import { assertComparable } from "../utility/assertTypesComparable.js";
import {
  type ResolvedExpressionNode,
  type Expression,
  type ExpressionNode
} from "../expression/Expression.js";

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

export class ComparisonPredicate implements Predicate {
  constructor(
    public left: Expression,
    public operator: ComparisonOperator,
    public right: Expression,
  ) {}

  evaluate(row: RowView): boolean {
    const leftResult = this.left.evaluate(row);
    const rightResult = this.right.evaluate(row);

    if (leftResult === null || rightResult === null) {
      return false;
    }

    switch (this.operator) {
      case "eq":
        return leftResult === rightResult;

      case "ne":
        return leftResult !== rightResult;

      case "gt":
      case "lt":
      case "gte":
      case "lte":
        assertComparable(leftResult, rightResult);

        switch (this.operator) {
          case "gt": return leftResult > rightResult;
          case "lt": return leftResult < rightResult;
          case "gte": return leftResult >= rightResult;
          case "lte": return leftResult <= rightResult;
        }

        default:
        const _exhaustive: never = this.operator;
        throw new Error(`Unsupported operator: ${_exhaustive}`);
      }

  }
}