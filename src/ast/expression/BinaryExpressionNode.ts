import type { ColumnValue } from "../../types/ColumnValue.js";
import {
  ExpressionNode,
  type ResolvedExpressionNode,
} from "./ExpressionNode.js";
import { BinaryExpressionMixin } from "./BinaryExpressionMixin.js";

export class BinaryExpressionNode extends BinaryExpressionMixin(
  ExpressionNode,
) {
  readonly kind = "binary" as const;

  constructor(
    public readonly left: ExpressionNode,
    public readonly operator: BinaryOperator,
    public readonly right: ExpressionNode | ColumnValue,
  ) {
    super();
  }
}

export class ResolvedBinaryExpressionNode {
  readonly kind = "binary" as const;

  constructor(
    public readonly left: ResolvedExpressionNode,
    public readonly operator: BinaryOperator,
    public readonly right: ResolvedExpressionNode,
  ) {}
}

export type BinaryOperator = "add" | "subtract" | "multiply" | "divide" | "mod";
