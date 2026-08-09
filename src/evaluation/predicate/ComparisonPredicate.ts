import { type Predicate } from "./Predicate.js";
import { assertComparable } from "../utility/assertTypesComparable.js";
import { type Expression } from "../expression/Expression.js";
import { type ComparisonOperator } from "../../ast/predicate/ComparisonPredicateNode.js";

export class ComparisonPredicate<TContext> implements Predicate<TContext> {
  constructor(
    public left: Expression<TContext>,
    public operator: ComparisonOperator,
    public right: Expression<TContext>,
  ) {}

  evaluate(context: TContext): boolean {
    const leftResult = this.left.evaluate(context);
    const rightResult = this.right.evaluate(context);

    if (leftResult === null || rightResult === null) {
      return false;
    }

    switch (this.operator) {
      case "eq":
        return leftResult === rightResult;

      case "ne":
        return leftResult !== rightResult;

      case "gt":
        assertComparable(leftResult, rightResult);
        return leftResult > rightResult;

      case "lt":
        assertComparable(leftResult, rightResult);
        return leftResult < rightResult;

      case "gte":
        assertComparable(leftResult, rightResult);
        return leftResult >= rightResult;

      case "lte":
        assertComparable(leftResult, rightResult);
        return leftResult <= rightResult;

      default:
        throw new Error(`Unsupported operator: ${this.operator}`);
    }
  }
}
