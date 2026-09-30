import type { ResolvedColumn } from "../../semantic/relation/ResolvedColumn.js";
import { BinaryExpressionMixin } from "./BinaryExpressionMixin.js";
import { ExpressionNode } from "./ExpressionNode.js";

export class ResolvedColumnExpressionNode {
  readonly kind = "column" as const;

  constructor(public readonly column: ResolvedColumn) {}
}

export class ColumnExpressionNode extends BinaryExpressionMixin(
  ExpressionNode,
) {
  readonly kind = "column" as const;

  constructor(public columnName: string) {
    super();
  }
}
