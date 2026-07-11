import { type ColumnValue } from "../../types/ColumnValue.js";
import { type Expression } from "./Expression.js";
import { assertIsNumber } from "../utility/assertIsNumber.js";

export class BinaryExpression<TContext> implements Expression<TContext> {
  constructor(
    public readonly left: Expression<TContext>,
    public readonly operator:
      | "add"
      | "subtract"
      | "multiply"
      | "divide"
      | "mod",
    public readonly right: Expression<TContext>,
  ) {}

  evaluate(context: TContext): ColumnValue {
    const leftResult = this.left.evaluate(context);
    const rightResult = this.right.evaluate(context);

    if (leftResult === null || rightResult === null) {
      return false;
    }

    switch (this.operator) {
      case "add":
      case "subtract":
      case "multiply":
      case "divide":
      case "mod":
        assertIsNumber(leftResult);
        assertIsNumber(rightResult);

        switch (this.operator) {
          case "add": return leftResult + rightResult;
          case "subtract": return leftResult - rightResult;
          case "multiply": return leftResult * rightResult;
          case "divide": return leftResult / rightResult;
          case "mod": return leftResult % rightResult;
        }

    default:
      const _exhaustive: never = this.operator;
      throw new Error(`Unsupported operator: ${_exhaustive}`);
    }
  }
}