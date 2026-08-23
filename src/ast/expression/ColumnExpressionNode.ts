import { type ColumnId } from "../../relational/Column.js";
import { BinaryExpressionMixin } from "./BinaryExpressionMixin.js";
import { ExpressionNode } from "./ExpressionNode.js";

export class ResolvedColumnExpressionNode {
  readonly kind = "column" as const;

  constructor(public columnId: ColumnId) {}
}

export class ColumnExpressionNode extends BinaryExpressionMixin(
  ExpressionNode,
) {
  readonly kind = "column" as const;

  constructor(public columnName: string) {
    super();
  }
}
