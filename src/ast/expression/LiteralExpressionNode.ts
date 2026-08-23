import { type ColumnValue } from "../../types/ColumnValue.js";
import { BinaryExpressionMixin } from "./BinaryExpressionMixin.js";
import { ExpressionNode } from "./ExpressionNode.js";

export class LiteralExpressionNode extends BinaryExpressionMixin(
  ExpressionNode,
) {
  readonly kind = "literal" as const;

  constructor(public readonly value: ColumnValue) {
    super();
  }
}
