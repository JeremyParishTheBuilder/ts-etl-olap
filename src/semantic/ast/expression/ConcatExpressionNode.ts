import {
  type ExpressionNode,
  ExpressionNodeBase,
} from "../../../evaluation/expression/Expression.js";

export class ConcatExpressionNode extends ExpressionNodeBase {
  readonly kind = "concat" as const;

  constructor(public readonly expressions: ExpressionNode[]) {
    super();
  }
}
