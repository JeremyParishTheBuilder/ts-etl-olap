import type { SqlType } from "../../types/SqlType.js";
import type { ExpressionNode, ResolvedExpressionNode } from "./ExpressionNode.js";
import { ExpressionNodeBase } from "./ExpressionNodeBase.js";

export class ResolvedCastExpressionNode {
  readonly kind = "cast" as const;

  constructor(
    public readonly expr: ResolvedExpressionNode,
    public readonly type: SqlType,
  ) {}
}

export class CastExpressionNode extends ExpressionNodeBase {
  readonly kind = "cast" as const;

  constructor(
    public readonly expr: ExpressionNode,
    public readonly type: SqlType,
  ) {
    super();
  }
}