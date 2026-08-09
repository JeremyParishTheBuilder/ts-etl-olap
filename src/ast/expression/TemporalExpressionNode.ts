import type { TemporalExpressionKind } from "../../evaluation/expression/TemporalExpression.js";
import { ExpressionNodeBase } from "./ExpressionNodeBase.js";

export class TemporalExpressionNode extends ExpressionNodeBase {
  readonly kind = "temporal" as const;

  constructor(public readonly expression: TemporalExpressionKind) {
    super();
  }
}
