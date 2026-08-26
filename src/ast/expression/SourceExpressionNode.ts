import { ExpressionNode } from "./ExpressionNode.js";

export class SourceExpressionNode extends ExpressionNode {
  readonly kind = "source" as const;

  constructor() {
    super();
  }
}
