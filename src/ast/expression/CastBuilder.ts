import type { ColumnValue } from "../../types/ColumnValue.js";
import type { SqlType } from "../../types/SqlType.js";
import { CastExpressionNode } from "./CastExpressionNode.js";
import type { ExpressionNode } from "./ExpressionNode.js";

export class CastBuilder {
  constructor(private expr: ExpressionNode | ColumnValue) {}

  as(type: SqlType) {
    return new CastExpressionNode(this.expr, type);
  }
}
