import type { ColumnValue } from "../../types/ColumnValue.js";
import { BinaryExpressionNode } from "./BinaryExpressionNode.js";
import type { ExpressionNode } from "./ExpressionNode.js";

// TypeScript requires mixin constructors to use `any[]`.
type ExpressionNodeConstructor = abstract new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => ExpressionNode;

export function BinaryExpressionMixin<TBase extends ExpressionNodeConstructor>(
  Base: TBase,
) {
  abstract class BinaryExpressionMethods extends Base {
    add(expr: ExpressionNode | ColumnValue) {
      return new BinaryExpressionNode(this, "add", expr);
    }

    subtract(expr: ExpressionNode | ColumnValue) {
      return new BinaryExpressionNode(this, "subtract", expr);
    }

    multiply(expr: ExpressionNode | ColumnValue) {
      return new BinaryExpressionNode(this, "multiply", expr);
    }

    divide(expr: ExpressionNode | ColumnValue) {
      return new BinaryExpressionNode(this, "divide", expr);
    }

    mod(expr: ExpressionNode | ColumnValue) {
      return new BinaryExpressionNode(this, "mod", expr);
    }
  }

  return BinaryExpressionMethods;
}
