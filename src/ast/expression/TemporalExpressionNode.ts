import type { TemporalExpressionKind } from "../../evaluation/expression/TemporalExpression.js";
import { ExpressionNode } from "./ExpressionNode.js";

export class TemporalExpressionNode extends ExpressionNode {
  readonly kind = "temporal" as const;

  constructor(public readonly expression: TemporalExpressionKind) {
    super();
  }
}
