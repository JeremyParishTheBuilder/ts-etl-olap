import type { ColumnValue } from "../../../types/ColumnValue.js";
import { asExpressionNode } from "./asExpressionNode.js";
import {
  type ExpressionNode,
  type ResolvedExpressionNode,
} from "./ExpressionNode.js";
import { ExpressionNodeBase } from "./ExpressionNodeBase.js";

export class BinaryExpressionNode extends ExpressionNodeBase {
  readonly kind = "binary" as const;

  public readonly left: ExpressionNode;
  public readonly right: ExpressionNode;

  constructor(
    left: ExpressionNode | ColumnValue,
    public readonly operator:
      "add" | "subtract" | "multiply" | "divide" | "mod",
    right: ExpressionNode | ColumnValue,
  ) {
    super();
    this.left = asExpressionNode(left);
    this.right = asExpressionNode(right);
  }
}

export class ResolvedBinaryExpressionNode {
  readonly kind = "binary" as const;

  constructor(
    public readonly left: ResolvedExpressionNode,
    public readonly operator:
      "add" | "subtract" | "multiply" | "divide" | "mod",
    public readonly right: ResolvedExpressionNode,
  ) {}
}
