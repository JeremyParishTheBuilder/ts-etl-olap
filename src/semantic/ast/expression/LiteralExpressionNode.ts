import { type ColumnValue } from "../../../types/ColumnValue.js";
import { ExpressionNodeBase } from "./ExpressionNodeBase.js";

export class LiteralExpressionNode extends ExpressionNodeBase {
  readonly kind = "literal" as const;

  constructor(public readonly value: ColumnValue) {
    super();
  }
}
