import {
  type ExpressionNode,
  ExpressionNodeBase,
  type ResolvedExpressionNode,
} from "./ExpressionNode.js";

export class BinaryExpressionNode extends ExpressionNodeBase {
  readonly kind = "binary" as const;

  constructor(
    public readonly left: ExpressionNode,
    public readonly operator:
      "add" | "subtract" | "multiply" | "divide" | "mod",
    public readonly right: ExpressionNode,
  ) {
    super();
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
