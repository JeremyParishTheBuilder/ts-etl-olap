import type { ColumnValue } from "../../../types/ColumnValue.js";
import { asExpressionNode } from "./asExpressionNode.js";
import { type ExpressionNode } from "./ExpressionNode.js";
import { ExpressionNodeBase } from "./ExpressionNodeBase.js";

export class ConcatExpressionNode extends ExpressionNodeBase {
  readonly kind = "concat" as const;
  public readonly expressions: ExpressionNode[];

  constructor(expressions: (ExpressionNode | ColumnValue)[]) {
    super();
    this.expressions = expressions.map((expr) => asExpressionNode(expr));
  }
}
