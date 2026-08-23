import type { ColumnValue } from "../../types/ColumnValue.js";
import type { SqlType } from "../../types/SqlType.js";
import { BinaryExpressionMixin } from "./BinaryExpressionMixin.js";
import {
  ExpressionNode,
  type ResolvedExpressionNode,
} from "./ExpressionNode.js";

export class ResolvedCastExpressionNode {
  readonly kind = "cast" as const;

  constructor(
    public readonly expr: ResolvedExpressionNode,
    public readonly type: SqlType,
  ) {}
}

export class CastExpressionNode extends BinaryExpressionMixin(ExpressionNode) {
  readonly kind = "cast" as const;

  constructor(
    public readonly expr: ExpressionNode | ColumnValue,
    public readonly type: SqlType,
  ) {
    super();
  }
}
