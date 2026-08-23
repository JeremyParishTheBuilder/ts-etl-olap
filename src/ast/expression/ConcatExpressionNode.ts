import type { ColumnValue } from "../../types/ColumnValue.js";
import {
  ExpressionNode,
  type ResolvedExpressionNode,
} from "./ExpressionNode.js";

export class ConcatExpressionNode extends ExpressionNode {
  readonly kind = "concat" as const;
  public readonly expressions: (ExpressionNode | ColumnValue)[];

  constructor(expressions: (ExpressionNode | ColumnValue)[]) {
    super();
    this.expressions = expressions;
  }
}

export class ResolvedConcatExpressionNode {
  readonly kind = "concat" as const;

  constructor(public readonly expressions: ResolvedExpressionNode[]) {}
}
