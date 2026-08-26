import { ExpressionNode } from "./ExpressionNode.js";

export class CurrentValueExpressionNode extends ExpressionNode {
  readonly kind = "current" as const;

  constructor() {
    super();
  }
}
