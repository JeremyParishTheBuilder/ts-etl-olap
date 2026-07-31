import { type ColumnValue } from "../../../types/ColumnValue.js";
import { ExpressionNodeBase } from "./ExpressionNode.js";

export class LiteralExpressionNode extends ExpressionNodeBase {
  readonly kind = "literal" as const;

  constructor(public readonly value: ColumnValue) {
    super();
  }
}
